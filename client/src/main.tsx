import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import SidebarProviderWrapper from "./hooks/use-sidebar";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "./theme/theme";

createRoot(document.getElementById("root")!).render(
  <ChakraProvider theme={theme}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <SidebarProviderWrapper>
        <App />
      </SidebarProviderWrapper>
    </ThemeProvider>
  </ChakraProvider>
);
