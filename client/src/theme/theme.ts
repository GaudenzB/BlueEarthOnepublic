import { extendTheme } from "@chakra-ui/react/dist/theme-utils";

const theme = extendTheme({
  colors: {
    brand: {
      50: "#e4f0ff",
      100: "#b3d1ff",
      500: "#004080", // BlueEarth navy
      700: "#002f5c",
    },
  },
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "gray.50",
      },
    },
  },
});

export default theme;