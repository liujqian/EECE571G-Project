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
} from "./utils/interact";
import { GameResponse } from "./utils/interfaces";

function App() {
    const callLogger = async () => {
        await connectWallet();
        const devAddress: string = await getDevAddress();
        const numGames: number = await getNumberOfGames();
        const games: GameResponse[] = await getAllGames();
        const hostGames: number[] = await getHostGames(
            "0x735b7262C99FFE85e3C44D77B1E4aDf96e999B16"
        );

        console.log("devAddress:", devAddress);
        console.log("numGames:", numGames);
        console.log("games:", games);
        console.log("host games:", hostGames);
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
