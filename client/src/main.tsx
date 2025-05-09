import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import SidebarProviderWrapper from "./hooks/use-sidebar";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light">
    <SidebarProviderWrapper>
      <App />
    </SidebarProviderWrapper>
  </ThemeProvider>
);
