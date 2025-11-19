// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {FarmerRegistry} from "../src/FarmerRegistry.sol";
import {WeatherOracle} from "../src/WeatherOracle.sol";
import {EligibilityEngine} from "../src/EligibilityEngine.sol";

contract EligibilityEngineTest is Test {
    FarmerRegistry public farmerRegistry;
    WeatherOracle public weatherOracle;
    EligibilityEngine public eligibilityEngine;

    address public owner = address(1);
    address public farmer1 = address(2);
    address public oracle1 = address(3);

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

        // Register farmer
        vm.prank(farmer1);
        farmerRegistry.registerFarmer(
            "0xabc123", "District1", "Village1", 28613900, 77123400, FarmerRegistry.CropType.RICE
        );

        // Record weather event with drought
        vm.prank(oracle1);
        weatherOracle.recordWeatherData(
            "District1",
            3500, // 35°C - high temperature
            100, // 1mm - very low rainfall
            true, // drought alert
            false,
            "event-001"
        );
    }

    function test_CreateSubsidyScheme() public {
        string[] memory eligibleCrops = new string[](2);
        eligibleCrops[0] = "RICE";
        eligibleCrops[1] = "WHEAT";

        vm.prank(owner);
        eligibilityEngine.createSubsidyScheme(
            "scheme-001",
            "Drought Relief Scheme",
            1 ether, // base amount
            15000, // 150% multiplier for drought
            12000, // 120% multiplier for flood
            eligibleCrops,
            block.timestamp,
            block.timestamp + 365 days
        );

        EligibilityEngine.SubsidyScheme memory scheme = eligibilityEngine.getSubsidyScheme("scheme-001");

        assertEq(scheme.schemeName, "Drought Relief Scheme");
        assertEq(scheme.baseAmount, 1 ether);
        assertTrue(scheme.isActive);
    }

    function test_CheckEligibility_Success() public {
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

        // Check eligibility
        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-001", "scheme-001");

        assertTrue(decision.isEligible);
        assertEq(decision.subsidyAmount, 1.5 ether); // 1 ether * 150% = 1.5 ether
        assertEq(decision.farmer, farmer1);
    }

    function test_CheckEligibility_RevertIf_RegionMismatch() public {
        // Register farmer in different district
        address farmer2 = address(4);
        vm.prank(farmer2);
        farmerRegistry.registerFarmer(
            "0xdef456",
            "District2", // Different district
            "Village2",
            30000000,
            80000000,
            FarmerRegistry.CropType.RICE
        );

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

        vm.prank(farmer2);
        EligibilityEngine.EligibilityDecision memory decision = eligibilityEngine.checkEligibility(
            farmer2,
            "event-001", // Event for District1, but farmer in District2
            "scheme-001"
        );

        assertFalse(decision.isEligible);
        assertEq(decision.subsidyAmount, 0);
    }

    function test_CheckEligibility_RevertIf_NoDisasterAlert() public {
        // Record weather event without disaster
        vm.prank(oracle1);
        weatherOracle.recordWeatherData(
            "District1",
            2500, // Normal temperature
            5000, // Normal rainfall
            false, // No drought
            false, // No flood
            "event-002"
        );

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

        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-002", "scheme-001");

        assertFalse(decision.isEligible);
    }

    function test_CheckEligibility_RevertIf_CropNotEligible() public {
        // Register farmer with WHEAT crop
        address farmer2 = address(4);
        vm.prank(farmer2);
        farmerRegistry.registerFarmer(
            "0xdef456", "District1", "Village2", 28614000, 77123500, FarmerRegistry.CropType.WHEAT
        );

        // Create scheme only for RICE
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

        vm.prank(farmer2);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer2, "event-001", "scheme-001");

        assertFalse(decision.isEligible);
    }

    function test_GetLatestDecision() public {
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

        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-001", "scheme-001");

        EligibilityEngine.EligibilityDecision memory latestDecision = eligibilityEngine.getLatestDecision(farmer1);

        assertTrue(latestDecision.isEligible);
        assertEq(latestDecision.proofHash, decision.proofHash);
    }

    function test_VerifyProof() public {
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

        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-001", "scheme-001");

        // Verify proof
        (bool isValid, EligibilityEngine.EligibilityDecision memory verifiedDecision) =
            eligibilityEngine.verifyProof(decision.proofHash, farmer1);

        assertTrue(isValid);
        assertEq(verifiedDecision.farmer, farmer1);
        assertTrue(verifiedDecision.isEligible);
        assertEq(verifiedDecision.subsidyAmount, 1.5 ether);
    }

    function test_VerifyProof_InvalidProof() public view {
        bytes32 fakeProof = keccak256("fake proof");

        (bool isValid,) = eligibilityEngine.verifyProof(fakeProof, farmer1);

        assertFalse(isValid);
    }

    function test_CheckEligibility_BothDisasters() public {
        // Record weather event with both drought and flood
        vm.prank(oracle1);
        weatherOracle.recordWeatherData(
            "District1",
            3500,
            100,
            true, // drought
            true, // flood
            "event-002"
        );

        string[] memory eligibleCrops = new string[](1);
        eligibleCrops[0] = "RICE";

        vm.prank(owner);
        eligibilityEngine.createSubsidyScheme(
            "scheme-002",
            "Disaster Relief",
            1 ether,
            15000, // 150% for drought
            12000, // 120% for flood
            eligibleCrops,
            block.timestamp,
            block.timestamp + 365 days
        );

        vm.prank(farmer1);
        EligibilityEngine.EligibilityDecision memory decision =
            eligibilityEngine.checkEligibility(farmer1, "event-002", "scheme-002");

        assertTrue(decision.isEligible);
        // Should use higher multiplier (150% = 1.5 ether)
        assertEq(decision.subsidyAmount, 1.5 ether);
    }
}
