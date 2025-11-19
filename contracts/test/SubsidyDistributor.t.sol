// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {FarmerRegistry} from "../src/FarmerRegistry.sol";
import {WeatherOracle} from "../src/WeatherOracle.sol";
import {EligibilityEngine} from "../src/EligibilityEngine.sol";
import {SubsidyDistributor} from "../src/SubsidyDistributor.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract SubsidyDistributorTest is Test {
    FarmerRegistry public farmerRegistry;
    WeatherOracle public weatherOracle;
    EligibilityEngine public eligibilityEngine;
    SubsidyDistributor public subsidyDistributor;
    ERC20Mock public paymentToken;

    address public owner = address(1);
    address public farmer1 = address(2);
    address public oracle1 = address(3);
    address public agent1 = address(4);
    address public unauthorized = address(5);

    function setUp() public {
        // Deploy FarmerRegistry
        vm.prank(owner);
        farmerRegistry = new FarmerRegistry(owner);

        // Deploy WeatherOracle
        vm.prank(owner);
        weatherOracle = new WeatherOracle(owner);

        // Authorize oracle
        vm.prank(owner);
        weatherOracle.authorizeOracle(oracle1);

        // Deploy EligibilityEngine
        vm.prank(owner);
        eligibilityEngine = new EligibilityEngine(owner, address(farmerRegistry), address(weatherOracle));

        // Deploy payment token (ERC20Mock for testing)
        paymentToken = new ERC20Mock();

        // Deploy SubsidyDistributor with ERC20 token
        vm.prank(owner);
        subsidyDistributor = new SubsidyDistributor(owner, address(eligibilityEngine), address(paymentToken));

        // Authorize agent
        vm.prank(owner);
        subsidyDistributor.authorizeAgent(agent1);

        // Register farmer
        vm.prank(farmer1);
        farmerRegistry.registerFarmer(
            "0xabc123", "District1", "Village1", 28613900, 77123400, FarmerRegistry.CropType.RICE
        );

        // Record weather event
        vm.prank(oracle1);
        weatherOracle.recordWeatherData("District1", 3500, 100, true, false, "event-001");

        // Create subsidy scheme
        string[] memory eligibleCrops = new string[](1);
        eligibleCrops[0] = "RICE";

        vm.prank(owner);
        eligibilityEngine.createSubsidyScheme(
            "scheme-001",
            "Drought Relief",
            1 ether,
            15000,
            12000,
            eligibleCrops,
            block.timestamp,
            block.timestamp + 365 days
        );
    }

    function test_ExecutePayment_NativeToken() public {
        // Deploy new distributor with native token
        vm.prank(owner);
        SubsidyDistributor nativeDistributor = new SubsidyDistributor(
            owner,
            address(eligibilityEngine),
            address(0) // Native token
        );

        vm.prank(owner);
        nativeDistributor.authorizeAgent(agent1);

        // Deposit funds
        vm.deal(address(this), 10 ether);
        (bool success,) = address(nativeDistributor).call{value: 5 ether}("");
        require(success, "Deposit failed");

        // Check eligibility first
        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-001", "scheme-001");

        require(decision.isEligible, "Farmer should be eligible");

        // Execute payment
        vm.prank(agent1);
        nativeDistributor.executePayment(farmer1, decision.proofHash, decision.subsidyAmount);

        assertEq(farmer1.balance, decision.subsidyAmount);
        assertTrue(nativeDistributor.isPaymentExecuted(decision.proofHash));
    }

    function test_ExecutePayment_ERC20Token() public {
        // Mint tokens to distributor
        paymentToken.mint(address(subsidyDistributor), 10 ether);

        // Check eligibility
        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-001", "scheme-001");

        require(decision.isEligible, "Farmer should be eligible");

        uint256 farmerBalanceBefore = paymentToken.balanceOf(farmer1);

        // Execute payment
        vm.prank(agent1);
        subsidyDistributor.executePayment(farmer1, decision.proofHash, decision.subsidyAmount);

        assertEq(paymentToken.balanceOf(farmer1), farmerBalanceBefore + decision.subsidyAmount);
        assertTrue(subsidyDistributor.isPaymentExecuted(decision.proofHash));
    }

    function test_ExecutePayment_RevertIf_Unauthorized() public {
        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-001", "scheme-001");

        paymentToken.mint(address(subsidyDistributor), 10 ether);

        vm.expectRevert("SubsidyDistributor: Not authorized agent");
        vm.prank(unauthorized);
        subsidyDistributor.executePayment(farmer1, decision.proofHash, decision.subsidyAmount);
    }

    function test_ExecutePayment_RevertIf_DuplicateProof() public {
        paymentToken.mint(address(subsidyDistributor), 10 ether);

        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-001", "scheme-001");

        // Execute first payment
        vm.prank(agent1);
        subsidyDistributor.executePayment(farmer1, decision.proofHash, decision.subsidyAmount);

        // Try to execute again with same proof
        vm.expectRevert("SubsidyDistributor: Payment already executed");
        vm.prank(agent1);
        subsidyDistributor.executePayment(farmer1, decision.proofHash, decision.subsidyAmount);
    }

    function test_ExecutePayment_RevertIf_InsufficientFunds() public {
        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-001", "scheme-001");

        // Don't deposit enough funds
        paymentToken.mint(address(subsidyDistributor), 0.5 ether);

        vm.expectRevert("SubsidyDistributor: Insufficient funds");
        vm.prank(agent1);
        subsidyDistributor.executePayment(farmer1, decision.proofHash, decision.subsidyAmount);
    }

    function test_DepositERC20Funds() public {
        paymentToken.mint(address(this), 5 ether);
        paymentToken.approve(address(subsidyDistributor), 5 ether);

        subsidyDistributor.depositERC20Funds(5 ether);

        assertEq(paymentToken.balanceOf(address(subsidyDistributor)), 5 ether);
    }

    function test_WithdrawFunds() public {
        paymentToken.mint(address(subsidyDistributor), 10 ether);

        uint256 ownerBalanceBefore = paymentToken.balanceOf(owner);

        vm.prank(owner);
        subsidyDistributor.withdrawFunds(5 ether, payable(owner));

        assertEq(paymentToken.balanceOf(owner), ownerBalanceBefore + 5 ether);
    }

    function test_GetPayment() public {
        paymentToken.mint(address(subsidyDistributor), 10 ether);

        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-001", "scheme-001");

        vm.prank(agent1);
        subsidyDistributor.executePayment(farmer1, decision.proofHash, decision.subsidyAmount);

        SubsidyDistributor.SubsidyPayment memory payment = subsidyDistributor.getPayment(decision.proofHash);

        assertEq(payment.farmer, farmer1);
        assertEq(payment.amount, decision.subsidyAmount);
        assertTrue(payment.executed);
    }

    function test_GetFarmerPayments() public {
        paymentToken.mint(address(subsidyDistributor), 20 ether);

        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-001", "scheme-001");

        vm.prank(agent1);
        subsidyDistributor.executePayment(farmer1, decision.proofHash, decision.subsidyAmount);

        bytes32[] memory payments = subsidyDistributor.getFarmerPayments(farmer1);
        assertEq(payments.length, 1);
        assertEq(payments[0], decision.proofHash);
    }

    function test_ExecutePayment_RevertIf_InvalidProof() public {
        paymentToken.mint(address(subsidyDistributor), 10 ether);

        bytes32 fakeProof = keccak256("fake proof");

        vm.expectRevert("SubsidyDistributor: Invalid or ineligible proof");
        vm.prank(agent1);
        subsidyDistributor.executePayment(farmer1, fakeProof, 1 ether);
    }

    function test_ExecutePayment_RevertIf_AmountMismatch() public {
        paymentToken.mint(address(subsidyDistributor), 10 ether);

        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-001", "scheme-001");

        // Try to pay wrong amount
        vm.expectRevert("SubsidyDistributor: Amount mismatch");
        vm.prank(agent1);
        subsidyDistributor.executePayment(
            farmer1,
            decision.proofHash,
            decision.subsidyAmount + 1 ether // Wrong amount
        );
    }
}
