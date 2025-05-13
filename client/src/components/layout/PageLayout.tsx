import React, { ReactNode } from "react";
import { Layout, Typography } from "antd";

const { Content } = Layout;
const { Title } = Typography;

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  maxWidth?: string | number;
  padding?: number | [number, number];
}

/**
 * PageLayout component for consistent page layouts across the application
 * @param children - The content to be displayed in the layout
 * @param title - Optional page title to display at the top
 * @param maxWidth - Optional max width for the container (default: 1200)
 * @param padding - Optional padding (default: [16, 24])
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  maxWidth = 1200,
  padding = [16, 24],
}) => {
  return (
    <Layout.Content
      style={{ 
        background: "#f5f5f5",
        width: "100%"
      }}
    >
      <div
        style={{ 
          maxWidth: maxWidth,
          margin: "0 auto",
          padding: typeof padding === "number" ? padding : `${padding[1]}px ${padding[0]}px`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {title && (
            <Title level={2} style={{ color: "#1E2A40", marginBottom: 0 }}>
              {title}
            </Title>
          )}
          {children}
        </div>
      </div>
    </Layout.Content>
  );
};

export default PageLayout;