// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {FarmerRegistry} from "../src/FarmerRegistry.sol";
import {WeatherOracle} from "../src/WeatherOracle.sol";
import {EligibilityEngine} from "../src/EligibilityEngine.sol";
import {SubsidyDistributor} from "../src/SubsidyDistributor.sol";

contract DeployScript is Script {
    // Contract addresses (will be set during deployment)
    address public farmerRegistry;
    address public weatherOracle;
    address public eligibilityEngine;
    address public subsidyDistributor;

    // Configuration
    address public paymentToken = address(0); // Set to ERC20 address if using token, or address(0) for native

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

        console.log("Deploying contracts...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy FarmerRegistry
        console.log("\n=== Deploying FarmerRegistry ===");
        FarmerRegistry farmerRegistryContract = new FarmerRegistry(deployer);
        farmerRegistry = address(farmerRegistryContract);
        console.log("FarmerRegistry deployed at:", farmerRegistry);

        // Step 2: Deploy WeatherOracle
        console.log("\n=== Deploying WeatherOracle ===");
        WeatherOracle weatherOracleContract = new WeatherOracle(deployer);
        weatherOracle = address(weatherOracleContract);
        console.log("WeatherOracle deployed at:", weatherOracle);

        // Step 3: Deploy EligibilityEngine
        console.log("\n=== Deploying EligibilityEngine ===");
        EligibilityEngine eligibilityEngineContract = new EligibilityEngine(deployer, farmerRegistry, weatherOracle);
        eligibilityEngine = address(eligibilityEngineContract);
        console.log("EligibilityEngine deployed at:", eligibilityEngine);

        // Step 4: Deploy SubsidyDistributor
        console.log("\n=== Deploying SubsidyDistributor ===");
        SubsidyDistributor subsidyDistributorContract =
            new SubsidyDistributor(deployer, eligibilityEngine, paymentToken);
        subsidyDistributor = address(subsidyDistributorContract);
        console.log("SubsidyDistributor deployed at:", subsidyDistributor);

        vm.stopBroadcast();

        // Print summary
        console.log("\n=== Deployment Summary ===");
        console.log("FarmerRegistry:", farmerRegistry);
        console.log("WeatherOracle:", weatherOracle);
        console.log("EligibilityEngine:", eligibilityEngine);
        console.log("SubsidyDistributor:", subsidyDistributor);
        if (paymentToken == address(0)) {
            console.log("Payment Token: Native Token");
        } else {
            console.log("Payment Token:", paymentToken);
        }

        // Save addresses to file
        _saveAddresses();
    }

    function _saveAddresses() internal {
        string memory json = string.concat(
            "{\n",
            '  "farmerRegistry": "',
            vm.toString(farmerRegistry),
            '",\n',
            '  "weatherOracle": "',
            vm.toString(weatherOracle),
            '",\n',
            '  "eligibilityEngine": "',
            vm.toString(eligibilityEngine),
            '",\n',
            '  "subsidyDistributor": "',
            vm.toString(subsidyDistributor),
            '",\n',
            '  "paymentToken": "',
            vm.toString(paymentToken),
            '",\n',
            '  "network": "sepolia"\n',
            "}\n"
        );

        vm.writeFile("./deployments/sepolia.json", json);
        console.log("\nAddresses saved to: ./deployments/sepolia.json");
    }
}
