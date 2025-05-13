import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import SidebarProviderWrapper from "./hooks/use-sidebar";
import { ConfigProvider } from "antd";
import "antd/dist/reset.css";

// Ant Design theme configuration
const antTheme = {
  token: {
    colorPrimary: "#1E2A40", // Brand primary color (from theme.ts)
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    borderRadius: 4,
  },
};

createRoot(document.getElementById("root")!).render(
  <ConfigProvider theme={antTheme}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <SidebarProviderWrapper>
        <App />
      </SidebarProviderWrapper>
    </ThemeProvider>
  </ConfigProvider>
);
