import { theme } from 'antd';
import type { ThemeConfig } from 'antd';
import { tokens } from './tokens';

/**
 * Ant Design Theme Configuration
 * 
 * This file configures the Ant Design theme using our design system tokens,
 * ensuring consistent styling across all Ant Design components.
 */

// Create the theme configuration
export const antTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // Colors
    colorPrimary: tokens.colors.brand.primary,
    colorPrimaryBg: tokens.colors.brand.primaryLight,
    colorPrimaryBgHover: tokens.colors.brand.primaryLight,
    colorPrimaryBorder: tokens.colors.brand.primary,
    colorPrimaryText: tokens.colors.brand.primary,
    colorPrimaryTextHover: tokens.colors.brand.primaryLight,
    colorPrimaryHover: tokens.colors.brand.primaryLight,
    colorPrimaryActive: tokens.colors.brand.primaryDark,
    
    colorSuccess: tokens.colors.semantic.success,
    colorWarning: tokens.colors.semantic.warning,
    colorError: tokens.colors.semantic.error,
    colorInfo: tokens.colors.semantic.info,
    
    colorTextBase: tokens.colors.neutral['800'],
    colorTextSecondary: tokens.colors.neutral['700'],
    colorTextTertiary: tokens.colors.neutral['600'],
    colorTextQuaternary: tokens.colors.neutral['500'],
    
    colorBgBase: tokens.colors.neutral['50'],
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: tokens.colors.neutral['100'],
    
    // Border radius
    borderRadius: parseInt(tokens.borderRadius.md),
    borderRadiusLG: parseInt(tokens.borderRadius.lg),
    borderRadiusSM: parseInt(tokens.borderRadius.sm),
    borderRadiusXS: parseInt(tokens.borderRadius.xs),
    
    // Font family
    fontFamily: tokens.typography.fontFamily.sans,
    
    // Font size
    fontSize: parseInt(tokens.typography.fontSize.base),
    fontSizeSM: parseInt(tokens.typography.fontSize.sm),
    fontSizeLG: parseInt(tokens.typography.fontSize.lg),
    
    // Line height
    lineHeight: tokens.typography.lineHeight.normal,
    lineHeightLG: tokens.typography.lineHeight.relaxed,
    lineHeightSM: tokens.typography.lineHeight.snug,
    
    // Spacing
    marginXS: parseInt(tokens.spacing['1']),
    marginSM: parseInt(tokens.spacing['2']),
    margin: parseInt(tokens.spacing['3']),
    marginMD: parseInt(tokens.spacing['4']),
    marginLG: parseInt(tokens.spacing['5']),
    marginXL: parseInt(tokens.spacing['6']),
    marginXXL: parseInt(tokens.spacing['8']),
    
    // Padding
    paddingXS: parseInt(tokens.spacing['1']),
    paddingSM: parseInt(tokens.spacing['2']),
    padding: parseInt(tokens.spacing['3']),
    paddingMD: parseInt(tokens.spacing['4']),
    paddingLG: parseInt(tokens.spacing['5']),
    paddingXL: parseInt(tokens.spacing['6']),
    
    // Box shadows
    boxShadow: tokens.boxShadow.sm,
    boxShadowSecondary: tokens.boxShadow.md,
    
    // Animation
    motionDurationFast: tokens.animation.duration.fast,
    motionDurationMid: tokens.animation.duration.normal,
    motionDurationSlow: tokens.animation.duration.slow,
    
    motionEaseOut: tokens.animation.easing.easeOut,
    motionEaseInOut: tokens.animation.easing.easeInOut,
    
    // Control height
    controlHeightSM: 24,
    controlHeight: 32,
    controlHeightLG: 40,
    
    // Control outline width
    controlOutlineWidth: 2,
    
    // Z-index
    zIndexBase: tokens.zIndex['0'],
    zIndexPopupBase: tokens.zIndex['50'],
    
    // Opacity
    opacityLoading: parseFloat(tokens.opacity['50']),
    
    // Wire frames
    wireframe: false,
  },
  components: {
    Button: {
      borderRadius: parseInt(tokens.borderRadius.sm),
      borderRadiusLG: parseInt(tokens.borderRadius.md),
      borderRadiusSM: parseInt(tokens.borderRadius.xs),
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
      borderRadius: parseInt(tokens.borderRadius.md),
      boxShadow: tokens.boxShadow.sm,
      paddingLG: parseInt(tokens.spacing['5']),
    },
    Table: {
      borderRadius: parseInt(tokens.borderRadius.sm),
      colorBgContainer: '#ffffff',
      colorBorderSecondary: tokens.colors.neutral['200'],
      paddingContentVerticalLG: parseInt(tokens.spacing['4']),
      paddingContentHorizontalLG: parseInt(tokens.spacing['4']),
      headerBg: tokens.colors.neutral['50'],
      headerColor: tokens.colors.neutral['700'],
      headerSortActiveBg: tokens.colors.neutral['100'],
      headerFilterHoverBg: tokens.colors.neutral['200'],
      footerBg: tokens.colors.neutral['50'],
      rowHoverBg: tokens.colors.neutral['100'],
      borderRadiusLG: parseInt(tokens.borderRadius.md),
      borderRadiusSM: parseInt(tokens.borderRadius.xs),
    },
    Select: {
      borderRadius: parseInt(tokens.borderRadius.sm),
      colorBorder: tokens.colors.neutral['300'],
      controlItemBgActive: tokens.colors.neutral['100'],
      controlItemBgHover: tokens.colors.neutral['50'],
      colorTextPlaceholder: tokens.colors.neutral['500'],
      colorTextDisabled: tokens.colors.neutral['400'],
      borderRadiusLG: parseInt(tokens.borderRadius.md),
      borderRadiusSM: parseInt(tokens.borderRadius.xs),
    },
    Input: {
      borderRadius: parseInt(tokens.borderRadius.sm),
      colorBorder: tokens.colors.neutral['300'],
      colorTextPlaceholder: tokens.colors.neutral['500'],
      colorTextDisabled: tokens.colors.neutral['400'],
      borderRadiusLG: parseInt(tokens.borderRadius.md),
      borderRadiusSM: parseInt(tokens.borderRadius.xs),
    },
    Menu: {
      colorItemBgActive: tokens.colors.neutral['100'],
      colorItemBgHover: tokens.colors.neutral['50'],
      itemColor: tokens.colors.neutral['700'],
      itemActiveBg: tokens.colors.brand.primaryLight,
      itemSelectedBg: tokens.colors.brand.primaryLight,
      itemSelectedColor: tokens.colors.brand.primary,
      borderRadius: parseInt(tokens.borderRadius.md),
      boxShadow: tokens.boxShadow.md,
    },
    Modal: {
      borderRadius: parseInt(tokens.borderRadius.lg),
      colorBgElevated: '#ffffff',
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
      boxShadow: tokens.boxShadow.lg,
      headerBg: 'transparent',
      titleColor: tokens.colors.neutral['900'],
      contentBg: '#ffffff',
      padding: parseInt(tokens.spacing['5']),
    },
    Drawer: {
      colorBgElevated: '#ffffff',
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
      footerPaddingBlock: parseInt(tokens.spacing['4']),
      footerPaddingInline: parseInt(tokens.spacing['4']),
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
      titleFontSize: parseInt(tokens.typography.fontSize.base),
      horizontalItemPadding: '12px 16px',
    },
    Dropdown: {
      controlItemBgHover: tokens.colors.neutral['100'],
      controlItemBgActive: tokens.colors.brand.primaryLight,
      borderRadius: parseInt(tokens.borderRadius.md),
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
      borderRadius: parseInt(tokens.borderRadius.sm),
      cellHeight: 36,
      cellWidth: 36,
      cellHoverBg: tokens.colors.neutral['100'],
      borderRadiusLG: parseInt(tokens.borderRadius.md),
      borderRadiusSM: parseInt(tokens.borderRadius.xs),
      cellBgDisabled: tokens.colors.neutral['100'],
    },
    Form: {
      labelColor: tokens.colors.neutral['700'],
      colorTextHeading: tokens.colors.neutral['800'],
      itemMarginBottom: parseInt(tokens.spacing['4']),
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
      colorSuccessBg: tokens.colors.success.light,
      colorWarning: tokens.colors.semantic.warning,
      colorWarningBg: tokens.colors.warning.light,
      colorError: tokens.colors.semantic.error,
      colorErrorBg: tokens.colors.error.light,
      colorInfo: tokens.colors.semantic.info,
      colorInfoBg: tokens.colors.info.light,
    },
    Notification: {
      boxShadow: tokens.boxShadow.lg,
      borderRadius: parseInt(tokens.borderRadius.md),
    },
    Tooltip: {
      borderRadius: parseInt(tokens.borderRadius.xs),
      colorTextLightSolid: '#ffffff',
    },
    Popover: {
      colorBgElevated: '#ffffff',
      borderRadius: parseInt(tokens.borderRadius.md),
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