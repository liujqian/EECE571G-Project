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
        uint256 card_price;
        uint256 host_fee; // in Wei per Eth of pool value (fraction of pool x 10^18)
        uint256 start_time; // Unix timestamp of start time (must be in the future)
        uint256 turn_time; // time between draws
        uint256 last_draw_time;
        address[] players; // array of players, which we can iterate over to check for a winner
        mapping(address => Card[]) player_cards; // mapping of addresses to array of cards, so players can check their cards easily
        uint[] numbers_drawn; // initialized with 0 in first entry for every game (free tile)
        mapping(address => uint) caller_players; // mapping of addresses to the number of  valid calls (resulted in drawing next number/numbers)
        bool is_valid;
        bool has_completed;
        uint pool_value;
    }

contract BingoEECE571G {

    address payable public constant dev_address = payable(address(0x100)); // TODO: change before deployment
    mapping(uint => Game) public games; // indexed by game IDs
    mapping(address => uint[]) public player_games; // allows players to find the game IDs of their active games (can remove later if too gas intensive)
    uint public num_games;

    modifier gameExists(uint game_id) {
        require(games[game_id].start_time > 0, "Game doesn't exist!");
        _;
    }

    modifier hostOrPlayersCall(uint game_id, address _sender){
        require((games[game_id].host_address == _sender) || (_checkRepeatedAddress(games[game_id].players, _sender)));
        _;
    }

    modifier timePrecedence(uint256 timestamp1, uint256 timestamp2){
        require(timestamp2 < timestamp1, "You cannot do this anymore!");
        _;
    }

    modifier validInterval(uint game_id) {
        uint intervalsPassed = (block.timestamp - games[game_id].start_time) / games[game_id].turn_time + 1;
        require(games[game_id].numbers_drawn.length < intervalsPassed,
            "Not enough time has passed to draw a new number!");
        _;
    }


    // creates a new game with msg.sender as host
    function createGame(uint _card_price, uint _host_fee, uint _start_time, uint _turn_time) public payable returns (uint game_id){
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
        return num_games;
    }

    function buyCard(uint game_id, uint[25] memory _numbers) timePrecedence(games[game_id].start_time, block.timestamp) public payable {
        require(games[game_id].is_valid, "Game not valid");
        require(!games[game_id].has_completed, "Game has already completed");
        require(msg.value == games[game_id].card_price, "Incorrect payment");

        require(_cardNumbersUnique(_numbers), "Numbers can not be repeated");

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

        uint256[3] memory superblocks;

        games[game_id].player_cards[msg.sender].push(Card(_numbers, superblocks));
        player_games[msg.sender].push(game_id);

        games[game_id].pool_value += msg.value;
    }

    function _cardNumbersUnique(uint[25] memory numbers) public pure returns(bool){
        for(uint i=0; i<numbers.length; i++){
            for(uint j = 0; j<numbers.length; j++){
                if(numbers[i]==numbers[j] && j!=i){
                    return false;
                }
            }
        }
        return true;
    }

    // Draws next number for game with host address msg.sender, if it has been long enough since last draw
    function drawNumber(uint gameID) public gameExists(gameID) validInterval(gameID) hostOrPlayersCall(gameID, msg.sender) {
        uint intervalsPassed = (block.timestamp - games[gameID].start_time) / games[gameID].turn_time + 1;
        uint numbersToDrawn = intervalsPassed - games[gameID].numbers_drawn.length;

        if (msg.sender != games[gameID].host_address)
            games[gameID].caller_players[msg.sender] += numbersToDrawn;

        for (uint i = 0; i < numbersToDrawn; i++) {
            uint randNumber = drawRandomNumber(gameID, 0, 100);
            games[gameID].numbers_drawn.push(randNumber);
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
        // only a ratio, not the real cut that the host should get.
        uint hostCut = (poolSize * (hostFee * 1 ether)); // TODO: shouldn't this be (poolSize * (hostFee / 1 ether))
        (payable(games[gameID].host_address)).transfer(hostCut);
        uint poolSplitable = poolSize - hostCut;
        for (uint i = 0; i < winnerStrikes.length; i++) {
            address curWinner = games[gameID].players[i];
            uint curWinnerStrikeCount = winnerStrikes[i];
            uint curWinnerCut = poolSplitable * (curWinnerStrikeCount / totalStrikes);
            (payable(curWinner)).transfer(curWinnerCut);
        }
    }

    function drawRandomNumber(uint gameID, uint start, uint end) private view returns (uint) {
        uint random_number = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender))
        ) % (end - start + 1) + start;
        while (_checkRepeatedNumber(games[gameID].numbers_drawn, random_number)) {
            random_number = uint256(
                keccak256(abi.encodePacked(block.timestamp, msg.sender))
            ) % 100;
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
    returns (uint256 cardPrice, uint256 startTime, uint256 hostFee, uint256 turnTime, bool hasCompleted, uint poolValue, uint[] memory numbersDrawn){
        Game storage g = games[gameID];
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
