import React, {useState} from "react";
import {Button, Card, Layout, Menu, theme} from "antd";
import {connectWallet} from "../utils/connect";
import Web3 from "web3";
const {Header, Content, Footer} = Layout;

export const Dashboard: React.FC = () => {
    let [address, setAddress] = useState("");
    const {
        token: {colorBgContainer},
    } = theme.useToken();
    let content = Login({setAddress: setAddress});
    return (
        <Layout className="layout">
            <Header>
                <Menu
                    theme="dark"
                    mode="horizontal"
                    defaultSelectedKeys={["2"]}
                    items={
                        [
                            {key: 0, label: "My Bingo Cards"},
                            {key: 1, label: "Game lobby",}
                        ]
                    }
                />
                <div>

                </div>
            </Header>
            <Content style={{padding: "0 50px"}}>
                <div className="site-layout-content" style={
                    {background: colorBgContainer, alignItems: "center", display: "flex", flexDirection: "column"}
                }>
                    {content}
                </div>
            </Content>
            <Footer style={{textAlign: "center"}}>Ant Design ©2023 Created by Ant UED</Footer>
        </Layout>
    );
};

const Login = (loginProps: any) => {
    return <Card title="Login to your wallet" bordered={true} style={{width: 300}}>
        <Button onClick={async () => {
            let connectResult = await connectWallet();
            if (connectResult.address) {
                loginProps.setAddress(connectResult.address);
            } else {
                alert(connectResult.status);
            }
        }
        }>Connect</Button>
    </Card>;
};