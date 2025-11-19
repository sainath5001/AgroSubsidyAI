// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {WeatherOracle} from "../src/WeatherOracle.sol";

contract WeatherOracleTest is Test {
    WeatherOracle public weatherOracle;

    address public owner = address(1);
    address public oracle1 = address(2);
    address public oracle2 = address(3);
    address public unauthorized = address(4);

    function setUp() public {
        vm.prank(owner);
        weatherOracle = new WeatherOracle(owner);

        vm.prank(owner);
        weatherOracle.authorizeOracle(oracle1);
    }

    function test_RecordWeatherData() public {
        vm.prank(oracle1);
        weatherOracle.recordWeatherData(
            "District1",
            2550, // 25.5°C
            1050, // 10.5mm
            true,
            false,
            "event-001"
        );

        WeatherOracle.WeatherEvent memory weatherEvent = weatherOracle.getWeatherEvent("event-001");
        assertEq(weatherEvent.region, "District1");
        assertEq(weatherEvent.temperature, 2550);
        assertEq(weatherEvent.rainfall, 1050);
        assertTrue(weatherEvent.droughtAlert);
        assertFalse(weatherEvent.floodAlert);
        assertEq(weatherEvent.oracleAddress, oracle1);
    }

    function test_RecordWeatherData_RevertIf_Unauthorized() public {
        vm.expectRevert("WeatherOracle: Not authorized oracle");
        vm.prank(unauthorized);
        weatherOracle.recordWeatherData("District1", 2550, 1050, true, false, "event-001");
    }

    function test_RecordWeatherData_RevertIf_DuplicateEventId() public {
        vm.prank(oracle1);
        weatherOracle.recordWeatherData("District1", 2550, 1050, true, false, "event-001");

        vm.expectRevert("WeatherOracle: Event ID already exists");
        vm.prank(oracle1);
        weatherOracle.recordWeatherData("District1", 2600, 1100, false, true, "event-001");
    }

    function test_AuthorizeOracle() public {
        vm.prank(owner);
        weatherOracle.authorizeOracle(oracle2);

        assertTrue(weatherOracle.authorizedOracles(oracle2));
    }

    function test_RevokeOracle() public {
        vm.prank(owner);
        weatherOracle.revokeOracle(oracle1);

        assertFalse(weatherOracle.authorizedOracles(oracle1));
    }

    function test_CheckDisasterAlerts() public {
        vm.prank(oracle1);
        weatherOracle.recordWeatherData("District1", 2550, 1050, true, false, "event-001");

        (bool hasDrought, bool hasFlood, string memory eventId) = weatherOracle.checkDisasterAlerts("District1");

        assertTrue(hasDrought);
        assertFalse(hasFlood);
        assertEq(eventId, "event-001");
    }

    function test_GetRegionEvents() public {
        vm.prank(oracle1);
        weatherOracle.recordWeatherData("District1", 2550, 1050, true, false, "event-001");

        vm.prank(oracle1);
        weatherOracle.recordWeatherData("District1", 2600, 1100, false, true, "event-002");

        string[] memory events = weatherOracle.getRegionEvents("District1");
        assertEq(events.length, 2);
    }

    function test_GetLatestEventForRegion() public {
        vm.prank(oracle1);
        weatherOracle.recordWeatherData("District1", 2550, 1050, true, false, "event-001");

        WeatherOracle.WeatherEvent memory latestEvent = weatherOracle.getLatestEventForRegion("District1");

        assertEq(latestEvent.eventId, "event-001");
        assertTrue(latestEvent.droughtAlert);
    }

    function test_GetTotalEvents() public {
        assertEq(weatherOracle.getTotalEvents(), 0);

        vm.prank(oracle1);
        weatherOracle.recordWeatherData("District1", 2550, 1050, true, false, "event-001");

        assertEq(weatherOracle.getTotalEvents(), 1);
    }
}
