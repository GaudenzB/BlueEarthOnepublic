/**
 * Design Tokens System for BlueEarth Capital
 * 
 * This file defines the core design tokens used throughout the application,
 * following a financial services aesthetic with a focus on trust, professionalism,
 * and clarity.
 */

/**
 * Color System
 * Organized by semantic purpose rather than just color names
 */
export const colors = {
  brand: {
    primary: '#0e4a86', // Deep blue - main brand color
    primaryLight: '#1e63a5', // Lighter blue for hover states
    primaryLighter: '#f0f7ff', // Very light blue for backgrounds
    primaryDark: '#0a3a68', // Darker blue for active states
    secondary: '#1e63a5', // Secondary brand color
    accent: '#3b82f6', // Accent color for highlights
  },
  neutral: {
    100: '#ffffff', // White
    200: '#f9fafc', // Nearly white
    300: '#f1f5f9', // Very light gray
    400: '#e2e8f0', // Light gray
    500: '#cbd5e1', // Medium gray
    600: '#94a3b8', // Medium-dark gray
    700: '#64748b', // Dark gray
    800: '#475569', // Very dark gray
    900: '#1e293b', // Nearly black
  },
  semantic: {
    success: '#10b981', // Green for success, approval, completion
    warning: '#f59e0b', // Amber for warnings, pending states
    error: '#ef4444', // Red for errors, rejections, critical states
    info: '#3b82f6', // Blue for information, neutral notifications
    draft: '#94a3b8', // Muted color for draft/inactive states
  },
  charts: {
    blue: ['#0e4a86', '#1e63a5', '#3b82f6', '#93c5fd', '#dbeafe'],
    green: ['#065f46', '#10b981', '#34d399', '#6ee7b7', '#d1fae5'],
    amber: ['#92400e', '#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7'],
    red: ['#991b1b', '#ef4444', '#f87171', '#fca5a5', '#fee2e2'],
    purple: ['#5b21b6', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ede9fe'],
  }
};

/**
 * Spacing System
 * Based on a 4px grid to ensure consistent spacing throughout the application
 */
export const spacing = {
  // Core spacing units (in px)
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
  40: '160px',
  
  // Semantic aliases
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '40px',
  '3xl': '48px',
  '4xl': '64px',
};

/**
 * Typography System
 * Standardized typography settings for consistent textual presentation
 */
export const typography = {
  // Font families
  fontFamily: {
    base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  
  // Font sizes (in px)
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
  },
  
  // Font weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

/**
 * Border radii
 * Standardized corner roundness values
 */
export const radii = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  pill: '9999px',
};

/**
 * Shadow system
 * Standardized elevation values
 */
export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

/**
 * Transition presets
 * Standardized animation settings
 */
export const transitions = {
  default: 'all 250ms ease',
  fast: 'all 150ms ease',
  slow: 'all 350ms ease',
  
  // Easing functions
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
};

/**
 * Z-index scale
 * Standardized stacking context values
 */
export const zIndices = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
};

/**
 * Breakpoints
 * Standardized screen size thresholds (in px)
 */
export const breakpoints = {
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  '2xl': '1600px',
};

// Combined tokens export
export const tokens = {
  colors,
  spacing,
  typography,
  radii,
  shadows,
  transitions,
  zIndices,
  breakpoints,
};

export default tokens;