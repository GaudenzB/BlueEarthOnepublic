/**
 * Color constants for the BlueEarth Capital application
 * 
 * These colors are used throughout the application for consistent styling.
 * Use these constants instead of hardcoding color values.
 */

/**
 * Primary brand color palette
 */
export const primary = {
  50: '#E5EBF3',
  100: '#C1CDE2',
  200: '#9AABCF',
  300: '#7289BC',
  400: '#536FAD',
  500: '#324D6F', // Main primary color
  600: '#2A3A55', // Hover state
  700: '#1A2B47', // Primary base 
  800: '#0C1C36', // Sidebar bg
  900: '#000C22',
};

/**
 * Secondary brand color palette
 */
export const secondary = {
  50: '#F2F7FD',
  100: '#DBEAFA',
  200: '#C3DEF8',
  300: '#ABD1F5',
  400: '#93C5F3',
  500: '#7BB8F0',
  600: '#63ACF0', // Main secondary color
  700: '#4A9FED',
  800: '#3293EB',
  900: '#1986E8',
};

/**
 * Neutral/gray color palette
 */
export const gray = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
};

/**
 * Success color palette
 */
export const success = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#34D399',
  500: '#10B981',
  600: '#059669',
  700: '#047857',
  800: '#065F46',
  900: '#064E3B',
};

/**
 * Warning color palette
 */
export const warning = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
};

/**
 * Danger/error color palette
 */
export const danger = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#EF4444',
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
  900: '#7F1D1D',
};

/**
 * Info color palette
 */
export const info = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
};

/**
 * Base colors
 */
export const base = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

/**
 * Semantic color mapping
 */
export const semantic = {
  // Text colors
  textPrimary: gray[900],
  textSecondary: gray[700],
  textTertiary: gray[500],
  textDisabled: gray[400],
  textInverse: base.white,
  
  // Background colors
  backgroundPrimary: base.white,
  backgroundSecondary: gray[50],
  backgroundTertiary: gray[100],
  backgroundDisabled: gray[200],
  
  // Border colors
  borderPrimary: gray[200],
  borderSecondary: gray[300],
  borderFocus: primary[500],
  
  // Component colors
  componentBackground: base.white,
  componentBackgroundHover: gray[50],
  componentBackgroundActive: gray[100],
  componentBorder: gray[200],
  componentBorderHover: gray[300],
  componentBorderActive: primary[500],
  
  // Button colors
  buttonPrimary: primary[700],
  buttonPrimaryHover: primary[600],
  buttonPrimaryActive: primary[800],
  buttonSecondary: secondary[600],
  buttonSecondaryHover: secondary[500],
  buttonSecondaryActive: secondary[700],
  
  // Status colors
  statusSuccess: success[500],
  statusWarning: warning[500],
  statusDanger: danger[500],
  statusInfo: info[500],
};

/**
 * Export all colors
 */
export const colors = {
  primary,
  secondary,
  gray,
  success,
  warning,
  danger,
  info,
  base,
  semantic,
};