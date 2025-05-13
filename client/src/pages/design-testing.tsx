import React, { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import {
  Tabs,
  Tab,
  Button,
  Space,
  Card,
  Typography,
  Divider,
  Row,
  Col,
  Collapse,
  Badge,
  Alert
} from "antd";
import {
  PlusOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  DownloadOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export default function DesignTesting() {
  const [activeTab, setActiveTab] = useState("1");

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <PageLayout title="Design Testing - Ant Design Components">
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>Tab Types</Title>
        <Paragraph type="secondary">
          Ant Design offers several types of tab components for different UI needs
        </Paragraph>
        
        {/* Basic Tabs */}
        <Divider orientation="left">Basic Tabs</Divider>
        <Tabs defaultActiveKey="1" onChange={onChange} style={{ marginBottom: 24 }}>
          <Tabs.TabPane tab="Tab 1" key="1">
            Content of Tab Pane 1
          </Tabs.TabPane>
          <Tabs.TabPane tab="Tab 2" key="2">
            Content of Tab Pane 2
          </Tabs.TabPane>
          <Tabs.TabPane tab="Tab 3" key="3">
            Content of Tab Pane 3
          </Tabs.TabPane>
        </Tabs>
        
        {/* Card Tabs */}
        <Divider orientation="left">Card Tabs</Divider>
        <Tabs defaultActiveKey="1" type="card" style={{ marginBottom: 24 }}>
          <Tabs.TabPane tab="Card Tab 1" key="1">
            Content of Card Tab 1
          </Tabs.TabPane>
          <Tabs.TabPane tab="Card Tab 2" key="2">
            Content of Card Tab 2
          </Tabs.TabPane>
          <Tabs.TabPane tab="Card Tab 3" key="3">
            Content of Card Tab 3
          </Tabs.TabPane>
        </Tabs>

        {/* Tabs with Icons */}
        <Divider orientation="left">Tabs with Icons</Divider>
        <Tabs defaultActiveKey="1" style={{ marginBottom: 24 }}>
          <Tabs.TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Documents
              </span>
            } 
            key="1"
          >
            Documents content
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={
              <span>
                <UnorderedListOutlined />
                List View
              </span>
            } 
            key="2"
          >
            List view content
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={
              <span>
                <AppstoreOutlined />
                Gallery View
              </span>
            } 
            key="3"
          >
            Gallery view content
          </Tabs.TabPane>
        </Tabs>

        {/* Centered Tabs */}
        <Divider orientation="left">Centered Tabs</Divider>
        <Tabs defaultActiveKey="1" centered style={{ marginBottom: 24 }}>
          <Tabs.TabPane tab="Tab 1" key="1">
            Content of centered Tab 1
          </Tabs.TabPane>
          <Tabs.TabPane tab="Tab 2" key="2">
            Content of centered Tab 2
          </Tabs.TabPane>
          <Tabs.TabPane tab="Tab 3" key="3">
            Content of centered Tab 3
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Row gutter={24}>
        <Col span={12}>
          <Card title="Collapse Panels" style={{ marginBottom: 24 }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header="Document Information" key="1">
                <p>This is the document information panel content</p>
                <p>You can include any content within the panel</p>
              </Panel>
              <Panel header="Document History" key="2">
                <p>This is the document history panel content</p>
              </Panel>
              <Panel header="Document Permissions" key="3" extra={<SettingOutlined />}>
                <p>This is the document permissions panel content</p>
              </Panel>
            </Collapse>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Alert Components">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert message="Info Alert" type="info" showIcon />
              <Alert message="Success Alert" type="success" showIcon />
              <Alert message="Warning Alert" type="warning" showIcon />
              <Alert message="Error Alert" type="error" showIcon />
              <Alert
                message="Alert with Description"
                description="This is a more detailed alert with a longer description explaining more information."
                type="info"
                showIcon
              />
            </Space>
          </Card>
        </Col>
      </Row>
      
      <Card title="Action Buttons" style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />}>
            Create Document
          </Button>
          <Button icon={<DownloadOutlined />}>Download</Button>
          <Button type="dashed">Dashed Button</Button>
          <Button type="primary" danger>Danger Button</Button>
          <Button type="link">Link Button</Button>
          <Button type="default" disabled>
            Disabled Button
          </Button>
        </Space>
        
        <Divider orientation="left">Button Sizes</Divider>
        <Space wrap>
          <Button type="primary" size="large">Large Button</Button>
          <Button type="primary">Default Button</Button>
          <Button type="primary" size="small">Small Button</Button>
        </Space>
      </Card>
      
      <Card title="Badges and Status Indicators">
        <Space wrap size="large">
          <Badge count={5}>
            <div style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
          </Badge>
          
          <Badge count={0} showZero>
            <div style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
          </Badge>
          
          <Badge count={<DownloadOutlined style={{ color: '#1890ff' }} />}>
            <div style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
          </Badge>
          
          <Badge dot>
            <div style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
          </Badge>
          
          <Badge status="success" text="Success" />
          <Badge status="error" text="Error" />
          <Badge status="default" text="Default" />
          <Badge status="processing" text="Processing" />
          <Badge status="warning" text="Warning" />
        </Space>
      </Card>
    </PageLayout>
  );
}