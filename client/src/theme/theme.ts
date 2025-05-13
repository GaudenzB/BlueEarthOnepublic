import { extendTheme } from "@chakra-ui/react";

// BlueEarth Capital brand colors
// Updated to a more mature, professional aesthetic for financial SaaS platforms
const theme = extendTheme({
  colors: {
    brand: {
      50: "#E6EAF0", // Lightest shade
      100: "#C2CCE0", // Very light
      200: "#9AAACB", // Light
      300: "#7287B7", // Medium light
      400: "#5470A7", // Medium
      500: "#1E2A40", // Primary base (navy)
      600: "#19253B", // Primary dark
      700: "#131D30", // Very dark (sidebar)
      800: "#0D1526", // Extra dark
      900: "#060C19", // Nearly black
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
    },
    // Status colors for badges - subdued and professional
    status: {
      success: {
        bg: "green.50",
        color: "green.800",
      },
      warning: {
        bg: "yellow.50",
        color: "yellow.800", 
      },
      error: {
        bg: "red.50",
        color: "red.800",
      },
      info: {
        bg: "blue.50",
        color: "blue.800",
      },
      default: {
        bg: "gray.50",
        color: "gray.700",
      },
    }
  },
  fonts: {
    heading: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    body: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  },
  fontSizes: {
    xs: "0.75rem",
    sm: "0.813rem",
    md: "0.875rem",
    lg: "1rem",
    xl: "1.125rem",
    "2xl": "1.25rem",
    "3xl": "1.5rem",
    "4xl": "1.875rem",
    "5xl": "2.25rem",
    "6xl": "3rem",
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
          borderColor: "gray.200",
          color: "gray.800",
          _hover: {
            bg: "gray.50",
          },
        },
      },
      sizes: {
        sm: {
          fontSize: "sm",
          px: 3,
          py: 1,
        },
      },
    },
    Table: {
      baseStyle: {
        th: {
          fontWeight: "medium",
          textTransform: "none",
          letterSpacing: "normal",
          color: "gray.600", 
          fontSize: "sm",
        },
        td: {
          fontSize: "sm",
        },
      },
      variants: {
        simple: {
          th: {
            borderBottom: "1px",
            borderColor: "gray.200",
          },
          td: {
            borderBottom: "1px",
            borderColor: "gray.200",
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: "semibold",
        color: "brand.500",
      },
      sizes: {
        "2xl": {
          fontSize: "2xl",
        },
      },
    },
    Alert: {
      variants: {
        "left-accent": {
          container: {
            borderLeftWidth: "4px",
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        px: 2,
        py: 1,
        textTransform: "none",
        fontWeight: "medium",
        borderRadius: "md",
        fontSize: "xs",
      },
      variants: {
        subtle: {
          bg: "gray.50",
          color: "gray.800",
        },
        success: {
          bg: "green.50",
          color: "green.800",
        },
        warning: {
          bg: "yellow.50",
          color: "yellow.800",
        },
        error: {
          bg: "red.50",
          color: "red.800",
        },
        info: {
          bg: "blue.50",
          color: "blue.800",
        },
      },
    },
  },
});

export default theme;