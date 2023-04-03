import React, {CSSProperties, useEffect, useState} from "react";
import {
    addWalletListener,
    connectWallet,
    getCurrentWalletConnected,
    removeWalletListener,
} from "../utils/connect";

import {UserOutlined} from "@ant-design/icons";
import {getCards, getGameInfo} from "../utils/stubs";
import {
    Avatar,
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Drawer,
    Form,
    Input,
    InputNumber,
    Layout,
    Menu, Modal,
    Pagination,
    Radio,
    Row,
    theme,
} from "antd";
import {Spin} from "antd/lib";
import {GameResponse} from "../utils/interfaces";
import {
    buyCard,
    checkGameStatus, createGame,
    getAllGames,
    getAllPlayerGames,
    getGame,
    getPlayerCards,
    getPlayerGames
} from "../utils/interact";

const Web3 = require("web3");
const BN = Web3.utils.BN;

const {Meta} = Card;
const {Header, Content, Footer, Sider} = Layout;

export const Dashboard: React.FC = () => {
    let [address, setAddress] = useState("");
    const {
        token: {colorBgContainer},
    } = theme.useToken();
    let [content, setContent] = useState(Login({setAddress: setAddress}));
    let [selectedMenuKey, setSelectedMenuKey] = useState("1");

    function changeAccountCallback(accounts: Array<string>) {
        if (accounts.length > 0) {
            setAddress(accounts[0]);
        } else {
            setAddress("");
        }

        removeWalletListener(changeAccountCallback);
    }

    useEffect(() => {
        getCurrentWalletConnected().then((wallet) => {
            if (wallet.address) {
                setAddress(wallet.address);
                setContent(
                    <GamesGallery
                        address={address}
                        lobbyType={"allGames"}
                    ></GamesGallery>
                );
                setSelectedMenuKey("1");
                addWalletListener(changeAccountCallback);
            } else {
                setAddress("");
                setContent(Login({setAddress: setAddress}));
            }
        });
    }, [address]);
    let allGameLobby = <GamesGallery
        address={address}
        lobbyType={"joinedGames"}
    ></GamesGallery>;
    let joinedGameLobby = <GamesGallery
        address={address}
        lobbyType={"allGames"}
    ></GamesGallery>;
    return (
        <Layout className="layout">
            <Header>
                <div
                    style={{
                        float: "left",
                        display: "flex",
                        width: "50vw",
                        justifyContent: "left",
                    }}
                >
                    <div
                        style={{float: "left", color: "white", fontSize: 24}}
                    >
                        BINGO571G
                    </div>
                    <Menu
                        theme="dark"
                        mode="horizontal"
                        defaultSelectedKeys={["1"]}
                        selectedKeys={[selectedMenuKey]}
                        items={[
                            {
                                key: 0,
                                label: "My Bingo Games",
                                disabled: address.length == 0,
                                onClick: () => {
                                    setSelectedMenuKey("0");
                                    setContent(
                                        allGameLobby
                                    );
                                },
                            },
                            {
                                key: 1,
                                label: "Game lobby",
                                disabled: address.length == 0,
                                onClick: () => {
                                    setSelectedMenuKey("1");
                                    setContent(
                                        joinedGameLobby
                                    );
                                },
                            },
                            {
                                key: 3,
                                label: "About",
                                onClick: () => {
                                    window.location.reload();
                                },
                            },
                        ]}
                        style={{float: "left", width: "20vw"}}
                    />
                </div>
                <div
                    style={{
                        float: "right",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    {address.length > 0 && (
                        <Avatar
                            shape="square"
                            size="large"
                            icon={<UserOutlined/>}
                        />
                    )}
                    {address.length > 0 &&
                        address.substring(0, 5) +
                        "..." +
                        address.substring(
                            address.length - 3,
                            address.length
                        )}
                </div>
            </Header>
            <Content style={{padding: "0 50px"}}>
                <div
                    className="site-layout-content"
                    style={{
                        background: colorBgContainer,
                        alignItems: "center",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {content}
                </div>
            </Content>
            <Footer style={{textAlign: "center"}}>
                Created by Jingqian Liu
            </Footer>
        </Layout>
    );
};

const Login: React.FC = (loginProps: any) => {
    return (
        <Card
            title="Login to your wallet"
            bordered={true}
            style={{width: 300}}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "15vh",
                    justifyContent: "space-evenly",
                }}
            >
                <Button
                    onClick={async () => {
                        let connectResult = await connectWallet();
                        if (connectResult.address) {
                            loginProps.setAddress(connectResult.address);
                        } else {
                            alert(connectResult.status);
                        }
                    }}
                >
                    Connect via MetaMask
                </Button>
                <Button
                    onClick={() => {
                        window.location.href = "https://metamask.io";
                    }}
                >
                    What is MetaMask?
                </Button>
            </div>
        </Card>
    );
};

interface GamesLobbyProps {
    address: string;
    lobbyType: "allGames" | "joinedGames";
}

interface Game {
    hostAddress: string;
    cardPrice: number;
    startTime: number;
    hostFee: number;
    turnTime: number;
    hasCompleted: boolean;
    poolValue: number;
    numbersDrawn: Array<number>;
}

const GamesGallery: React.FC<GamesLobbyProps> = (
    gamesLobbyProps: GamesLobbyProps
) => {
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
    console.log("Rendering gamesgallery");
    let [page, setPage] = useState(1);
    let [joinedGameDrawerOpen, setJoinedGameDrawerOpen] = useState(false);
    let [selectedGameID, setSelectedGameID] = useState("");
    let [game, setGame] = useState(defaultGame);
    let [cards, setCards] = useState([] as Array<Array<number>>);
    let [gameFilter, setGameFilter] = useState(() => true);
    let [generalGameDrawerOpen, setGeneralGameDrawerOpen] = useState(false);
    let [buyingCards, setBuyingCards] = useState(false);
    let [selectedNumbers, setSelectedNumbers] = useState([] as Array<number>);
    let [createGameDrawerOpen, setCreateGameDrawerOpen] = useState(false);
    let [createGameForm, setCreateGameForm] = useState({} as any);
    let [errorMsg, setErrorMsg] = useState("You must fill out the form.");
    let [showErrorMsg, setShowErrorMsg] = useState(false);
    let [waiting, setWaiting] = useState(false);
    let [result, setResult] = useState("");
    let [modalOpen, setModalOpen] = useState(false);
    let [games, setGames] = useState([] as Array<GameResponse>);
    let [modalPrompt, setModalPrompt] = useState("");
    let numberSelectCallback = function (changedValue: any, values: any) {
        setShowErrorMsg(false);
        let nums = [];
        for (let i = 0; i < 25; i++) {
            if (values[i] === undefined) {
                setErrorMsg(`You must fill out all the numbers.`);
                return;
            }
            let num = values[i];
            try {
                let parsedInt = parseInt(num);
                if (parsedInt >= 100) {
                    setErrorMsg(
                        `The number in block ${i} is of invalid value.`
                    );
                    return;
                }
                nums.push(parsedInt);
            } catch (e) {
                setErrorMsg(`The number in block ${i} is of invalid value.`);
                return;
            }
        }
        setErrorMsg("");
        setSelectedNumbers(nums);
    };
    let [numberInputForm, setNumberInputForm] = useState(
        <BingoCardEditable onFormChanged={numberSelectCallback}/>
    );

    useEffect(
        function () {
            let gameGetter = gamesLobbyProps.lobbyType == "allGames" ? getAllGames : getAllPlayerGames;
            let gamesPromise = gameGetter(gamesLobbyProps.address);
            gamesPromise.then(
                function (games: Array<GameResponse>) {
                    setGames(games);
                }
            );
        },
        [games.length, gamesLobbyProps.lobbyType]
    );

    useEffect(
        function () {
            if (selectedGameID !== "") {
                let gottenGame = checkGameStatus(parseInt(selectedGameID));
                gottenGame.then(
                    function (
                        gameResponse: GameResponse
                    ) {
                        const game: Game = {
                            cardPrice: parseInt(gameResponse.card_price),
                            hasCompleted: gameResponse.has_completed,
                            hostAddress: gameResponse.host_address,
                            hostFee: parseInt(new BN(gameResponse.host_fee).mul(new BN(100)).div(new BN("1000000000000000000")).toString()),
                            numbersDrawn: gameResponse.drawn_numbers!,
                            poolValue: parseInt(gameResponse.pool_value),
                            startTime: parseInt(gameResponse.start_time),
                            turnTime: parseInt(gameResponse.turn_time),
                        };
                        setGame(game);
                    }
                );
            }
        },
        [selectedGameID]
    );

    useEffect(
        function () {
            if (selectedGameID !== "") {
                getPlayerCards(parseInt(selectedGameID), gamesLobbyProps.address).then(
                    function (cards: Array<Array<number>>) {
                        setCards(cards);
                    }
                );
            }
        },
        [selectedGameID]
    );

    let totalGameCount = games.length;
    let numGameOnPage =
        page * pageSize > totalGameCount ? totalGameCount % pageSize : pageSize;
    let row1: Array<JSX.Element> = [];
    for (let i = 0; i < 3; i++) {
        row1.push(
            <Col key={i.toString()} span={24 / 3}>
                {i < numGameOnPage ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <GameIcon
                            gameID={games[(page - 1) * pageSize + i].id.toString()}
                            onClick={function () {
                                if (
                                    gamesLobbyProps.lobbyType == "joinedGames"
                                ) {
                                    setJoinedGameDrawerOpen(true);
                                } else {
                                    setGeneralGameDrawerOpen(true);
                                }
                                setSelectedGameID(games[(page - 1) * pageSize + i].id.toString());
                            }}
                        />
                    </div>
                ) : (
                    <></>
                )}
            </Col>
        );
    }
    let row2: Array<JSX.Element> = [];
    for (let i = 3; i < pageSize; i++) {
        row2.push(
            <Col key={i.toString()} span={24 / 3}>
                {i < numGameOnPage ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <GameIcon
                            gameID={games[(page - 1) * pageSize + i].id.toString()}
                            onClick={function () {
                                if (
                                    gamesLobbyProps.lobbyType == "joinedGames"
                                ) {
                                    setJoinedGameDrawerOpen(true);
                                } else {
                                    setGeneralGameDrawerOpen(true);
                                }
                                setSelectedGameID(games[(page - 1) * pageSize + i].id.toString());
                            }}
                        />
                    </div>
                ) : (
                    <></>
                )}
            </Col>
        );
    }
    let bingoCardComponents = cards.map(function (singleCard, idx) {
        return (
            <BingoCard
                cardNumbers={singleCard}
                tickedNumbers={game.numbersDrawn.filter(
                    (value) => value != 100
                )}
                key={idx}
            ></BingoCard>
        );
    });

    let gameStartTime = new Date(game.startTime * 1e3);
    let gameDrawNumberInterval = game.turnTime;

    let title =
        gamesLobbyProps.lobbyType == "joinedGames"
            ? "Joined Bingo Games"
            : "All Bingo Games";
    let onDrawerClose = () => {
        setJoinedGameDrawerOpen(false);
        setGeneralGameDrawerOpen(false);
        setCreateGameDrawerOpen(false);
        setGame(defaultGame);
        setSelectedGameID("");
        setCards([]);
        setNumberInputForm(
            <BingoCardEditable onFormChanged={numberSelectCallback}/>
        );
        setCreateGameForm({});
        setShowErrorMsg(false);
        setErrorMsg("You must fill out the form.");
        setModalPrompt("");
    };

    let joinedGameFilterRadio = (
        <Radio.Group
            defaultValue="a"
            buttonStyle="solid"
            style={{
                display: "flex",
                width: "100%",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <Radio.Button value="a">
                <div style={{width: "90px", textAlign: "center"}}>All</div>
            </Radio.Button>
            <Radio.Button value="b">
                <div style={{width: "90px", textAlign: "center"}}>
                    Finished
                </div>
            </Radio.Button>
            <Radio.Button value="c">
                <div style={{width: "90px", textAlign: "center"}}>
                    Unfinished
                </div>
            </Radio.Button>
        </Radio.Group>
    );
    let allGameFilterRadio = (
        <Radio.Group
            defaultValue="d"
            buttonStyle="solid"
            style={{
                display: "flex",
                width: "100%",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <Radio.Button value="d">
                <div style={{width: "90px", textAlign: "center"}}>All</div>
            </Radio.Button>
            <Radio.Button value="e">
                <div style={{width: "90px", textAlign: "center"}}>
                    Started
                </div>
            </Radio.Button>
            <Radio.Button value="f">
                <div style={{width: "90px", textAlign: "center"}}>
                    Unstarted
                </div>
            </Radio.Button>
            <Radio.Button value="f">
                <div style={{width: "90px", textAlign: "center"}}>
                    Hosted By Me
                </div>
            </Radio.Button>
        </Radio.Group>
    );

    const {
        token: {colorBgContainer, borderRadius, colorBorder},
    } = theme.useToken();
    let modalCallback = function (result: string) {
        setWaiting(false);
        if (result.includes("ERROR")) {
            setModalPrompt(`Failed to carry out the transaction: ${result.replaceAll("ERROR:", "")}`);
        } else {
            setModalPrompt(
                `Your transaction has been submitted to the blockchain for processing. 
                The transaction ID is ${result}. 
                Please go to 
                https://mumbai.polygonscan.com/tx/${result} 
                to check the result!`
            );
        }
    };

    return (
        <div>
            <Modal title={waiting ? "Waiting for the result" : "Transaction result"} open={modalOpen}
                   closable={false} maskClosable={false} cancelButtonProps={{style: {visibility: "hidden"}}}
                   okButtonProps={
                       {
                           disabled: waiting, onClick: function () {
                               setModalOpen(false);
                           }
                       }
                   }
                   width={"50vw"}
            >
                {
                    waiting &&
                    <div style={{height: "30vh"}}>
                        <Spin tip="Processing" size="large" style={{marginTop: "32px", marginBottom: "32px"}}>
                            <div className="content"/>
                        </Spin>
                    </div>
                }
                {
                    (!waiting) && modalPrompt
                }
            </Modal>
            <Layout>
                <Sider
                    style={{
                        background: colorBgContainer,
                        borderRadius: borderRadius,
                        borderColor: colorBorder,
                        borderStyle: "solid",
                    }}
                >
                    <div
                        style={{
                            textAlign: "center",
                            marginTop: "16px",
                            marginBottom: "16px",
                            fontSize: "1.5em",
                        }}
                    >
                        Filter
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        {gamesLobbyProps.lobbyType == "joinedGames"
                            ? joinedGameFilterRadio
                            : allGameFilterRadio}
                    </div>
                </Sider>
                <div style={{alignItems: "self-start"}}>
                    <Card
                        title={title}
                        bordered={true}
                        style={{width: "fit-content", height: "100%"}}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "end",
                                justifyContent: "space-evenly",
                                marginTop: "24px",
                                marginBottom: "24px",
                            }}
                        >
                            <Button
                                onClick={() => {
                                    setGames([]);
                                }}
                            >
                                Refresh
                            </Button>

                            {
                                gamesLobbyProps.lobbyType == "allGames" &&
                                <Button
                                    onClick={() => {
                                        setCreateGameDrawerOpen(true);
                                    }}
                                >
                                    Create a New Game
                                </Button>
                            }
                        </div>
                        <Divider/>
                        <Row gutter={[64, 64]} style={{width: "75vw"}}>
                            {row1}
                            {row2}
                        </Row>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                marginTop: "32px",
                            }}
                        >
                            <Pagination
                                defaultCurrent={1}
                                total={totalGameCount}
                                pageSize={pageSize}
                                onChange={(page, pageSize) => {
                                    setPage(page);
                                }}
                            />
                        </div>

                        {/*Lobby game drawer*/}
                        <Drawer
                            title={"Game " + selectedGameID}
                            placement="right"
                            open={generalGameDrawerOpen}
                            onClose={onDrawerClose}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    height: "100%",
                                }}
                            >
                                {buyingCards && (
                                    <div>
                                        <div
                                            style={{
                                                textAlign: "center",
                                                fontSize: "1.5em",
                                                marginBottom: "16px",
                                            }}
                                        >
                                            Select a Card
                                        </div>
                                        <div
                                            style={{
                                                overflow: "auto",
                                                height: "35vh",
                                            }}
                                        >
                                            {numberInputForm}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "space-evenly",
                                            }}
                                        >
                                            {showErrorMsg && (
                                                <p style={{color: "red"}}>
                                                    {errorMsg}
                                                </p>
                                            )}
                                            <Button
                                                onClick={() => {
                                                    let randCard =
                                                        generateRandomCard();
                                                    setNumberInputForm(
                                                        <BingoCardEditable
                                                            onFormChanged={
                                                                numberSelectCallback
                                                            }
                                                            cardNumbers={
                                                                randCard
                                                            }
                                                        />
                                                    );
                                                    setSelectedNumbers(
                                                        randCard
                                                    );
                                                    setErrorMsg("");
                                                    setShowErrorMsg(false);
                                                }}
                                            >
                                                Generate Random Numbers
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setNumberInputForm(
                                                        <BingoCardEditable
                                                            onFormChanged={
                                                                numberSelectCallback
                                                            }
                                                        />
                                                    );
                                                    setSelectedNumbers([]);
                                                    setErrorMsg(
                                                        "Please fill out the card!"
                                                    );
                                                    setShowErrorMsg(false);
                                                }}
                                                style={{marginTop: "16px"}}
                                            >
                                                Reset the Card
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <Card
                                    title={`Game ${selectedGameID}`}
                                    style={{height: "fit-content"}}
                                >
                                    <Descriptions
                                        title="Game Infomation"
                                        column={1}
                                    >
                                        <Descriptions.Item label="Host Wallet">
                                            {game.hostAddress.substring(0, 5) +
                                                "..." +
                                                game.hostAddress.substring(
                                                    game.hostAddress.length - 3,
                                                    game.hostAddress.length
                                                )}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Host fee percentage">
                                            {game.hostFee}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Card Price in Wei">
                                            {game.cardPrice}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Start Time">
                                            {formatTime(gameStartTime)}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Draw Interval in Seconds">
                                            {gameDrawNumberInterval}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Completed?">
                                            {" "}
                                            {game.hasCompleted.toString()}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Pool Value in Wei">
                                            {" "}
                                            {game.poolValue}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Numbers Drawn">
                                            {" "}
                                            {game.numbersDrawn
                                                .filter((value) => value != 100)
                                                .toString()}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Draw Number for the Game">
                                            <Button
                                                disabled={
                                                    game.startTime * 1e3 >
                                                    Date.now()
                                                }
                                            >
                                                Try to Draw Numbers
                                            </Button>
                                        </Descriptions.Item>
                                    </Descriptions>
                                    <div
                                        style={{
                                            alignItems: "center",
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                    >
                                        {!buyingCards ? (
                                            <Button
                                                disabled={
                                                    game.startTime > Date.now()
                                                }
                                                onClick={() => {
                                                    setBuyingCards(true);
                                                }}
                                            >
                                                Buy a Bingo Card for this Game
                                            </Button>
                                        ) : (
                                            <div
                                                style={{
                                                    justifyContent:
                                                        "space-around",
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    width: "100%"
                                                }}>
                                                <Button onClick={
                                                    () => {
                                                        if (errorMsg.length != 0) {
                                                            setShowErrorMsg(true);
                                                        } else {
                                                            setWaiting(true);
                                                            setModalOpen(true);
                                                            buyCard(
                                                                gamesLobbyProps.address,
                                                                {
                                                                    card: selectedNumbers,
                                                                    gameId: parseInt(selectedGameID),
                                                                    value: game.cardPrice.toString()
                                                                }
                                                            ).then(
                                                                modalCallback
                                                            );
                                                        }
                                                    }
                                                }
                                                >
                                                    Confirm
                                                </Button>
                                                <Button
                                                    onClick={
                                                        () => {
                                                            setBuyingCards(false);
                                                        }
                                                    }
                                                >
                                                    Cancle
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </Drawer>

                        {/*Create game drawer*/}
                        <Drawer
                            title={"Create a Game"}
                            placement="right"
                            open={createGameDrawerOpen}
                            onClose={onDrawerClose}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    height: "100%",
                                }}
                            >
                                <p>
                                    To create a game and become the host of the
                                    game, you need to specify the Bingo card
                                    price of the game, the percentage you will
                                    get out of the total prize pool, the start
                                    time of the game, and the number draw
                                    interval. Please note that as the host of
                                    the game, you need to pay three times of the
                                    card price as the initial prize pool. You
                                    may also want to set the percentage you will
                                    get out of the prize pool wisely. If you set
                                    it too low, it may not even cover the gas
                                    fee. If you set it too high, players may not
                                    want to join your game.
                                </p>
                                <Card
                                    title={`New Game`}
                                    style={{height: "fit-content"}}
                                >
                                    <Form
                                        onValuesChange={function (
                                            changedValues: any,
                                            values: any
                                        ) {
                                            for (const k in values) {
                                                if (values[k] === undefined) {
                                                    setErrorMsg(
                                                        "All fields must be entered."
                                                    );
                                                    return;
                                                }
                                            }
                                            if (
                                                !/^\d+$/.test(
                                                    values["cardPrice"]
                                                )
                                            ) {
                                                setErrorMsg(
                                                    "The card price is of invalid value."
                                                );
                                                return;
                                            }
                                            if (
                                                !/^\d+$/.test(
                                                    values["hostFee"]
                                                ) ||
                                                parseInt(values["hostFee"]) >
                                                100
                                            ) {
                                                setErrorMsg(
                                                    "The host fee is of invalid value."
                                                );
                                                return;
                                            }
                                            if (
                                                !/^\d+$/.test(
                                                    values["turnTime"]
                                                )
                                            ) {
                                                setErrorMsg(
                                                    "The number draw interval is of invalid value."
                                                );
                                                return;
                                            }
                                            if (
                                                !/\d\d:\d\d:\d\d/.test(
                                                    values["startTime"]
                                                )
                                            ) {
                                                setErrorMsg(
                                                    "The start time is of invalid value."
                                                );
                                                return;
                                            }
                                            if (!/\d\d\d\d\.\d\d\.\d\d/.test(values["startDate"])) {
                                                setErrorMsg(
                                                    "The start date is of invalid value."
                                                );
                                                return;
                                            }

                                            try {
                                                // This time parsing logic is based on code provided by OpenAI's ChatGPT.
                                                let time = values["startTime"];
                                                let parts = time.split(":");
                                                const hours = parseInt(
                                                    parts[0],
                                                    10
                                                );
                                                const minutes = parseInt(
                                                    parts[1],
                                                    10
                                                );
                                                const seconds = parseInt(
                                                    parts[2],
                                                    10
                                                );
                                                const totalSeconds =
                                                    hours * 60 * 60 +
                                                    minutes * 60 +
                                                    seconds;
                                                const dateString =
                                                    values["startDate"];
                                                parts = dateString.split(".");
                                                const year = parseInt(
                                                    parts[0],
                                                    10
                                                );
                                                const month =
                                                    parseInt(parts[1], 10) - 1; // subtract 1 since months are zero-indexed in JS
                                                const day = parseInt(
                                                    parts[2],
                                                    10
                                                );
                                                const date = new Date(
                                                    year,
                                                    month,
                                                    day
                                                );
                                                values["startTime"] =
                                                    Math.floor(
                                                        date.getTime() / 1000
                                                    ) + totalSeconds;
                                                delete values["startDate"];
                                            } catch (e) {
                                                setErrorMsg(
                                                    "The start time or the start date is of invalid value."
                                                );
                                                return;
                                            }

                                            let eth = new BN(
                                                "1000000000000000000"
                                            );
                                            values["hostFee"] = eth
                                                .mul(new BN(values["hostFee"]))
                                                .div(new BN(100));
                                            values["cardPrice"] = new BN(
                                                values["cardPrice"]
                                            );
                                            setCreateGameForm(values);
                                            setErrorMsg("");
                                        }}
                                    >
                                        <Form.Item
                                            name={"cardPrice"}
                                            label={"Bingo card price in Wei"}
                                        >
                                            <Input/>
                                        </Form.Item>
                                        <Form.Item
                                            name={"hostFee"}
                                            label={
                                                "Host fee in percentage (0-100)"
                                            }
                                        >
                                            <Input/>
                                        </Form.Item>
                                        <Form.Item
                                            name={"startTime"}
                                            label={"Game start time (hh:mm:ss)"}
                                        >
                                            <Input/>
                                        </Form.Item>
                                        <Form.Item
                                            name={"startDate"}
                                            label={
                                                "Game start date (yyyy.mm.dd)"
                                            }
                                        >
                                            <Input/>
                                        </Form.Item>
                                        <Form.Item
                                            name={"turnTime"}
                                            label={
                                                "Draw interval in seconds"
                                            }
                                        >
                                            <InputNumber/>
                                        </Form.Item>
                                    </Form>
                                    {showErrorMsg && (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                color: "red",
                                            }}
                                        >
                                            {errorMsg}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            marginTop: "16px",
                                        }}
                                    >
                                        <Button
                                            onClick={
                                                () => {
                                                    if (errorMsg.length != 0) {
                                                        setShowErrorMsg(true);
                                                    } else {
                                                        setModalOpen(true);
                                                        setWaiting(true);
                                                        createGame(
                                                            gamesLobbyProps.address,
                                                            {
                                                                card_price: createGameForm["cardPrice"].toString(),
                                                                host_fee: createGameForm["hostFee"].toString(),
                                                                start_time: createGameForm["startTime"].toString(),
                                                                turn_time: createGameForm["turnTime"].toString(),
                                                                value: createGameForm["cardPrice"].mul(new BN(3)).toString()
                                                            }
                                                        ).then(modalCallback);
                                                    }
                                                }
                                            }
                                        >
                                            Confirm New Game
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </Drawer>

                        {/* Joined game drawer*/}
                        <Drawer
                            title={"Game " + selectedGameID}
                            placement="right"
                            open={joinedGameDrawerOpen}
                            onClose={onDrawerClose}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    height: "100%",
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            textAlign: "center",
                                            fontSize: "1.5em",
                                            marginBottom: "16px",
                                        }}
                                    >
                                        Bingo Cards for This Game
                                    </div>
                                    <div
                                        style={{
                                            overflow: "auto",
                                            height: "45vh",
                                        }}
                                    >
                                        {bingoCardComponents}
                                    </div>
                                </div>
                                <Card
                                    title={`Game ${selectedGameID}`}
                                    style={{height: "40vh"}}
                                >
                                    <Descriptions
                                        title="Game Infomation"
                                        column={1}
                                    >
                                        <Descriptions.Item label="Host Wallet">
                                            {game.hostAddress.substring(0, 5) +
                                                "..." +
                                                game.hostAddress.substring(
                                                    game.hostAddress.length - 3,
                                                    game.hostAddress.length
                                                )}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Card Price in Wei">
                                            {game.cardPrice}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Host fee percentage">
                                            {game.hostFee}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Start Time">
                                            {formatTime(gameStartTime)}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Draw Interval in Seconds">
                                            {gameDrawNumberInterval}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Completed?">
                                            {" "}
                                            {game.hasCompleted.toString()}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Pool Value in Wei">
                                            {" "}
                                            {game.poolValue}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Numbers Drawn">
                                            {" "}
                                            {game.numbersDrawn
                                                .filter((value) => value != 100)
                                                .toString()}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Draw Number for the Game">
                                            {" "}
                                            <Button
                                                disabled={
                                                    game.startTime * 1e3 >
                                                    Date.now()
                                                }
                                            >
                                                Try to Draw Numbers
                                            </Button>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>
                            </div>
                        </Drawer>
                    </Card>
                </div>
            </Layout>
        </div>
    );
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

interface BingoCardEditableProps {
    onFormChanged: (changedValue: any, values: any) => void;
    cardNumbers?: Array<number>;
}

function generateRandomCard(): Array<number> {
    let ranges = [
        [1, 19],
        [20, 39],
        [40, 59],
        [60, 79],
        [80, 99],
    ];
    let nums = [];
    let generated: any = {};
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let randNum = getRandomInt(ranges[i][0], ranges[i][1]);
            while (randNum in generated) {
                randNum = getRandomInt(ranges[i][0], ranges[i][1]);
            }
            if (i * 5 + j == 12) {
                randNum = 0;
            }
            nums.push(randNum);
        }
    }
    return nums;
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const BingoCardEditable = (props: BingoCardEditableProps) => {
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
    let rows = [];
    for (let i = 0; i < 5; i++) {
        let cols = [];
        for (let j = 0; j < 5; j++) {
            let idx = j * 5 + i;
            let col = (
                <Col flex={1} style={style} key={`${j}col`}>
                    <Form.Item
                        name={idx.toString()}
                        rules={[]}
                        style={{margin: 0}}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-evenly",
                                height: "100%",
                                alignItems: "center",
                            }}
                        >
                            {idx == 12 ? (
                                <Input value={0} disabled={true}></Input>
                            ) : props.cardNumbers ? (
                                <Input value={props.cardNumbers[idx]}></Input>
                            ) : (
                                <Input></Input>
                            )}
                        </div>
                    </Form.Item>
                </Col>
            );
            cols.push(col);
        }
        rows.push(
            <Row gutter={[0, 0]} key={`${i}row`}>
                {cols}
            </Row>
        );
    }
    return <Form onValuesChange={props.onFormChanged}>{rows}</Form>;
};

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
            let idx = j * 5 + i;
            let col = (
                <Col
                    flex={1}
                    style={{
                        ...style,
                        backgroundColor:
                            carArr[idx] == 0
                                ? "lightgreen"
                                : tickedArr.includes(carArr[idx])
                                    ? "yellow"
                                    : "white",
                    }}
                    key={`${j}col`}
                >
                    {" "}
                    {carArr[idx]}
                </Col>
            );
            cols.push(col);
        }
        rows.push(
            <Row gutter={[0, 0]} key={`${i}row`}>
                {cols}
            </Row>
        );
    }
    return (
        <>
            <div style={{marginTop: "8px"}}>{rows}</div>
        </>
    );
};

interface GameIconProps {
    gameID: string;
    onClick: () => void;
}

const GameIcon: React.FC<GameIconProps> = function (props) {
    return (
        <Card
            hoverable
            style={{width: 240}}
            cover={
                <img
                    alt="Bingo Picture"
                    src={require("../resources/Bingo-chips.jpg")}
                />
            }
            onClick={props.onClick}
        >
            <Meta title={`Game ID: ` + props.gameID}/>
        </Card>
    );
};
