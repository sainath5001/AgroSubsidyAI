// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {FarmerRegistry} from "../src/FarmerRegistry.sol";
import {WeatherOracle} from "../src/WeatherOracle.sol";
import {EligibilityEngine} from "../src/EligibilityEngine.sol";
import {SubsidyDistributor} from "../src/SubsidyDistributor.sol";

/**
 * @title SetupScript
 * @dev Post-deployment setup: authorize oracles and agents
 * @notice Run this after Deploy.s.sol
 */
contract SetupScript is Script {
    function run() external {
        // Get private key from env (with or without 0x prefix)
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey;
        
        // Remove 0x prefix if present
        bytes memory keyBytes = bytes(privateKeyStr);
        if (keyBytes.length >= 2 && keyBytes[0] == '0' && keyBytes[1] == 'x') {
            // Has 0x prefix, parse as hex
            deployerPrivateKey = vm.parseUint(privateKeyStr);
        } else {
            // No 0x prefix, add it and parse
            string memory keyWithPrefix = string.concat("0x", privateKeyStr);
            deployerPrivateKey = vm.parseUint(keyWithPrefix);
        }
        
        address deployer = vm.addr(deployerPrivateKey);

        // Load deployed addresses
        // Use environment variables for addresses
        address weatherOracle = vm.envAddress("WEATHER_ORACLE_ADDRESS");
        address payable subsidyDistributor = payable(vm.envAddress("SUBSIDY_DISTRIBUTOR_ADDRESS"));

        // Oracle addresses to authorize (set in .env)
        address oracle1 = vm.envOr("ORACLE_1_ADDRESS", address(0));
        address oracle2 = vm.envOr("ORACLE_2_ADDRESS", address(0));

        // Agent addresses to authorize (set in .env)
        address agent1 = vm.envOr("AGENT_1_ADDRESS", address(0));
        address agent2 = vm.envOr("AGENT_2_ADDRESS", address(0));

        vm.startBroadcast(deployerPrivateKey);

        // Authorize oracles
        if (oracle1 != address(0)) {
            console.log("Authorizing oracle 1:", oracle1);
            WeatherOracle(weatherOracle).authorizeOracle(oracle1);
        }

        if (oracle2 != address(0)) {
            console.log("Authorizing oracle 2:", oracle2);
            WeatherOracle(weatherOracle).authorizeOracle(oracle2);
        }

        // Authorize agents
        if (agent1 != address(0)) {
            console.log("Authorizing agent 1:", agent1);
            SubsidyDistributor(subsidyDistributor).authorizeAgent(agent1);
        }

        if (agent2 != address(0)) {
            console.log("Authorizing agent 2:", agent2);
            SubsidyDistributor(subsidyDistributor).authorizeAgent(agent2);
        }

        vm.stopBroadcast();

        console.log("\n=== Setup Complete ===");
    }
}
