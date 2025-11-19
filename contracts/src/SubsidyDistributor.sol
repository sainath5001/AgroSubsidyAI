// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./EligibilityEngine.sol";

/**
 * @title SubsidyDistributor
 * @dev Handles automatic subsidy payments to eligible farmers
 * @notice Only authorized AI agent can trigger payments
 */
contract SubsidyDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Reference to EligibilityEngine
    EligibilityEngine public eligibilityEngine;

    // Payment structure
    struct SubsidyPayment {
        address farmer;
        uint256 amount;
        bytes32 eligibilityProof;
        uint256 timestamp;
        bool executed;
        address paymentToken; // Address(0) for native token, otherwise ERC20
    }

    // Mapping from proof hash to payment
    mapping(bytes32 => SubsidyPayment) public payments;

    // Mapping from farmer to array of payment proof hashes
    mapping(address => bytes32[]) public farmerPayments;

    // Array of all payment proof hashes
    bytes32[] public allPayments;

    // Mapping to track authorized agents (AI agents that can trigger payments)
    mapping(address => bool) public authorizedAgents;

    // Array of authorized agent addresses
    address[] public agentList;

    // Payment token (ERC20) - if address(0), use native token
    IERC20 public paymentToken;

    // Events
    event PaymentExecuted(
        address indexed farmer,
        uint256 amount,
        bytes32 indexed eligibilityProof,
        address paymentToken,
        uint256 timestamp
    );

    event AgentAuthorized(address indexed agent, uint256 timestamp);

    event AgentRevoked(address indexed agent, uint256 timestamp);

    event FundsDeposited(address indexed depositor, uint256 amount, address token, uint256 timestamp);

    event FundsWithdrawn(address indexed recipient, uint256 amount, address token, uint256 timestamp);

    // Modifiers
    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender], "SubsidyDistributor: Not authorized agent");
        _;
    }

    /**
     * @dev Constructor
     * @param initialOwner Address of the contract owner
     * @param _eligibilityEngine Address of EligibilityEngine contract
     * @param _paymentToken Address of ERC20 token (address(0) for native token)
     */
    constructor(address initialOwner, address _eligibilityEngine, address _paymentToken) Ownable(initialOwner) {
        require(_eligibilityEngine != address(0), "SubsidyDistributor: Invalid eligibility engine");

        eligibilityEngine = EligibilityEngine(_eligibilityEngine);

        if (_paymentToken != address(0)) {
            paymentToken = IERC20(_paymentToken);
        }
    }

    /**
     * @dev Authorize an AI agent to trigger payments
     * @param agentAddress Address of the agent to authorize
     */
    function authorizeAgent(address agentAddress) external onlyOwner {
        require(!authorizedAgents[agentAddress], "SubsidyDistributor: Agent already authorized");
        require(agentAddress != address(0), "SubsidyDistributor: Invalid address");

        authorizedAgents[agentAddress] = true;
        agentList.push(agentAddress);

        emit AgentAuthorized(agentAddress, block.timestamp);
    }

    /**
     * @dev Revoke agent authorization
     * @param agentAddress Address of the agent to revoke
     */
    function revokeAgent(address agentAddress) external onlyOwner {
        require(authorizedAgents[agentAddress], "SubsidyDistributor: Agent not authorized");

        authorizedAgents[agentAddress] = false;

        emit AgentRevoked(agentAddress, block.timestamp);
    }

    /**
     * @dev Execute subsidy payment to farmer (only authorized agents)
     * @param farmerAddress Address of the farmer
     * @param eligibilityProof Proof hash from eligibility check
     * @param amount Subsidy amount to pay
     */
    function executePayment(address farmerAddress, bytes32 eligibilityProof, uint256 amount)
        external
        onlyAuthorizedAgent
        nonReentrant
    {
        require(farmerAddress != address(0), "SubsidyDistributor: Invalid farmer address");
        require(amount > 0, "SubsidyDistributor: Amount must be > 0");
        require(!payments[eligibilityProof].executed, "SubsidyDistributor: Payment already executed");

        // Verify eligibility proof exists and is valid
        (bool isValid, EligibilityEngine.EligibilityDecision memory decision) =
            eligibilityEngine.verifyProof(eligibilityProof, farmerAddress);
        require(isValid, "SubsidyDistributor: Invalid or ineligible proof");
        require(decision.farmer == farmerAddress, "SubsidyDistributor: Proof farmer mismatch");
        require(decision.isEligible, "SubsidyDistributor: Farmer not eligible");
        require(decision.subsidyAmount == amount, "SubsidyDistributor: Amount mismatch");

        // Check contract balance
        uint256 balance = _getBalance();
        require(balance >= amount, "SubsidyDistributor: Insufficient funds");

        // Create payment record
        SubsidyPayment memory payment = SubsidyPayment({
            farmer: farmerAddress,
            amount: amount,
            eligibilityProof: eligibilityProof,
            timestamp: block.timestamp,
            executed: true,
            paymentToken: address(paymentToken)
        });

        payments[eligibilityProof] = payment;
        farmerPayments[farmerAddress].push(eligibilityProof);
        allPayments.push(eligibilityProof);

        // Execute payment
        _transferPayment(farmerAddress, amount);

        emit PaymentExecuted(farmerAddress, amount, eligibilityProof, address(paymentToken), block.timestamp);
    }

    /**
     * @dev Internal function to transfer payment
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function _transferPayment(address to, uint256 amount) internal {
        if (address(paymentToken) == address(0)) {
            // Native token transfer
            (bool success,) = payable(to).call{value: amount}("");
            require(success, "SubsidyDistributor: Native token transfer failed");
        } else {
            // ERC20 token transfer
            paymentToken.safeTransfer(to, amount);
        }
    }

    /**
     * @dev Get contract balance
     * @return uint256 Balance of native token or ERC20 token
     */
    function _getBalance() internal view returns (uint256) {
        if (address(paymentToken) == address(0)) {
            return address(this).balance;
        } else {
            return paymentToken.balanceOf(address(this));
        }
    }

    /**
     * @dev Deposit funds to contract (for native token)
     */
    function depositFunds() external payable {
        require(msg.value > 0, "SubsidyDistributor: Amount must be > 0");
        require(address(paymentToken) == address(0), "SubsidyDistributor: Use ERC20 deposit function");

        emit FundsDeposited(msg.sender, msg.value, address(0), block.timestamp);
    }

    /**
     * @dev Deposit ERC20 tokens to contract
     * @param amount Amount of tokens to deposit
     */
    function depositERC20Funds(uint256 amount) external {
        require(amount > 0, "SubsidyDistributor: Amount must be > 0");
        require(address(paymentToken) != address(0), "SubsidyDistributor: Use native deposit function");

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);

        emit FundsDeposited(msg.sender, amount, address(paymentToken), block.timestamp);
    }

    /**
     * @dev Withdraw funds from contract (only owner)
     * @param amount Amount to withdraw
     * @param to Recipient address
     */
    function withdrawFunds(uint256 amount, address payable to) external onlyOwner {
        require(to != address(0), "SubsidyDistributor: Invalid recipient");
        require(amount > 0, "SubsidyDistributor: Amount must be > 0");

        uint256 balance = _getBalance();
        require(balance >= amount, "SubsidyDistributor: Insufficient balance");

        if (address(paymentToken) == address(0)) {
            (bool success,) = to.call{value: amount}("");
            require(success, "SubsidyDistributor: Withdrawal failed");
        } else {
            paymentToken.safeTransfer(to, amount);
        }

        emit FundsWithdrawn(to, amount, address(paymentToken), block.timestamp);
    }

    /**
     * @dev Get payment details by proof hash
     * @param proofHash Eligibility proof hash
     * @return payment SubsidyPayment struct
     */
    function getPayment(bytes32 proofHash) external view returns (SubsidyPayment memory payment) {
        require(payments[proofHash].timestamp > 0, "SubsidyDistributor: Payment not found");
        return payments[proofHash];
    }

    /**
     * @dev Get all payment proofs for a farmer
     * @param farmerAddress Address of the farmer
     * @return bytes32[] Array of proof hashes
     */
    function getFarmerPayments(address farmerAddress) external view returns (bytes32[] memory) {
        return farmerPayments[farmerAddress];
    }

    /**
     * @dev Get total number of payments
     * @return uint256 Total count
     */
    function getTotalPayments() external view returns (uint256) {
        return allPayments.length;
    }

    /**
     * @dev Get contract balance
     * @return uint256 Current balance
     */
    function getBalance() external view returns (uint256) {
        return _getBalance();
    }

    /**
     * @dev Get number of authorized agents
     * @return uint256 Count of authorized agents
     */
    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }

    /**
     * @dev Get all authorized agent addresses
     * @return address[] Array of agent addresses
     */
    function getAllAgents() external view returns (address[] memory) {
        return agentList;
    }

    /**
     * @dev Check if payment has been executed
     * @param proofHash Eligibility proof hash
     * @return bool True if payment executed
     */
    function isPaymentExecuted(bytes32 proofHash) external view returns (bool) {
        return payments[proofHash].executed;
    }

    /**
     * @dev Receive native tokens
     */
    receive() external payable {
        if (address(paymentToken) == address(0)) {
            emit FundsDeposited(msg.sender, msg.value, address(0), block.timestamp);
        }
    }
}
