/**
 * Spacing constants for the BlueEarth Capital application
 * 
 * These spacings are used throughout the application for consistent layouts.
 * Use these constants instead of hardcoding spacing values.
 */

/**
 * Base spacing unit (in pixels)
 */
export const BASE_SPACING_UNIT = 4;

/**
 * Spacing scale
 */
export const spacing = {
  // Absolute values (in pixels)
  px: '1px',
  '0': '0',
  '0.5': `${BASE_SPACING_UNIT * 0.125}px`, // 0.5px
  '1': `${BASE_SPACING_UNIT * 0.25}px`,    // 1px
  '1.5': `${BASE_SPACING_UNIT * 0.375}px`, // 1.5px
  '2': `${BASE_SPACING_UNIT * 0.5}px`,     // 2px
  '2.5': `${BASE_SPACING_UNIT * 0.625}px`, // 2.5px
  '3': `${BASE_SPACING_UNIT * 0.75}px`,    // 3px
  '3.5': `${BASE_SPACING_UNIT * 0.875}px`, // 3.5px
  '4': `${BASE_SPACING_UNIT}px`,           // 4px
  '5': `${BASE_SPACING_UNIT * 1.25}px`,    // 5px
  '6': `${BASE_SPACING_UNIT * 1.5}px`,     // 6px
  '7': `${BASE_SPACING_UNIT * 1.75}px`,    // 7px
  '8': `${BASE_SPACING_UNIT * 2}px`,       // 8px
  '9': `${BASE_SPACING_UNIT * 2.25}px`,    // 9px
  '10': `${BASE_SPACING_UNIT * 2.5}px`,    // 10px
  '11': `${BASE_SPACING_UNIT * 2.75}px`,   // 11px
  '12': `${BASE_SPACING_UNIT * 3}px`,      // 12px
  '14': `${BASE_SPACING_UNIT * 3.5}px`,    // 14px
  '16': `${BASE_SPACING_UNIT * 4}px`,      // 16px
  '20': `${BASE_SPACING_UNIT * 5}px`,      // 20px
  '24': `${BASE_SPACING_UNIT * 6}px`,      // 24px
  '28': `${BASE_SPACING_UNIT * 7}px`,      // 28px
  '32': `${BASE_SPACING_UNIT * 8}px`,      // 32px
  '36': `${BASE_SPACING_UNIT * 9}px`,      // 36px
  '40': `${BASE_SPACING_UNIT * 10}px`,     // 40px
  '44': `${BASE_SPACING_UNIT * 11}px`,     // 44px
  '48': `${BASE_SPACING_UNIT * 12}px`,     // 48px
  '52': `${BASE_SPACING_UNIT * 13}px`,     // 52px
  '56': `${BASE_SPACING_UNIT * 14}px`,     // 56px
  '60': `${BASE_SPACING_UNIT * 15}px`,     // 60px
  '64': `${BASE_SPACING_UNIT * 16}px`,     // 64px
  '72': `${BASE_SPACING_UNIT * 18}px`,     // 72px
  '80': `${BASE_SPACING_UNIT * 20}px`,     // 80px
  '96': `${BASE_SPACING_UNIT * 24}px`,     // 96px
  
  // Semantic spacing aliases
  none: '0',
  xs: `${BASE_SPACING_UNIT}px`,            // 4px
  sm: `${BASE_SPACING_UNIT * 2}px`,        // 8px
  md: `${BASE_SPACING_UNIT * 4}px`,        // 16px
  lg: `${BASE_SPACING_UNIT * 6}px`,        // 24px
  xl: `${BASE_SPACING_UNIT * 8}px`,        // 32px
  '2xl': `${BASE_SPACING_UNIT * 12}px`,    // 48px
  '3xl': `${BASE_SPACING_UNIT * 16}px`,    // 64px
  '4xl': `${BASE_SPACING_UNIT * 20}px`,    // 80px
  '5xl': `${BASE_SPACING_UNIT * 24}px`,    // 96px
  
  // Component-specific spacing
  inputPadding: `${BASE_SPACING_UNIT * 3}px`,  // 12px
  buttonPadding: `${BASE_SPACING_UNIT * 3}px ${BASE_SPACING_UNIT * 4}px`,  // 12px 16px
  cardPadding: `${BASE_SPACING_UNIT * 4}px`,   // 16px
  tableCellPadding: `${BASE_SPACING_UNIT * 3}px ${BASE_SPACING_UNIT * 4}px`,  // 12px 16px
  sectionGap: `${BASE_SPACING_UNIT * 8}px`,    // 32px
  formGap: `${BASE_SPACING_UNIT * 6}px`,       // 24px
  gridGap: `${BASE_SPACING_UNIT * 4}px`,       // 16px
};

/**
 * Border radius scale
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',    // Circle/pill
  
  // Component-specific border radius
  button: '0.25rem',  // 4px
  input: '0.25rem',   // 4px
  card: '0.5rem',     // 8px
  modal: '0.5rem',    // 8px
  avatar: '50%',      // Circle
  badge: '9999px',    // Pill
};

/**
 * Z-index scale
 */
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

/**
 * Export all spacing related constants
 */
export const spacingSystem = {
  spacing,
  borderRadius,
  zIndex,
};