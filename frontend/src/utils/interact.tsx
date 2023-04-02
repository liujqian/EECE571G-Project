import { CardInfo, GameResponse, TransactionParameters } from "./interfaces";

const Web3 = require("web3");
const infuraKey = process.env.REACT_APP_INFURA_KEY;
const web3 = new Web3("https://polygon-mumbai.infura.io/v3/" + infuraKey);
const contractABI = require("./contractABI.json");
const contractAddress = "0xF56819d9FAf22Ba131dC3227E606f0173558F52F";

const developerAddress = "0xB8B97b070C78c9dfc6a6BA03DfCA805E676BF725";

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

export const getPlayerGames = async (address: string): Promise<number[]> => {
    const playerGames: number[] = [];
    let game: number | null = null;

    let i = 0;
    while (true) {
        try {
            const game = await bingoContract.methods
                .player_games(address, i)
                .call();
            if (game !== null) {
                playerGames.push(game);
            }
            i++;
        } catch (error) {
            console.error(`Error fetching game ${i}: ${error}`);
            break;
        }
    }
    return playerGames;
};

export const getHostGames = async (address: string): Promise<number[]> => {
    const hostGames: number[] = [];
    let game: number | null = null;

    let i = 0;
    while (true) {
        try {
            const game = await bingoContract.methods
                .host_games(address, i)
                .call();
            if (game !== null) {
                hostGames.push(game);
            }
            i++;
        } catch (error) {
            console.error(`Error fetching game ${i}: ${error}`);
            break;
        }
    }
    return hostGames;
};

export const drawNumber = async (
    fromAddress: string,
    gameId: number
): Promise<string> => {
    // const FromAddressTest = "0x735b7262c99ffe85e3c44d77b1e4adf96e999b16";
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

    const transactionParameters = {
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

// const eventDrawNumber = bingoContract.events.NumberDraw();

// eventDrawNumber.on("data", (eventData: any) => {
//     console.log("draw number:", eventData.returnValues.newValue);
// });

// const eventBuyCard = bingoContract.events.CardPurchase();

// eventBuyCard.on("connected", (eventData: any) => {
//     console.log("card purchased:", eventData.returnValues.newValue);
// });
