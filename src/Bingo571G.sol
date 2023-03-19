// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

struct Card{
    // specify bingo card by an array of numbers, top to bottom then left to right 
    // so first five entries are the 'B' column, 13th entry is always 0 (for free tile)
    uint[25] numbers; 
    uint[3] superblocks; // should this be the numbers or indices of the superblocks?
}

struct Game {
    address payable host_address;
    uint256 host_fee; // in percent
    uint256 start_time; // Unix timestamp of start time (must be in the future)
    uint256 turn_time; // time between draws
    uint256 last_draw_time;
    address[] players; // array of players, which we can iterate over to check for a winner
    mapping (address => Card[]) player_cards; // mapping of addresses to array of cards, so players can check their cards easily
    uint[] numbers_drawn; // initialized with 0 in first entry for every game (free tile)
    bool has_started;
    bool has_completed;
    uint pool_value;

}

contract BingoEECE571G {

    address payable public constant dev_address = payable(address(0x100)); // change before deployment
    mapping (address => Game) private games; // indexed by host address: can we do this and allow each address to host at most one game to keep things simple?
    mapping (address => address[]) private player_games; // allows players to find the host addresses of their active games (can remove later if too gas intensive)

    modifier hostExists(address _sender) {
        require(games[_sender].start_time > 0, "Host doesn't exist!");
        _;
    }

    modifier validInterval(address _sender) {
        require(games[_sender].last_draw_time + games[_sender].turn_time < block.timestamp, 
        "Not enough time has passed to draw a new number!");
        _;
    }
    
    
    // creates a new game with msg.sender as host
    function createGame(uint host_fee, uint start_time, uint turn_time) public{
        return;
    }

    // Draws next number for game with host address msg.sender, if it has been long enough since last draw
    function hostDrawNumber() public hostExists(msg.sender){
        uint random_number = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 100;

        games[msg.sender].numbers_drawn.push(random_number);
    }

    // returns number of BINGOs for a card defined by game address and index
    function checkCard(address game_host, address player, uint index) public view returns(uint){
        games[game_host].player_cards[player][index].numbers; // how to check bingos?
        uint8[5] memory columns = [1, 1, 1, 1, 1];
        uint8[5] memory rows = [1, 1, 1, 1, 1];
        uint down_diagonal = 1;
        uint up_diagonal = 1;
        
        for(uint i=0; i<25; i++){
            if(!isPresent(games[game_host].player_cards[player][index].numbers[i], games[game_host].numbers_drawn)){
                columns[i/5] = 0;
                rows[i%5] = 0;
                if(i/5 == i%5){
                    down_diagonal = 0;
                }
                if(i/5 == (5 - i%5)){
                    up_diagonal = 0;
                }
            }
        }

        uint num_bingos = 0;

        for(uint i=0; i<5; i++){
            num_bingos += columns[i];
            num_bingos += rows[i];
        }
        num_bingos += down_diagonal;
        num_bingos += up_diagonal;

        return num_bingos;
    }

    function checkGameStatus(address host) public view returns(bool is_valid, uint[] memory numbers){
        
        return(false, new uint[](0));
    }

    function isPresent(uint number, uint[] memory array) internal pure returns(bool present){
        for(uint i=0; i<array.length; i++){
            if(array[i] == number) {
                return true;
            }
            return false;
        }
    }

}