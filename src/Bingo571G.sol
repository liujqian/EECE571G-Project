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
    uint host_fee; // in percent
    uint start_time; // Unix timestamp of start time (must be in the future)
    uint turn_time; // time between draws
    uint last_draw_time;
    address[] players; // array of players, which we can iterate over to check for a winner
    mapping (address => Card[]) player_cards; // mapping of addresses to array of cards, so players can check their cards easily
    uint[] numbers_drawn; // initialized with 0 in first entry for every game (free tile)
    bool has_started;
    bool has_completed;
    uint pool_value;

}

contract BingoEECE571G {

    address payable public constant dev_address = payable(address(0x100)); // change before deployment
    mapping (address => Game) games; // indexed by host address: can we do this and allow each address to host at most one game to keep things simple?
    mapping (address => address[]) player_games; // allows players to find the host addresses of their active games (can remove later if too gas intensive)


    // creates a new game with msg.sender as host
    function createGame(uint host_fee, uint start_time, uint turn_time) public{
        return;
    }

    // Draws next number for game with host address msg.sender, if it has been long enough since last draw
    function hostDrawNumber() public {
        return;
    }

    // returns number of BINGOs for a card defined by game address and index
    function checkCard(address game_host, address player, uint index) public view returns(uint){
        return 0;
    }

    function checkGameStatus(address host) public view returns(bool is_valid, uint[] memory numbers){
        
        return(false, new uint[](0));
    }

}