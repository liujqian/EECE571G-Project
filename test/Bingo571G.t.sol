// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Bingo571G.sol";

contract BingoEECE571GTest is Test {
    BingoEECE571G public bingo;
    address payable alice = payable(address(0x100));
    address payable bob = payable(address(0x200));
    address payable steve = payable(address(0x300));
    uint present_time = 10 days;

    function setUp() public {
        bingo = new BingoEECE571G();
        // set block.timestamp to arbitrary time defined by "present_time"
        vm.warp(present_time);                    
    }

    function testCreateNewGame() public {
        // create 2 games 
        bingo.createGame(0.1 ether, 10**5, present_time + 1 days, 1 hours);
        bingo.createGame(0.2 ether, 10**6, present_time + 2 days, 30 minutes);

        // another host makes another 2 games
        vm.prank(alice);
        bingo.createGame(0.3 ether, 10**7, present_time + 1 days, 12 hours);
        vm.prank(alice);
        bingo.createGame(0.4 ether, 10**8, present_time + 2 days, 6 hours);

        // another host tries to create 2 games but one is invalid
        vm.prank(bob);
        bingo.createGame(0.05 ether, 10**9, present_time + 1 days, 12 hours);
        vm.prank(bob);
        vm.expectRevert("Start time must be in the future.");
        bingo.createGame(1 ether, 10**6, present_time - 1 days, 20 minutes);

        // check num_games
        assertEq(bingo.num_games(), 5);
    }
}