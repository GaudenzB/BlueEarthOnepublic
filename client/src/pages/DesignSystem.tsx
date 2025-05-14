import React from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Divider, 
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
import { StatusTag } from '@/components/ui/StatusTag';
import {
  ColorSwatch,
  SpacingShowcase,
  TypographyShowcase,
  FontWeightShowcase,
  LineHeightShowcase,
  BorderRadiusShowcase,
  ShadowShowcase,
  TokenSection,
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
        <Text strong>Base Font Family</Text>
        <Paragraph style={{ marginTop: '8px', marginBottom: 0 }}>
          {tokens.typography.fontFamily.base}
        </Paragraph>
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
              <div key={key} style={{ marginBottom: '16px' }}>
                <Text strong style={{ display: 'block' }}>{key}</Text>
                <Text 
                  style={{ 
                    fontWeight: value as number, 
                    display: 'block', 
                    fontSize: '16px',
                    marginTop: '4px'
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </Text>
                <Divider style={{ margin: '12px 0' }} />
              </div>
            ))}
          </Card>
        </Col>
        
        <Col span={12}>
          <Title level={3} style={{ margin: '24px 0 16px' }}>Line Heights</Title>
          <Card>
            {Object.entries(tokens.typography.lineHeight).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>{key}</Text>
                  <Text type="secondary">{value}</Text>
                </div>
                <Paragraph 
                  style={{ 
                    lineHeight: value as number | string, 
                    margin: '4px 0 0 0',
                    padding: '8px',
                    background: tokens.colors.neutral[300],
                    borderRadius: '4px'
                  }}
                >
                  This paragraph demonstrates the {key} line height ({value}). Notice how the spacing between lines affects readability.
                </Paragraph>
                <Divider style={{ margin: '12px 0' }} />
              </div>
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
          <Col key={key} span={6} xs={12} sm={8} md={6} lg={4} style={{ marginBottom: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: tokens.colors.brand.primary, 
                borderRadius: value,
                marginBottom: '8px',
                margin: '0 auto 8px'
              }} />
              <Text strong style={{ display: 'block' }}>{key}</Text>
              <Text type="secondary">{value}</Text>
            </div>
          </Col>
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
      <Card style={{ marginBottom: '32px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>Button Types</Title>
            <Space wrap>
              <Button type="primary">Primary Button</Button>
              <Button>Default Button</Button>
              <Button type="dashed">Dashed Button</Button>
              <Button type="text">Text Button</Button>
              <Button type="link">Link Button</Button>
            </Space>
          </div>
          
          <div>
            <Title level={5}>Button Sizes</Title>
            <Space wrap>
              <Button type="primary" size="large">Large Button</Button>
              <Button type="primary">Default Button</Button>
              <Button type="primary" size="small">Small Button</Button>
            </Space>
          </div>
          
          <div>
            <Title level={5}>Button with Icons</Title>
            <Space wrap>
              <Button type="primary" icon={<PlusOutlined />}>Add Item</Button>
              <Button icon={<SearchOutlined />}>Search</Button>
              <Button icon={<DownloadOutlined />}>Download</Button>
              <Button type="primary" icon={<SettingOutlined />} />
            </Space>
          </div>
        </Space>
      </Card>
      
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
                <Tag color="green">Green Tag</Tag>
                <Tag color="orange">Orange Tag</Tag>
                <Tag color="red">Red Tag</Tag>
                <Tag color="purple">Purple Tag</Tag>
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
                  case 'active': return <Badge status="success" text="Active" />;
                  case 'inactive': return <Badge status="default" text="Inactive" />;
                  case 'pending': return <Badge status="processing" text="Pending" />;
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