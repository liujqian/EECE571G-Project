import React, {useState} from "react";
import "./App.css";
import {Home} from "./components/Home";
import {Dashboard} from "./components/Dashboard";

function App() {
    let home = <Home goToDashboard={() => setPage(dashboard)}></Home>;
    let dashboard = <Dashboard></Dashboard>;
    let [page, setPage] = useState(home);
    return (
        page
    );
}

export default App;
