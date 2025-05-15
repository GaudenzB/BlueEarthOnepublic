// blueearth-theme.ts – TailwindCSS Design Tokens for BlueEarthOne Portal

export const blueEarthTheme = {
  colors: {
    primary: "#005E5D", // BlueEarth primary teal
    secondary: "#1A1A1A", // Dark neutral
    accent: "#E1F4F3", // Light accent background
    muted: "#6B7280", // Gray 500
    background: "#F9FAFB",
    border: "#E5E7EB",
    destructive: "#B91C1C"
  },
  spacing: {
    xs: "0.25rem",   // 4px
    sm: "0.5rem",    // 8px
    md: "1rem",      // 16px
    lg: "1.5rem",    // 24px
    xl: "2rem",      // 32px
    '2xl': "3rem",   // 48px
  },
  borderRadius: {
    sm: "0.375rem",  // 6px
    md: "0.5rem",    // 8px
    lg: "0.75rem",   // 12px
    xl: "1rem",      // 16px
    full: "9999px"
  },
  fontSize: {
    xs: "0.75rem",   // 12px
    sm: "0.875rem",  // 14px
    base: "1rem",    // 16px
    lg: "1.125rem",  // 18px
    xl: "1.25rem",   // 20px
    '2xl': "1.5rem", // 24px
    '3xl': "1.875rem", // 30px
    '4xl': "2.25rem" // 36px
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700"
  },
  shadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
    lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)"
  },
  zIndex: {
    base: 0,
    dropdown: 10,
    modal: 50,
    toast: 100,
    tooltip: 200
  }
};

/**
 * Helper function to convert hex to HSL for use with Tailwind CSS
 * This allows us to use our hex colors with the CSS variable system
 */
export function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Convert hex to RGB
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  // Convert RGB to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    
    h *= 60;
  }
  
  // Round the values
  h = Math.round(h);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  // Return as CSS hsl string
  return `${h} ${s}% ${l}%`;
}

/**
 * Generate HSL values for all theme colors
 * This is needed for the CSS variable system
 */
export const themeHSL = {
  primary: hexToHSL(blueEarthTheme.colors.primary),
  secondary: hexToHSL(blueEarthTheme.colors.secondary),
  accent: hexToHSL(blueEarthTheme.colors.accent),
  muted: hexToHSL(blueEarthTheme.colors.muted),
  background: hexToHSL(blueEarthTheme.colors.background),
  border: hexToHSL(blueEarthTheme.colors.border),
  destructive: hexToHSL(blueEarthTheme.colors.destructive)
};