import React, {useEffect, useState} from "react";
import {Avatar, Button, Card, Col, Drawer, Layout, Menu, Pagination, Row, theme} from "antd";
import {addWalletListener, connectWallet, getCurrentWalletConnected, removeWalletListener} from "../utils/connect";
import {UserOutlined} from "@ant-design/icons";
import {getNumCards, getTotalGameCount} from "../utils/stubs";

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
        getCurrentWalletConnected().then((wallet) => {
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
        });
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
                                        setContent(<Cards address={address}></Cards>);
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

const Cards: React.FC<AddressProps> = (cardsProps: AddressProps) => {
    let pageSize = 6;
    let [page, setPage] = useState(1);
    let [totalGameCount, setTotalGameCount] = useState(0);
    let [drawerOpen, setDrawerOpen] = useState(false);
    let [selectedGameID, setSelectedGameID] = useState("");
    useEffect(
        function () {
            getTotalGameCount().then(
                function (count) {
                    setTotalGameCount(count);
                }
            );
        }, [totalGameCount]
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
                                }
                            }/>
                        </div> : <></>
                }
            </Col>,
        );
    }
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

        <Drawer title="Basic Drawer" placement="right" open={drawerOpen} onClose={
            () => {
                setDrawerOpen(!drawerOpen);
            }
        }>
            < p> Some contents...</p>
            <p>Some contents...</p>
        </Drawer>
    </Card>;
};

interface BingoCardProps {
    cardNumbers: Array<Array<number>>;
}

const BingoCard: React.FC<BingoCardProps> = (props: BingoCardProps) => {
    return <></>;
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
