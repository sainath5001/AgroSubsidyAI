// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FarmerRegistry
 * @dev Registry for farmer profiles with wallet address, location, and crop information
 * @notice Removed IPFS - land proof stored as string hash on-chain
 */
contract FarmerRegistry is Ownable, ReentrancyGuard {
    // Enum for crop types
    enum CropType {
        RICE,
        WHEAT,
        CORN,
        SUGARCANE,
        COTTON,
        SOYBEAN,
        OTHER
    }

    // Farmer profile structure
    struct FarmerProfile {
        address wallet;
        string landProofHash; // Hash of land documents (stored on-chain)
        string district;
        string village;
        uint256 latitude; // Optional: for precise location (multiplied by 1e6)
        uint256 longitude; // Optional: for precise location (multiplied by 1e6)
        CropType cropType;
        uint256 registrationTimestamp;
        bool isActive;
    }

    // Mapping from wallet address to farmer profile
    mapping(address => FarmerProfile) public farmers;

    // Mapping to check if wallet is registered
    mapping(address => bool) public isRegistered;

    // Array of all registered farmer addresses
    address[] public registeredFarmers;

    // Events
    event FarmerRegistered(
        address indexed farmer, string district, string village, CropType cropType, uint256 timestamp
    );

    event FarmerUpdated(address indexed farmer, string district, string village, CropType cropType, uint256 timestamp);

    event FarmerDeactivated(address indexed farmer, uint256 timestamp);

    event FarmerReactivated(address indexed farmer, uint256 timestamp);

    // Modifiers
    modifier onlyRegisteredFarmer() {
        require(isRegistered[msg.sender], "FarmerRegistry: Not registered");
        _;
    }

    modifier onlyActiveFarmer() {
        require(isRegistered[msg.sender] && farmers[msg.sender].isActive, "FarmerRegistry: Farmer not active");
        _;
    }

    /**
     * @dev Constructor
     * @param initialOwner Address of the contract owner
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Register a new farmer
     * @param landProofHash Hash of land documents (string format)
     * @param district District name
     * @param village Village name
     * @param latitude Latitude coordinate (multiplied by 1e6, e.g., 28.6139 * 1e6 = 28613900)
     * @param longitude Longitude coordinate (multiplied by 1e6)
     * @param cropType Crop type enum value
     */
    function registerFarmer(
        string memory landProofHash,
        string memory district,
        string memory village,
        uint256 latitude,
        uint256 longitude,
        CropType cropType
    ) external nonReentrant {
        require(!isRegistered[msg.sender], "FarmerRegistry: Already registered");
        require(bytes(landProofHash).length > 0, "FarmerRegistry: Land proof required");
        require(bytes(district).length > 0, "FarmerRegistry: District required");
        require(bytes(village).length > 0, "FarmerRegistry: Village required");

        FarmerProfile memory newProfile = FarmerProfile({
            wallet: msg.sender,
            landProofHash: landProofHash,
            district: district,
            village: village,
            latitude: latitude,
            longitude: longitude,
            cropType: cropType,
            registrationTimestamp: block.timestamp,
            isActive: true
        });

        farmers[msg.sender] = newProfile;
        isRegistered[msg.sender] = true;
        registeredFarmers.push(msg.sender);

        emit FarmerRegistered(msg.sender, district, village, cropType, block.timestamp);
    }

    /**
     * @dev Update farmer profile (only by farmer themselves)
     * @param landProofHash Updated land proof hash
     * @param district Updated district
     * @param village Updated village
     * @param latitude Updated latitude
     * @param longitude Updated longitude
     * @param cropType Updated crop type
     */
    function updateProfile(
        string memory landProofHash,
        string memory district,
        string memory village,
        uint256 latitude,
        uint256 longitude,
        CropType cropType
    ) external onlyRegisteredFarmer nonReentrant {
        require(bytes(landProofHash).length > 0, "FarmerRegistry: Land proof required");
        require(bytes(district).length > 0, "FarmerRegistry: District required");
        require(bytes(village).length > 0, "FarmerRegistry: Village required");

        farmers[msg.sender].landProofHash = landProofHash;
        farmers[msg.sender].district = district;
        farmers[msg.sender].village = village;
        farmers[msg.sender].latitude = latitude;
        farmers[msg.sender].longitude = longitude;
        farmers[msg.sender].cropType = cropType;

        emit FarmerUpdated(msg.sender, district, village, cropType, block.timestamp);
    }

    /**
     * @dev Get farmer profile
     * @param farmerAddress Address of the farmer
     * @return profile FarmerProfile struct
     */
    function getFarmerProfile(address farmerAddress) external view returns (FarmerProfile memory profile) {
        require(isRegistered[farmerAddress], "FarmerRegistry: Farmer not registered");
        return farmers[farmerAddress];
    }

    /**
     * @dev Check if farmer is registered and active
     * @param farmerAddress Address of the farmer
     * @return bool True if registered and active
     */
    function isFarmerActive(address farmerAddress) external view returns (bool) {
        return isRegistered[farmerAddress] && farmers[farmerAddress].isActive;
    }

    /**
     * @dev Deactivate farmer (only by owner, for fraud cases)
     * @param farmerAddress Address of the farmer to deactivate
     */
    function deactivateFarmer(address farmerAddress) external onlyOwner {
        require(isRegistered[farmerAddress], "FarmerRegistry: Farmer not registered");
        require(farmers[farmerAddress].isActive, "FarmerRegistry: Already deactivated");

        farmers[farmerAddress].isActive = false;

        emit FarmerDeactivated(farmerAddress, block.timestamp);
    }

    /**
     * @dev Reactivate farmer (only by owner)
     * @param farmerAddress Address of the farmer to reactivate
     */
    function reactivateFarmer(address farmerAddress) external onlyOwner {
        require(isRegistered[farmerAddress], "FarmerRegistry: Farmer not registered");
        require(!farmers[farmerAddress].isActive, "FarmerRegistry: Already active");

        farmers[farmerAddress].isActive = true;

        emit FarmerReactivated(farmerAddress, block.timestamp);
    }

    /**
     * @dev Get total number of registered farmers
     * @return uint256 Total count
     */
    function getTotalFarmers() external view returns (uint256) {
        return registeredFarmers.length;
    }

    /**
     * @dev Get all registered farmer addresses (for iteration)
     * @return address[] Array of farmer addresses
     */
    function getAllFarmers() external view returns (address[] memory) {
        return registeredFarmers;
    }

    /**
     * @dev Get farmers by district (requires iteration - use off-chain indexing for production)
     * @param district District name to search
     * @return address[] Array of farmer addresses in the district
     */
    function getFarmersByDistrict(string memory district) external view returns (address[] memory) {
        address[] memory result = new address[](registeredFarmers.length);
        uint256 count = 0;

        for (uint256 i = 0; i < registeredFarmers.length; i++) {
            if (keccak256(bytes(farmers[registeredFarmers[i]].district)) == keccak256(bytes(district))) {
                result[count] = registeredFarmers[i];
                count++;
            }
        }

        // Resize array to actual count
        address[] memory finalResult = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }

        return finalResult;
    }
}
