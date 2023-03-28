import React from "react";
import {Button, Col, Row} from "antd";

import {Layout, Space} from "antd";

const {Header, Footer, Sider, Content} = Layout;

const headerStyle: React.CSSProperties = {
    textAlign: "center",
    color: "#fff",
    height: 64,
    paddingInline: 50,
    lineHeight: "64px",
    backgroundColor: "#7dbcea",
    minHeight: 300
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
};

const footerStyle: React.CSSProperties = {
    textAlign: "center",
    color: "#fff",
    backgroundColor: "#7dbcea",
    minHeight: 300
};
type HomePrompt = {
    goToDashboard: () => void,
}

export function Home(homePrompt: HomePrompt): JSX.Element {
    return <Space direction="vertical" style={{width: "100%"}}>
        <Layout>
            <Header style={headerStyle}>
                <Row>
                    <Col span={6}><p style={
                        {
                            fontSize: "6em"
                        }
                    }>Bingo571G</p></Col>
                    <Col span={6}></Col>
                    <Col span={6}></Col>
                    <Col span={6}>col-6</Col>
                </Row>
            </Header>
            <Layout>
                <Content style={contentStyle}>Content</Content>
                <Sider style={siderStyle}>Sider</Sider>
            </Layout>
            <Footer style={footerStyle}>Footer</Footer>
        </Layout>
    </Space>;
}

