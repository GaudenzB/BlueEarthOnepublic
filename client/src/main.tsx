import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import SidebarProviderWrapper from "./hooks/use-sidebar";
import { ConfigProvider } from "antd";
import antThemeConfig from "./theme/ant-theme";

// Use the comprehensive Ant Design theme configuration
createRoot(document.getElementById("root")!).render(
  <ConfigProvider theme={antThemeConfig}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <SidebarProviderWrapper>
        <App />
      </SidebarProviderWrapper>
    </ThemeProvider>
  </ConfigProvider>
);
