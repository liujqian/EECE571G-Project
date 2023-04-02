import React from "react";
import { Button, Col, Image, Row } from "antd";

import { Layout, Space } from "antd";
import { bingoContract, getDevAddress, drawNumber } from "../utils/interact";
import { connectWallet } from "../utils/connect";

const { Header, Footer, Sider, Content } = Layout;

const headerStyle: React.CSSProperties = {
    textAlign: "center",
    color: "#fff",
    height: "fit-content",
    padding: "0px 0px 0px 64px",
    lineHeight: "64px",
    backgroundColor: "#7dbcea",
};

const contentStyle: React.CSSProperties = {
    textAlign: "center",
    minHeight: 700,
    lineHeight: "120px",
    color: "#fff",
    backgroundColor: "#108ee9",
};

const siderStyle: React.CSSProperties = {
    textAlign: "center",
    lineHeight: "120px",
    color: "#fff",
    backgroundColor: "#3ba0e9",
    minWidth: "800",
};

const footerStyle: React.CSSProperties = {
    textAlign: "center",
    backgroundColor: "white",
    minHeight: "20vh",
    display: "flex",
    flexDirection: "column",
    padding: "0px 0px 0px 0px",
};
type HomePrompt = {
    goToDashboard: () => void;
};

const getInfo = async () => {
    await connectWallet();
    const log_info = await getDevAddress();
    console.log("draw number:", log_info);
};

export function Home(homePrompt: HomePrompt): JSX.Element {
    return (
        <Space direction="vertical" style={{ width: "100%", height: "100%" }}>
            <Layout>
                <Header style={headerStyle}>
                    <Row align="top" justify="space-around">
                        <Col span={6}>
                            <p
                                style={{
                                    fontSize: "4em",
                                    marginTop: "25px",
                                    textAlign: "left",
                                }}
                            >
                                Bingo571G
                            </p>
                        </Col>
                        <Col span={6}></Col>
                        <Col span={6}></Col>
                        <Col span={6} style={{ backgroundColor: "#90caf9" }}>
                            <div style={{ height: "auto", overflow: "hidden" }}>
                                <Image
                                    src={require("../resources/Bingo.jpg")}
                                    width={300}
                                    style={{ marginTop: "8px" }}
                                ></Image>
                                <p
                                    style={{
                                        margin: 0,
                                        height: 50,
                                        lineHeight: "3",
                                    }}
                                >
                                    Bingo Cards
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Header>
                <Layout>
                    <Content style={contentStyle}>
                        <Row style={{ height: "700px" }}>
                            <Col
                                span={16}
                                style={{ backgroundColor: "#1976d2" }}
                            >
                                <Row>
                                    <Col span={16}>
                                        <div
                                            style={{
                                                marginLeft: "36px",
                                                height: "100%",
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontSize: "2em",
                                                    textAlign: "left",
                                                }}
                                            >
                                                What is Bingo571G?
                                            </p>
                                            <button onClick={getInfo}>
                                                logger
                                            </button>
                                            <p
                                                style={{
                                                    textAlign: "left",
                                                    lineHeight: "24px",
                                                }}
                                            >
                                                Bingo571G is a game that is
                                                backed-up by the smart contract
                                                technology. It allows users to
                                                play the traditional Bingo game
                                                on a completely fair and
                                                transparent environment. Here,
                                                players can host Bingo games and
                                                collect the compensation fees
                                                for hosts as well join hosted
                                                games by buying Bingo cards and
                                                enjoy the thrill of gambling
                                                online with other blockchain
                                                users.
                                                <br />
                                                <br />
                                                Because of the smart contract
                                                and blockchain technologies,
                                                every line of code running the
                                                Bingo571G is completely open.
                                                Players can actually take a look
                                                at the underlying implementation
                                                of the game and thus they do not
                                                need to worry about the games
                                                being rigged at all.
                                                <br />
                                                <br />
                                                Right now, the game's contract
                                                has been deployed to the Mumbai
                                                test net of the Polygon
                                                blockchain network. Players can
                                                start gaming with MATIC tokens
                                                from the Mumbai test faucet.
                                            </p>
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                            <Col
                                span={8}
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-evenly",
                                        height: "100%",
                                        width: 300,
                                        verticalAlign: "center",
                                    }}
                                >
                                    <Button
                                        style={{ width: 300 }}
                                        onClick={homePrompt.goToDashboard}
                                    >
                                        Start the Games Now!
                                    </Button>
                                    <Button
                                        style={{ width: 300 }}
                                        onClick={() => {
                                            window.location.href =
                                                "https://docs.google.com/document/d/1KUvHDENApX49oxbEY4w-Lym_JJYVF-njBc8Nr1YmvZc/edit?usp=sharing";
                                        }}
                                    >
                                        Read the Whitepaper
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Content>
                </Layout>
                <Footer style={footerStyle}>
                    <Row style={{ height: "20vh" }}>
                        <Col span={8}>
                            <Row>
                                <Col span={12}>
                                    <div
                                        style={{
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-evenly",
                                            alignItems: "center",
                                            verticalAlign: "middle",
                                        }}
                                    >
                                        <img
                                            src={require("../resources/UBC-Logo.jpg")}
                                            width={300}
                                            style={{
                                                marginTop: "8px",
                                                width: "6vw",
                                            }}
                                        ></img>
                                        The University of British Columbia
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div
                                        style={{
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "space-evenly",
                                            textAlign: "center",
                                        }}
                                    >
                                        <img
                                            src={require("../resources/ECE-logo.png")}
                                            width={300}
                                            style={{
                                                marginTop: "8px",
                                                width: "9vw",
                                            }}
                                        ></img>
                                        Department of Electrical and Computer
                                        Engineering
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={8} style={{ backgroundColor: "#e3f2fd" }}>
                            <div
                                style={{
                                    textAlign: "left",
                                    marginLeft: "36px",
                                }}
                            >
                                <p>
                                    About the developers
                                    <br />
                                    <br />
                                    The Bingo571G game is developed by four
                                    brilliant students, Jingqian Liu, Taha
                                    Shabani, Rahul Ramjuttun, and Andrew
                                    Musgrave, while taking the course "EECE 571G
                                    Blockchain Software Engineering."
                                    <br />
                                    <br />
                                    Currently Jingqian and Rahul are Master of
                                    Engineering students in the ECE department
                                    of UBC. Taha and Andrew are Master of
                                    Applied Science students in the ECE
                                    department of UBC.
                                </p>
                            </div>
                        </Col>
                        <Col span={8} style={{ backgroundColor: "#bbdefb" }}>
                            <div
                                style={{
                                    textAlign: "left",
                                    marginLeft: "36px",
                                }}
                            >
                                <p>
                                    Contact us
                                    <br />
                                    <br />
                                    If you have any questions about the game or
                                    if you have any feedback or suggestions to
                                    make the game better, please contact the
                                    development team via email:
                                    <a href="mailto:liujqian@students.ubc.ca">
                                        {" "}
                                        liujqian@students.ubc.ca
                                    </a>
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Footer>
            </Layout>
        </Space>
    );
}
