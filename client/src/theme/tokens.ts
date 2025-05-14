/**
 * Design System Tokens
 * 
 * This file contains all design tokens used throughout the application.
 * Tokens are organized by category (colors, typography, spacing, etc.)
 * and are used to maintain a consistent visual language.
 */

/**
 * Color tokens
 */
const colors = {
  /**
   * Brand colors
   */
  brand: {
    /**
     * Primary brand color - used for primary actions, key UI elements
     */
    primary: '#0A66C2',
    
    /**
     * Lighter version of primary for backgrounds, hover states
     */
    primaryLight: '#E8F1FA',
    
    /**
     * Darker version of primary for active states, borders
     */
    primaryDark: '#004182',
    
    /**
     * Secondary brand color - used for secondary actions
     */
    secondary: '#2E3B55'
  },
  
  /**
   * Semantic colors - convey meaning
   */
  semantic: {
    /**
     * Success color - positive actions, confirmations
     */
    success: '#10B981',
    
    /**
     * Warning color - alerts, requires attention
     */
    warning: '#F59E0B',
    
    /**
     * Error color - failures, destructive actions
     */
    error: '#EF4444',
    
    /**
     * Info color - neutral information, guidance
     */
    info: '#3B82F6'
  },
  
  /**
   * Neutral colors for text, backgrounds, borders
   */
  neutral: {
    '50': '#F9FAFB',
    '100': '#F3F4F6',
    '200': '#E5E7EB',
    '300': '#D1D5DB',
    '400': '#9CA3AF',
    '500': '#6B7280',
    '600': '#4B5563',
    '700': '#374151',
    '800': '#1F2937',
    '900': '#111827'
  },
  
  /**
   * Extended palette for advanced UI needs
   */
  blue: {
    '50': '#EFF6FF',
    '100': '#DBEAFE',
    '200': '#BFDBFE',
    '300': '#93C5FD',
    '400': '#60A5FA',
    '500': '#3B82F6',
    '600': '#2563EB',
    '700': '#1D4ED8',
    '800': '#1E40AF',
    '900': '#1E3A8A'
  },
  
  green: {
    '50': '#ECFDF5',
    '100': '#D1FAE5',
    '200': '#A7F3D0',
    '300': '#6EE7B7',
    '400': '#34D399',
    '500': '#10B981',
    '600': '#059669',
    '700': '#047857',
    '800': '#065F46',
    '900': '#064E3B'
  },
  
  red: {
    '50': '#FEF2F2',
    '100': '#FEE2E2',
    '200': '#FECACA',
    '300': '#FCA5A5',
    '400': '#F87171',
    '500': '#EF4444',
    '600': '#DC2626',
    '700': '#B91C1C',
    '800': '#991B1B',
    '900': '#7F1D1D'
  },
  
  amber: {
    '50': '#FFFBEB',
    '100': '#FEF3C7',
    '200': '#FDE68A',
    '300': '#FCD34D',
    '400': '#FBBF24',
    '500': '#F59E0B',
    '600': '#D97706',
    '700': '#B45309',
    '800': '#92400E',
    '900': '#78350F'
  },
  
  purple: {
    '50': '#F5F3FF',
    '100': '#EDE9FE',
    '200': '#DDD6FE',
    '300': '#C4B5FD',
    '400': '#A78BFA',
    '500': '#8B5CF6',
    '600': '#7C3AED',
    '700': '#6D28D9',
    '800': '#5B21B6',
    '900': '#4C1D95'
  },
  
  orange: {
    '50': '#FFF7ED',
    '100': '#FFEDD5',
    '200': '#FED7AA',
    '300': '#FDBA74',
    '400': '#FB923C',
    '500': '#F97316',
    '600': '#EA580C',
    '700': '#C2410C',
    '800': '#9A3412',
    '900': '#7C2D12'
  }
};

/**
 * Typography tokens
 */
const typography = {
  /**
   * Font families
   */
  fontFamily: {
    /**
     * Primary font used for most text
     */
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    
    /**
     * Monospace font for code, technical content
     */
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  },
  
  /**
   * Font weights
   */
  fontWeight: {
    /**
     * Light text - 300
     */
    light: 300,
    
    /**
     * Normal text - 400
     */
    normal: 400,
    
    /**
     * Medium text - 500
     */
    medium: 500,
    
    /**
     * Semi-bold text - 600
     */
    semibold: 600,
    
    /**
     * Bold text - 700
     */
    bold: 700
  },
  
  /**
   * Font sizes (in pixels)
   */
  fontSize: {
    /**
     * Extra small text - 10px
     */
    xs: '10px',
    
    /**
     * Small text - 12px
     */
    sm: '12px',
    
    /**
     * Base text - 14px
     */
    base: '14px',
    
    /**
     * Medium text - 16px
     */
    md: '16px',
    
    /**
     * Large text - 18px
     */
    lg: '18px',
    
    /**
     * Extra large text - 20px
     */
    xl: '20px',
    
    /**
     * 2XL text - 24px
     */
    '2xl': '24px',
    
    /**
     * 3XL text - 30px
     */
    '3xl': '30px',
    
    /**
     * 4XL text - 36px
     */
    '4xl': '36px',
    
    /**
     * 5XL text - 48px
     */
    '5xl': '48px'
  },
  
  /**
   * Line heights
   */
  lineHeight: {
    /**
     * Tight line height - 1
     * Used for headings and short text
     */
    tight: 1,
    
    /**
     * Snug line height - 1.25
     */
    snug: 1.25,
    
    /**
     * Normal line height - 1.5
     * Used for most text
     */
    normal: 1.5,
    
    /**
     * Relaxed line height - 1.625
     */
    relaxed: 1.625,
    
    /**
     * Loose line height - 2
     * Used for readable long-form content
     */
    loose: 2
  },
  
  /**
   * Letter spacing
   */
  letterSpacing: {
    /**
     * Tighter letter spacing - -0.05em
     */
    tighter: '-0.05em',
    
    /**
     * Tight letter spacing - -0.025em
     */
    tight: '-0.025em',
    
    /**
     * Normal letter spacing - 0
     */
    normal: '0',
    
    /**
     * Wide letter spacing - 0.025em
     */
    wide: '0.025em',
    
    /**
     * Wider letter spacing - 0.05em
     */
    wider: '0.05em',
    
    /**
     * Widest letter spacing - 0.1em
     * Used for all-caps text and decorative purposes
     */
    widest: '0.1em'
  }
};

/**
 * Spacing tokens (in pixels)
 * Based on a 4px grid
 */
const spacing = {
  '0': '0',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
  '32': '128px',
  '40': '160px',
  '48': '192px',
  '56': '224px',
  '64': '256px'
};

/**
 * Border radii (in pixels)
 */
const radii = {
  /**
   * No radius (square corners)
   */
  none: '0',
  
  /**
   * Small radius - 2px
   */
  sm: '2px',
  
  /**
   * Default radius - 4px
   */
  md: '4px',
  
  /**
   * Large radius - 8px
   */
  lg: '8px',
  
  /**
   * Extra large radius - 12px
   */
  xl: '12px',
  
  /**
   * 2XL radius - 16px
   */
  '2xl': '16px',
  
  /**
   * Full radius (circle/pill)
   */
  full: '9999px'
};

/**
 * Box shadows
 */
const shadows = {
  /**
   * No shadow
   */
  none: 'none',
  
  /**
   * Small shadow
   */
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  
  /**
   * Default shadow
   */
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  
  /**
   * Large shadow
   */
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  /**
   * Extra large shadow
   */
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  /**
   * 2XL shadow - for modal/dialogs
   */
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  /**
   * Inner shadow - for pressed states
   */
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
};

/**
 * Z-index values
 */
const zIndices = {
  /**
   * Hidden under content
   */
  hide: -1,
  
  /**
   * Base layer - default content
   */
  base: 0,
  
  /**
   * First layer - above base
   */
  docked: 10,
  
  /**
   * Dropdown layer - for menus, popups
   */
  dropdown: 1000,
  
  /**
   * Sticky layer - for sticky headers/footers
   */
  sticky: 1100,
  
  /**
   * Banner layer - for notifications, announcements
   */
  banner: 1200,
  
  /**
   * Overlay layer - for modals, dialogs
   */
  overlay: 1300,
  
  /**
   * Modal layer - for modal content
   */
  modal: 1400,
  
  /**
   * Popover layer - for popovers, tooltips
   */
  popover: 1500,
  
  /**
   * Skip link layer - for accessibility skip links
   */
  skipLink: 1600,
  
  /**
   * Toast layer - for toast notifications
   */
  toast: 1700,
  
  /**
   * Top layer - always visible, above everything
   */
  top: 9999
};

/**
 * Border widths (in pixels)
 */
const borderWidths = {
  '0': '0',
  '1': '1px',
  '2': '2px',
  '4': '4px',
  '8': '8px'
};

/**
 * Animation durations (in milliseconds)
 */
const durations = {
  '0': '0ms',
  '75': '75ms',
  '100': '100ms',
  '150': '150ms',
  '200': '200ms',
  '300': '300ms',
  '500': '500ms',
  '700': '700ms',
  '1000': '1000ms'
};

/**
 * Animation easing functions
 */
const easings = {
  /**
   * Default easing - smooth acceleration
   */
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  /**
   * Linear easing - constant velocity
   */
  linear: 'linear',
  
  /**
   * In easing - accelerate from zero velocity
   */
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  
  /**
   * Out easing - decelerate to zero velocity
   */
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  
  /**
   * In-out easing - accelerate, then decelerate
   */
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
};

/**
 * Media queries for responsive design
 */
const breakpoints = {
  /**
   * Small screens - mobile phones
   */
  sm: '640px',
  
  /**
   * Medium screens - tablets
   */
  md: '768px',
  
  /**
   * Large screens - laptops
   */
  lg: '1024px',
  
  /**
   * Extra large screens - desktops
   */
  xl: '1280px',
  
  /**
   * 2XL screens - large desktops
   */
  '2xl': '1536px'
};

/**
 * Export all design tokens
 */
export const tokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  zIndices,
  borderWidths,
  durations,
  easings,
  breakpoints
};

export default tokens;