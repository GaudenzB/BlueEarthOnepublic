import React from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Space, 
  Button, 
  Input, 
  Select, 
  Switch, 
  Tag,
  Tabs,
  Table, 
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  SettingOutlined, 
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { tokens } from '@/theme/tokens';
import { StatusTag } from '@/components/ui';
import {
  ColorSwatch,
  SpacingShowcase,
  TypographyShowcase,
  FontWeightShowcase,
  LineHeightShowcase,
  BorderRadiusShowcase,
  ComponentShowcase
} from '@/components/design/DesignTokens';

const { Title, Text, Paragraph } = Typography;

/**
 * Design System Page
 * 
 * A comprehensive showcase of the BlueEarth Capital design system,
 * displaying all design tokens, components, patterns, and guidelines
 * in one centralized location.
 */
export default function DesignSystem() {
  const items = [
    { key: 'colors', label: 'Colors', children: <ColorsSection /> },
    { key: 'typography', label: 'Typography', children: <TypographySection /> },
    { key: 'spacing', label: 'Spacing', children: <SpacingSection /> },
    { key: 'components', label: 'Components', children: <ComponentsSection /> },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '16px' }}>BlueEarth Capital Design System</Title>
      <Paragraph style={{ fontSize: '16px', marginBottom: '32px' }}>
        A comprehensive collection of design tokens, components, and patterns used throughout the BlueEarth Capital platform.
        This design system ensures consistency, accessibility, and a professional financial services aesthetic.
      </Paragraph>
      
      <Tabs defaultActiveKey="colors" items={items} />
    </div>
  );
}

// Colors Section
function ColorsSection() {
  return (
    <div>
      <Title level={3} style={{ margin: '24px 0 16px' }}>Brand Colors</Title>
      <Paragraph>Our primary brand colors reflect trust, professionalism, and financial stability.</Paragraph>
      <Row gutter={[16, 16]}>
        <ColorSwatch color={tokens.colors.brand.primary} name="Primary" value={tokens.colors.brand.primary} />
        <ColorSwatch color={tokens.colors.brand.primaryLight} name="Primary Light" value={tokens.colors.brand.primaryLight} />
        <ColorSwatch color={tokens.colors.brand.primaryDark} name="Primary Dark" value={tokens.colors.brand.primaryDark} />
        <ColorSwatch color={tokens.colors.brand.secondary} name="Secondary" value={tokens.colors.brand.secondary} />
      </Row>
      
      <Title level={3} style={{ margin: '32px 0 16px' }}>Semantic Colors</Title>
      <Paragraph>Used consistently to convey meaning across the platform.</Paragraph>
      <Row gutter={[16, 16]}>
        <ColorSwatch color={tokens.colors.semantic.success} name="Success" value={tokens.colors.semantic.success} />
        <ColorSwatch color={tokens.colors.semantic.warning} name="Warning" value={tokens.colors.semantic.warning} />
        <ColorSwatch color={tokens.colors.semantic.error} name="Error" value={tokens.colors.semantic.error} />
        <ColorSwatch color={tokens.colors.semantic.info} name="Info" value={tokens.colors.semantic.info} />
      </Row>
      
      <Title level={3} style={{ margin: '32px 0 16px' }}>Neutral Colors</Title>
      <Paragraph>Used for text, backgrounds, and borders throughout the application.</Paragraph>
      <Row gutter={[16, 16]}>
        {Object.entries(tokens.colors.neutral).map(([key, value]) => (
          <ColorSwatch key={key} color={value} name={`Neutral ${key}`} value={value} />
        ))}
      </Row>
    </div>
  );
}

// Typography Section
function TypographySection() {
  return (
    <div>
      <Title level={3} style={{ margin: '24px 0 16px' }}>Font Family</Title>
      <Card style={{ marginBottom: '32px' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text strong>Sans-Serif Font Family (Primary)</Text>
            <Paragraph style={{ marginTop: '8px', marginBottom: 0, fontFamily: tokens.typography.fontFamily.sans }}>
              {tokens.typography.fontFamily.sans}
            </Paragraph>
          </Col>
          <Col span={24}>
            <Text strong>Serif Font Family</Text>
            <Paragraph style={{ marginTop: '8px', marginBottom: 0, fontFamily: tokens.typography.fontFamily.serif }}>
              {tokens.typography.fontFamily.serif}
            </Paragraph>
          </Col>
          <Col span={24}>
            <Text strong>Monospace Font Family</Text>
            <Paragraph style={{ marginTop: '8px', marginBottom: 0, fontFamily: tokens.typography.fontFamily.mono }}>
              {tokens.typography.fontFamily.mono}
            </Paragraph>
          </Col>
          <Col span={24}>
            <Text strong>Display Font Family</Text>
            <Paragraph style={{ marginTop: '8px', marginBottom: 0, fontFamily: tokens.typography.fontFamily.display }}>
              {tokens.typography.fontFamily.display}
            </Paragraph>
          </Col>
        </Row>
      </Card>
      
      <Title level={3} style={{ margin: '24px 0 16px' }}>Font Sizes</Title>
      <Card style={{ marginBottom: '32px' }}>
        {Object.entries(tokens.typography.fontSize).map(([key, value]) => (
          <TypographyShowcase 
            key={key}
            size={key} 
            value={value} 
            example="BlueEarth Capital - Investment Excellence" 
          />
        ))}
      </Card>
      
      <Row gutter={[32, 32]}>
        <Col span={12}>
          <Title level={3} style={{ margin: '24px 0 16px' }}>Font Weights</Title>
          <Card>
            {Object.entries(tokens.typography.fontWeight).map(([key, value]) => (
              <FontWeightShowcase 
                key={key} 
                name={key} 
                weight={value as number}
              />
            ))}
          </Card>
        </Col>
        
        <Col span={12}>
          <Title level={3} style={{ margin: '24px 0 16px' }}>Line Heights</Title>
          <Card>
            {Object.entries(tokens.typography.lineHeight).map(([key, value]) => (
              <LineHeightShowcase 
                key={key} 
                name={key} 
                value={value as number | string} 
              />
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// Spacing Section
function SpacingSection() {
  return (
    <div>
      <Title level={3} style={{ margin: '24px 0 16px' }}>Spacing Scale</Title>
      <Paragraph>
        Our spacing follows a consistent 4px grid system to ensure proportional layouts throughout the application.
      </Paragraph>
      
      <Card style={{ marginBottom: '32px' }}>
        <Row gutter={[16, 24]}>
          {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32].map((size) => {
            // Use type-safe approach for accessing spacing values
            const spacingKey = size.toString() as keyof typeof tokens.spacing;
            return (
              <SpacingShowcase 
                key={spacingKey} 
                value={tokens.spacing[spacingKey] || '0'} 
                label={`spacing.${spacingKey}`} 
              />
            );
          })}
        </Row>
      </Card>
      
      <Title level={3} style={{ margin: '24px 0 16px' }}>Border Radius</Title>
      <Row gutter={[16, 16]}>
        {Object.entries(tokens.radii).map(([key, value]) => (
          <BorderRadiusShowcase key={key} name={key} value={value} />
        ))}
      </Row>
    </div>
  );
}

// Components Section
function ComponentsSection() {
  return (
    <div>
      <Title level={3} style={{ margin: '24px 0 16px' }}>Buttons</Title>
      <ComponentShowcase 
        title="Button Types"
        description="Different button types serve different purposes in the interface. Use them consistently based on action importance.">
        <Space wrap>
          <Button type="primary">Primary Button</Button>
          <Button>Default Button</Button>
          <Button type="dashed">Dashed Button</Button>
          <Button type="text">Text Button</Button>
          <Button type="link">Link Button</Button>
        </Space>
      </ComponentShowcase>
      
      <ComponentShowcase 
        title="Button Sizes"
        description="Different button sizes help establish visual hierarchy and adapt to different screen sizes.">
        <Space wrap>
          <Button type="primary" size="large">Large Button</Button>
          <Button type="primary">Default Button</Button>
          <Button type="primary" size="small">Small Button</Button>
        </Space>
      </ComponentShowcase>
      
      <ComponentShowcase 
        title="Button with Icons"
        description="Icons enhance button recognition and provide visual cues about the action being performed.">
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />}>Add Item</Button>
          <Button icon={<SearchOutlined />}>Search</Button>
          <Button icon={<DownloadOutlined />}>Download</Button>
          <Button type="primary" icon={<SettingOutlined />} />
        </Space>
      </ComponentShowcase>
      
      <Title level={3} style={{ margin: '24px 0 16px' }}>Status Tags</Title>
      <Card style={{ marginBottom: '32px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>Employee Statuses</Title>
            <Space wrap>
              <StatusTag status="active" />
              <StatusTag status="inactive" />
              <StatusTag status="on_leave" />
              <StatusTag status="remote" />
            </Space>
          </div>
          
          <div>
            <Title level={5}>Document Statuses</Title>
            <Space wrap>
              <StatusTag status="draft" />
              <StatusTag status="in_review" />
              <StatusTag status="pending" />
              <StatusTag status="approved" />
              <StatusTag status="completed" />
              <StatusTag status="rejected" />
              <StatusTag status="expired" />
            </Space>
          </div>
          
          <div>
            <Title level={5}>Custom Status</Title>
            <Space wrap>
              <StatusTag status="custom" text="Custom Status" />
              <StatusTag status="custom" text="Interactive" interactive onClick={() => alert('Status clicked')} />
            </Space>
          </div>
          
          <div>
            <Title level={5}>Status Sizes</Title>
            <Space wrap>
              <StatusTag status="active" size="small" />
              <StatusTag status="active" />
              <StatusTag status="active" size="large" />
            </Space>
          </div>
        </Space>
      </Card>
      
      <Title level={3} style={{ margin: '24px 0 16px' }}>Form Controls</Title>
      <Card style={{ marginBottom: '32px' }}>
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Input</Text>
              <Input placeholder="Basic input" />
              <Input prefix={<SearchOutlined />} placeholder="Input with icon" />
            </Space>
          </Col>
          
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Select</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Select an option"
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Select multiple options"
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </Space>
          </Col>
          
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Switch</Text>
              <div>
                <Switch defaultChecked style={{ marginRight: '8px' }} />
                <Switch style={{ marginRight: '8px' }} />
                <Switch size="small" defaultChecked />
              </div>
            </Space>
          </Col>
          
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Tags</Text>
              <div>
                <Tag color="blue">Blue Tag</Tag>
                <Tag color="geekblue">Dark Blue Tag</Tag>
                <Tag color="cyan">Light Blue Tag</Tag>
                <Tag color="default">Grey Tag</Tag>
                <Tag color="#1a3f6d">Navy Tag</Tag>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
      
      <Title level={3} style={{ margin: '24px 0 16px' }}>Data Display</Title>
      <Card>
        <Table 
          style={{ marginBottom: '32px' }}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Status', dataIndex: 'status', key: 'status', 
              render: (status) => {
                switch(status) {
                  case 'active': // Fall through
       // Fall through
       return <Badge status="success" text="Active" />;
                  case 'inactive': // Fall through
       // Fall through
       return <Badge status="default" text="Inactive" />;
                  case 'pending': // Fall through
       // Fall through
       return <Badge status="processing" text="Pending" />;
                  default: return <Badge status="default" text={status} />;
                }
              } 
            },
            { title: 'Date', dataIndex: 'date', key: 'date' },
            { title: 'Actions', key: 'actions', render: () => (
              <Space>
                <Button type="text" size="small">View</Button>
                <Button type="text" size="small">Edit</Button>
              </Space>
            )},
          ]}
          dataSource={[
            { key: '1', name: 'John Brown', status: 'active', date: '2025-01-15' },
            { key: '2', name: 'Jim Green', status: 'pending', date: '2025-02-20' },
            { key: '3', name: 'Joe Black', status: 'inactive', date: '2025-03-10' },
          ]}
          pagination={false}
        />
      </Card>
      
      <Card style={{ marginTop: '24px' }}>
        <Row gutter={[24, 24]}>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Badges</Text>
              <div>
                <Badge status="success" text="Success" style={{ marginRight: '16px' }} />
                <Badge status="processing" text="Processing" style={{ marginRight: '16px' }} />
                <Badge status="error" text="Error" style={{ marginRight: '16px' }} />
                <Badge status="warning" text="Warning" style={{ marginRight: '16px' }} />
                <Badge status="default" text="Default" />
              </div>
            </Space>
          </Col>
          
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Tabs</Text>
              <Tabs
                defaultActiveKey="1"
                items={[
                  { key: '1', label: 'Tab 1', children: 'Content of Tab 1' },
                  { key: '2', label: 'Tab 2', children: 'Content of Tab 2' },
                ]}
              />
            </Space>
          </Col>
          
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Notification Icons</Text>
              <div>
                <CheckCircleOutlined style={{ color: tokens.colors.semantic.success, fontSize: '24px', marginRight: '16px' }} />
                <ClockCircleOutlined style={{ color: tokens.colors.semantic.warning, fontSize: '24px', marginRight: '16px' }} />
                <CloseCircleOutlined style={{ color: tokens.colors.semantic.error, fontSize: '24px' }} />
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
}