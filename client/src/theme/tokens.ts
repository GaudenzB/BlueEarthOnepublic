/**
 * Design System Tokens
 * 
 * This file contains standardized values for colors, spacing, typography, and other
 * design elements to ensure consistent styling across the application.
 * 
 * These tokens serve as the foundation for the Ant Design theme configuration
 * and can be imported directly by components for custom styling.
 */

export const tokens = {
  /**
   * Color palette
   */
  colors: {
    // Brand colors
    brand: {
      primary: '#1a3f6d',      // Deep blue - primary brand color
      primaryLight: '#3468a5',  // Lighter version for hover states
      primaryDark: '#102a4c',  // Darker version for active states
      secondary: '#00a3b4',    // Teal - secondary brand color
    },
    
    // Semantic colors for states and notifications
    semantic: {
      success: '#4caf50',     // Green for success states
      warning: '#ff9800',     // Orange for warning states
      error: '#f44336',      // Red for error states
      info: '#2196f3',       // Blue for informational states
    },
    
    // Neutral colors for text, backgrounds, and borders
    neutral: {
      '50': '#fafafa',       // Near-white for backgrounds
      '100': '#f5f5f5',      // Light gray for alternating sections
      '200': '#eeeeee',      // Light gray for borders
      '300': '#e0e0e0',      // Medium-light gray for separators
      '400': '#bdbdbd',      // Medium gray for disabled elements
      '500': '#9e9e9e',      // Medium gray for placeholder text
      '600': '#757575',      // Dark gray for secondary text
      '700': '#616161',      // Dark gray for body text
      '800': '#424242',      // Very dark gray for primary text
      '900': '#212121',      // Near-black for headings
    },
    
    // Extended color palette for data visualization and UI elements
    blue: {
      light: '#e3f2fd',
      default: '#2196f3',
      dark: '#1565c0',
    },
    green: {
      light: '#e8f5e9',
      default: '#4caf50',
      dark: '#2e7d32',
    },
    red: {
      light: '#ffebee',
      default: '#f44336',
      dark: '#c62828',
    },
    yellow: {
      light: '#fffde7',
      default: '#ffeb3b',
      dark: '#f9a825',
    },
    orange: {
      light: '#fff3e0',
      default: '#ff9800',
      dark: '#ef6c00',
    },
    
    // Status colors (using semantic colors)
    success: {
      light: '#e8f5e9',
      default: '#4caf50',
      dark: '#2e7d32',
    },
    warning: {
      light: '#fff8e1',
      default: '#ff9800',
      dark: '#ef6c00',
    },
    error: {
      light: '#ffebee',
      default: '#f44336',
      dark: '#c62828',
    },
    info: {
      light: '#e3f2fd',
      default: '#2196f3',
      dark: '#1565c0',
    },
  },
  
  /**
   * Spacing scale (in pixels)
   * Used for margins, paddings, and gaps
   */
  spacing: {
    '0': '0',
    '0.5': '2px',   // 2px - Extra tiny
    '1': '4px',     // 4px - Tiny
    '2': '8px',     // 8px - Extra small
    '3': '12px',    // 12px - Small
    '4': '16px',    // 16px - Default
    '5': '24px',    // 24px - Medium
    '6': '32px',    // 32px - Large
    '7': '40px',    // 40px - Extra large
    '8': '48px',    // 48px - 2x large
    '9': '64px',    // 64px - 3x large
    '10': '80px',   // 80px - 4x large
    '11': '96px',   // 96px - 5x large
    '12': '128px',  // 128px - 6x large
  },
  
  /**
   * Typography settings
   */
  typography: {
    // Font families
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      mono: "'SF Mono', 'Roboto Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
    
    // Font weights
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    // Font sizes (in pixels)
    fontSize: {
      xs: '12px',     // Extra small text
      sm: '14px',     // Small text
      base: '16px',   // Body text
      lg: '18px',     // Large text
      xl: '20px',     // Extra large text
      '2xl': '24px',  // 2x large text
      '3xl': '30px',  // 3x large text
      '4xl': '36px',  // 4x large text
      '5xl': '48px',  // 5x large text
    },
    
    // Line heights
    lineHeight: {
      none: 1,        // No line height
      tight: 1.25,    // Tight line height
      snug: 1.375,    // Slightly loose line height
      normal: 1.5,    // Normal line height
      relaxed: 1.625, // Relaxed line height
      loose: 2,       // Loose line height
    },
    
    // Letter spacing
    letterSpacing: {
      tighter: '-0.05em', // Tighter tracking
      tight: '-0.025em',  // Tight tracking
      normal: '0',        // Normal tracking
      wide: '0.025em',    // Wide tracking
      wider: '0.05em',    // Wider tracking
      widest: '0.1em',    // Widest tracking
    },
  },
  
  /**
   * Border radius values
   */
  borderRadius: {
    none: '0',
    xs: '2px',      // Extra small
    sm: '4px',      // Small
    md: '6px',      // Medium
    lg: '8px',      // Large
    xl: '12px',     // Extra large
    '2xl': '16px',  // 2x large
    '3xl': '24px',  // 3x large
    full: '9999px', // Fully rounded
  },
  
  /**
   * Border width values
   */
  borderWidth: {
    '0': '0',
    '1': '1px',
    '2': '2px',
    '4': '4px',
    '8': '8px',
  },
  
  /**
   * Box shadow values
   */
  boxShadow: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',                                                  // Extra small
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',                 // Small
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',           // Medium
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',         // Large
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',       // Extra large
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',                                        // 2x large
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',                                       // Inner shadow
    outline: '0 0 0 3px rgba(26, 63, 109, 0.5)',                                          // Focus outline
  },
  
  /**
   * Z-index values
   */
  zIndex: {
    '0': 0,
    '10': 10,    // Background elements
    '20': 20,    // Regular elements
    '30': 30,    // Sticky elements
    '40': 40,    // Floating elements
    '50': 50,    // Dropdowns
    '60': 60,    // Sticky headers
    '70': 70,    // Tooltips
    '80': 80,    // Popovers
    '90': 90,    // Modals
    '100': 100,  // Notifications
    auto: 'auto',
  },
  
  /**
   * Breakpoints for responsive design
   */
  breakpoints: {
    xs: '480px',     // Extra small devices
    sm: '576px',     // Small devices
    md: '768px',     // Medium devices
    lg: '992px',     // Large devices
    xl: '1200px',    // Extra large devices
    '2xl': '1600px', // 2x large devices
  },
  
  /**
   * Component size presets
   */
  componentSize: {
    small: {
      fontSize: '12px',
      padding: '4px 8px',
      height: '24px',
    },
    default: {
      fontSize: '14px',
      padding: '8px 12px',
      height: '32px',
    },
    large: {
      fontSize: '16px',
      padding: '12px 16px',
      height: '40px',
    },
  },
  
  /**
   * Animation duration values
   */
  animation: {
    duration: {
      fastest: '100ms',  // Ultra fast animations
      faster: '150ms',   // Very fast animations
      fast: '200ms',     // Fast animations
      normal: '300ms',   // Normal animations
      slow: '400ms',     // Slow animations
      slower: '500ms',   // Very slow animations
      slowest: '800ms',  // Ultra slow animations
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      sharp: 'cubic-bezier(0.4, 0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
  
  /**
   * opacity values
   */
  opacity: {
    '0': '0',
    '5': '0.05',
    '10': '0.1',
    '20': '0.2',
    '25': '0.25',
    '30': '0.3',
    '40': '0.4',
    '50': '0.5',
    '60': '0.6',
    '70': '0.7',
    '75': '0.75',
    '80': '0.8',
    '90': '0.9',
    '95': '0.95',
    '100': '1',
  },
};

export default tokens;