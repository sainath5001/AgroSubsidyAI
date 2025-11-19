// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {FarmerRegistry} from "../src/FarmerRegistry.sol";

contract FarmerRegistryTest is Test {
    FarmerRegistry public farmerRegistry;

    address public owner = address(1);
    address public farmer1 = address(2);
    address public farmer2 = address(3);

    function setUp() public {
        vm.prank(owner);
        farmerRegistry = new FarmerRegistry(owner);
    }

    function test_RegisterFarmer() public {
        vm.prank(farmer1);
        farmerRegistry.registerFarmer(
            "0xabc123",
            "District1",
            "Village1",
            28613900, // 28.6139 * 1e6
            77123400, // 77.1234 * 1e6
            FarmerRegistry.CropType.RICE
        );

        assertTrue(farmerRegistry.isRegistered(farmer1));
        assertTrue(farmerRegistry.isFarmerActive(farmer1));

        FarmerRegistry.FarmerProfile memory profile = farmerRegistry.getFarmerProfile(farmer1);
        assertEq(profile.wallet, farmer1);
        assertEq(profile.landProofHash, "0xabc123");
        assertEq(profile.district, "District1");
        assertEq(profile.village, "Village1");
        assertEq(uint256(profile.cropType), uint256(FarmerRegistry.CropType.RICE));
    }

    function test_RegisterFarmer_RevertIf_AlreadyRegistered() public {
        vm.prank(farmer1);
        farmerRegistry.registerFarmer(
            "0xabc123", "District1", "Village1", 28613900, 77123400, FarmerRegistry.CropType.RICE
        );

        vm.expectRevert("FarmerRegistry: Already registered");
        vm.prank(farmer1);
        farmerRegistry.registerFarmer(
            "0xabc123", "District1", "Village1", 28613900, 77123400, FarmerRegistry.CropType.RICE
        );
    }

    function test_RegisterFarmer_RevertIf_EmptyLandProof() public {
        vm.expectRevert("FarmerRegistry: Land proof required");
        vm.prank(farmer1);
        farmerRegistry.registerFarmer("", "District1", "Village1", 28613900, 77123400, FarmerRegistry.CropType.RICE);
    }

    function test_UpdateProfile() public {
        vm.prank(farmer1);
        farmerRegistry.registerFarmer(
            "0xabc123", "District1", "Village1", 28613900, 77123400, FarmerRegistry.CropType.RICE
        );

        vm.prank(farmer1);
        farmerRegistry.updateProfile(
            "0xdef456", "District2", "Village2", 30000000, 80000000, FarmerRegistry.CropType.WHEAT
        );

        FarmerRegistry.FarmerProfile memory profile = farmerRegistry.getFarmerProfile(farmer1);
        assertEq(profile.landProofHash, "0xdef456");
        assertEq(profile.district, "District2");
        assertEq(profile.village, "Village2");
        assertEq(uint256(profile.cropType), uint256(FarmerRegistry.CropType.WHEAT));
    }

    function test_UpdateProfile_RevertIf_NotRegistered() public {
        vm.expectRevert("FarmerRegistry: Not registered");
        vm.prank(farmer1);
        farmerRegistry.updateProfile(
            "0xdef456", "District2", "Village2", 30000000, 80000000, FarmerRegistry.CropType.WHEAT
        );
    }

    function test_DeactivateFarmer() public {
        vm.prank(farmer1);
        farmerRegistry.registerFarmer(
            "0xabc123", "District1", "Village1", 28613900, 77123400, FarmerRegistry.CropType.RICE
        );

        vm.prank(owner);
        farmerRegistry.deactivateFarmer(farmer1);

        assertFalse(farmerRegistry.isFarmerActive(farmer1));
        assertTrue(farmerRegistry.isRegistered(farmer1));
    }

    function test_ReactivateFarmer() public {
        vm.prank(farmer1);
        farmerRegistry.registerFarmer(
            "0xabc123", "District1", "Village1", 28613900, 77123400, FarmerRegistry.CropType.RICE
        );

        vm.prank(owner);
        farmerRegistry.deactivateFarmer(farmer1);

        vm.prank(owner);
        farmerRegistry.reactivateFarmer(farmer1);

        assertTrue(farmerRegistry.isFarmerActive(farmer1));
    }

    function test_GetFarmersByDistrict() public {
        vm.prank(farmer1);
        farmerRegistry.registerFarmer(
            "0xabc123", "District1", "Village1", 28613900, 77123400, FarmerRegistry.CropType.RICE
        );

        vm.prank(farmer2);
        farmerRegistry.registerFarmer(
            "0xdef456", "District1", "Village2", 28614000, 77123500, FarmerRegistry.CropType.WHEAT
        );

        address[] memory farmers = farmerRegistry.getFarmersByDistrict("District1");
        assertEq(farmers.length, 2);
    }

    function test_GetTotalFarmers() public {
        assertEq(farmerRegistry.getTotalFarmers(), 0);

        vm.prank(farmer1);
        farmerRegistry.registerFarmer(
            "0xabc123", "District1", "Village1", 28613900, 77123400, FarmerRegistry.CropType.RICE
        );

        assertEq(farmerRegistry.getTotalFarmers(), 1);
    }
}
