import React, {CSSProperties, useEffect, useState} from "react";
import {Avatar, Button, Card, Col, Descriptions, Drawer, Layout, Menu, Pagination, Row, theme} from "antd";
import {addWalletListener, connectWallet, getCurrentWalletConnected, removeWalletListener} from "../utils/connect";
import {UserOutlined} from "@ant-design/icons";
import {getCards, getGameInfo, getTotalGameCount} from "../utils/stubs";

const {Meta} = Card;
const {Header, Content, Footer} = Layout;

export const Dashboard: React.FC = () => {
    let [address, setAddress] = useState("");
    const {
        token: {colorBgContainer},
    } = theme.useToken();
    let [content, setContent] = useState(Login({setAddress: setAddress}));
    let [selectedMenuKey, setSelectedMenuKey] = useState("1");

    function changeAccountCallback(accounts: Array<string>) {
        console.log("Account changed.");
        if (accounts.length > 0) {
            setAddress(accounts[0]);
        } else {
            setAddress("");
        }
        removeWalletListener(changeAccountCallback);
    }

    useEffect(() => {
        getCurrentWalletConnected().then(
            (wallet) => {
                if (wallet.address) {
                    setAddress(wallet.address);
                    setContent(
                        <Lobby address={address}></Lobby>
                    );
                    setSelectedMenuKey("1");
                    addWalletListener(changeAccountCallback);
                } else {
                    setAddress("");
                    setContent(Login({setAddress: setAddress}));
                }
            }
        );
    }, [address]);

    return (
        <Layout className="layout">
            <Header>
                <div style={{float: "left", display: "flex", width: "50vw", justifyContent: "left"}}>
                    <div style={{float: "left", color: "white", fontSize: 24}}>BINGO571G</div>
                    <Menu
                        theme="dark"
                        mode="horizontal"
                        defaultSelectedKeys={["1"]}
                        selectedKeys={[selectedMenuKey]}
                        items={
                            [
                                {
                                    key: 0, label: "My Bingo Cards", disabled: address.length == 0, onClick: () => {
                                        setSelectedMenuKey("0");
                                        setContent(<PlayerGames address={address}></PlayerGames>);
                                    }
                                },
                                {
                                    key: 1, label: "Game lobby", disabled: address.length == 0, onClick: () => {
                                        setSelectedMenuKey("1");
                                        setContent(<Lobby address={address}></Lobby>);
                                    }
                                },
                                {
                                    key: 3, label: "About", onClick: () => {
                                        window.location.reload();
                                    }
                                }
                            ]
                        }
                        style={{float: "left", width: "20vw"}}
                    />
                </div>
                <div style={{float: "right", color: "white", display: "flex", alignItems: "center"}}>
                    {address.length > 0 && <Avatar shape="square" size="large" icon={<UserOutlined/>}/>}
                    {address.length > 0 && address.substring(0, 5) + "..." + address.substring(address.length - 3, address.length)}
                </div>
            </Header>
            <Content style={{padding: "0 50px"}}>
                <div className="site-layout-content" style={
                    {background: colorBgContainer, alignItems: "center", display: "flex", flexDirection: "column"}
                }>
                    {content}
                </div>
            </Content>
            <Footer style={{textAlign: "center"}}>Created by Jingqian Liu</Footer>
        </Layout>
    );
};

const Login: React.FC = (loginProps: any) => {
    return <Card title="Login to your wallet" bordered={true} style={{width: 300}}>
        <div style={
            {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "15vh",
                justifyContent: "space-evenly"
            }
        }>
            <Button onClick={async () => {
                let connectResult = await connectWallet();
                if (connectResult.address) {
                    loginProps.setAddress(connectResult.address);
                } else {
                    alert(connectResult.status);
                }
            }
            }>Connect via MetaMask</Button>
            <Button onClick=
                        {
                            () => {
                                window.location.href = "https://metamask.io";
                            }
                        }
            >
                What is MetaMask?
            </Button>
        </div>
    </Card>;
};

interface AddressProps {
    address: string;
}

const Lobby: React.FC<AddressProps> = (lobbyProps: AddressProps) => {
    return <Card title="Lobby" bordered={true} style={{width: 300}}>

    </Card>;
};

interface Game {
    hostAddress: string,
    cardPrice: number,
    startTime: number,
    hostFee: number,
    turnTime: number,
    hasCompleted: boolean,
    poolValue: number,
    numbersDrawn: Array<number>
}

const PlayerGames: React.FC<AddressProps> = (playerGamesProps: AddressProps) => {
    let pageSize = 6;
    let defaultGame: Game = {
        hostAddress: "0x0",
        cardPrice: 0,
        startTime: 0,
        hostFee: 0,
        turnTime: 0,
        hasCompleted: false,
        poolValue: 0,
        numbersDrawn: [0],
    };
    let [page, setPage] = useState(1);
    let [totalGameCount, setTotalGameCount] = useState(0);
    let [drawerOpen, setDrawerOpen] = useState(false);
    let [selectedGameID, setSelectedGameID] = useState("");
    let [game, setGame] = useState(defaultGame);
    let [cards, setCards] = useState([] as Array<Array<number>>);

    useEffect(
        function () {
            getTotalGameCount().then(
                function (count) {
                    setTotalGameCount(count);
                }
            );
        }, [totalGameCount]
    );

    useEffect(
        function () {
            if (selectedGameID !== "") {
                getGameInfo(selectedGameID).then(
                    function (game: Game) {
                        setGame(game);
                    }
                );
            }
        }, [selectedGameID]
    );

    useEffect(
        function () {
            if (selectedGameID !== "") {
                getCards(playerGamesProps.address, selectedGameID).then(
                    function (cards: Array<Array<number>>) {
                        setCards(cards);
                    }
                );
            }
        }, [selectedGameID]
    );

    let numGameOnPage = page * pageSize > totalGameCount ? totalGameCount % pageSize : pageSize;
    let row1: Array<JSX.Element> = [];
    for (let i = 0; i < 3; i++) {
        row1.push(
            <Col key={i.toString()} span={24 / 3}>
                {
                    i < numGameOnPage ?
                        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                            <GameIcon gameID={i.toString()} onClick={
                                function () {
                                    setDrawerOpen(true);
                                    setSelectedGameID(i.toString());
                                }
                            }/>
                        </div> : <></>
                }
            </Col>,
        );
    }
    let row2: Array<JSX.Element> = [];
    for (let i = 3; i < 6; i++) {
        row2.push(
            <Col key={i.toString()} span={24 / 3}>
                {
                    i < numGameOnPage ?
                        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                            <GameIcon gameID={i.toString()} onClick={
                                function () {
                                    setDrawerOpen(true);
                                    setSelectedGameID(i.toString());
                                }
                            }/>
                        </div> : <></>
                }
            </Col>,
        );
    }
    let bingoCardComponents = cards.map(
        function (singleCard, idx) {
            return <BingoCard cardNumbers={singleCard}
                              tickedNumbers={game.numbersDrawn.filter((value) => value != 100)}
                              key={idx}
            ></BingoCard>;
        }
    );

    let gameStartTime = new Date(game.startTime * 1e3);
    let gameDrawNumberInterval = game.turnTime;


    return <Card title="Joined Bingo Games" bordered={true} style={{width: "fit-content", height: "100%"}}>
        <Row gutter={[64, 64]} style={{width: "75vw"}}>
            {row1}
            {row2}
        </Row>

        <div style={{display: "flex", flexDirection: "column", alignItems: "center", marginTop: "32px"}}>
            <Pagination defaultCurrent={1} total={totalGameCount} pageSize={pageSize} onChange={
                (page, pageSize) => {
                    setPage(page);
                }
            }/>
        </div>

        <Drawer title={"Game " + selectedGameID} placement="right" open={drawerOpen} onClose={
            () => {
                setDrawerOpen(!drawerOpen);
                setGame(defaultGame);
                setSelectedGameID("");
                setCards([]);
            }
        }>
            <div style={
                {
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%"
                }
            }>
                <div>
                    <div style={{textAlign: "center", fontSize: "1.5em", marginBottom: "16px"}}>Bingo Cards for This
                        Game
                    </div>
                    <div style={{overflow: "auto", height: "45vh"}}>
                        {bingoCardComponents}
                    </div>
                </div>
                <Card title={`Game ${selectedGameID}`} style={{height: "40vh"}}>
                    <Descriptions title="Game Infomation" column={1}>
                        <Descriptions.Item
                            label="Host Wallet">{game.hostAddress.substring(0, 5) + "..." + game.hostAddress.substring(game.hostAddress.length - 3, game.hostAddress.length)}</Descriptions.Item>
                        <Descriptions.Item label="Card Price in Wei">{game.cardPrice}</Descriptions.Item>
                        <Descriptions.Item label="Start Time">{formatTime(gameStartTime)}</Descriptions.Item>
                        <Descriptions.Item
                            label="Number Draw Interval in Seconds">{gameDrawNumberInterval}</Descriptions.Item>
                        <Descriptions.Item label="Completed?"> {game.hasCompleted.toString()}</Descriptions.Item>
                        <Descriptions.Item label="Pool Value in Wei"> {game.poolValue}</Descriptions.Item>
                        <Descriptions.Item
                            label="Numbers Drawn"> {game.numbersDrawn.filter((value) => value != 100).toString()}</Descriptions.Item>
                        <Descriptions.Item
                            label="Draw Number for the Game"> <Button>Try to Draw Numbers</Button></Descriptions.Item>
                    </Descriptions>
                </Card>
            </div>
        </Drawer>
    </Card>;
};

// This utility function to format a JavaScript Date object is provided by OpenAI's ChatGPT.
function formatTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

interface BingoCardProps {
    cardNumbers: Array<number>;
    tickedNumbers: Array<number>;
    key: number | string;
}

const BingoCard: React.FC<BingoCardProps> = (props: BingoCardProps) => {
    let style: CSSProperties = {
        aspectRatio: "1",
        border: "black",
        borderStyle: "solid",
        width: "3px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2em",
    };
    let carArr = props.cardNumbers;
    let tickedArr = props.tickedNumbers;
    let rows = [];
    for (let i = 0; i < 5; i++) {
        let cols = [];
        for (let j = 0; j < 5; j++) {
            let idx = i * 5 + j;
            let col = <Col flex={1} style={
                {
                    ...style,
                    backgroundColor: carArr[idx] == 0 ? "lightgreen" : tickedArr.includes(carArr[idx]) ? "yellow" : "white"
                }
            } key={`${j}col`}> {carArr[idx]}</Col>;
            cols.push(col);
        }
        rows.push(<Row gutter={[0, 0]} key={`${i}row`}>{cols}</Row>);
    }
    return <>
        <div style={{marginTop: "8px"}}>
            {rows}
        </div>
    </>;
};

interface GameIconProps {
    gameID: string;
    onClick: () => void,
}

const GameIcon: React.FC<GameIconProps> = function (props) {
    return <Card
        hoverable
        style={{width: 240}}
        cover={<img alt="Bingo Picture" src={require("../resources/Bingo-chips.jpg")}/>}
        onClick={
            props.onClick
        }
    >
        <Meta title={`Game ID: ` + props.gameID}/>
    </Card>;
};
