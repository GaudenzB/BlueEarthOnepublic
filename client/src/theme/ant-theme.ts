/**
 * Ant Design Theme Configuration
 * 
 * This file configures the Ant Design theme to match our financial services aesthetic.
 * It overrides default Ant Design tokens with our custom design system values.
 */
import { theme } from 'antd';
import { tokens } from './tokens';
import type { ThemeConfig } from 'antd';

/**
 * Ant Design theme configuration
 * 
 * This theme configuration leverages Ant Design's algorithm system for automatic derivative
 * token generation along with our custom overrides from our design system.
 * 
 * See: https://ant.design/docs/react/customize-theme
 */
export const antThemeConfig: ThemeConfig = {
  // Use Ant Design's algorithm to generate derivative tokens
  algorithm: [theme.compactAlgorithm, theme.defaultAlgorithm],
  
  // Core token overrides
  token: {
    // Brand colors
    colorPrimary: tokens.colors.brand.primary,
    colorSuccess: tokens.colors.semantic.success,
    colorWarning: tokens.colors.semantic.warning,
    colorError: tokens.colors.semantic.error,
    colorInfo: tokens.colors.semantic.info,
    
    // Typography
    fontFamily: tokens.typography.fontFamily.base,
    fontSize: parseInt(tokens.typography.fontSize.md),
    fontWeightStrong: tokens.typography.fontWeight.semibold,
    
    // Border radius - using our standardized radius
    borderRadius: parseInt(tokens.radii.md),
    
    // Spacing - sync with our spacing scale
    padding: parseInt(tokens.spacing.md),
    margin: parseInt(tokens.spacing.md),
    
    // Border color
    colorBorder: tokens.colors.neutral[400],
    
    // Text colors
    colorText: tokens.colors.neutral[900],
    colorTextSecondary: tokens.colors.neutral[700],
    colorTextTertiary: tokens.colors.neutral[600],
    colorTextQuaternary: tokens.colors.neutral[500],
    
    // Background colors
    colorBgContainer: tokens.colors.neutral[100],
    colorBgElevated: tokens.colors.neutral[100],
    colorBgLayout: tokens.colors.neutral[200],
    
    // Style settings
    wireframe: false,
    motion: true,
  },
  
  // Component specific overrides
  components: {
    Button: {
      borderRadius: parseInt(tokens.radii.md),
      controlHeight: 40,
      paddingContentHorizontal: parseInt(tokens.spacing[4]),
      fontSize: parseInt(tokens.typography.fontSize.sm),
      fontWeight: tokens.typography.fontWeight.medium,
      // Add component-specific algorithm
      algorithm: true,
    },
    Card: {
      borderRadius: parseInt(tokens.radii.lg),
      boxShadow: tokens.shadows.sm,
      colorBorderSecondary: tokens.colors.neutral[400],
      padding: parseInt(tokens.spacing[6]),
    },
    Input: {
      borderRadius: parseInt(tokens.radii.md),
      controlHeight: 40,
      paddingInline: parseInt(tokens.spacing[3]),
      colorBorder: tokens.colors.neutral[400],
    },
    Select: {
      borderRadius: parseInt(tokens.radii.md),
      controlHeight: 40,
      colorBorder: tokens.colors.neutral[400],
      colorTextPlaceholder: tokens.colors.neutral[600],
      optionSelectedBg: tokens.colors.brand.primaryLighter,
      optionSelectedColor: tokens.colors.brand.primary,
    },
    Table: {
      borderRadius: parseInt(tokens.radii.lg),
      headerBg: tokens.colors.neutral[300],
      headerColor: tokens.colors.neutral[900],
      fontWeightStrong: tokens.typography.fontWeight.semibold,
      fontSize: parseInt(tokens.typography.fontSize.sm),
      paddingContentVertical: parseInt(tokens.spacing[4]),
      paddingContentHorizontal: parseInt(tokens.spacing[4]),
      rowHoverBg: tokens.colors.brand.primaryLighter,
    },
    Pagination: {
      borderRadius: parseInt(tokens.radii.md),
      colorPrimary: tokens.colors.brand.primary,
      colorBgContainer: tokens.colors.neutral[100],
    },
    Modal: {
      borderRadius: parseInt(tokens.radii.lg),
      padding: parseInt(tokens.spacing[6]),
      titleFontSize: parseInt(tokens.typography.fontSize.xl),
    },
    Menu: {
      colorItemBg: 'transparent',
      colorItemText: tokens.colors.neutral[900],
      colorItemTextSelected: tokens.colors.brand.primary,
      colorItemBgSelected: tokens.colors.brand.primaryLighter,
      colorItemBgHover: tokens.colors.neutral[300],
      borderRadius: parseInt(tokens.radii.md),
    },
    Tabs: {
      colorPrimary: tokens.colors.brand.primary,
      colorBorder: tokens.colors.neutral[400],
      margin: 0,
    },
    Tooltip: {
      colorFill: tokens.colors.neutral[900],
      borderRadiusOuter: parseInt(tokens.radii.md),
    },
    Typography: {
      colorText: tokens.colors.neutral[900],
      colorTextSecondary: tokens.colors.neutral[700],
      fontWeightStrong: tokens.typography.fontWeight.semibold,
    },
    Dropdown: {
      borderRadius: parseInt(tokens.radii.md),
      controlHeight: 40,
      boxShadow: tokens.shadows.md,
    },
    Popover: {
      borderRadius: parseInt(tokens.radii.md),
      boxShadow: tokens.shadows.md,
    },
    Tag: {
      borderRadius: parseInt(tokens.radii.pill),
      fontSize: parseInt(tokens.typography.fontSize.xs),
    },
    Avatar: {
      borderRadius: parseInt(tokens.radii.pill),
    }
  },
};

export default antThemeConfig;