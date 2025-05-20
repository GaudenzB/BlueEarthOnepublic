/**
 * Design Tokens Component Library
 * 
 * This file contains reusable components for displaying design tokens
 * in the design system documentation.
 */

import React from 'react';
import { Card, Typography, Space, Col, Divider } from 'antd';
import { tokens } from '@/theme/tokens';

const { Title, Text, Paragraph } = Typography;

/**
 * Color Swatch component for displaying color tokens
 */
export const ColorSwatch: React.FC<{
  color: string;
  name: string;
  value: string;
}> = ({ color, name, value }) => (
  <Col span={6} xs={24} sm={12} md={8} lg={6} style={{ marginBottom: '24px' }}>
    <Card bodyStyle={{ padding: '16px' }}>
      <div style={{ 
        backgroundColor: color, 
        height: '60px', 
        borderRadius: '8px',
        marginBottom: '12px',
        border: `1px solid ${tokens.colors.neutral[400]}`
      }} />
      <Typography.Text strong style={{ display: 'block' }}>{name}</Typography.Text>
      <Typography.Text type="secondary" style={{ display: 'block', wordBreak: 'break-all' }}>{value}</Typography.Text>
    </Card>
  </Col>
);

/**
 * Typography Showcase component
 */
export const TypographyShowcase: React.FC<{
  size: string;
  value: string;
  example: string;
}> = ({ size, value, example }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <Text strong>{size}</Text>
      <Text type="secondary">{value}</Text>
    </div>
    <Typography.Paragraph style={{ fontSize: value, margin: 0 as number }}>{example}</Typography.Paragraph>
    <Divider style={{ margin: '12px 0' }} />
  </div>
);

/**
 * Font Weight Showcase component
 */
export const FontWeightShowcase: React.FC<{
  name: string;
  weight: number;
}> = ({ name, weight }) => (
  <div style={{ marginBottom: '16px' }}>
    <Text strong style={{ display: 'block' }}>{name}</Text>
    <Text 
      style={{ 
        fontWeight: weight, 
        display: 'block', 
        fontSize: '16px',
        marginTop: '4px'
      }}
    >
      The quick brown fox jumps over the lazy dog
    </Text>
    <Divider style={{ margin: '12px 0' }} />
  </div>
);

/**
 * Line Height Showcase component
 */
export const LineHeightShowcase: React.FC<{
  name: string;
  value: number | string;
}> = ({ name, value }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Text strong>{name}</Text>
      <Text type="secondary">{value}</Text>
    </div>
    <Paragraph 
      style={{ 
        lineHeight: value, 
        margin: '4px 0 0 0',
        padding: '8px',
        background: tokens.colors.neutral[300],
        borderRadius: '4px'
      }}
    >
      This paragraph demonstrates the {name} line height ({value}). Notice how the spacing between lines affects readability.
    </Paragraph>
    <Divider style={{ margin: '12px 0' }} />
  </div>
);

/**
 * Spacing Showcase component
 */
export const SpacingShowcase: React.FC<{
  value: string;
  label: string;
}> = ({ value, label }) => (
  <Col span={6} xs={12} sm={8} md={6} lg={4} style={{ marginBottom: '16px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ 
        width: value, 
        height: '24px', 
        backgroundColor: tokens.colors.brand.primary, 
        marginBottom: '8px',
        borderRadius: '4px'
      }} />
      <Text strong>{label}</Text>
      <Text type="secondary">{value}</Text>
    </div>
  </Col>
);

/**
 * Border Radius Showcase component
 */
export const BorderRadiusShowcase: React.FC<{
  name: string;
  value: string;
}> = ({ name, value }) => (
  <Col span={6} xs={12} sm={8} md={6} lg={4} style={{ marginBottom: '16px' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        width: '80px', 
        height: '80px', 
        backgroundColor: tokens.colors.brand.primary, 
        borderRadius: value,
        marginBottom: '8px',
        margin: '0 auto 8px'
      }} />
      <Text strong style={{ display: 'block' }}>{name}</Text>
      <Text type="secondary">{value}</Text>
    </div>
  </Col>
);

/**
 * Shadow Showcase component
 */
export const ShadowShowcase: React.FC<{
  name: string;
  value: string;
}> = ({ name, value }) => (
  <Col span={6} xs={12} sm={8} md={6} lg={4} style={{ marginBottom: '24px' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        width: '100px', 
        height: '100px', 
        backgroundColor: tokens.colors.neutral[100], 
        borderRadius: tokens.radii.md,
        boxShadow: value,
        margin: '0 auto 8px'
      }} />
      <Text strong style={{ display: 'block' }}>{name}</Text>
      <Text type="secondary" style={{ fontSize: '12px' }}>{value.slice(0, 30)}...</Text>
    </div>
  </Col>
);

/**
 * Token Section component
 */
export const TokenSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div>
    <Title level={3} style={{ margin: '24px 0 16px' }}>{title}</Title>
    {description && <Paragraph>{description}</Paragraph>}
    {children}
  </div>
);

/**
 * Component Showcase
 */
export const ComponentShowcase: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <Card style={{ marginBottom: '32px' }}>
    <Title level={5}>{title}</Title>
    {description && <Paragraph>{description}</Paragraph>}
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {children}
    </Space>
  </Card>
);