// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title WeatherOracle
 * @dev Stores weather and disaster data from trusted oracles
 * @notice Weather data is public and immutable once recorded
 */
contract WeatherOracle is Ownable, ReentrancyGuard {
    // Weather event structure
    struct WeatherEvent {
        string region; // District/Village identifier
        uint256 timestamp;
        int256 temperature; // Temperature in Celsius (multiplied by 1e2, e.g., 25.5°C = 2550)
        uint256 rainfall; // Rainfall in mm (multiplied by 1e2, e.g., 10.5mm = 1050)
        bool droughtAlert; // Drought alert flag
        bool floodAlert; // Flood alert flag
        string eventId; // Unique event identifier
        address oracleAddress; // Address of the oracle that reported this
    }

    // Mapping from event ID to weather event
    mapping(string => WeatherEvent) public weatherEvents;

    // Array of all event IDs
    string[] public eventIds;

    // Mapping from region to array of event IDs (for quick lookup)
    mapping(string => string[]) public regionEvents;

    // Mapping to track authorized oracles
    mapping(address => bool) public authorizedOracles;

    // Array of authorized oracle addresses
    address[] public oracleList;

    // Events
    event WeatherDataRecorded(
        string indexed eventId,
        string region,
        int256 temperature,
        uint256 rainfall,
        bool droughtAlert,
        bool floodAlert,
        uint256 timestamp
    );

    event OracleAuthorized(address indexed oracle, uint256 timestamp);

    event OracleRevoked(address indexed oracle, uint256 timestamp);

    // Modifiers
    modifier onlyAuthorizedOracle() {
        require(authorizedOracles[msg.sender], "WeatherOracle: Not authorized oracle");
        _;
    }

    /**
     * @dev Constructor
     * @param initialOwner Address of the contract owner
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Authorize an oracle to submit weather data
     * @param oracleAddress Address of the oracle to authorize
     */
    function authorizeOracle(address oracleAddress) external onlyOwner {
        require(!authorizedOracles[oracleAddress], "WeatherOracle: Oracle already authorized");
        require(oracleAddress != address(0), "WeatherOracle: Invalid address");

        authorizedOracles[oracleAddress] = true;
        oracleList.push(oracleAddress);

        emit OracleAuthorized(oracleAddress, block.timestamp);
    }

    /**
     * @dev Revoke oracle authorization
     * @param oracleAddress Address of the oracle to revoke
     */
    function revokeOracle(address oracleAddress) external onlyOwner {
        require(authorizedOracles[oracleAddress], "WeatherOracle: Oracle not authorized");

        authorizedOracles[oracleAddress] = false;

        emit OracleRevoked(oracleAddress, block.timestamp);
    }

    /**
     * @dev Record weather data (only authorized oracles)
     * @param region District/Village identifier
     * @param temperature Temperature in Celsius (multiplied by 1e2)
     * @param rainfall Rainfall in mm (multiplied by 1e2)
     * @param droughtAlert Drought alert flag
     * @param floodAlert Flood alert flag
     * @param eventId Unique event identifier
     */
    function recordWeatherData(
        string memory region,
        int256 temperature,
        uint256 rainfall,
        bool droughtAlert,
        bool floodAlert,
        string memory eventId
    ) external onlyAuthorizedOracle nonReentrant {
        require(bytes(region).length > 0, "WeatherOracle: Region required");
        require(bytes(eventId).length > 0, "WeatherOracle: Event ID required");
        require(weatherEvents[eventId].timestamp == 0, "WeatherOracle: Event ID already exists");

        WeatherEvent memory newEvent = WeatherEvent({
            region: region,
            timestamp: block.timestamp,
            temperature: temperature,
            rainfall: rainfall,
            droughtAlert: droughtAlert,
            floodAlert: floodAlert,
            eventId: eventId,
            oracleAddress: msg.sender
        });

        weatherEvents[eventId] = newEvent;
        eventIds.push(eventId);
        regionEvents[region].push(eventId);

        emit WeatherDataRecorded(eventId, region, temperature, rainfall, droughtAlert, floodAlert, block.timestamp);
    }

    /**
     * @dev Get weather event by ID
     * @param eventId Event identifier
     * @return weatherEvent WeatherEvent struct
     */
    function getWeatherEvent(string memory eventId) external view returns (WeatherEvent memory weatherEvent) {
        require(weatherEvents[eventId].timestamp != 0, "WeatherOracle: Event not found");
        return weatherEvents[eventId];
    }

    /**
     * @dev Check if region has active disaster alerts
     * @param region District/Village identifier
     * @return hasDrought True if drought alert exists
     * @return hasFlood True if flood alert exists
     * @return latestEventId Latest event ID for the region
     */
    function checkDisasterAlerts(string memory region)
        external
        view
        returns (bool hasDrought, bool hasFlood, string memory latestEventId)
    {
        string[] memory events = regionEvents[region];
        if (events.length == 0) {
            return (false, false, "");
        }

        // Get the latest event (assuming events are added chronologically)
        // For production, you might want to track latest event per region
        latestEventId = events[events.length - 1];
        WeatherEvent memory latestEvent = weatherEvents[latestEventId];

        return (latestEvent.droughtAlert, latestEvent.floodAlert, latestEventId);
    }

    /**
     * @dev Get all events for a region
     * @param region District/Village identifier
     * @return events Array of event IDs
     */
    function getRegionEvents(string memory region) external view returns (string[] memory events) {
        return regionEvents[region];
    }

    /**
     * @dev Get total number of weather events
     * @return uint256 Total count
     */
    function getTotalEvents() external view returns (uint256) {
        return eventIds.length;
    }

    /**
     * @dev Get all event IDs (for iteration)
     * @return string[] Array of event IDs
     */
    function getAllEventIds() external view returns (string[] memory) {
        return eventIds;
    }

    /**
     * @dev Get number of authorized oracles
     * @return uint256 Count of authorized oracles
     */
    function getOracleCount() external view returns (uint256) {
        return oracleList.length;
    }

    /**
     * @dev Get all authorized oracle addresses
     * @return address[] Array of oracle addresses
     */
    function getAllOracles() external view returns (address[] memory) {
        return oracleList;
    }

    /**
     * @dev Get latest weather event for a region (helper function)
     * @param region District/Village identifier
     * @return weatherEvent WeatherEvent struct or empty if not found
     */
    function getLatestEventForRegion(string memory region) external view returns (WeatherEvent memory weatherEvent) {
        string[] memory events = regionEvents[region];
        if (events.length == 0) {
            // Return empty struct
            return WeatherEvent({
                region: "",
                timestamp: 0,
                temperature: 0,
                rainfall: 0,
                droughtAlert: false,
                floodAlert: false,
                eventId: "",
                oracleAddress: address(0)
            });
        }

        string memory latestEventId = events[events.length - 1];
        return weatherEvents[latestEventId];
    }
}
