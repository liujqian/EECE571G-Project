// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Bingo571G.sol";
import "../lib/foundry-random/src/FoundryRandom.sol";

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

    function getNumbersDrawn(uint game_id) public view returns(uint[] memory) {
        return games[game_id].numbers_drawn;
    }

    function getPlayerCalls(uint game_id, address _address) public view returns(uint) {
        return games[game_id].caller_players[_address];
    } 
}

contract BingoEECE571GTest is Test {
    ExposedBingoEECE571G public bingo;
    FoundryRandom public random;
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
        random = new FoundryRandom();
        // set block.timestamp to arbitrary time defined by "present_time"
        vm.warp(present_time);  
        vm.deal(address100, 10 ether);
        vm.deal(address200, 10 ether);
        vm.deal(address300, 10 ether);            
    }

    function test_setGameNumbers() public {
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**5, present_time + 1 days, 1 hours);
        drawn_numbers = [0, 79, 25];
        bingo._setGameNumbers(1, drawn_numbers);
        uint[] memory numbers_back;
        ( , , , , , , numbers_back) = bingo.checkGameStatus(1);
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

        // host fee too high
        vm.prank(address100);
        vm.expectRevert("The host cut proportion must be less than 1 ether");
        bingo.createGame{value: 3 ether}(1 ether, 10**19, present_time - 1 days, 20 minutes);

        // check num_games
        assertEq(bingo.num_games(), 3);
        assertEq(address(bingo).balance, 1.15 ether);
    }

    /* 
        @notice uses the foundry-random library which takes a long time to compile and run
        comment/uncomment as necessary (also comment the import and 2 initializations)
    */
    function testBuyCard1() public {
        bingo.createGame{value: 0.1 ether}(0.001 ether, 10**5, present_time + 1 days, 1 hours);
        bingo.createGame{value: 1 ether}(0.2 ether, 10**5, present_time + 1 days, 1 hours);
        
        vm.startPrank(address100);

        // game already started
        vm.warp(present_time+ 2 days);
        vm.expectRevert("You cannot do this anymore!");
        bingo.buyCard{value: 0.001 ether}(1, card_numbers); 
        vm.warp(present_time);

        // insufficient payment
        vm.expectRevert("Incorrect payment");
        bingo.buyCard{value: 0.0005 ether}(1, card_numbers);
        vm.expectRevert("Incorrect payment");
        bingo.buyCard{value: 0.005 ether}(1, card_numbers);

        uint[25] memory cards = card_numbers;
        for(uint i = 0; i < 10; i++) {
            cards = card_numbers;
            cards[random.randomNumber(0, 4)] = random.randomNumber(6, 19);
            cards[random.randomNumber(5, 9)] = random.randomNumber(26, 39);
            cards[random.randomNumber(10, 11)] = random.randomNumber(46, 49);
            cards[random.randomNumber(13, 14)] = random.randomNumber(50, 59);
            cards[random.randomNumber(15, 19)] = random.randomNumber(66, 79);
            cards[random.randomNumber(20, 24)] = random.randomNumber(86, 99);

            bingo.buyCard{value: 0.001 ether}(1, cards);

            if(i % 2 == 0) {
                bingo.buyCard{value: 0.2 ether}(2, cards);
            }
        }

        //Test number of of range card purchases (invalid cards)
        for(uint i = 0; i < 10; i++) {
            // FIRST ROW
            cards = card_numbers;
            cards[random.randomNumber(0, 4)] = random.randomNumber(20, 100);
            vm.expectRevert("Numbers in first column must be in the range 1-19");
            bingo.buyCard{value: 0.001 ether}(1, cards);

            // SECOND ROW
            cards = card_numbers;
            cards[random.randomNumber(5, 9)] = random.randomNumber(0, 19);
            vm.expectRevert("Numbers in second column must be in the range 20-39");
            bingo.buyCard{value: 0.001 ether}(1, cards);

            cards = card_numbers;
            cards[random.randomNumber(5, 9)] = random.randomNumber(40, 100);
            vm.expectRevert("Numbers in second column must be in the range 20-39");
            bingo.buyCard{value: 0.001 ether}(1, cards);

            // THIRD ROW
            cards = card_numbers;
            cards[random.randomNumber(10, 11)] = random.randomNumber(0, 39);
            vm.expectRevert("Numbers in third column must be in the range 40-59");
            bingo.buyCard{value: 0.001 ether}(1, cards);

            cards = card_numbers;
            cards[random.randomNumber(10, 11)] = random.randomNumber(60, 100);
            vm.expectRevert("Numbers in third column must be in the range 40-59");
            bingo.buyCard{value: 0.001 ether}(1, cards);

            cards = card_numbers;
            cards[12] = random.randomNumber(1, 100);
            vm.expectRevert("Must have 0 in center square (Free tile!)");
            bingo.buyCard{value: 0.001 ether}(1, cards);

            // FOURTH ROW
            cards = card_numbers;
            cards[random.randomNumber(15, 19)] = random.randomNumber(0, 49);
            vm.expectRevert("Numbers in fourth column must be in the range 50-79");
            bingo.buyCard{value: 0.001 ether}(1, cards);

            cards = card_numbers;
            cards[random.randomNumber(15, 19)] = random.randomNumber(80, 100);
            vm.expectRevert("Numbers in fourth column must be in the range 50-79");
            bingo.buyCard{value: 0.001 ether}(1, cards);

            // FIFTH ROW
            cards = card_numbers;
            cards[random.randomNumber(20, 24)] = random.randomNumber(0, 79);
            vm.expectRevert("Numbers in fifth column must be in the range 80-99");
            bingo.buyCard{value: 0.001 ether}(1, cards);

            cards = card_numbers;
            cards[random.randomNumber(20, 24)] = random.randomNumber(100, 200);
            vm.expectRevert("Numbers in fifth column must be in the range 80-99");
            bingo.buyCard{value: 0.001 ether}(1, cards);
        }

        // Test repeated number cards (invalid cards)
        cards = card_numbers;
        cards[3] = cards[2];
        vm.expectRevert("Numbers can not be repeated");
        bingo.buyCard{value: 0.001 ether}(1, cards);

        cards = card_numbers;
        cards[5] = cards[6];
        vm.expectRevert("Numbers can not be repeated");
        bingo.buyCard{value: 0.001 ether}(1, cards);

        cards = card_numbers;
        cards[9] = cards[8];
        vm.expectRevert("Numbers can not be repeated");
        bingo.buyCard{value: 0.001 ether}(1, cards);

        cards = card_numbers;
        cards[14] = cards[10];
        vm.expectRevert("Numbers can not be repeated");
        bingo.buyCard{value: 0.001 ether}(1, cards);

        cards = card_numbers;
        cards[17] = cards[18];
        vm.expectRevert("Numbers can not be repeated");
        bingo.buyCard{value: 0.001 ether}(1, cards);

        cards = card_numbers;
        cards[20] = cards[22];
        vm.expectRevert("Numbers can not be repeated");
        bingo.buyCard{value: 0.001 ether}(1, cards);
 
        // Test other people buying cards
        vm.stopPrank();
        cards = card_numbers;

        vm.prank(address200);
        bingo.buyCard{value: 0.001 ether}(1, cards);
        vm.prank(address200);
        bingo.buyCard{value: 0.001 ether}(1, cards);

        vm.prank(address300);
        bingo.buyCard{value: 0.001 ether}(1, cards);
        vm.prank(address300);
        bingo.buyCard{value: 0.2 ether}(2, cards);


        assertEq(bingo.getNumberOfCards(1, address100), 10);
        assertEq(bingo.getNumberOfCards(1, address200), 2);
        assertEq(bingo.getNumberOfCards(1, address300), 1);

        assertEq(bingo.getNumberOfCards(2, address100), 5);
        assertEq(bingo.getNumberOfCards(2, address200), 0);
        assertEq(bingo.getNumberOfCards(2, address300), 1);

        assertEq(address(bingo).balance, 2.313 ether);
        assertEq(bingo.getPoolValue(1), 0.113 ether);
        assertEq(bingo.getPoolValue(2), 2.2 ether);
    }

    function testBuyCard2() public {
        // non existent game
        vm.expectRevert("Game doesn't exist!");
        bingo.buyCard{value: 0.001 ether}(5, card_numbers);

        vm.prank(address100);
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**16, present_time + 1 days, 1 hours);
        
        vm.prank(address200);
        card_numbers[17] = 75;
        bingo.buyCard{value: 0.1 ether}(1, card_numbers);

        present_time += 1 days + 1 + 4 hours;
        vm.warp(present_time);
        vm.startPrank(address100); //host

        drawn_numbers = [0, 61, 62, 64, 65];
        bingo._setGameNumbers(1, drawn_numbers);
        bingo.drawNumber(1);

        bool hasCompleted;
        (, , , , hasCompleted, , ) = bingo.checkGameStatus(1);
        assertTrue(hasCompleted);

        card_numbers[1] = 9;
        vm.expectRevert("You cannot do this anymore!");
        bingo.buyCard{value: 0.1 ether}(1, card_numbers);
    }

    function testCheckCard() public {
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**5, present_time + 1 days, 1 hours);
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**5, present_time + 1 days, 1 hours);

        vm.startPrank(address100);

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

    function testNumberOfDraws() public {
        // Test number of numbers drawn
        uint[] memory numbers_back; 

        vm.prank(address100);
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**5, present_time + 1 days, 1 hours);
        assertEq(bingo.getNumbersDrawn(1).length-1, 0);
        
        vm.prank(address200);
        bingo.buyCard{value: 0.1 ether}(1, card_numbers);

        vm.startPrank(address100);
        present_time += 1 days + 1;
        vm.warp(present_time);
        bingo.drawNumber(1);    // should draw one number
        assertEq(bingo.getNumbersDrawn(1).length-1, 1);

        present_time += 2 hours;
        vm.warp(present_time);
        bingo.drawNumber(1);    // should draw 2 numbers
        assertEq(bingo.getNumbersDrawn(1).length-1, 3);

        present_time += 1 days;
        vm.warp(present_time);
        bingo.drawNumber(1);    // should draw 24 numbers
        assertEq(bingo.getNumbersDrawn(1).length-1, 27);

        bool debug = false;
        if(debug) {
            numbers_back = bingo.getNumbersDrawn(1);
            for(uint i = 0; i < numbers_back.length; i++) {
                emit log_uint(numbers_back[i]);
            }
        }
    }

    // Single winner, host calls all draws
    function testEndOfGame1() public {
        uint hostFee;
        bool hasCompleted;
        uint poolValue; 
        
        vm.prank(address100);
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**16, present_time + 1 days, 1 hours);
        
        vm.prank(address200);
        card_numbers[17] = 75;
        bingo.buyCard{value: 0.1 ether}(1, card_numbers);

        present_time += 1 days + 1 + 4 hours;
        vm.warp(present_time);
        vm.startPrank(address100); //host

        drawn_numbers = [0, 61, 62, 64, 65];
        bingo._setGameNumbers(1, drawn_numbers);
        
        bingo.drawNumber(1);    // should draw 75 resulting in a bingo
        assertEq(bingo.checkCard(1, address200, 0), 1); // passes, bingo did indeed happen

        (, , hostFee, , hasCompleted, poolValue, ) = bingo.checkGameStatus(1);
        assertTrue(hasCompleted);

        uint hostCut = (poolValue*hostFee / 1 ether);
        assertEq(address100.balance, 9.7 ether + hostCut);
        assertEq(address200.balance, 9.9 ether + (poolValue - hostCut));
    }

    // Multiple winners, host calls all draws
    function testEndOfGame2() public {
        uint hostFee;
        bool hasCompleted;
        uint poolValue; 
    
        vm.prank(address100);
        bingo.createGame{value: 3 ether}(1 ether, 10**17, present_time + 1 days, 1 hours);
        
        card_numbers = [
            6, 13, 14, 11, 18, 
            21, 31, 28, 30, 29,
            59, 46, 0, 48, 47,
            60, 63, 68, 77, 72,
            80, 81, 90, 89, 92
        ];
        vm.prank(address200);
        bingo.buyCard{value: 1 ether}(1, card_numbers);

        card_numbers = [
            4, 15, 16, 5, 19,
            32, 37, 39, 25, 20,
            41, 48, 0, 51, 58,
            70, 63, 71, 67, 77,
            96, 86, 99, 89, 94
        ];
        vm.prank(address300);
        bingo.buyCard{value: 1 ether}(1, card_numbers);

        assertEq(bingo.getPoolValue(1), 5 ether);

        present_time += 1 days + 1;
        vm.warp(present_time);

        vm.startPrank(address100);
        for(uint i = 0; i < 15; i++) {
            bingo.drawNumber(1);
            present_time += 1 hours;
            vm.warp(present_time);
        }

        assertEq(bingo.checkCard(1, address200, 0), 1);
        assertEq(bingo.checkCard(1, address300, 0), 1);

        (, , hostFee, , hasCompleted, poolValue, ) = bingo.checkGameStatus(1);
        assertTrue(hasCompleted);

        uint hostCut = (poolValue*hostFee / 1 ether);
        assertEq(address100.balance, 7 ether + hostCut);
        assertEq(address200.balance, 9 ether + (poolValue-hostCut)/2);
        assertEq(address300.balance, 9 ether + (poolValue-hostCut)/2);
    }

    // Single winner with multiple draw callers
    function testEndOfGame3() public {
        uint hostFee;
        bool hasCompleted;
        uint poolValue; 

        vm.prank(address100);
        bingo.createGame{value: 3 ether}(1 ether, 10**17, present_time + 1 days, 1 hours);

        vm.prank(address200);
        bingo.buyCard{value: 1 ether}(1, card_numbers);

        vm.prank(address300);
        card_numbers[24] = 88;
        bingo.buyCard{value: 1 ether}(1, card_numbers);

        present_time += 1 days + 1 + 4 hours;
        vm.warp(present_time);
        
        drawn_numbers = [0, 19, 81, 82, 83, 84];
        bingo._setGameNumbers(1, drawn_numbers);

        present_time += 1 hours;
        vm.warp(present_time);
        vm.prank(address300);
        bingo.drawNumber(1);

        present_time += 1 hours;
        vm.warp(present_time);
        vm.prank(address200);
        bingo.drawNumber(1);

        present_time += 1 hours;
        vm.warp(present_time);
        vm.prank(address200);
        bingo.drawNumber(1);

        assertEq(bingo.checkCard(1, address200, 0), 0);
        assertEq(bingo.checkCard(1, address300, 0), 1);

        (, , hostFee, , hasCompleted, poolValue, ) = bingo.checkGameStatus(1);
        assertTrue(hasCompleted);

        uint hostCut = (poolValue*hostFee / 1 ether);
        uint callerBaseCut = hostCut / 100;

        uint p1 = hostCut - (callerBaseCut * 3);
        uint p2 = callerBaseCut * 2;
        uint p3 = callerBaseCut * 1;

        assertEq(address100.balance - 7 ether, p1);
        assertEq(address200.balance - 9 ether, p2);
        assertEq(address300.balance - 9 ether, poolValue - hostCut + p3);
    }

    // Multiple winners with multiple draw callers
    function testEndOfGame4() public {
        uint hostFee;
        bool hasCompleted;
        uint poolValue; 

        vm.prank(address100);
        bingo.createGame{value: 3 ether}(1 ether, 10**17, present_time + 1 days, 1 hours);

        vm.prank(address200);
        bingo.buyCard{value: 1 ether}(1, card_numbers);

        vm.prank(address300);
        card_numbers[5] = 31;
        bingo.buyCard{value: 1 ether}(1, card_numbers);

        present_time += 1 days + 1 + 4 hours;
        vm.warp(present_time);
        
        drawn_numbers = [0, 22, 25, 21, 83, 84];
        bingo._setGameNumbers(1, drawn_numbers);

        present_time += 1 hours;
        vm.warp(present_time);
        vm.prank(address300);
        bingo.drawNumber(1);

        present_time += 1 hours;
        vm.warp(present_time);
        vm.prank(address300);
        bingo.drawNumber(1);

        present_time += 1 hours;
        vm.warp(present_time);
        vm.prank(address200);
        bingo.drawNumber(1);

        present_time += 1 hours;
        vm.warp(present_time);
        vm.prank(address200);
        bingo.drawNumber(1);

        present_time += 1 hours;
        vm.warp(present_time);
        vm.prank(address200);
        bingo.drawNumber(1);
        
        assertEq(bingo.checkCard(1, address200, 0), 1);
        assertEq(bingo.checkCard(1, address300, 0), 0);

        (, , hostFee, , hasCompleted, poolValue, ) = bingo.checkGameStatus(1);
        assertTrue(hasCompleted);

        uint hostCut = (poolValue*hostFee / 1 ether);
        uint callerBaseCut = hostCut / 100;

        uint p1 = hostCut - (callerBaseCut * 5);
        uint p2 = callerBaseCut * 3;
        uint p3 = callerBaseCut * 2;

        assertEq(address100.balance - 7 ether, p1);
        assertEq(address200.balance - 9 ether, poolValue - hostCut + p2);
        assertEq(address300.balance - 9 ether, p3);
    }

    // Invalid calls to games
    function testEndOfGame5() public {
        bool hasCompleted;
        
        vm.prank(address100);
        bingo.createGame{value: 0.3 ether}(0.1 ether, 10**16, present_time + 1 days, 1 hours);
        
        vm.prank(address200);
        card_numbers[24] = 86;
        bingo.buyCard{value: 0.1 ether}(1, card_numbers);

        // before game start
        vm.warp(present_time + 1 hours);
        vm.expectRevert("Not enough time has passed to draw a new number!");
        bingo.drawNumber(1);

        present_time += 1 days + 1 + 4 hours;
        vm.warp(present_time);
        
        drawn_numbers = [0, 81, 82, 83, 84];
        bingo._setGameNumbers(1, drawn_numbers);

        // external player tries to draw
        vm.expectRevert("You are not part of this game");
        vm.prank(address300);
        bingo.drawNumber(1);
        
        vm.startPrank(address100);
        bingo.drawNumber(1);    

        vm.warp(present_time + 30 minutes);
        vm.expectRevert("Not enough time has passed to draw a new number!");
        bingo.drawNumber(1);

        present_time += 1 hours;
        vm.warp(present_time);
        bingo.drawNumber(1);

        assertEq(bingo.checkCard(1, address200, 0), 1);

        (, , , , hasCompleted, , ) = bingo.checkGameStatus(1);
        assertTrue(hasCompleted);

        present_time += 1 hours;
        vm.warp(present_time);
        vm.expectRevert("The game is over");
        bingo.drawNumber(1);
    }

}