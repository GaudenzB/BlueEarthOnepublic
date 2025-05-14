/**
 * Ant Design Theme Configuration
 * 
 * This file configures the Ant Design theme to match our financial services aesthetic.
 * It overrides default Ant Design tokens with our custom values.
 */
import { theme } from '../lib/theme';
import type { ThemeConfig } from 'antd';

/**
 * Ant Design theme configuration
 * See: https://ant.design/docs/react/customize-theme
 */
export const antThemeConfig: ThemeConfig = {
  token: {
    // Colors
    colorPrimary: theme.colors.primary.base,
    colorSuccess: theme.colors.status.success,
    colorWarning: theme.colors.status.warning,
    colorError: theme.colors.status.error,
    colorInfo: theme.colors.status.info,
    
    // Typography
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    
    // Border radius
    borderRadius: 6,
    
    // Spacing
    padding: 16,
    margin: 16,
    
    // Border color
    colorBorder: theme.colors.border.light,
    
    // Text colors
    colorText: theme.colors.text.primary,
    colorTextSecondary: theme.colors.text.secondary,
    colorTextTertiary: theme.colors.text.muted,
    
    // Background colors
    colorBgContainer: theme.colors.background.card,
    colorBgElevated: theme.colors.background.card,
    colorBgLayout: theme.colors.background.page,
    
    // Style settings
    wireframe: false, // Set to true for a more minimalistic style
  },
  
  // Component specific overrides
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 40,
      paddingContentHorizontal: 16,
      fontSize: 14,
      fontWeight: 500,
    },
    Card: {
      borderRadius: 8,
      boxShadow: theme.shadows.sm,
      colorBorderSecondary: theme.colors.border.light,
      padding: 24,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 40,
      paddingInline: 12,
      colorBorder: theme.colors.border.default,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 40,
      colorBorder: theme.colors.border.default,
    },
    Table: {
      borderRadius: 8,
      headerBg: theme.colors.background.subtle,
      headerColor: theme.colors.text.primary,
      fontWeightStrong: 600,
      fontSize: 14,
      paddingContentVertical: 16,
      paddingContentHorizontal: 16,
    },
    Pagination: {
      borderRadius: 6,
      colorPrimary: theme.colors.primary.base,
      colorBgContainer: theme.colors.background.card,
    },
    Modal: {
      borderRadius: 8,
      padding: 24,
      titleFontSize: 18,
    },
    Menu: {
      colorItemBg: 'transparent',
      colorItemText: theme.colors.text.primary,
      colorItemTextSelected: theme.colors.primary.base,
      colorItemBgSelected: theme.colors.background.selected,
      colorItemBgHover: theme.colors.background.selected,
      borderRadius: 6,
    },
    Tabs: {
      colorPrimary: theme.colors.primary.base,
      colorBorder: theme.colors.border.light,
      margin: 0,
    },
    Tooltip: {
      colorBgDefault: theme.colors.text.primary,
    },
    Typography: {
      colorText: theme.colors.text.primary,
      colorTextSecondary: theme.colors.text.secondary,
    }
  },
};

export default antThemeConfig;