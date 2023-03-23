// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Bingo571G.sol";
//import "../lib/foundry-random/src/FoundryRandom.sol";

contract ExposedBingoEECE571G is BingoEECE571G{
    function _setGameNumbers(uint game_id, uint[] calldata _numbers) public{
        games[game_id].numbers_drawn = [0];
        games[game_id].numbers_drawn.pop();
        for(uint i = 0; i < _numbers.length; i++) {
            games[game_id].numbers_drawn.push(_numbers[i]);
        }  
    }

    function getNumberOfCards(uint game_id, address payable _address) public view returns(uint) {
        return games[game_id].player_cards[_address].length;
    }

    function getPoolValue(uint game_id) public view returns(uint) {
        return games[game_id].pool_value;
    }
}

contract BingoEECE571GTest is Test {
    ExposedBingoEECE571G public bingo;
    //FoundryRandom public random;
    address payable address100 = payable(address(0x100));
    address payable address200 = payable(address(0x200));
    address payable address300 = payable(address(0x300));
    uint present_time = 10 days;

    uint[] drawn_numbers = [0];
    uint[25] card_numbers = [
            1,  2,  3,  4,  5, 
            21, 22, 23, 24, 25,
            41, 42, 0,  44, 45,
            61, 62, 63, 64, 65,
            81, 82, 83, 84, 85
    ];

    function setUp() public {
        bingo = new ExposedBingoEECE571G();
        //random = new FoundryRandom();
        // set block.timestamp to arbitrary time defined by "present_time"
        vm.warp(present_time);  
        vm.deal(address100, 10 ether);
        vm.deal(address200, 10 ether);
        vm.deal(address300, 10 ether);            
    }

    function test_setGameNumbers() public {
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**5, present_time + 1 days, 1 hours);
        drawn_numbers = [0, 79, 25];
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

    /* 
        @notice uses the foundry-random library which takes a long time to compile and run
        comment/uncomment as necessary (also comment the import and 2 initializations)
    */
    // function testBuyCard() public {
    //     bingo.createGame{value: 0.1 ether}(0.001 ether, 10**5, present_time + 1 days, 1 hours);
    //     bingo.createGame{value: 1 ether}(0.2 ether, 10**5, present_time + 1 days, 1 hours);
        
    //     vm.startPrank(address100);

    //     // non existent game
    //     vm.expectRevert("Game not valid");
    //     bingo.buyCard{value: 0.001 ether}(5, card_numbers);

    //     // game hasnt started
    //     vm.expectRevert("You cannot do this yet!");
    //     bingo.buyCard{value: 0.001 ether}(1, card_numbers); 

    //     vm.warp(present_time + 2 days);

    //     // insufficient payment
    //     vm.expectRevert("Incorrect payment");
    //     bingo.buyCard{value: 0.0005 ether}(1, card_numbers);
    //     vm.expectRevert("Incorrect payment");
    //     bingo.buyCard{value: 0.005 ether}(1, card_numbers);

    //     // bingo.buyCard{value: 1 ether}(1, [1, 2, 3, 4, 5, 21, 22, 23, 24, 25, 41, 42, 0, 43, 45, 61, 62, 63, 64, 65, 81, 81, 83, 84, 85]);
    //     // throws error Invalid implicit conversion from uint8[25] memory to uint256[25] memory requested.

    //     /* 
    //         Test valid/invalid number card purchases
    //         @notice takes a long time to compile and run (around 10 seconds) so comment/uncomment the test as necessary 
    //         @notice takes a long time to compile and run (around 10 seconds) so comment/uncomment as necessary 
    //     */
    //     for(uint i = 0; i < 10; i++) {
    //         card_numbers[random.randomNumber(0, 4)] = random.randomNumber(1, 19);
    //         card_numbers[random.randomNumber(5, 9)] = random.randomNumber(20, 39);
    //         card_numbers[random.randomNumber(10, 11)] = random.randomNumber(40, 59);
    //         card_numbers[random.randomNumber(13, 14)] = random.randomNumber(40, 59);
    //         card_numbers[random.randomNumber(15, 19)] = random.randomNumber(60, 79);
    //         card_numbers[random.randomNumber(20, 24)] = random.randomNumber(80, 99);

    //         bingo.buyCard{value: 0.001 ether}(1, card_numbers);

    //         if(i % 2 == 0) {
    //             bingo.buyCard{value: 0.2 ether}(2, card_numbers);
    //         }
    //     }

    //     //Test invalid card purchases
    //     uint[25] memory cards = card_numbers;
    //     for(uint i = 0; i < 10; i++) {
    //         // FIRST ROW
    //         cards[random.randomNumber(0, 4)] = random.randomNumber(20, 100);
    //         vm.expectRevert("Numbers in first column must be in the range 1-19");
    //         bingo.buyCard{value: 0.001 ether}(1, cards);

    //         // SECOND ROW
    //         cards = card_numbers;
    //         cards[random.randomNumber(5, 9)] = random.randomNumber(0, 19);
    //         vm.expectRevert("Numbers in second column must be in the range 20-39");
    //         bingo.buyCard{value: 0.001 ether}(1, cards);

    //         cards = card_numbers;
    //         cards[random.randomNumber(5, 9)] = random.randomNumber(40, 100);
    //         vm.expectRevert("Numbers in second column must be in the range 20-39");
    //         bingo.buyCard{value: 0.001 ether}(1, cards);

    //         // THIRD ROW
    //         cards = card_numbers;
    //         cards[random.randomNumber(10, 11)] = random.randomNumber(0, 39);
    //         vm.expectRevert("Numbers in third column must be in the range 40-59");
    //         bingo.buyCard{value: 0.001 ether}(1, cards);

    //         cards = card_numbers;
    //         cards[random.randomNumber(10, 11)] = random.randomNumber(60, 100);
    //         vm.expectRevert("Numbers in third column must be in the range 40-59");
    //         bingo.buyCard{value: 0.001 ether}(1, cards);

    //         cards = card_numbers;
    //         cards[12] = random.randomNumber(1, 100);
    //         vm.expectRevert("Must have 0 in center square (Free tile!)");
    //         bingo.buyCard{value: 0.001 ether}(1, cards);

    //         // FOURTH ROW
    //         cards = card_numbers;
    //         cards[random.randomNumber(15, 19)] = random.randomNumber(0, 49);
    //         vm.expectRevert("Numbers in fourth column must be in the range 50-79");
    //         bingo.buyCard{value: 0.001 ether}(1, cards);

    //         cards = card_numbers;
    //         cards[random.randomNumber(15, 19)] = random.randomNumber(80, 100);
    //         vm.expectRevert("Numbers in fourth column must be in the range 50-79");
    //         bingo.buyCard{value: 0.001 ether}(1, cards);

    //         // FIFTH ROW
    //         cards = card_numbers;
    //         cards[random.randomNumber(20, 24)] = random.randomNumber(0, 79);
    //         vm.expectRevert("Numbers in fifth column must be in the range 80-99");
    //         bingo.buyCard{value: 0.001 ether}(1, cards);

    //         cards = card_numbers;
    //         cards[random.randomNumber(20, 24)] = random.randomNumber(100, 200);
    //         vm.expectRevert("Numbers in fifth column must be in the range 80-99");
    //         bingo.buyCard{value: 0.001 ether}(1, cards);
    //     }
 
    //     vm.stopPrank();
    //     cards = card_numbers;

    //     vm.prank(address200);
    //     bingo.buyCard{value: 0.001 ether}(1, cards);
    //     vm.prank(address200);
    //     bingo.buyCard{value: 0.001 ether}(1, cards);

    //     vm.prank(address300);
    //     bingo.buyCard{value: 0.001 ether}(1, cards);
    //     vm.prank(address300);
    //     bingo.buyCard{value: 0.2 ether}(2, cards);


    //     assertEq(bingo.getNumberOfCards(1, address100), 10);
    //     assertEq(bingo.getNumberOfCards(1, address200), 2);
    //     assertEq(bingo.getNumberOfCards(1, address300), 1);

    //     assertEq(bingo.getNumberOfCards(2, address100), 5);
    //     assertEq(bingo.getNumberOfCards(2, address200), 0);
    //     assertEq(bingo.getNumberOfCards(2, address300), 1);

    //     assertEq(address(bingo).balance, 2.313 ether);
    //     assertEq(bingo.getPoolValue(1), 0.113 ether);
    //     assertEq(bingo.getPoolValue(2), 2.2 ether);
    // }

    function testCheckCard() public {
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**5, present_time + 1 days, 1 hours);
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**5, present_time + 1 days, 1 hours);

        vm.startPrank(address100);
        vm.warp(present_time + 2 days);

        bingo.buyCard{value: 0.1 ether}(1, card_numbers);
        bingo.buyCard{value: 0.1 ether}(2, card_numbers);

        // Row Bingo
        drawn_numbers = [0, 1, 2, 3, 4, 5];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 1, "r1");
        assertEq(bingo.checkCard(2, address100, 0), 0, "r1");

        drawn_numbers = [0, 61, 62, 63, 64, 65];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 1, "r2");
        assertEq(bingo.checkCard(2, address100, 0), 0, "r2");

        // Column Bingo
        drawn_numbers = [0, 2, 22, 42, 62, 82];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 1, "c1");
        assertEq(bingo.checkCard(2, address100, 0), 0, "c1");

        drawn_numbers = [0, 4, 24, 44, 64, 84];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 1, "c2");
        assertEq(bingo.checkCard(2, address100, 0), 0, "c2");

        // Diagonals
        drawn_numbers = [0, 1, 22, 64, 85];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 1, "d1");
        assertEq(bingo.checkCard(2, address100, 0), 0, "d1");

        drawn_numbers = [0, 5, 24, 62, 81];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 1, "d2");
        assertEq(bingo.checkCard(2, address100, 0), 0, "d2");

        // Multiple Bingos
        drawn_numbers = [0, 1, 4, 22, 24, 25, 41, 44, 45, 42, 63, 64, 65, 81, 84];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 2, "m1");
        assertEq(bingo.checkCard(2, address100, 0), 0, "m1");

        drawn_numbers = [0, 1, 4, 22, 85, 25, 3, 44, 45, 42, 63, 64, 65, 81, 84, 23, 83];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 2, "m2");
        assertEq(bingo.checkCard(2, address100, 0), 0, "m2");

        drawn_numbers = [0, 41, 42, 44, 45, 3, 23, 63, 83, 61, 62, 64, 65];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 3, "m3");
        assertEq(bingo.checkCard(2, address100, 0), 0, "m3");

        drawn_numbers = [0, 1, 22, 64, 85, 61, 62, 63, 65, 4, 24, 44, 84];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 3, "m4");
        assertEq(bingo.checkCard(2, address100, 0), 0, "m4");

        // Invalid calls
        vm.expectRevert("You do not have any cards!");
        assertEq(bingo.checkCard(1, address200, 0), 0, "eq");
        vm.expectRevert("You do not have any cards!");
        assertEq(bingo.checkCard(2, address300, 0), 0, "e2");
        vm.expectRevert("You do not have a card at this index");
        assertEq(bingo.checkCard(1, address100, 1), 0, "e3");
        vm.expectRevert("You do not have a card at this index");
        assertEq(bingo.checkCard(2, address100, 2), 0, "e4");

        // No bingos
        drawn_numbers = [0, 1, 22, 76, 85, 61, 62, 63, 65, 4, 24, 44, 84];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 0, "n1");

        drawn_numbers = [0];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 0, "n2");

        drawn_numbers = [81, 82, 83, 84, 86];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 0, "n3");

        drawn_numbers = [0, 5, 1, 81, 85, 83, 3, 41, 45, 21, 64, 63];
        bingo._setGameNumbers(1, drawn_numbers);
        assertEq(bingo.checkCard(1, address100, 0), 0, "n4");
    }   
}