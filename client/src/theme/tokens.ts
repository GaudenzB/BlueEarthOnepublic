/**
 * BlueEarth Capital Design System Tokens
 * 
 * This file contains our comprehensive design token system that defines
 * all visual design attributes across the platform. These tokens establish
 * the foundation for our financial services aesthetic, ensuring a cohesive,
 * professional, and trustworthy experience throughout the application.
 * 
 * Each token category is organized hierarchically with meaningful names that 
 * express their intended purpose. All component styling should reference these
 * tokens instead of using hard-coded values.
 * 
 * The tokens are consumed by:
 * 1. The Ant Design theme configuration (ant-theme.ts)
 * 2. Custom component styling
 * 3. Utility classes and inline styles
 * 
 * USAGE GUIDELINES:
 * - Always use tokens instead of hard-coded values
 * - Prefer semantic tokens over direct color values
 * - Maintain the financial services aesthetic by using appropriate
 *   colors, spacing, and typography combinations
 */

export const tokens = {
  /**
   * Color palette
   * 
   * Our color system is designed to reflect a trustworthy, professional
   * financial services aesthetic while maintaining excellent readability
   * and accessibility standards.
   */
  colors: {
    // Brand colors - primary financial blue palette
    brand: {
      primary: '#1a3f6d',      // Deep navy blue - primary brand color
      primaryLight: '#3468a5',  // Lighter version for hover states
      primaryDark: '#102a4c',   // Darker version for active states
      secondary: '#00a3b4',     // Teal - secondary accent color
      tertiary: '#5d7994',      // Slate blue - tertiary brand color
      quaternary: '#bfd1e5',    // Light blue - subtle accents
      gold: '#d4af37',          // Financial gold - for premium features
      goldLight: '#e6d190',     // Light gold for hover states
      goldDark: '#9e7e1a',      // Dark gold for active states
    },
    
    // Semantic colors for states, feedback, and notifications
    semantic: {
      success: '#4caf50',       // Green for success states
      warning: '#ff9800',       // Orange for warning states
      error: '#f44336',         // Red for error states
      info: '#2196f3',          // Blue for informational states
      pending: '#8e44ad',       // Purple for pending states
      locked: '#34495e',        // Dark slate for locked items
      verified: '#27ae60',      // Emerald green for verified items
      premium: '#d4af37',       // Gold for premium features
    },
    
    // Neutral colors for text, backgrounds, and borders
    // Slightly cooler grays for a more professional look
    neutral: {
      '50': '#f8fafc',          // Near-white for backgrounds
      '100': '#f1f5f9',         // Light gray for alternating sections
      '200': '#e2e8f0',         // Light gray for borders
      '300': '#cbd5e1',         // Medium-light gray for separators
      '400': '#94a3b8',         // Medium gray for disabled elements
      '500': '#64748b',         // Medium gray for placeholder text
      '600': '#475569',         // Dark gray for secondary text
      '700': '#334155',         // Dark gray for body text
      '800': '#1e293b',         // Very dark gray for primary text
      '900': '#0f172a',         // Near-black for headings
    },
    
    // Chart and data visualization colors
    data: {
      blue: '#2196f3',
      green: '#4caf50',
      red: '#f44336',
      orange: '#ff9800',
      purple: '#9c27b0',
      teal: '#009688',
      indigo: '#3f51b5',
      lime: '#cddc39',
      brown: '#795548',
      blueGray: '#607d8b',
    },
    
    // Extended color palette with light, default, and dark variants
    extended: {
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
      teal: {
        light: '#e0f2f1',
        default: '#009688',
        dark: '#00695c',
      },
      purple: {
        light: '#f3e5f5',
        default: '#9c27b0',
        dark: '#6a1b9a',
      },
      indigo: {
        light: '#e8eaf6',
        default: '#3f51b5',
        dark: '#283593',
      },
    },
    
    // Status colors are defined in the 'status' object below to avoid duplication
    
    // Status colors with light, default, and dark variants
    status: {
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
      pending: {
        light: '#f3e5f5',
        default: '#8e44ad',
        dark: '#6a1b9a',
      },
      verified: {
        light: '#e0f2f1',
        default: '#27ae60',
        dark: '#00695c',
      },
    },
    
    // Financial-specific colors
    financial: {
      profit: '#27ae60',        // Green for positive values
      loss: '#e74c3c',          // Red for negative values
      neutral: '#3498db',       // Blue for neutral values
      premium: '#d4af37',       // Gold for premium indicators
      secure: '#2c3e50',        // Dark blue for security features
      transaction: '#16a085',   // Teal for transaction success
      alert: '#d35400',         // Orange for financial alerts
    },
  },
  
  /**
   * Spacing scale (in pixels)
   * 
   * Our spacing follows a consistent 4px grid system to ensure
   * proportional layouts throughout the application. This spacing
   * scale is particularly important for maintaining the precise,
   * orderly appearance expected in financial applications.
   */
  spacing: {
    '0': '0',
    '0.5': '2px',   // 2px - Extra tiny (for fine details)
    '1': '4px',     // 4px - Tiny (base unit)
    '2': '8px',     // 8px - Extra small (2× base)
    '3': '12px',    // 12px - Small (3× base)
    '4': '16px',    // 16px - Default (4× base)
    '5': '20px',    // 20px - Medium-small (5× base)
    '6': '24px',    // 24px - Medium (6× base)
    '7': '32px',    // 32px - Medium-large (8× base)
    '8': '40px',    // 40px - Large (10× base)
    '9': '48px',    // 48px - Extra large (12× base)
    '10': '64px',   // 64px - 2× large (16× base)
    '11': '80px',   // 80px - 3× large (20× base)
    '12': '96px',   // 96px - 4× large (24× base)
    '13': '128px',  // 128px - 5× large (32× base)
    '14': '160px',  // 160px - 6× large (40× base)
    '15': '192px',  // 192px - 7× large (48× base)
  },
  
  /**
   * Layout system
   * 
   * Layout tokens for consistent container widths, maximum widths,
   * and other structural elements across the application.
   */
  layout: {
    // Max widths for different container types
    maxWidth: {
      xs: '320px',     // Very narrow containers (mobile cards)
      sm: '540px',     // Narrow containers (modals, small forms)
      md: '720px',     // Medium containers (dialogs, medium forms)
      lg: '960px',     // Medium-large containers (panels)
      xl: '1140px',    // Large containers (main content areas)
      '2xl': '1320px', // Extra large containers (full page layouts)
      '3xl': '1540px', // Maximum width for ultra-wide screens
      full: '100%',    // Full width of its container
    },
    
    // Section padding scale (for container sections)
    sectionPadding: {
      xs: '16px',     // Mobile minimum padding
      sm: '24px',     // Small section padding
      md: '32px',     // Medium section padding
      lg: '48px',     // Large section padding
      xl: '64px',     // Extra large section padding
    },
    
    // Grid gaps for various breakpoints
    gridGap: {
      xs: '4px',      // Tightest grid spacing
      sm: '8px',      // Small grid spacing
      md: '16px',     // Medium grid spacing
      lg: '24px',     // Large grid spacing
      xl: '32px',     // Extra large grid spacing
    },
    
    // Aspect ratios for image containers
    aspectRatio: {
      square: '1/1',     // 1:1 Square
      video: '16/9',     // 16:9 Widescreen
      portrait: '3/4',   // 3:4 Portrait
      landscape: '4/3',  // 4:3 Landscape
      wide: '21/9',      // 21:9 Ultrawide
      auto: 'auto',      // Automatic sizing
    }
  },
  
  /**
   * Typography system
   * 
   * Our typography system is designed to create a clear hierarchy
   * and optimize readability, which is essential for financial
   * information and data-heavy interfaces.
   */
  typography: {
    // Font families
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      mono: "'SF Mono', 'Roboto Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      display: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", // For display text
    },
    
    // Font weights
    fontWeight: {
      light: 300,       // Light text (use sparingly)
      regular: 400,     // Regular body text
      medium: 500,      // Medium emphasis
      semibold: 600,    // Semi-bold (for subheadings)
      bold: 700,        // Bold (for headings)
      extrabold: 800,   // Extra bold (for major headings)
    },
    
    // Font sizes (in pixels)
    fontSize: {
      xs: '12px',      // Extra small (labels, captions)
      sm: '14px',      // Small (secondary text)
      base: '16px',    // Base (body text)
      lg: '18px',      // Large (emphasized body)
      xl: '20px',      // Extra large (small headings)
      '2xl': '24px',   // 2x large (h3, subheadings)
      '3xl': '30px',   // 3x large (h2, section headings)
      '4xl': '36px',   // 4x large (h1, page titles)
      '5xl': '48px',   // 5x large (hero titles)
      '6xl': '60px',   // 6x large (display headings)
      '7xl': '72px',   // 7x large (jumbo displays)
    },
    
    // Line heights
    lineHeight: {
      none: 1,          // No line height (use for display text only)
      tight: 1.2,       // Tight (headlines, display text)
      snug: 1.35,       // Snug (headings)
      normal: 1.5,      // Normal (body text)
      relaxed: 1.625,   // Relaxed (large body text)
      loose: 1.75,      // Loose (for improved readability)
      paragraph: 1.8,   // For long-form content
    },
    
    // Letter spacing
    letterSpacing: {
      tightest: '-0.05em',  // Very tight (display text)
      tighter: '-0.025em',  // Tighter (headlines)
      tight: '-0.01em',     // Slightly tight (headings)
      normal: '0',          // Normal (body text)
      wide: '0.01em',       // Slightly wide (all caps text)
      wider: '0.025em',     // Wider (small caps)
      widest: '0.05em',     // Widest (uppercase labels)
      caps: '0.1em',        // For all-caps text
    },
    
    // Paragraph spacing
    paragraphSpacing: {
      sm: '0.75em',    // Small paragraph spacing
      md: '1em',       // Medium paragraph spacing
      lg: '1.5em',     // Large paragraph spacing
      xl: '2em',       // Extra large paragraph spacing
    },
    
    // Text truncation
    truncate: {
      single: {         // Single line truncation
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      multi: (lines: number) => ({  // Multi-line truncation
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical',
      }),
    },
  },
  
  /**
   * Border radius values
   * 
   * Our border radius system adds appropriate rounding to UI elements
   * while maintaining the professional, structured appearance expected
   * in financial applications.
   */
  radii: {
    none: '0',          // No border radius (sharp corners)
    xs: '2px',          // Extra small (subtle rounding)
    sm: '4px',          // Small (buttons, inputs)
    md: '6px',          // Medium (cards, modals)
    lg: '8px',          // Large (large cards, dialogs)
    xl: '12px',         // Extra large (feature sections)
    '2xl': '16px',      // 2x large (prominent UI elements)
    '3xl': '24px',      // 3x large (hero sections)
    full: '9999px',     // Fully rounded (avatars, badges)
  },
  
  /**
   * Border width values
   */
  borderWidth: {
    '0': '0',          // No border
    '1': '1px',        // Thin border (default)
    '2': '2px',        // Medium border (emphasis)
    '3': '3px',        // Thick border (strong emphasis)
    '4': '4px',        // Extra thick border (visual anchors)
    '8': '8px',        // Ultra thick (decorative elements)
  },
  
  /**
   * Border styles
   */
  borderStyle: {
    solid: 'solid',       // Solid line
    dashed: 'dashed',     // Dashed line
    dotted: 'dotted',     // Dotted line
    double: 'double',     // Double line
    none: 'none',         // No border
  },
  
  /**
   * Box shadow values
   * 
   * Our shadow system creates subtle depth cues using
   * professional, refined elevation effects appropriate
   * for financial interfaces.
   */
  boxShadow: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',                                                      // Extra small (subtle lift)
    sm: '0 1px 3px 0 rgba(15, 23, 42, 0.1), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',                // Small (buttons, cards)
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',            // Medium (dropdowns, popovers)
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.07), 0 4px 6px -4px rgba(15, 23, 42, 0.05)',          // Large (modals, dialogs)
    xl: '0 20px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',         // Extra large (sidebars)
    '2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.1)',                                              // 2x large (featured elements)
    inner: 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.06)',                                             // Inner shadow (pressed states)
    outline: '0 0 0 3px rgba(26, 63, 109, 0.4)',                                                   // Focus outline (accessibility)
    // Financial-specific shadows
    card: '0 2px 5px 0 rgba(15, 23, 42, 0.08)',                                                    // For financial cards
    floating: '0 8px 16px rgba(15, 23, 42, 0.06), 0 3px 6px rgba(15, 23, 42, 0.04)',               // For floating UI elements
    insetCard: 'inset 0 2px 5px 0 rgba(15, 23, 42, 0.03), 0 1px 1px 0 rgba(15, 23, 42, 0.05)',     // Inset card effect
    highElevation: '0 20px 30px -10px rgba(15, 23, 42, 0.07), 0 10px 20px -15px rgba(15, 23, 42, 0.04)',  // High elevation elements
  },
  
  /**
   * Z-index scale
   * 
   * Consistent z-index values to manage stacking contexts
   * across the application.
   */
  zIndex: {
    '0': 0,            // Base level
    '10': 10,          // Background elements
    '20': 20,          // Default UI elements
    '30': 30,          // Positioned UI elements
    '40': 40,          // Sticky elements
    '50': 50,          // Dropdown menus
    '60': 60,          // Sticky headers/footers
    '70': 70,          // Tooltips
    '80': 80,          // Popovers
    '90': 90,          // Modals/dialogs
    '100': 100,        // Notifications/toasts
    'overlay': 1000,   // Overlay layers
    'modal': 1100,     // Modal containers
    'toast': 1200,     // Toasts/alerts
    'tooltip': 1300,   // Tooltips
    'popover': 1400,   // Popovers
    'max': 9999,       // Maximum z-index
    auto: 'auto',      // Auto z-index
  },
  
  /**
   * Breakpoints for responsive design
   * 
   * Screen size breakpoints used for responsive layouts
   * and component behaviors.
   */
  breakpoints: {
    xs: '480px',       // Extra small devices (phones)
    sm: '576px',       // Small devices (large phones)
    md: '768px',       // Medium devices (tablets)
    lg: '992px',       // Large devices (laptops)
    xl: '1200px',      // Extra large devices (desktops)
    '2xl': '1400px',   // 2x large devices (large desktops)
    '3xl': '1600px',   // 3x large devices (ultra-wide desktops)
    '4xl': '1920px',   // 4x large devices (full HD)
  },
  
  /**
   * Component size presets
   * 
   * Standard size configurations for common UI components,
   * ensuring visual consistency across the interface.
   */
  componentSize: {
    // Button sizes
    button: {
      xs: {
        fontSize: '12px',
        padding: '2px 8px',
        height: '24px',
      },
      sm: {
        fontSize: '14px',
        padding: '4px 12px',
        height: '32px',
      },
      md: {
        fontSize: '16px',
        padding: '6px 16px',
        height: '40px',
      },
      lg: {
        fontSize: '18px',
        padding: '8px 20px',
        height: '48px',
      },
    },
    
    // Input sizes
    input: {
      sm: {
        fontSize: '14px',
        padding: '6px 12px',
        height: '32px',
      },
      md: {
        fontSize: '16px',
        padding: '8px 16px',
        height: '40px',
      },
      lg: {
        fontSize: '18px',
        padding: '10px 20px',
        height: '48px',
      },
    },
    
    // Icon sizes
    icon: {
      xs: '12px',     // Extra small icons
      sm: '16px',     // Small icons
      md: '20px',     // Medium icons
      lg: '24px',     // Large icons
      xl: '32px',     // Extra large icons
    },
    
    // Avatar sizes
    avatar: {
      xs: '24px',     // Extra small avatars
      sm: '32px',     // Small avatars
      md: '40px',     // Medium avatars
      lg: '48px',     // Large avatars
      xl: '64px',     // Extra large avatars
      '2xl': '96px',  // 2x large avatars
    },
  },
  
  /**
   * Animation system
   * 
   * Timing and easing functions for subtle, professional animations
   * that enhance the user experience without feeling flashy.
   */
  animation: {
    // Duration values
    duration: {
      instant: '0ms',     // No animation
      fastest: '100ms',   // Ultra fast animations
      faster: '150ms',    // Very fast animations
      fast: '200ms',      // Fast animations
      normal: '300ms',    // Standard animations
      slow: '400ms',      // Slow animations
      slower: '500ms',    // Very slow animations
      slowest: '700ms',   // Ultra slow animations
      pageTransition: '220ms', // Page transitions
      modalEnter: '250ms',     // Modal enter animation
      modalExit: '200ms',      // Modal exit animation
      tooltipEnter: '150ms',   // Tooltip enter animation
      tooltipExit: '100ms',    // Tooltip exit animation
    },
    
    // Easing functions
    easing: {
      // Standard easing
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      
      // Custom easing curves
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',       // Material standard
      accelerate: 'cubic-bezier(0.4, 0, 1, 1)',       // Swift acceleration
      decelerate: 'cubic-bezier(0, 0, 0.2, 1)',       // Gentle deceleration
      smooth: 'cubic-bezier(0.4, 0.2, 0.2, 1)',       // Smooth transitions
      precise: 'cubic-bezier(0.4, 0.0, 0.6, 1)',      // Precise movements
      emphasized: 'cubic-bezier(0.2, 0.0, 0, 1.0)',   // Emphasized movements
      swift: 'cubic-bezier(0.55, 0, 0.1, 1)',         // Swift, natural motion
    },
    
    // Common animation presets
    presets: {
      fadeIn: 'fade 300ms ease-out',
      fadeOut: 'fade 200ms ease-in',
      slideIn: 'slide 250ms ease-out',
      slideOut: 'slide 200ms ease-in',
      scaleIn: 'scale 250ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      scaleOut: 'scale 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    },
  },
  
  /**
   * Opacity values
   * 
   * Standardized opacity levels for creating transparency effects
   * while maintaining consistency across the interface.
   */
  opacity: {
    '0': '0',
    '5': '0.05',
    '10': '0.1',
    '15': '0.15',
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
    
    // Semantic opacity presets
    disabled: '0.5',      // For disabled elements
    hover: '0.8',         // Hover state overlay
    active: '0.7',        // Active state overlay
    focus: '0.9',         // Focus state
    overlay: '0.5',       // Modal overlay
    watermark: '0.05',    // Watermarks
  },
  
  /**
   * Financial UI-specific tokens
   * 
   * Special tokens specifically designed for financial interfaces
   * such as data tables, charts, and financial indicators.
   */
  financial: {
    // Data table density presets
    tableRowHeight: {
      compact: '36px',    // Compact tables (data dense)
      default: '44px',    // Standard tables
      relaxed: '56px',    // Relaxed tables (improved readability)
    },
    
    // Chart color schemes
    chartColors: {
      primary: [
        '#1a3f6d', '#3468a5', '#5d7994', '#00a3b4', '#27ae60',
        '#3498db', '#34495e', '#d4af37', '#8e44ad', '#16a085',
      ],
      sequential: [
        '#1a3f6d', '#235087', '#2d62a0', '#3773ba', '#4183d3', '#4c94ed'
      ],
      diverging: [
        '#e74c3c', '#f39c12', '#f1c40f', '#dddddd', '#3498db', '#2980b9', '#1a3f6d'
      ],
    },
    
    // Financial data visualization
    dataVisualization: {
      positive: '#27ae60',        // Positive values/growth
      negative: '#e74c3c',        // Negative values/loss
      neutral: '#3498db',         // Neutral values
      baseline: '#7f8c8d',        // Baseline/reference
      forecast: '#9b59b6',        // Forecast data
      historical: '#34495e',      // Historical data
      alert: '#e67e22',           // Alert threshold
      target: '#2ecc71',          // Target indicator
    },
  },
};

export default tokens;