// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FarmerRegistry.sol";
import "./WeatherOracle.sol";

/**
 * @title EligibilityEngine
 * @dev Evaluates farmer eligibility for subsidies based on weather/disaster data
 * @notice Checks if farmer's location matches affected regions and validates crop eligibility
 */
contract EligibilityEngine is Ownable {
    // Reference to FarmerRegistry
    FarmerRegistry public farmerRegistry;

    // Reference to WeatherOracle
    WeatherOracle public weatherOracle;

    // Eligibility decision structure
    struct EligibilityDecision {
        address farmer;
        bool isEligible;
        uint256 subsidyAmount;
        bytes32 proofHash; // Hash of the decision proof
        string reason; // Reason for eligibility or ineligibility
        string weatherEventId; // Associated weather event
        uint256 timestamp;
    }

    // Mapping from farmer address to eligibility decisions
    mapping(address => EligibilityDecision[]) public farmerDecisions;

    // Mapping from proof hash to decision (to prevent duplicates)
    mapping(bytes32 => bool) public usedProofs;

    // Subsidy scheme structure
    struct SubsidyScheme {
        string schemeName;
        bool isActive;
        uint256 baseAmount; // Base subsidy amount in wei
        uint256 droughtMultiplier; // Multiplier for drought (in basis points, e.g., 15000 = 150%)
        uint256 floodMultiplier; // Multiplier for flood (in basis points)
        string[] eligibleCrops; // Crop types eligible for this scheme
        uint256 startDate;
        uint256 endDate;
    }

    // Mapping from scheme ID to subsidy scheme
    mapping(string => SubsidyScheme) public subsidySchemes;

    // Array of scheme IDs
    string[] public schemeIds;

    // Events
    event EligibilityChecked(
        address indexed farmer,
        bool isEligible,
        uint256 subsidyAmount,
        bytes32 proofHash,
        string reason,
        uint256 timestamp
    );

    event SubsidySchemeCreated(string indexed schemeId, string schemeName, uint256 baseAmount, uint256 timestamp);

    event SubsidySchemeUpdated(string indexed schemeId, bool isActive, uint256 timestamp);

    // Modifiers
    modifier onlyValidFarmer(address farmer) {
        require(farmerRegistry.isFarmerActive(farmer), "EligibilityEngine: Farmer not registered or inactive");
        _;
    }

    /**
     * @dev Constructor
     * @param initialOwner Address of the contract owner
     * @param _farmerRegistry Address of FarmerRegistry contract
     * @param _weatherOracle Address of WeatherOracle contract
     */
    constructor(address initialOwner, address _farmerRegistry, address _weatherOracle) Ownable(initialOwner) {
        require(_farmerRegistry != address(0), "EligibilityEngine: Invalid farmer registry");
        require(_weatherOracle != address(0), "EligibilityEngine: Invalid weather oracle");

        farmerRegistry = FarmerRegistry(_farmerRegistry);
        weatherOracle = WeatherOracle(_weatherOracle);
    }

    /**
     * @dev Create a new subsidy scheme
     * @param schemeId Unique identifier for the scheme
     * @param schemeName Name of the scheme
     * @param baseAmount Base subsidy amount in wei
     * @param droughtMultiplier Multiplier for drought (in basis points)
     * @param floodMultiplier Multiplier for flood (in basis points)
     * @param eligibleCrops Array of eligible crop names
     * @param startDate Scheme start date (timestamp)
     * @param endDate Scheme end date (timestamp)
     */
    function createSubsidyScheme(
        string memory schemeId,
        string memory schemeName,
        uint256 baseAmount,
        uint256 droughtMultiplier,
        uint256 floodMultiplier,
        string[] memory eligibleCrops,
        uint256 startDate,
        uint256 endDate
    ) external onlyOwner {
        require(bytes(schemeId).length > 0, "EligibilityEngine: Scheme ID required");
        require(bytes(subsidySchemes[schemeId].schemeName).length == 0, "EligibilityEngine: Scheme already exists");
        require(baseAmount > 0, "EligibilityEngine: Base amount must be > 0");
        require(endDate > startDate, "EligibilityEngine: Invalid date range");

        SubsidyScheme memory newScheme = SubsidyScheme({
            schemeName: schemeName,
            isActive: true,
            baseAmount: baseAmount,
            droughtMultiplier: droughtMultiplier,
            floodMultiplier: floodMultiplier,
            eligibleCrops: eligibleCrops,
            startDate: startDate,
            endDate: endDate
        });

        subsidySchemes[schemeId] = newScheme;
        schemeIds.push(schemeId);

        emit SubsidySchemeCreated(schemeId, schemeName, baseAmount, block.timestamp);
    }

    /**
     * @dev Update subsidy scheme status
     * @param schemeId Scheme identifier
     * @param isActive Active status
     */
    function updateSchemeStatus(string memory schemeId, bool isActive) external onlyOwner {
        require(bytes(subsidySchemes[schemeId].schemeName).length > 0, "EligibilityEngine: Scheme not found");

        subsidySchemes[schemeId].isActive = isActive;

        emit SubsidySchemeUpdated(schemeId, isActive, block.timestamp);
    }

    /**
     * @dev Check farmer eligibility for subsidy
     * @param farmerAddress Address of the farmer
     * @param weatherEventId Weather event ID to check against
     * @param schemeId Subsidy scheme ID
     * @return decision EligibilityDecision struct
     */
    function checkEligibility(address farmerAddress, string memory weatherEventId, string memory schemeId)
        external
        onlyValidFarmer(farmerAddress)
        returns (EligibilityDecision memory decision)
    {
        // Get farmer profile
        FarmerRegistry.FarmerProfile memory farmer = farmerRegistry.getFarmerProfile(farmerAddress);

        // Get weather event
        WeatherOracle.WeatherEvent memory weatherEvent = weatherOracle.getWeatherEvent(weatherEventId);
        require(weatherEvent.timestamp > 0, "EligibilityEngine: Weather event not found");

        // Get subsidy scheme
        SubsidyScheme memory scheme = subsidySchemes[schemeId];
        require(bytes(scheme.schemeName).length > 0, "EligibilityEngine: Scheme not found");
        require(scheme.isActive, "EligibilityEngine: Scheme not active");
        require(
            block.timestamp >= scheme.startDate && block.timestamp <= scheme.endDate,
            "EligibilityEngine: Scheme not in valid date range"
        );

        // Initialize decision
        decision.farmer = farmerAddress;
        decision.weatherEventId = weatherEventId;
        decision.timestamp = block.timestamp;
        decision.isEligible = false;
        decision.subsidyAmount = 0;
        decision.reason = "";

        // Check 1: Region match
        bool regionMatch = keccak256(bytes(farmer.district)) == keccak256(bytes(weatherEvent.region))
            || keccak256(bytes(farmer.village)) == keccak256(bytes(weatherEvent.region));

        if (!regionMatch) {
            decision.reason = "Farmer location does not match affected region";
            _recordDecision(decision);
            return decision;
        }

        // Check 2: Disaster alert exists
        if (!weatherEvent.droughtAlert && !weatherEvent.floodAlert) {
            decision.reason = "No disaster alert for this region";
            _recordDecision(decision);
            return decision;
        }

        // Check 3: Crop eligibility
        bool cropEligible = _isCropEligible(farmer.cropType, scheme.eligibleCrops);
        if (!cropEligible) {
            decision.reason = "Crop type not eligible for this scheme";
            _recordDecision(decision);
            return decision;
        }

        // All checks passed - farmer is eligible
        decision.isEligible = true;

        // Calculate subsidy amount
        uint256 baseAmount = scheme.baseAmount;
        // Apply multiplier for the primary disaster (drought takes precedence if both exist)
        if (weatherEvent.droughtAlert && weatherEvent.floodAlert) {
            // If both disasters, use the higher multiplier
            uint256 droughtAmount = (baseAmount * scheme.droughtMultiplier) / 10000;
            uint256 floodAmount = (baseAmount * scheme.floodMultiplier) / 10000;
            baseAmount = droughtAmount > floodAmount ? droughtAmount : floodAmount;
        } else if (weatherEvent.droughtAlert) {
            baseAmount = (baseAmount * scheme.droughtMultiplier) / 10000;
        } else if (weatherEvent.floodAlert) {
            baseAmount = (baseAmount * scheme.floodMultiplier) / 10000;
        }

        decision.subsidyAmount = baseAmount;
        decision.reason = "Farmer meets all eligibility criteria";

        // Generate proof hash
        decision.proofHash = keccak256(
            abi.encodePacked(
                farmerAddress, weatherEventId, schemeId, block.timestamp, decision.isEligible, decision.subsidyAmount
            )
        );

        // Check for duplicate proof
        require(!usedProofs[decision.proofHash], "EligibilityEngine: Duplicate proof");
        usedProofs[decision.proofHash] = true;

        _recordDecision(decision);

        return decision;
    }

    /**
     * @dev Internal function to record eligibility decision
     * @param decision EligibilityDecision to record
     */
    function _recordDecision(EligibilityDecision memory decision) internal {
        farmerDecisions[decision.farmer].push(decision);

        emit EligibilityChecked(
            decision.farmer,
            decision.isEligible,
            decision.subsidyAmount,
            decision.proofHash,
            decision.reason,
            decision.timestamp
        );
    }

    /**
     * @dev Check if crop type is eligible for scheme
     * @param cropType Farmer's crop type
     * @param eligibleCrops Array of eligible crop names
     * @return bool True if crop is eligible
     */
    function _isCropEligible(FarmerRegistry.CropType cropType, string[] memory eligibleCrops)
        internal
        pure
        returns (bool)
    {
        // Convert crop type enum to string
        string memory cropTypeStr = _cropTypeToString(cropType);

        // Check if crop type is in eligible crops array
        for (uint256 i = 0; i < eligibleCrops.length; i++) {
            if (keccak256(bytes(cropTypeStr)) == keccak256(bytes(eligibleCrops[i]))) {
                return true;
            }
        }

        // Also check for "ALL" or "OTHER" in eligible crops
        for (uint256 i = 0; i < eligibleCrops.length; i++) {
            if (
                keccak256(bytes(eligibleCrops[i])) == keccak256(bytes("ALL"))
                    || keccak256(bytes(eligibleCrops[i])) == keccak256(bytes("OTHER"))
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Convert crop type enum to string
     * @param cropType Crop type enum
     * @return string Crop type as string
     */
    function _cropTypeToString(FarmerRegistry.CropType cropType) internal pure returns (string memory) {
        if (cropType == FarmerRegistry.CropType.RICE) return "RICE";
        if (cropType == FarmerRegistry.CropType.WHEAT) return "WHEAT";
        if (cropType == FarmerRegistry.CropType.CORN) return "CORN";
        if (cropType == FarmerRegistry.CropType.SUGARCANE) return "SUGARCANE";
        if (cropType == FarmerRegistry.CropType.COTTON) return "COTTON";
        if (cropType == FarmerRegistry.CropType.SOYBEAN) return "SOYBEAN";
        return "OTHER";
    }

    /**
     * @dev Get eligibility decision for farmer
     * @param farmerAddress Address of the farmer
     * @param index Index of the decision (0 = latest)
     * @return decision EligibilityDecision struct
     */
    function getFarmerDecision(address farmerAddress, uint256 index)
        external
        view
        returns (EligibilityDecision memory decision)
    {
        require(index < farmerDecisions[farmerAddress].length, "EligibilityEngine: Decision not found");
        return farmerDecisions[farmerAddress][index];
    }

    /**
     * @dev Get latest eligibility decision for farmer
     * @param farmerAddress Address of the farmer
     * @return decision Latest EligibilityDecision struct
     */
    function getLatestDecision(address farmerAddress) external view returns (EligibilityDecision memory decision) {
        require(farmerDecisions[farmerAddress].length > 0, "EligibilityEngine: No decisions found");
        uint256 latestIndex = farmerDecisions[farmerAddress].length - 1;
        return farmerDecisions[farmerAddress][latestIndex];
    }

    /**
     * @dev Get total number of decisions for a farmer
     * @param farmerAddress Address of the farmer
     * @return uint256 Total count
     */
    function getDecisionCount(address farmerAddress) external view returns (uint256) {
        return farmerDecisions[farmerAddress].length;
    }

    /**
     * @dev Get subsidy scheme details
     * @param schemeId Scheme identifier
     * @return scheme SubsidyScheme struct
     */
    function getSubsidyScheme(string memory schemeId) external view returns (SubsidyScheme memory scheme) {
        require(bytes(subsidySchemes[schemeId].schemeName).length > 0, "EligibilityEngine: Scheme not found");
        return subsidySchemes[schemeId];
    }

    /**
     * @dev Get all scheme IDs
     * @return string[] Array of scheme IDs
     */
    function getAllSchemeIds() external view returns (string[] memory) {
        return schemeIds;
    }

    /**
     * @dev Verify eligibility proof and get decision details
     * @param proofHash Proof hash to verify
     * @param farmerAddress Expected farmer address
     * @return isValid True if proof is valid
     * @return decision EligibilityDecision if valid
     */
    function verifyProof(bytes32 proofHash, address farmerAddress)
        external
        view
        returns (bool isValid, EligibilityDecision memory decision)
    {
        // Check if proof was used
        if (!usedProofs[proofHash]) {
            return (false, decision);
        }

        // Find the decision with this proof hash
        EligibilityDecision[] memory decisions = farmerDecisions[farmerAddress];
        for (uint256 i = 0; i < decisions.length; i++) {
            if (decisions[i].proofHash == proofHash) {
                // Verify the decision is eligible
                if (decisions[i].isEligible && decisions[i].subsidyAmount > 0) {
                    return (true, decisions[i]);
                }
                break;
            }
        }

        return (false, decision);
    }
}
