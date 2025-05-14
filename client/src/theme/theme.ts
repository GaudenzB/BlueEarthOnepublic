/**
 * BlueEarth Capital Theme System (Ant Design)
 * 
 * This file defines the theme tokens used throughout the application,
 * configured for Ant Design components and following financial services aesthetics.
 */

// Define our color palette
export const colors = {
  // Primary brand colors
  primary: {
    base: '#0e4a86', // Deep blue for primary brand color
    hover: '#1e63a5', // Slightly lighter blue for hover states
    light: '#f0f7ff', // Very light blue for subtle backgrounds
    dark: '#0a3a68', // Darker blue for active states
  },
  
  // Text colors
  text: {
    primary: '#1e293b', // Dark text for primary content
    secondary: '#64748b', // Secondary text color
    muted: '#94a3b8', // De-emphasized content
    inverse: '#ffffff', // White text for dark backgrounds
  },
  
  // Status colors
  status: {
    success: '#10b981', // Green for success states
    warning: '#f59e0b', // Amber for warning states
    error: '#ef4444', // Red for error states
    info: '#3b82f6', // Blue for informational states
    draft: '#94a3b8', // Grey for draft status
    
    // Additional status colors for more specific states
    active: '#10b981', // Green for active status
    inactive: '#ef4444', // Red for inactive status
    pending: '#f59e0b', // Amber for pending status
    completed: '#10b981', // Green for completed status
    in_review: '#3b82f6', // Blue for review status
    approved: '#10b981', // Green for approved status
    rejected: '#ef4444', // Red for rejected status
  },
  
  // Background colors
  background: {
    page: '#f8fafc', // Light grey for page backgrounds
    card: '#ffffff', // White for card backgrounds
    subtle: '#f1f5f9', // Subtle grey for secondary backgrounds
    selected: '#f0f7ff', // Light blue for selected items
    hover: '#f0f7ff', // Light blue for hover states
  },
  
  // Border colors
  border: {
    light: '#eaecf0', // Light grey for subtle borders
    default: '#d1d5db', // Medium grey for standard borders
    focus: '#0e4a86', // Primary blue for focus states
  },
};

// Define spacing scale
export const spacing = {
  '0': '0',
  '0.5': '0.125rem', // 2px
  '1': '0.25rem',    // 4px
  '1.5': '0.375rem', // 6px
  '2': '0.5rem',     // 8px
  '2.5': '0.625rem', // 10px
  '3': '0.75rem',    // 12px
  '3.5': '0.875rem', // 14px
  '4': '1rem',       // 16px
  '5': '1.25rem',    // 20px
  '6': '1.5rem',     // 24px
  '7': '1.75rem',    // 28px
  '8': '2rem',       // 32px
  '9': '2.25rem',    // 36px
  '10': '2.5rem',    // 40px
  '11': '2.75rem',   // 44px
  '12': '3rem',      // 48px
  '14': '3.5rem',    // 56px
  '16': '4rem',      // 64px
  '20': '5rem',      // 80px
  '24': '6rem',      // 96px
  '28': '7rem',      // 112px
  '32': '8rem',      // 128px
  '36': '9rem',      // 144px
  '40': '10rem',     // 160px
  '44': '11rem',     // 176px
  '48': '12rem',     // 192px
  '52': '13rem',     // 208px
  '56': '14rem',     // 224px
  '60': '15rem',     // 240px
  '64': '16rem',     // 256px
  '72': '18rem',     // 288px
  '80': '20rem',     // 320px
  '96': '24rem',     // 384px
  
  // Semantic aliases
  xs: '0.5rem',      // 8px
  sm: '0.75rem',     // 12px
  md: '1rem',        // 16px
  lg: '1.5rem',      // 24px
  xl: '2rem',        // 32px
  '2xl': '2.5rem',   // 40px
  '3xl': '3rem',     // 48px
};

// Typography system
export const typography = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  fontSizes: {
    xs: '0.75rem',     // 12px
    sm: '0.813rem',    // 13px
    md: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Box shadows
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// Border radius
export const borderRadius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
};

// Transitions
export const transitions = {
  fast: 'all 0.15s ease-in-out',
  normal: 'all 0.25s ease-in-out',
  slow: 'all 0.4s ease-in-out',
};

// Component-specific styles
const CARD_STYLES = {
  borderRadius: borderRadius.lg,
  boxShadow: shadows.sm,
  background: colors.background.card,
  border: `1px solid ${colors.border.light}`,
  padding: spacing.md,
};

const BUTTON_STYLES = {
  height: '40px',
  padding: '0 16px',
  borderRadius: borderRadius.md,
  fontWeight: typography.fontWeights.medium,
  transition: transitions.normal,
};

const INPUT_STYLES = {
  height: '40px',
  padding: '0 12px',
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border.default}`,
  background: colors.background.card,
};

const TABLE_STYLES = {
  headerBackground: colors.background.subtle,
  rowHoverBackground: colors.background.hover,
  borderColor: colors.border.light,
  padding: spacing.md,
};

// Export combined theme
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