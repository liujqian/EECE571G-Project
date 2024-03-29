// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

    struct Card {
        // specify bingo card by an array of numbers, top to bottom then left to right
        // so first five entries are the 'B' column, 13th entry is always 0 (for free tile)
        uint[25] numbers;
        uint[3] superblocks; // should this be the numbers or indices of the superblocks?
    }

    struct Game {
        // @notice ALL THE TIME RELATED VARIABLES ARE IN SECONDS.
        address payable host_address;
        uint card_price;
        uint host_fee; // in Wei per Eth of pool value (fraction of pool x 10^18)
        uint start_time; // Unix timestamp of start time (must be in the future)
        uint turn_time; // time between draws
        uint last_draw_time;
        address[] players; // array of players, which we can iterate over to check for a winner
        mapping(address => Card[]) player_cards; // mapping of addresses to array of cards, so players can check their cards easily
        uint[] numbers_drawn; // initialized with 0 in first entry for every game (free tile)
        mapping(address => uint) caller_players; // mapping of addresses to the number of  valid calls (resulted in drawing next number/numbers)
        bool is_valid;
        bool has_completed;
        uint pool_value;
    }

contract BingoEECE571G {

    address payable public dev_address;
    mapping(uint => Game) public games; // indexed by game IDs
    mapping(address => uint[]) public player_games; // allows players to find the game IDs of their active games (can remove later if too gas intensive)
    mapping(address => uint[]) public host_games;
    uint public num_games;

    event GameCreation(uint game_id, address host_address, uint host_fee, uint card_price, uint start_time, uint turn_time, uint pool_value);
    event NumberDraw(uint game_id, uint number);
    event CardPurchase(uint game_id, address player, uint[25] numbers);

    constructor() {
        dev_address = payable(msg.sender);
    }

    function getPlayerGamesCount(address playerAddress) public view returns (uint){return player_games[playerAddress].length;}

    function getHostGamesCount(address hostAddress) public view returns (uint){return host_games[hostAddress].length;}

    function getHostGames(address hostAddress) public view returns (uint[] memory) {
        uint[] storage gameIDs = host_games[hostAddress];
        uint[] memory copiedGameIDs = new uint[](gameIDs.length);
        for (uint i = 0; i < gameIDs.length; i++) {
            copiedGameIDs[i] = gameIDs[i];
        }
        return copiedGameIDs;
    }

    function getPlayerGames(address playerAddress) public view returns (uint[] memory) {
        uint[] storage gameIDs = player_games[playerAddress];
        uint[] memory copiedGameIDs = new uint[](gameIDs.length);
        for (uint i = 0; i < gameIDs.length; i++) {
            copiedGameIDs[i] = gameIDs[i];
        }
        return copiedGameIDs;
    }

    function getPlayerCards(uint gameID, address playerAddress) public view returns (Card[] memory) {
        address sender = playerAddress;
        Game storage game = games[gameID];
        Card[] storage playerCards = game.player_cards[sender];
        Card[] memory copiedCards = new Card[](playerCards.length);
        for (uint i = 0; i < playerCards.length; i++) {
            copiedCards[i] = playerCards[i];
        }
        return playerCards;
    }

    function setDevAddress(address _newAddress) public {
        require(msg.sender == dev_address, "Only the dev can change addresses");
        dev_address = payable(_newAddress);
    }

    modifier gameExists(uint game_id) {
        require(games[game_id].start_time > 0 && game_id > 0, "Game doesn't exist!");
        _;
    }

    modifier hostOrPlayersCall(uint game_id, address _sender){
        require((games[game_id].host_address == _sender) || (_checkRepeatedAddress(games[game_id].players, _sender)), "You are not part of this game");
        _;
    }

    modifier timePrecedence(uint timestamp1, uint timestamp2){
        require(timestamp2 < timestamp1, "You cannot do this anymore!");
        _;
    }

    modifier validInterval(uint game_id) {
        require(!games[game_id].has_completed, "The game is over");
        // numerator could be negative if called before game starts but will then be assigned to uint, check to prevent this
        require(block.timestamp > games[game_id].start_time, "Not enough time has passed to draw a new number!");
        uint intervalsPassed = (block.timestamp - games[game_id].start_time) / games[game_id].turn_time + 1;
        // numbers_drawn.length is 1 initially, not 0
        require(games[game_id].numbers_drawn.length - 1 < intervalsPassed,
            "Not enough time has passed to draw a new number!");
        _;
    }


    // creates a new game with msg.sender as host
    function createGame(uint _card_price, uint _host_fee, uint _start_time, uint _turn_time) public payable returns (uint game_id){
        require(_host_fee < 1 ether, "The host cut proportion must be less than 1 ether");
        require(_start_time > block.timestamp, "Start time must be in the future.");
        require(msg.value >= _card_price * 3, "The host needs to pay the starting pot of at least three times the card price.");

        num_games++;

        games[num_games].host_address = payable(msg.sender);
        games[num_games].card_price = _card_price;
        games[num_games].host_fee = _host_fee;
        games[num_games].start_time = _start_time;
        games[num_games].turn_time = _turn_time;
        games[num_games].last_draw_time = 0;
        games[num_games].numbers_drawn = [0];
        // Initialize with 0 (free square)
        games[num_games].has_completed = false;
        games[num_games].pool_value = msg.value;
        games[num_games].is_valid = true;
        host_games[msg.sender].push(num_games);

        emit GameCreation(num_games, msg.sender, _host_fee, _card_price, _start_time, _turn_time, msg.value);
        return num_games;
    }

    function buyCard(uint game_id, uint[25] memory _numbers) gameExists(game_id) timePrecedence(games[game_id].start_time, block.timestamp) public payable {
        require(!games[game_id].has_completed, "Game has already completed");
        require(msg.value == games[game_id].card_price, "Incorrect payment");

        for (uint i = 0; i < 5; i++) {
            require(_numbers[i] >= 1 && _numbers[i] <= 19, "Numbers in first column must be in the range 1-19");
        }
        for (uint i = 5; i < 10; i++) {
            require(_numbers[i] >= 20 && _numbers[i] <= 39, "Numbers in second column must be in the range 20-39");
        }
        for (uint i = 10; i < 12; i++) {
            require(_numbers[i] >= 40 && _numbers[i] <= 59, "Numbers in third column must be in the range 40-59");
        }

        require(_numbers[12] == 0, "Must have 0 in center square (Free tile!)");

        for (uint i = 13; i < 15; i++) {
            require(_numbers[i] >= 40 && _numbers[i] <= 59, "Numbers in third column must be in the range 40-59");
        }
        for (uint i = 15; i < 20; i++) {
            require(_numbers[i] >= 60 && _numbers[i] <= 79, "Numbers in fourth column must be in the range 50-79");
        }
        for (uint i = 20; i < 25; i++) {
            require(_numbers[i] >= 80 && _numbers[i] <= 99, "Numbers in fifth column must be in the range 80-99");
        }

        require(_cardNumbersUnique(_numbers), "Numbers can not be repeated");

        uint256[3] memory superblocks;

        games[game_id].player_cards[msg.sender].push(Card(_numbers, superblocks));

        if (!_checkRepeatedNumber(player_games[msg.sender], game_id)) {
            player_games[msg.sender].push(game_id);
        }
        if (!_checkRepeatedAddress(games[game_id].players, msg.sender)) {
            games[game_id].players.push(msg.sender);
        }


        games[game_id].pool_value += msg.value;
        emit CardPurchase(game_id, msg.sender, _numbers);
    }

    function _cardNumbersUnique(uint[25] memory numbers) private pure returns (bool){
        for (uint row = 0; row < 5; row++) {
            for (uint i = row * 5; i < (row + 1) * 5; i++) {
                for (uint j = i + 1; j < (row + 1) * 5; j++) {
                    if (numbers[i] == numbers[j] && j != i) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // Draws next number for game if it has been long enough since last draw
    function drawNumber(uint gameID) public gameExists(gameID) validInterval(gameID) hostOrPlayersCall(gameID, msg.sender) {
        uint intervalsPassed = (block.timestamp - games[gameID].start_time) / games[gameID].turn_time + 1;
        uint numbersToDrawn = intervalsPassed - (games[gameID].numbers_drawn.length - 1);

        if (msg.sender != games[gameID].host_address)
            games[gameID].caller_players[msg.sender] += numbersToDrawn;

        for (uint i = 0; i < numbersToDrawn; i++) {
            uint randNumber = drawRandomNumber(gameID, 0, 100);
            games[gameID].numbers_drawn.push(randNumber);
            emit NumberDraw(gameID, randNumber);
        }
        checkEndOfGame(gameID);
    }

    function checkEndOfGame(uint gameID) private returns (bool) {
        uint[] memory winnerStrikes = new uint[](games[gameID].players.length);
        for (uint player_idx = 0; player_idx < games[gameID].players.length; player_idx++) {
            address curPlayer = games[gameID].players[player_idx];
            uint playerTotalStrikeCount = 0;
            for (uint card_idx = 0; card_idx < games[gameID].player_cards[curPlayer].length; card_idx ++) {
                uint strikeCount = checkCard(gameID, curPlayer, card_idx);
                playerTotalStrikeCount += strikeCount;
            }
            winnerStrikes[player_idx] = playerTotalStrikeCount;
        }
        for (uint i = 0; i < games[gameID].players.length; i++) {
            if (winnerStrikes[i] != 0) {
                splitPrizePool(winnerStrikes, gameID);
                games[gameID].has_completed = true;
                return true;
            }
        }
        return false;
    }

    function splitPrizePool(uint[] memory winnerStrikes, uint gameID) private {
        uint totalStrikes = 0;
        for (uint i = 0; i < winnerStrikes.length; i++) {
            totalStrikes += winnerStrikes[i];
        }
        uint poolSize = games[gameID].pool_value;
        uint hostFee = games[gameID].host_fee;
        address[] memory players = games[gameID].players;

        // only a ratio, not the real cut that the host should get.

        //ToDo: Decide whether hostFee is a percentage, i.e., (between 0 and 100) or a fraction of Ether
        uint initHostCut = (poolSize * hostFee / 1 ether);
        //hostFee: fraction of Ether
        // uint initHostCut = (poolSize * (hostFee * 1 ether / 100)); //hostFee: percentange

        uint callerBaseCut = initHostCut / 100;
        uint allCalls = 0;
        for (uint i = 0; i < players.length; i++) {
            uint curCalls = games[gameID].caller_players[players[i]];
            if (curCalls > 0) {
                (payable(players[i])).transfer(callerBaseCut * curCalls);
                allCalls += curCalls;
            }
        }

        (payable(games[gameID].host_address)).transfer(initHostCut - allCalls * callerBaseCut);

        uint poolSplitable = poolSize - initHostCut;
        for (uint i = 0; i < winnerStrikes.length; i++) {
            address curWinner = games[gameID].players[i];
            uint curWinnerStrikeCount = winnerStrikes[i];
            uint curWinnerCut = (poolSplitable * curWinnerStrikeCount) / totalStrikes;
            (payable(curWinner)).transfer(curWinnerCut);
        }
    }

    function drawRandomNumber(uint gameID, uint start, uint end) private view returns (uint) {
        uint i = 0;
        uint random_number = uint(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, i))
        ) % (end - start + 1) + start;
        while (_checkRepeatedNumber(games[gameID].numbers_drawn, random_number)) {
            i++;
            random_number = uint(
                keccak256(abi.encodePacked(block.timestamp, msg.sender, i))
            ) % (end - start + 1) + start;
        }
        return random_number;
    }

    function _checkRepeatedNumber(
        uint[] storage numbersDrawn,
        uint newNumber
    ) private view returns (bool) {
        for (uint i = 0; i < numbersDrawn.length; i++) {
            if (numbersDrawn[i] == newNumber) {
                return true;
            }
        }
        return false;
    }

    function _checkRepeatedAddress(
        address[] storage addresses,
        address newAddress
    ) private view returns (bool) {
        for (uint i = 0; i < addresses.length; i++) {
            if (addresses[i] == newAddress) {
                return true;
            }
        }
        return false;
    }

    // returns number of BINGOs for a card defined by game address and index
    function checkCard(uint game_id, address player, uint index) public view returns (uint){
        require(games[game_id].player_cards[player].length > 0, "You do not have any cards!");
        require(games[game_id].player_cards[player].length > index, "You do not have a card at this index");
        uint8[5] memory columns = [1, 1, 1, 1, 1];
        uint8[5] memory rows = [1, 1, 1, 1, 1];
        uint down_diagonal = 1;
        uint up_diagonal = 1;

        for (uint i = 0; i < 25; i++) {
            if (!_checkRepeatedNumber(games[game_id].numbers_drawn, games[game_id].player_cards[player][index].numbers[i])) {
                columns[i / 5] = 0;
                rows[i % 5] = 0;
                if (i / 5 == i % 5) {
                    down_diagonal = 0;
                }
                if (i / 5 == (4 - i % 5)) {
                    up_diagonal = 0;
                }
            }
        }

        uint num_bingos = 0;

        for (uint i = 0; i < 5; i++) {
            num_bingos += columns[i];
            num_bingos += rows[i];
        }
        num_bingos += down_diagonal;
        num_bingos += up_diagonal;

        return num_bingos;
    }

    function checkGameStatus(uint gameID)
    public
    view
    returns (address hostAddress, uint cardPrice, uint startTime, uint hostFee, uint turnTime, bool hasCompleted, uint poolValue, uint[] memory numbersDrawn){
        Game storage g = games[gameID];
        hostAddress = g.host_address;
        cardPrice = g.card_price;
        startTime = g.start_time;
        hostFee = g.host_fee;
        turnTime = g.turn_time;
        hasCompleted = g.has_completed;
        poolValue = g.pool_value;
        numbersDrawn = new uint[](100);
        uint i;
        for (i = 0; i < g.numbers_drawn.length; i++) {
            numbersDrawn[i] = g.numbers_drawn[i];
        }
        for (; i < 100; i++) {
            numbersDrawn[i] = 100;
            // 100 represents the number has not yet been drawn yet.
        }
    }
}
