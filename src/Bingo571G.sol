// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

struct Card{
    // specify bingo card by an array of numbers, top to bottom then left to right 
    // so first five entries are the 'B' column, 13th entry is always 0 (for free tile)
    uint[25] numbers; 
    uint[3] superblocks; // should this be the numbers or indices of the superblocks?
}

struct Game {
// @notice ALL THE TIME RELATED VARIABLES ARE IN SECONDS.
    address payable host_address;
    uint256 host_fee; // in Wei per Eth of pool value (fraction of pool x 10^18)
    uint256 start_time; // Unix timestamp of start time (must be in the future)
    uint256 turn_time; // time between draws
    uint256 last_draw_time;
    address[] players; // array of players, which we can iterate over to check for a winner
    mapping (address => Card[]) player_cards; // mapping of addresses to array of cards, so players can check their cards easily
    uint[] numbers_drawn; // initialized with 0 in first entry for every game (free tile)
    bool is_valid;
    bool has_started;
    bool has_completed;
    uint pool_value;

}

contract BingoEECE571G {

    address payable public constant dev_address = payable(address(0x100)); // TODO: change before deployment
    mapping(uint => Game) private games; // indexed by host address: can we do this and allow each address to host at most one game to keep things simple?
    mapping(address => uint[]) private player_games; // allows players to find the host addresses of their active games (can remove later if too gas intensive)
    uint public num_games;


    modifier hostExists(address _sender) {
        require(games[_sender].start_time > 0, "Host doesn't exist!");
        _;
    }

    modifier validInterval(address _sender) {
        uint intervalsPassed = (block.timestamp - games[_sender].start_time) / games[_sender].turn_time + 1;
        require(games[_sender].numbers_drawn.length < intervalsPassed,
            "Not enough time has passed to draw a new number!");
        _;
    }


    // creates a new game with msg.sender as host
    function createGame(uint _host_fee, uint _start_time, uint _turn_time) public returns(uint game_id){
        require(_start_time > block.timestamp, "Start time must be in the future.");
        num_games++;
        games[num_games].host_address = payable(msg.sender);
        games[num_games].host_fee = _host_fee;
        games[num_games].start_time = _start_time;
        games[num_games].turn_time = _turn_time;
        games[num_games].last_draw_time = 0;
        games[num_games].numbers_drawn = [0]; // Initialize with 0 (free square)
        games[num_games].has_started = false;
        games[num_games].has_completed = false;
        games[num_games].pool_value = 0;
        games[num_games].is_valid = true;

        return num_games;
    }

    // Draws next number for game with host address msg.sender, if it has been long enough since last draw
    function hostDrawNumber() public hostExists(msg.sender) {
        address _sender = msg.sender;
        uint intervalsPassed = (block.timestamp - games[_sender].start_time) / games[_sender].turn_time + 1;
        uint numbersToDrawn = intervalsPassed - games[msg.sender].numbers_drawn.length;
        for (uint i = 0; i < numbersToDrawn; i++) {
            uint randNumber = drawRandomNumber();
            games[msg.sender].numbers_drawn.push(randNumber);
        }
    }

    function drawRandomNumber() private returns (uint) {
        uint random_number = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender))
        ) % 100;
        while (_checkRepeatedNumber(games[msg.sender].numbers_drawn, random_number)) {
            random_number = uint256(
                keccak256(abi.encodePacked(block.timestamp, msg.sender))
            ) % 100;
        }
        return random_number;
    }

    function _checkRepeatedNumber(
        uint[] storage numbersDrawn,
        uint newNumber
    ) private returns (bool) {
        for (uint i = 0; i < numbersDrawn.length; i++) {
            if (numbersDrawn[i] == newNumber) {
                return true;
            }
        }
        return false;
    }

    // returns number of BINGOs for a card defined by game address and index
    function checkCard(uint game_id, address player, uint index) public view returns(uint){
        uint8[5] memory columns = [1, 1, 1, 1, 1];
        uint8[5] memory rows = [1, 1, 1, 1, 1];
        uint down_diagonal = 1;
        uint up_diagonal = 1;
        
        for(uint i=0; i<25; i++){
            if(!isPresent(games[game_id].player_cards[player][index].numbers[i], games[game_id].numbers_drawn)){
                columns[i/5] = 0;
                rows[i%5] = 0;
                if(i/5 == i%5){
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

    function checkGameStatus(address host) public view returns (bool is_valid, uint[] memory numbers){

        return (false, new uint[](0));
    }

    function isPresent(uint number, uint[] memory array) internal pure returns (bool present){
        for (uint i = 0; i < array.length; i++) {
            if (array[i] == number) {
                return true;
            }
            return false;
        }
    }

}
