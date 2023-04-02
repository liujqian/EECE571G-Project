import {connectWallet} from "./connect";
import {CardInfo, GameRequest, GameResponse, TransactionParameters,} from "./interfaces";

const Web3 = require("web3");
const infuraKey = process.env.REACT_APP_INFURA_KEY;
console.log("Infura key is " + infuraKey);
const web3 = new Web3("https://polygon-mumbai.infura.io/v3/" + infuraKey);
const contractABI = require("./contractABI.json");
const contractAddress = "0xF56819d9FAf22Ba131dC3227E606f0173558F52F";

declare global {
    interface Window {
        ethereum: any;
    }
}

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

export const getAllPlayerGames = async (address: string): Promise<GameResponse[]> => {
    let playerGames = await getPlayerGames(address);
    const games: GameResponse[] = [];
    for (let gameID of playerGames) {
        const curGame: GameResponse = await getGame(gameID);
        games.push(curGame);
    }
    return games;
};

export const checkGameStatus = async (gameID: number): Promise<GameResponse> => {
    const gameDetails = await bingoContract.methods.checkGameStatus(gameID).call();
    return {
        id: gameID,
        card_price: gameDetails.cardPrice,
        has_completed: gameDetails.hasCompleted,
        host_address: gameDetails.hostAddress,
        host_fee: gameDetails.hostFee,
        pool_value: gameDetails.poolValue,
        start_time: gameDetails.startTime,
        turn_time: gameDetails.turnTime,
        drawn_numbers: gameDetails.numbersDrawn
    };
};

export const getPlayerGames = async (address: string): Promise<number[]> => {
    return await bingoContract.methods
        .getPlayerGames(address)
        .call();
};

export const getHostGames = async (address: string): Promise<number[]> => {
    return await bingoContract.methods
        .getHostGames(address,)
        .call();
};

export const drawNumber = async (
    fromAddress: string,
    gameId: number
): Promise<string> => {
    if (!window.ethereum) {
        return "💡 Connect your Metamask wallet to update the message on the blockchain.";
    }

    // //set up transaction parameters
    const transactionParameters: TransactionParameters = {
        to: contractAddress, // Required except during contract publications.
        from: fromAddress, // must match user's active address.
        data: bingoContract.methods.drawNumber(gameId).encodeABI(),
    };

    //sign the transaction
    try {
        const txHash = await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [transactionParameters],
        });
        return txHash;
    } catch (error: any) {
        return "😥 " + error.message;
    }
};

export const buyCard = async (
    fromAddress: string,
    cardInfo: CardInfo
): Promise<string> => {
    if (!window.ethereum) {
        return "💡 Connect your Metamask wallet to update the message on the blockchain.";
    }

    const transactionParameters: TransactionParameters = {
        to: contractAddress, // Required except during contract publications.
        from: fromAddress, // must match user's active address.
        value: cardInfo.value,
        data: bingoContract.methods
            .buyCard(cardInfo.gameId, cardInfo.card)
            .encodeABI(),
    };

    //sign the transaction
    try {
        const txHash = await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [transactionParameters],
        });
        return txHash;
    } catch (error: any) {
        return "😥 " + error.message;
    }
};

export const createGame = async (
    fromAddress: string,
    gameInfo: GameRequest
): Promise<string> => {
    if (!window.ethereum) {
        return "💡 Connect your Metamask wallet to update the message on the blockchain.";
    }

    const transactionParameters: TransactionParameters = {
        to: contractAddress, // Required except during contract publications.
        from: fromAddress, // must match user's active address.
        value: gameInfo.value,
        data: bingoContract.methods
            .createGame(
                gameInfo.card_price,
                gameInfo.host_fee,
                gameInfo.start_time,
                gameInfo.turn_time
            )
            .encodeABI(),
    };

    //sign the transaction
    try {
        const txHash = await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [transactionParameters],
        });
        return txHash;
    } catch (error: any) {
        return "😥 " + error.message;
    }
};

// Simple test function for wrappers
const callLogger = async () => {
    await connectWallet();
    const devAddress: string = await getDevAddress();
    const numGames: number = await getNumberOfGames();
    const games: GameResponse[] = await getAllGames();
    const hostGames: number[] = await getHostGames(
        "0x735b7262C99FFE85e3C44D77B1E4aDf96e999B16"
    );
    // const drawNumTxHash: string = await drawNumber("", 1);

    // const cardInfoTest: CardInfo = {
    //     gameId: 1,
    //     card: [
    //         6, 2, 3, 4, 5, 21, 22, 23, 24, 25, 41, 42, 0, 44, 45, 61, 62,
    //         64, 63, 65, 85, 81, 82, 93, 84,
    //     ],
    //     value: "1",
    // };

    // const buyCardTxHash: string = await buyCard("", cardInfoTest);

    const gameInfoTest: GameRequest = {
        card_price: "1",
        host_fee: "10",
        start_time: "1680427753",
        turn_time: "3600",
        value: "10",
    };

    const createGameTxHash: string = await createGame(
        "0x735b7262C99FFE85e3C44D77B1E4aDf96e999B16",
        gameInfoTest
    );

    console.log("devAddress:", devAddress);
    console.log("numGames:", numGames);
    console.log("games:", games);
    console.log("host games:", hostGames);
    // console.log("draw number transaction hash", drawNumTxHash);
    // console.log("buy card trasaction hash", buyCardTxHash);
    console.log("create game transaction hash", createGameTxHash);
};

// ToDo: add event listeners

// const eventDrawNumber = bingoContract.events.NumberDraw();

// eventDrawNumber.on("data", (eventData: any) => {
//     console.log("draw number:", eventData.returnValues.newValue);
// });

// const eventBuyCard = bingoContract.events.CardPurchase();

// eventBuyCard.on("connected", (eventData: any) => {
//     console.log("card purchased:", eventData.returnValues.newValue);
// });
