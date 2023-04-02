import { GameResponse } from "./interfaces";

const Web3 = require("web3");
const infuraKey = process.env.REACT_APP_INFURA_KEY;
const web3 = new Web3("https://polygon-mumbai.infura.io/v3/" + infuraKey);
const contractABI = require("./contractABI.json");
const contractAddress = "0xF56819d9FAf22Ba131dC3227E606f0173558F52F";

const developerAddress = "0xB8B97b070C78c9dfc6a6BA03DfCA805E676BF725";

export const bingoContract = new web3.eth.Contract(
    contractABI,
    contractAddress
);

export const getDevAddress = async (): Promise<string> => {
    const devAddress = await bingoContract.methods.dev_address().call();
    return devAddress;
};

export const getNumberOfGames = async (): Promise<number> => {
    const numGames = await bingoContract.methods.num_games().call();
    return numGames;
};

export const getGame = async (gameId: number): Promise<GameResponse> => {
    const gameDetails = await bingoContract.methods.games(gameId).call();
    const game: GameResponse = {
        id: gameId,
        card_price: gameDetails.card_price,
        has_completed: gameDetails.has_completed,
        host_address: gameDetails.host_address,
        host_fee: gameDetails.host_fee,
        is_valid: gameDetails.is_valid,
        last_draw_time: gameDetails.last_draw_time,
        pool_value: gameDetails.pool_value,
        start_time: gameDetails.start_time,
        turn_time: gameDetails.turn_time,
    };
    return game;
};

export const getAllGames = async (): Promise<GameResponse[]> => {
    const numberOfGames: number = await getNumberOfGames();
    const games: GameResponse[] = [];

    for (let i = 1; i <= numberOfGames; i++) {
        const curGame: GameResponse = await getGame(i);
        games.push(curGame);
    }
    return games;
};

// export const getDevAddress2 = async () => {
//     let gameID = 1;
//     let card = [
//         6, 2, 3, 4, 5, 21, 22, 23, 24, 25, 41, 42, 0, 44, 45, 61, 62, 64, 63,
//         65, 85, 81, 82, 93, 84,
//     ];
//     const transactionParameters = {
//         to: contractAddress, // Required except during contract publications.
//         from: "0x735b7262c99ffe85e3c44d77b1e4adf96e999b16", // must match user's active address.
//         value: "1",
//         data: bingoContract.methods.buyCard(gameID, card).encodeABI(),
//     };
//     const txHash = await window.ethereum.request({
//         method: "eth_sendTransaction",
//         params: [transactionParameters],
//     });
//     // console.log("transaction id is " + txHash);
//     return;
// };

// export const drawNumber = async (gameId) => {
//     const fromAddress = "0x735b7262c99ffe85e3c44d77b1e4adf96e999b16";
//     if (!window.ethereum) {
//         return {
//             status: "💡 Connect your Metamask wallet to update the message on the blockchain.",
//         };
//     }

//     // //set up transaction parameters
//     const transactionParameters = {
//         to: contractAddress, // Required except during contract publications.
//         from: fromAddress, // must match user's active address.
//         data: bingoContract.methods.drawNumber(gameId).encodeABI(),
//     };

//     //sign the transaction
//     try {
//         const txHash = await window.ethereum.request({
//             method: "eth_sendTransaction",
//             params: [transactionParameters],
//         });
//         // console.log("transaction id is " + txHash);
//     } catch (error) {
//         return {
//             status: "😥 " + error.message,
//         };
//     }
// };

// const eventDrawNumber = bingoContract.events.NumberDraw();

// eventDrawNumber.on("data", (eventData) => {
//     console.log("Value changed:", eventData.returnValues.newValue);
// });
