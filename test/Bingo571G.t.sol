// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Bingo571G.sol";

contract ExposedBingoEECE571G is BingoEECE571G{
    function _setGameNumbers(uint game_id, uint[] memory _numbers) public{
        games[game_id].numbers_drawn = _numbers;
    }
}

contract BingoEECE571GTest is Test {
    ExposedBingoEECE571G public bingo;
    address payable address100 = payable(address(0x100));
    address payable address200 = payable(address(0x200));
    address payable address300 = payable(address(0x300));
    uint present_time = 10 days;

    uint[] drawn_numbers = [0, 79, 25];
    uint[25] card_numbers = [
            1,  2,  3,  4,  5, 
            21, 22, 23, 24, 25,
            41, 42, 0,  44, 45,
            61, 62, 63, 64, 65,
            81, 82, 83, 84, 85
    ];

    function setUp() public {
        bingo = new ExposedBingoEECE571G();
        // set block.timestamp to arbitrary time defined by "present_time"
        vm.warp(present_time);  
        vm.deal(address100, 10 ether);
        vm.deal(address200, 10 ether);
        vm.deal(address300, 10 ether);            
    }

    function test_setGameNumbers() public {
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**5, present_time + 1 days, 1 hours);
        bingo._setGameNumbers(0, drawn_numbers);
        uint[] memory numbers_back;
        ( , , , , , , numbers_back) = bingo.checkGameStatus(0);
        assert(numbers_back[1] == 79);
    }
    
    function testCreateGame() public {
        // create 2 games 
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**5, present_time + 1 days, 1 hours);
        bingo.createGame{value: 0.7 ether}(0.2 ether, 10**6, present_time + 2 days, 30 minutes);

        vm.expectRevert("The host needs to pay the starting pot of at least three times the card price.");
        bingo.createGame{value: 0.1 ether}(0.1 ether, 10**5, present_time + 1 days, 1 hours);

        // another host tries to create 2 games but one is invalid
        vm.prank(address100);
        bingo.createGame{value: 0.15 ether}(0.05 ether, 10**9, present_time + 1 days, 12 hours);
        vm.prank(address100);
        vm.expectRevert("Start time must be in the future.");
        bingo.createGame{value: 3 ether}(1 ether, 10**6, present_time - 1 days, 20 minutes);

        // check num_games
        assertEq(bingo.num_games(), 3);
        assertEq(address(bingo).balance, 1.15 ether);
    }

    function testBuyCard() public {
        bingo.createGame{value: 3 ether}(1 ether, 10**5, present_time + 1 days, 1 hours);
        
        vm.startPrank(address100);

        // non existent game
        vm.expectRevert("Game not valid");
        bingo.buyCard{value: 1 ether}(5, card_numbers);

        // game hasnt started
        vm.expectRevert("You cannot do this yet!");
        bingo.buyCard{value: 1 ether}(1, card_numbers); 

        vm.warp(present_time + 2 days);

        // insufficient payment
        vm.expectRevert("Incorrect payment");
        bingo.buyCard{value: 0.5 ether}(1, card_numbers);
        vm.expectRevert("Incorrect payment");
        bingo.buyCard{value: 1.5 ether}(1, card_numbers);

        // bingo.buyCard{value: 1 ether}(1, [1, 2, 3, 4, 5, 21, 22, 23, 24, 25, 41, 42, 0, 43, 45, 61, 62, 63, 64, 65, 81, 81, 83, 84, 85]);
        // throws error Invalid implicit conversion from uint8[25] memory to uint256[25] memory requested.
    }
}