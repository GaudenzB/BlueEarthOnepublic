/**
 * Financial Portal Theme Configuration
 * 
 * This file contains the centralized theme tokens used throughout the application.
 * Following the design guidelines in /docs/design-guidelines.md.
 * 
 * Use these tokens to maintain visual consistency across components.
 */

export const colors = {
  // Primary colors
  primary: {
    blue: '#0e4a86', // Primary brand color
    navy: '#172554', // Headings and important text
    green: '#10b981', // Success states
  },
  
  // Secondary colors
  secondary: {
    charcoal: '#1e293b', // Primary text
    slate: '#64748b',    // Secondary text
    lightGray: '#f8fafc', // Background for panels
  },
  
  // Accent colors
  accent: {
    gold: '#f59e0b',   // Warnings
    ruby: '#e11d48',   // Errors
    purple: '#8b5cf6', // Special features
  },
  
  // Status colors
  status: {
    active: '#10b981',    // Green
    pending: '#3b82f6',   // Blue
    warning: '#f59e0b',   // Amber
    error: '#ef4444',     // Red
    inactive: '#6b7280',  // Gray
  },
  
  // Common interface colors
  border: '#e5e7eb',
  shadow: 'rgba(0, 0, 0, 0.08)',
  backgroundLight: '#ffffff',
  backgroundDark: '#f8fafc',
  
  // Table specific colors
  table: {
    headerBg: '#f8fafc',
    headerText: '#334155',
    border: '#e2e8f0',
    rowHover: '#f1f5f9',
    zebraStripe: '#fafafa',
  }
};

// Typography settings
export const typography = {
  fontFamily: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  fontSize: {
    // Headings
    h1: '28px',
    h2: '24px',
    h3: '20px',
    h4: '18px',
    h5: '16px',
    h6: '14px',
    
    // Body text
    bodyLarge: '16px',
    bodyRegular: '14px',
    bodySmall: '12px',
  },
  
  fontWeight: {
    bold: 600,
    medium: 500,
    regular: 400,
  },
  
  lineHeight: {
    headings: 1.2,
    body: 1.5,
  }
};

// Spacing scale
export const spacing = {
  base: 4,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  
  // Specific component spacing
  cardPadding: '16px',
  sectionPadding: '24px',
  tableCellPadding: '12px 16px',
  inputPadding: '8px 12px',
};

// Border radius scale
export const borderRadius = {
  none: '0px',
  sm: '4px',
  default: '8px',
  lg: '12px',
  xl: '16px',
  pill: '999px',
};

// Shadows for different elevations
export const shadows = {
  sm: '0 1px 2px rgba(16, 24, 40, 0.05)',
  default: '0 1px 3px rgba(16, 24, 40, 0.1), 0 1px 2px rgba(16, 24, 40, 0.06)',
  md: '0 4px 6px -1px rgba(16, 24, 40, 0.1), 0 2px 4px -1px rgba(16, 24, 40, 0.06)',
  lg: '0 10px 15px -3px rgba(16, 24, 40, 0.1), 0 4px 6px -2px rgba(16, 24, 40, 0.05)',
  xl: '0 20px 25px -5px rgba(16, 24, 40, 0.1), 0 10px 10px -5px rgba(16, 24, 40, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(16, 24, 40, 0.05)',
  none: 'none',
};

// Transitions
export const transitions = {
  default: '200ms ease',
  fast: '100ms ease',
  slow: '300ms ease',
};

// Breakpoints for responsive design
export const breakpoints = {
  mobile: '640px',
  tablet: '1024px',
  desktop: '1280px',
  largeDesktop: '1440px',
};

// Container width constraints
export const containers = {
  maxWidth: '1200px',
  formWidth: '800px',
};

// Ant Design specific theme overrides
export const antOverrides = {
  token: {
    colorPrimary: colors.primary.blue,
    colorSuccess: colors.primary.green,
    colorWarning: colors.accent.gold,
    colorError: colors.accent.ruby,
    colorInfo: colors.primary.blue,
    
    fontFamily: typography.fontFamily.primary,
    
    borderRadius: parseInt(borderRadius.default),
    
    boxShadow: shadows.default,
    
    // Component-specific overrides
    Table: {
      headerBg: colors.table.headerBg,
      headerColor: colors.table.headerText,
      borderColor: colors.table.border,
    },
    Button: {
      defaultBg: 'white',
      defaultBorderColor: colors.border,
      primaryBg: colors.primary.blue,
      primaryColor: 'white',
    },
    Card: {
      padding: spacing.cardPadding,
    },
  }
};

// Named export for backwards compatibility with existing components
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  containers,
  antOverrides,
};

// Default export of complete theme
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  containers,
  antOverrides,
};