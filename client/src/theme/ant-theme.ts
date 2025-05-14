import { theme } from 'antd';
import type { ThemeConfig } from 'antd';
import { tokens } from './tokens';

/**
 * BlueEarth Capital Ant Design Theme Configuration
 * 
 * This file configures the Ant Design theme using our design system tokens,
 * ensuring consistent styling across all Ant Design components while maintaining
 * our distinctive financial services aesthetic.
 * 
 * The theme configuration follows Ant Design's token system and maps our
 * design tokens to the appropriate Ant Design variables.
 */

// Extract status color values from tokens
const statusColors = {
  success: tokens.colors.status.success.default,
  successLight: tokens.colors.status.success.light,
  successDark: tokens.colors.status.success.dark,
  warning: tokens.colors.status.warning.default,
  warningLight: tokens.colors.status.warning.light,
  warningDark: tokens.colors.status.warning.dark,
  error: tokens.colors.status.error.default,
  errorLight: tokens.colors.status.error.light,
  errorDark: tokens.colors.status.error.dark,
  info: tokens.colors.status.info.default,
  infoLight: tokens.colors.status.info.light,
  infoDark: tokens.colors.status.info.dark,
};

// Create the theme configuration
export const antTheme: ThemeConfig = {
  // Use the default algorithm with slight adjustments for a professional look
  algorithm: theme.defaultAlgorithm,
  token: {
    // Brand colors
    colorPrimary: tokens.colors.brand.primary,
    colorPrimaryBg: tokens.colors.brand.primaryLight,
    colorPrimaryBgHover: tokens.colors.brand.primaryLight,
    colorPrimaryBorder: tokens.colors.brand.primary,
    colorPrimaryText: tokens.colors.brand.primary,
    colorPrimaryTextHover: tokens.colors.brand.primaryLight,
    colorPrimaryHover: tokens.colors.brand.primaryLight,
    colorPrimaryActive: tokens.colors.brand.primaryDark,
    
    // Secondary brand color
    colorLink: tokens.colors.brand.secondary,
    colorLinkHover: tokens.colors.brand.tertiary,
    colorLinkActive: tokens.colors.brand.quaternary,
    
    // Semantic colors for feedback and status indicators
    colorSuccess: statusColors.success,
    colorWarning: statusColors.warning,
    colorError: statusColors.error,
    colorInfo: statusColors.info,
    
    // Text colors for various hierarchy levels
    colorTextBase: tokens.colors.neutral['800'],
    colorTextSecondary: tokens.colors.neutral['700'],
    colorTextTertiary: tokens.colors.neutral['600'],
    colorTextQuaternary: tokens.colors.neutral['500'],
    colorTextPlaceholder: tokens.colors.neutral['400'],
    colorTextDisabled: tokens.colors.neutral['400'],
    
    // Background colors
    colorBgBase: tokens.colors.neutral['50'],
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: tokens.colors.neutral['100'],
    colorBgSpotlight: tokens.colors.neutral['200'],
    
    // Border colors
    colorBorder: tokens.colors.neutral['200'],
    colorBorderSecondary: tokens.colors.neutral['100'],
    
    // Border radius values
    borderRadius: 6, // Medium
    borderRadiusLG: 8, // Large
    borderRadiusSM: 4, // Small
    borderRadiusXS: 2, // Extra small
    
    // Typography
    fontFamily: tokens.typography.fontFamily.sans,
    
    // Font sizes
    fontSize: parseInt(tokens.typography.fontSize.base.replace('px', '')),
    fontSizeSM: parseInt(tokens.typography.fontSize.sm.replace('px', '')),
    fontSizeLG: parseInt(tokens.typography.fontSize.lg.replace('px', '')),
    fontSizeXL: parseInt(tokens.typography.fontSize.xl.replace('px', '')),
    
    // Font weights
    fontWeightStrong: tokens.typography.fontWeight.semibold,
    
    // Line heights
    lineHeight: tokens.typography.lineHeight.normal,
    lineHeightLG: tokens.typography.lineHeight.relaxed,
    lineHeightSM: tokens.typography.lineHeight.snug,
    
    // Spacing values for margins
    marginXXS: parseInt(tokens.spacing['0.5'].replace('px', '')),
    marginXS: parseInt(tokens.spacing['1'].replace('px', '')),
    marginSM: parseInt(tokens.spacing['2'].replace('px', '')),
    margin: parseInt(tokens.spacing['3'].replace('px', '')),
    marginMD: parseInt(tokens.spacing['4'].replace('px', '')),
    marginLG: parseInt(tokens.spacing['6'].replace('px', '')),
    marginXL: parseInt(tokens.spacing['7'].replace('px', '')),
    marginXXL: parseInt(tokens.spacing['9'].replace('px', '')),
    
    // Padding values
    paddingXXS: parseInt(tokens.spacing['0.5'].replace('px', '')),
    paddingXS: parseInt(tokens.spacing['1'].replace('px', '')),
    paddingSM: parseInt(tokens.spacing['2'].replace('px', '')),
    padding: parseInt(tokens.spacing['3'].replace('px', '')),
    paddingMD: parseInt(tokens.spacing['4'].replace('px', '')),
    paddingLG: parseInt(tokens.spacing['6'].replace('px', '')),
    paddingXL: parseInt(tokens.spacing['7'].replace('px', '')),
    
    // Box shadows for elevation
    boxShadow: tokens.boxShadow.sm,
    boxShadowSecondary: tokens.boxShadow.md,
    
    // Animation timing
    motionDurationFast: tokens.animation.duration.fast,
    motionDurationMid: tokens.animation.duration.normal,
    motionDurationSlow: tokens.animation.duration.slow,
    
    // Animation easing functions
    motionEaseOutQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',
    motionEaseOut: 'ease-out',
    motionEaseInOut: 'ease-in-out',
    motionEaseOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    
    // Control heights for inputs, buttons, etc.
    controlHeightSM: parseInt(tokens.componentSize.button.xs.height.replace('px', '')),
    controlHeight: parseInt(tokens.componentSize.button.sm.height.replace('px', '')),
    controlHeightLG: parseInt(tokens.componentSize.button.md.height.replace('px', '')),
    
    // Control outline width (for focus states)
    controlOutlineWidth: parseInt(tokens.borderWidth['2'].replace('px', '')),
    
    // Z-index values
    zIndexBase: tokens.zIndex['0'],
    zIndexPopupBase: tokens.zIndex['50'],
    
    // Opacity values
    opacityLoading: parseFloat(tokens.opacity['50']),
    
    // Disable wireframes for production-quality appearance
    wireframe: false,
  },
  components: {
    Button: {
      borderRadius: 4, // Small border radius for buttons
      borderRadiusLG: 6, // Medium border radius for large buttons
      borderRadiusSM: 2, // Extra small border radius for small buttons
      colorBorder: tokens.colors.neutral['300'],
      boxShadow: tokens.boxShadow.none,
      controlHeightLG: 40,
      controlHeight: 32,
      controlHeightSM: 24,
      paddingInlineLG: 16,
      paddingInline: 12,
      paddingInlineSM: 8,
    },
    Card: {
      colorBorderSecondary: tokens.colors.neutral['200'],
      borderRadius: 6, // Medium border radius for cards
      boxShadow: tokens.boxShadow.sm,
      paddingLG: 20, // Medium-small spacing for large card padding
    },
    Table: {
      borderRadius: 4, // Small border radius for tables
      colorBgContainer: '#ffffff',
      colorBorderSecondary: tokens.colors.neutral['200'],
      paddingContentVerticalLG: 16, // Default spacing for table content
      paddingContentHorizontalLG: 16, // Default spacing for table content
      headerBg: tokens.colors.neutral['50'],
      headerColor: tokens.colors.neutral['700'],
      headerSortActiveBg: tokens.colors.neutral['100'],
      headerFilterHoverBg: tokens.colors.neutral['200'],
      footerBg: tokens.colors.neutral['50'],
      rowHoverBg: tokens.colors.neutral['100'],
      borderRadiusLG: 6, // Medium border radius
      borderRadiusSM: 2, // Extra small border radius
    },
    Select: {
      borderRadius: 4, // Small border radius for selects
      colorBorder: tokens.colors.neutral['300'],
      controlItemBgActive: tokens.colors.neutral['100'],
      controlItemBgHover: tokens.colors.neutral['50'],
      colorTextPlaceholder: tokens.colors.neutral['500'],
      colorTextDisabled: tokens.colors.neutral['400'],
      borderRadiusLG: 6, // Medium border radius
      borderRadiusSM: 2, // Extra small border radius
    },
    Input: {
      borderRadius: 4, // Small border radius for inputs
      colorBorder: tokens.colors.neutral['300'],
      colorTextPlaceholder: tokens.colors.neutral['500'],
      colorTextDisabled: tokens.colors.neutral['400'],
      borderRadiusLG: 6, // Medium border radius
      borderRadiusSM: 2, // Extra small border radius
    },
    Menu: {
      colorItemBgActive: tokens.colors.neutral['100'],
      colorItemBgHover: tokens.colors.neutral['50'],
      itemColor: tokens.colors.neutral['700'],
      itemActiveBg: tokens.colors.brand.primaryLight,
      itemSelectedBg: tokens.colors.brand.primaryLight,
      itemSelectedColor: tokens.colors.brand.primary,
      borderRadius: 6, // Medium border radius for menus
      boxShadow: tokens.boxShadow.md,
    },
    Modal: {
      borderRadius: 8, // Large border radius for modals
      colorBgElevated: '#ffffff',
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
      boxShadow: tokens.boxShadow.lg,
      headerBg: 'transparent',
      titleColor: tokens.colors.neutral['900'],
      contentBg: '#ffffff',
      padding: 20, // Medium-small spacing for modal padding
    },
    Drawer: {
      colorBgElevated: '#ffffff',
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
      footerPaddingBlock: 16, // Default spacing
      footerPaddingInline: 16, // Default spacing
    },
    Tag: {
      colorBorder: 'transparent',
      defaultBg: tokens.colors.neutral['100'],
      defaultColor: tokens.colors.neutral['800'],
    },
    Tabs: {
      cardGutter: 2,
      cardHeight: 40,
      horizontalItemGutter: 32,
      titleFontSize: 16, // Base font size
      horizontalItemPadding: '12px 16px',
    },
    Dropdown: {
      controlItemBgHover: tokens.colors.neutral['100'],
      controlItemBgActive: tokens.colors.brand.primaryLight,
      borderRadius: 6, // Medium border radius for dropdowns
      boxShadow: tokens.boxShadow.md,
    },
    Pagination: {
      itemActiveBg: tokens.colors.brand.primary,
      itemSize: 32,
      itemSizeSM: 24,
      colorPrimary: tokens.colors.brand.primary,
      colorPrimaryHover: tokens.colors.brand.primaryLight,
      colorPrimaryBorder: tokens.colors.brand.primary,
    },
    DatePicker: {
      borderRadius: 4, // Small border radius for date pickers
      cellHeight: 36,
      cellWidth: 36,
      cellHoverBg: tokens.colors.neutral['100'],
      borderRadiusLG: 6, // Medium border radius
      borderRadiusSM: 2, // Extra small border radius
      cellBgDisabled: tokens.colors.neutral['100'],
    },
    Form: {
      labelColor: tokens.colors.neutral['700'],
      colorTextHeading: tokens.colors.neutral['800'],
      itemMarginBottom: 16, // Default spacing
    },
    Badge: {
      colorBgContainer: '#ffffff',
    },
    Avatar: {
      colorBgContainer: '#ffffff',
      colorTextLightSolid: '#ffffff',
    },
    Alert: {
      colorSuccess: tokens.colors.semantic.success,
      colorSuccessBg: tokens.colors.extended.green.light,
      colorWarning: tokens.colors.semantic.warning,
      colorWarningBg: tokens.colors.extended.orange.light,
      colorError: tokens.colors.semantic.error,
      colorErrorBg: tokens.colors.extended.red.light,
      colorInfo: tokens.colors.semantic.info,
      colorInfoBg: tokens.colors.extended.blue.light,
    },
    Notification: {
      boxShadow: tokens.boxShadow.lg,
      borderRadius: 6, // Medium border radius for notifications
    },
    Tooltip: {
      borderRadius: 2, // Extra small border radius for tooltips
      colorTextLightSolid: '#ffffff',
    },
    Popover: {
      colorBgElevated: '#ffffff',
      borderRadius: 6, // Medium border radius for popovers
      boxShadow: tokens.boxShadow.md,
    },
    Spin: {
      dotSize: 20,
      dotSizeLG: 32,
      dotSizeSM: 14,
    },
  }
};

export default antTheme;