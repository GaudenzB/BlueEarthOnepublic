import { extendTheme } from "@chakra-ui/react";

// BlueEarth Capital brand colors
// Primary: #1A2B47 (dark navy)
// Secondary shades: #0C1C36 (darker), #324D6F (lighter)
const theme = extendTheme({
  colors: {
    brand: {
      50: "#E6EBF2", // Lightest shade
      100: "#C5D0E1", // Very light
      200: "#A3B6D0", // Light
      300: "#809BBE", // Medium light
      400: "#5E81AD", // Medium
      500: "#1A2B47", // Primary base
      600: "#16253E", // Primary dark
      700: "#0C1C36", // Very dark (sidebar)
      800: "#081426", // Extra dark
      900: "#040C16", // Nearly black
    },
    accent: {
      50: "#E6F7FF", // Lightest shade
      100: "#B3E0FF", // Very light
      200: "#80C9FF", // Light
      300: "#4DB2FF", // Medium light
      400: "#1A9CFF", // Medium
      500: "#0085FF", // Primary accent
      600: "#0066CC", // Dark accent
      700: "#004C99", // Very dark accent
      800: "#003366", // Extra dark accent
      900: "#00264D", // Nearly black accent
    }
  },
  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "gray.50",
        color: "gray.800",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "500",
        borderRadius: "md",
      },
      variants: {
        solid: {
          bg: "brand.500",
          color: "white",
          _hover: {
            bg: "brand.600",
          },
        },
        outline: {
          borderColor: "brand.500",
          color: "brand.500",
          _hover: {
            bg: "brand.50",
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        color: "brand.500",
      },
    },
  },
});

export default theme;