import React, {useEffect, useState} from "react";
import {Avatar, Button, Card, Layout, Menu, theme} from "antd";
import {addWalletListener, connectWallet, getCurrentWalletConnected, removeWalletListener} from "../utils/connect";
import Web3 from "web3";
import {UserOutlined} from "@ant-design/icons";

const {Header, Content, Footer} = Layout;

export const Dashboard: React.FC = () => {
    let [address, setAddress] = useState("");
    const {
        token: {colorBgContainer},
    } = theme.useToken();
    let [content, setContent] = useState(Login({setAddress: setAddress}));

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
                setAddress(address);
                setContent(Lobby({}));
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
                        items={
                            [
                                {key: 0, label: "My Bingo Cards"},
                                {key: 1, label: "Game lobby",}
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

const Login = (loginProps: any) => {
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
            <Button onClick={() => {
                window.location.href = "https://metamask.io";
            }}>
                What is MetaMask?
            </Button>
        </div>
    </Card>;
};
;
const Lobby = (loginProps: any) => {
    return <Card title="Lobby" bordered={true} style={{width: 300}}>
        This is lobby
    </Card>;
};