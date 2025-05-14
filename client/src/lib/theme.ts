/**
 * BlueEarth Capital Design System Theme
 * 
 * This file defines the core design tokens used throughout the application.
 * Always use these tokens instead of hard-coded values to ensure consistency.
 */

export const theme = {
  // Brand colors
  brand: {
    50: '#e3f0ff',
    100: '#c2d8f8',
    200: '#9ec0ed',
    300: '#7aa8e2',
    400: '#5690d7',
    500: '#0f52ba', // Primary brand color
    600: '#0d47a1', // Hover state
    700: '#1a3d7c', // Dark areas
    800: '#16335f',
    900: '#112947',
  },
  
  // Neutral colors
  gray: {
    50: '#f8f9fa',  // Page backgrounds, subtle backgrounds
    100: '#f0f2f5', // Card backgrounds, dividers
    200: '#e9ecef', // Input fields, borders
    300: '#dee2e6', // Disabled states, secondary borders
    400: '#ced4da', // Placeholder text
    500: '#adb5bd', // Secondary text, disabled text
    600: '#6c757d', // Muted text, secondary headings
    700: '#495057', // Primary text
    800: '#343a40', // Headings 
    900: '#212529', // Main headings
  },
  
  // Status colors
  status: {
    success: {
      light: '#f6ffed',
      base: '#52c41a',  
      dark: '#389e0d',
    },
    warning: {
      light: '#fffbe6',
      base: '#faad14',
      dark: '#d48806',
    },
    error: {
      light: '#fff1f0',
      base: '#ff4d4f',
      dark: '#cf1322',
    },
    info: {
      light: '#e6f7ff',
      base: '#1890ff',
      dark: '#096dd9',
    },
    processing: {
      base: '#1890ff',
    }
  },
  
  // Typography
  typography: {
    fontFamily: {
      base: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  
  // Spacing
  spacing: {
    0: '0',
    1: '0.25rem',    // 4px
    2: '0.5rem',     // 8px
    3: '0.75rem',    // 12px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    8: '2rem',       // 32px
    10: '2.5rem',    // 40px
    12: '3rem',      // 48px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    32: '8rem',      // 128px
    40: '10rem',     // 160px
    48: '12rem',     // 192px
    56: '14rem',     // 224px
    64: '16rem',     // 256px
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',  // Fully rounded (circle/pill)
  },
  
  // Shadows
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  
  // Maximum widths for containers
  maxWidth: {
    xs: '20rem',     // 320px
    sm: '24rem',     // 384px
    md: '28rem',     // 448px
    lg: '32rem',     // 512px
    xl: '36rem',     // 576px
    '2xl': '42rem',  // 672px
    '3xl': '48rem',  // 768px
    '4xl': '56rem',  // 896px
    '5xl': '64rem',  // 1024px
    '6xl': '72rem',  // 1152px
    '7xl': '80rem',  // 1280px
    full: '100%',
  },
  
  // Z-index values
  zIndex: {
    auto: 'auto',
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    100: 100,
    modal: 1000,
    toast: 1100,
    tooltip: 1200,
  },
  
  // Ant Design specific
  antDesign: {
    // Primary color (used in many Ant components)
    primaryColor: '#0f52ba',
    
    // Component-specific overrides
    card: {
      defaultBorderRadius: '0.75rem', // xl
      defaultPadding: 24, // spacing.6
      defaultShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', // shadows.sm
    },
    
    // Status tag colors mapping
    tagColors: {
      active: 'success',
      inactive: 'default',
      remote: 'processing',
      on_leave: 'warning',
      deleted: 'error',
      draft: 'default',
      in_review: 'processing',
      approved: 'success',
      rejected: 'error',
      pending: 'warning',
    },
  },
};

// Utility functions to access theme values
export const getThemeValue = (path: string) => {
  const parts = path.split('.');
  return parts.reduce((obj, key) => obj?.[key], theme);
};

export default theme;