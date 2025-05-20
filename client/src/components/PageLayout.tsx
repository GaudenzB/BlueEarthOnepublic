import { Layout, Typography } from "antd";
import React from "react";
import { theme } from "../lib/theme";

const { Header, Content } = Layout;
const { Title } = Typography;

/**
 * Page layout component that follows the BlueEarthOne design system.
 * 
 * This component provides a consistent layout for all pages in the application,
 * including a header with the page title and a container for content.
 * 
 * @see docs/design-system.md for design system guidelines.
 */
type PageLayoutProps = {
  /** Page title to be displayed in the header */
  title: string;
  /** Page content */
  children: React.ReactNode;
};

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh', background: theme.colors.background.page }}>
      <Header style={{ 
        background: theme.colors.background.card, 
        padding: '16px 24px',
        boxShadow: theme.shadows.sm,
        height: 'auto',
        lineHeight: 'normal'
      }}>
        <Title level={3} style={{ 
          margin: 0 as number,
          color: theme.colors.primary.base
        }}>
          {title}
        </Title>
      </Header>
      <Content style={{ 
        maxWidth: '1200px',
        width: '100%',
        margin: '24px auto',
        padding: '0 24px'
      }}>
        {children}
      </Content>
    </Layout>
  );
}