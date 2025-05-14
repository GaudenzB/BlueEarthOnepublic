/**
 * Ant Design Theme Configuration
 * 
 * This file configures the Ant Design theme to match our design system tokens.
 * It customizes component styles globally for a consistent look and feel.
 */

import { ThemeConfig } from 'antd';
import { tokens } from './tokens';

/**
 * Ant Design theme configuration
 * 
 * This theme configuration customizes Ant Design components to match
 * our design system. It uses tokens from our design system to ensure
 * visual consistency across all components.
 */
export const antTheme: ThemeConfig = {
  token: {
    // Colors
    colorPrimary: tokens.colors.brand.primary,
    colorPrimaryBg: tokens.colors.brand.primaryLight,
    colorPrimaryHover: tokens.colors.brand.primaryDark,
    colorLink: tokens.colors.brand.primary,
    colorLinkHover: tokens.colors.brand.primaryDark,
    colorSuccess: tokens.colors.semantic.success,
    colorWarning: tokens.colors.semantic.warning,
    colorError: tokens.colors.semantic.error,
    colorInfo: tokens.colors.semantic.info,
    colorTextBase: tokens.colors.neutral[800],
    colorBgBase: tokens.colors.neutral[50],
    
    // Typography
    fontFamily: tokens.typography.fontFamily.base,
    fontSize: parseInt(tokens.typography.fontSize.base),
    fontSizeSM: parseInt(tokens.typography.fontSize.sm),
    fontSizeLG: parseInt(tokens.typography.fontSize.lg),
    fontSizeXL: parseInt(tokens.typography.fontSize.xl),
    fontWeightStrong: tokens.typography.fontWeight.semibold,
    
    // Border radius
    borderRadius: parseInt(tokens.radii.md),
    borderRadiusLG: parseInt(tokens.radii.lg),
    borderRadiusSM: parseInt(tokens.radii.sm),
    borderRadiusXS: parseInt(tokens.radii.sm) / 2,
    
    // Spacing
    padding: parseInt(tokens.spacing[4]),
    paddingSM: parseInt(tokens.spacing[3]),
    paddingXS: parseInt(tokens.spacing[2]),
    paddingLG: parseInt(tokens.spacing[6]),
    paddingXL: parseInt(tokens.spacing[8]),
    margin: parseInt(tokens.spacing[4]),
    marginSM: parseInt(tokens.spacing[3]),
    marginXS: parseInt(tokens.spacing[2]),
    marginLG: parseInt(tokens.spacing[6]),
    marginXL: parseInt(tokens.spacing[8]),
    
    // Box shadow
    boxShadow: tokens.shadows.md,
    boxShadowSecondary: tokens.shadows.sm,
    
    // Motion
    motionEaseInOut: tokens.easings.inOut,
    motionEaseOut: tokens.easings.out,
    motionEaseIn: tokens.easings.in,
    motionDurationFast: '0.2s',
    motionDurationMid: '0.3s',
    motionDurationSlow: '0.4s'
  },
  
  // Component-specific customizations
  components: {
    Button: {
      primaryColor: tokens.colors.brand.primary,
      defaultBorderColor: tokens.colors.neutral[300],
      defaultColor: tokens.colors.neutral[700],
      defaultBg: tokens.colors.neutral[100],
      fontWeight: tokens.typography.fontWeight.medium,
      borderRadius: parseInt(tokens.radii.md),
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      paddingInlineLG: 20,
      paddingInline: 16,
      paddingInlineSM: 12
    },
    
    Card: {
      borderRadius: parseInt(tokens.radii.lg),
      boxShadow: tokens.shadows.sm,
      headerBg: tokens.colors.neutral[50],
      headerFontSize: parseInt(tokens.typography.fontSize.md),
      headerFontWeight: tokens.typography.fontWeight.semibold,
      paddingLG: parseInt(tokens.spacing[6]),
      colorBorderSecondary: tokens.colors.neutral[200]
    },
    
    Layout: {
      headerBg: tokens.colors.neutral[50],
      headerHeight: 64,
      headerPadding: `0 ${tokens.spacing[6]}`,
      headerColor: tokens.colors.neutral[800],
      siderBg: tokens.colors.neutral[50],
      triggerHeight: 48,
      triggerBg: tokens.colors.neutral[200],
      triggerColor: tokens.colors.neutral[700],
      footerBg: tokens.colors.neutral[50],
      footerPadding: tokens.spacing[6],
    },
    
    Menu: {
      itemHeight: 48,
      itemHoverBg: tokens.colors.brand.primaryLight,
      itemHoverColor: tokens.colors.brand.primary,
      itemSelectedBg: tokens.colors.brand.primaryLight,
      itemSelectedColor: tokens.colors.brand.primary,
      itemBorderRadius: parseInt(tokens.radii.md),
      subMenuItemBorderRadius: parseInt(tokens.radii.md),
      horizontalItemBorderRadius: parseInt(tokens.radii.md),
      horizontalItemHoverBg: tokens.colors.brand.primaryLight,
      horizontalItemSelectedBg: tokens.colors.brand.primaryLight,
      horizontalItemSelectedColor: tokens.colors.brand.primary
    },
    
    Table: {
      headerBg: tokens.colors.neutral[100],
      headerColor: tokens.colors.neutral[800],
      headerSortActiveBg: tokens.colors.neutral[200],
      headerFilterActiveBg: tokens.colors.neutral[200],
      rowHoverBg: tokens.colors.neutral[100],
      borderColor: tokens.colors.neutral[200],
      borderRadius: parseInt(tokens.radii.md),
      headerBorderRadius: parseInt(tokens.radii.md)
    },
    
    Form: {
      itemMarginBottom: parseInt(tokens.spacing[5]),
      verticalLabelPadding: `0 0 ${tokens.spacing[2]} 0`,
      labelColor: tokens.colors.neutral[700],
      labelFontSize: parseInt(tokens.typography.fontSize.sm),
      labelHeight: 24,
      labelColonMarginInlineEnd: parseInt(tokens.spacing[2]),
      labelRequiredMarkColor: tokens.colors.semantic.error,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32
    },
    
    Input: {
      activeBorderColor: tokens.colors.brand.primary,
      hoverBorderColor: tokens.colors.brand.primary,
      activeShadow: `0 0 0 2px ${tokens.colors.brand.primaryLight}`,
      errorActiveShadow: `0 0 0 2px ${tokens.colors.semantic.error}10`,
      borderRadius: parseInt(tokens.radii.md),
      colorError: tokens.colors.semantic.error,
      colorErrorOutline: `rgba(${parseInt(tokens.colors.semantic.error.slice(1, 3), 16)}, ${parseInt(tokens.colors.semantic.error.slice(3, 5), 16)}, ${parseInt(tokens.colors.semantic.error.slice(5, 7), 16)}, 0.2)`,
      paddingInline: parseInt(tokens.spacing[3]),
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32
    },
    
    Select: {
      optionSelectedBg: tokens.colors.brand.primaryLight,
      optionSelectedColor: tokens.colors.brand.primary,
      optionActiveBg: tokens.colors.brand.primaryLight,
      borderRadius: parseInt(tokens.radii.md),
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      boxShadow: tokens.shadows.md
    },
    
    DatePicker: {
      cellActiveWithRangeBg: tokens.colors.brand.primaryLight,
      cellHoverWithRangeBg: `${tokens.colors.brand.primary}20`,
      cellRangeBorderColor: tokens.colors.brand.primary,
      timeColumnHeight: 224,
      cellHeight: 32,
      borderRadius: parseInt(tokens.radii.md),
      cellRangeBorderRadius: parseInt(tokens.radii.sm)
    },
    
    Modal: {
      paddingMD: parseInt(tokens.spacing[6]),
      headerPaddingVertical: parseInt(tokens.spacing[4]),
      headerFontSize: parseInt(tokens.typography.fontSize.xl),
      headerBg: tokens.colors.neutral[50],
      contentBg: tokens.colors.neutral[50],
      titleFontSize: parseInt(tokens.typography.fontSize.xl),
      titleLineHeight: 1.5,
      borderRadius: parseInt(tokens.radii.lg),
      footerBg: tokens.colors.neutral[50]
    },
    
    Tabs: {
      cardBg: tokens.colors.neutral[100],
      cardHeight: 40,
      cardPadding: `0 ${tokens.spacing[4]}`,
      cardGutter: parseInt(tokens.spacing[2]),
      itemSelectedColor: tokens.colors.brand.primary,
      itemHoverColor: tokens.colors.brand.primary,
      itemActiveColor: tokens.colors.brand.primary,
      inkBarColor: tokens.colors.brand.primary,
      horizontalItemPadding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
      horizontalItemMargin: `0 ${tokens.spacing[2]} 0 0`,
      titleFontSize: parseInt(tokens.typography.fontSize.md)
    },
    
    Tooltip: {
      colorBgDefault: tokens.colors.neutral[800],
      borderRadius: parseInt(tokens.radii.md),
      zIndexPopup: tokens.zIndices.popover
    },
    
    Message: {
      contentPadding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
      contentBg: tokens.colors.neutral[800],
      contentBorderRadius: parseInt(tokens.radii.md)
    },
    
    Notification: {
      paddingVertical: parseInt(tokens.spacing[4]),
      paddingHorizontal: parseInt(tokens.spacing[4]),
      width: 384,
      borderRadius: parseInt(tokens.radii.md),
      boxShadow: tokens.shadows.lg,
      colorBgElevated: tokens.colors.neutral[50]
    },
    
    Tag: {
      defaultBg: `${tokens.colors.brand.primary}10`,
      defaultColor: tokens.colors.brand.primary,
      borderRadiusSM: parseInt(tokens.radii.sm),
      lineHeight: 1.5
    }
  }
};

export default antTheme;