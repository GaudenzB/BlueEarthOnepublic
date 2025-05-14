/**
 * BlueEarth Capital color palette
 * 
 * This file is deprecated and will be replaced with the theme system.
 * For new components, please import from theme.ts instead.
 * This file remains for backward compatibility.
 */
import { colors as themeColors } from './theme';

// Define backwards-compatible color values
export const colors = {
  // Primary Colors
  primary: {
    base: themeColors.primary.navy, // Deep navy blue for headers, sidebars, primary buttons
    hover: "#3F4F6F", // Higher contrast navy for hover and active states
    light: themeColors.primary.blue, // Softer navy for accents, borders, backgrounds
    ultraLight: themeColors.backgroundLight, // Very light tone for secondary backgrounds
  },
  
  // Typography
  text: {
    primary: "#FFFFFF", // White text for dark backgrounds
    body: themeColors.secondary.charcoal, // Default dark text for light backgrounds
    muted: themeColors.secondary.slate, // Secondary or de-emphasized content
  },
  
  // Accent Colors
  accent: {
    success: themeColors.status.active, // Green for confirming actions or positive status
    warning: themeColors.status.warning, // Amber for alerts and cautions
    error: themeColors.status.error, // Red for destructive actions or errors
    info: themeColors.status.pending, // Blue for highlights or informational messages
  },
  
  // Backgrounds and Neutrals
  background: {
    base: themeColors.backgroundDark, // Default background for pages and content
    sidebar: themeColors.primary.navy, // Very dark navy for navigation panels
    divider: themeColors.border, // Soft grey for separating content
    card: themeColors.backgroundLight, // White for content presentation in cards
    hover: "#435D85" // High contrast hover for dark sidebar/navbar elements
  }
};