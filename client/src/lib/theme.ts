/**
 * Theme Configuration
 * 
 * This file contains the centralized theme tokens for the application,
 * following the financial services aesthetic guidelines.
 */

export const colors = {
  primary: {
    base: '#0e4a86',
    hover: '#1e63a5',
    light: '#f0f7ff',
    dark: '#0a3a68',
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    muted: '#94a3b8',
    inverse: '#ffffff',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    draft: '#94a3b8',
  },
  background: {
    page: '#f9fafc',
    card: '#ffffff',
    subtle: '#f8fafc',
    selected: '#f0f7ff',
  },
  border: {
    light: '#eaecf0',
    default: '#d1d5db',
    focus: '#0e4a86',
  }
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
};

export const shadows = {
  sm: '0 1px 2px rgba(16, 24, 40, 0.05)',
  md: '0 4px 6px -1px rgba(16, 24, 40, 0.1)',
  lg: '0 10px 15px -3px rgba(16, 24, 40, 0.1)',
  xl: '0 20px 25px -5px rgba(16, 24, 40, 0.1)',
};

export const typography = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  lineHeights: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const transitions = {
  default: 'all 0.2s ease-in-out',
  fast: 'all 0.15s ease',
  slow: 'all 0.3s ease-in-out',
};

export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
};

// Component-specific styling
export const CARD_STYLES = {
  card: {
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)',
    border: '1px solid #eaecf0',
    transition: 'all 0.2s ease-in-out',
  },
  cardHover: {
    boxShadow: '0 3px 10px rgba(16, 24, 40, 0.1)',
  },
  cardSelected: {
    borderColor: colors.primary.base,
    boxShadow: `0 0 0 1px ${colors.primary.base}, ${shadows.md}`,
  },
};

export const BUTTON_STYLES = {
  primary: {
    backgroundColor: colors.primary.base,
    borderColor: colors.primary.base,
    color: '#ffffff',
    boxShadow: shadows.sm,
    fontWeight: typography.fontWeights.medium,
    height: '40px',
    borderRadius: borderRadius.md,
  },
  secondary: {
    backgroundColor: '#ffffff',
    borderColor: colors.primary.base,
    color: colors.primary.base,
    boxShadow: 'none',
    fontWeight: typography.fontWeights.medium,
    height: '40px',
    borderRadius: borderRadius.md,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: colors.primary.base,
    boxShadow: 'none',
    fontWeight: typography.fontWeights.medium,
    height: '40px',
    borderRadius: borderRadius.md,
  },
};

export const INPUT_STYLES = {
  default: {
    height: '40px',
    borderRadius: borderRadius.md,
    borderColor: colors.border.default,
    boxShadow: 'none',
  },
  focus: {
    borderColor: colors.primary.base,
    boxShadow: `0 0 0 2px ${colors.primary.light}`,
  },
  error: {
    borderColor: colors.status.error,
    boxShadow: `0 0 0 2px ${colors.status.error}20`,
  },
};

export const TABLE_STYLES = {
  header: {
    backgroundColor: colors.background.subtle,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  row: {
    border: `1px solid ${colors.border.light}`,
    borderLeft: 'none',
    borderRight: 'none',
  },
  rowHover: {
    backgroundColor: colors.background.selected,
  },
  cell: {
    padding: spacing.md,
  },
};

export const theme = {
  colors,
  spacing,
  shadows,
  typography,
  transitions,
  borderRadius,
  components: {
    card: CARD_STYLES,
    button: BUTTON_STYLES,
    input: INPUT_STYLES,
    table: TABLE_STYLES,
  },
};

export default theme;