import React, { useState } from "react";
import "./App.css";
import { Home } from "./components/Home";
import { Dashboard } from "./components/Dashboard";
import { connectWallet } from "./utils/connect";
import {
    getGame,
    getDevAddress,
    getNumberOfGames,
    getAllGames,
    getHostGames,
    drawNumber,
    buyCard,
} from "./utils/interact";
import { CardInfo, GameResponse } from "./utils/interfaces";

function App() {
    const callLogger = async () => {
        await connectWallet();
        const devAddress: string = await getDevAddress();
        const numGames: number = await getNumberOfGames();
        const games: GameResponse[] = await getAllGames();
        const hostGames: number[] = await getHostGames(
            "0x735b7262C99FFE85e3C44D77B1E4aDf96e999B16"
        );
        // const drawNumTxHash: string = await drawNumber("", 1);

        const cardInfoTest: CardInfo = {
            gameId: 1,
            card: [
                6, 2, 3, 4, 5, 21, 22, 23, 24, 25, 41, 42, 0, 44, 45, 61, 62,
                64, 63, 65, 85, 81, 82, 93, 84,
            ],
            value: "1",
        };

        const buyCardTxHash: string = await buyCard("", cardInfoTest);

        console.log("devAddress:", devAddress);
        console.log("numGames:", numGames);
        console.log("games:", games);
        console.log("host games:", hostGames);
        // console.log("draw number transaction hash", drawNumTxHash);
        console.log("buy card trasaction hash", buyCardTxHash);
    };
    let home = <Home goToDashboard={() => setPage(dashboard)}></Home>;
    let dashboard = <Dashboard></Dashboard>;
    let [page, setPage] = useState(home);
    return (
        <button
            onClick={() => {
                callLogger();
            }}
        >
            show logs
        </button>
        // page
    );
}

export default App;
