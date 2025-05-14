/**
 * BlueEarth Capital color palette
 * 
 * This file is deprecated and will be replaced with the theme system.
 * For new components, please import from theme.ts instead.
 * This file remains for backward compatibility.
 */
import { theme } from './theme';

export const colors = {
  // Primary Colors
  primary: {
    base: theme.brand[700], // Deep navy blue for headers, sidebars, primary buttons
    hover: "#3F4F6F", // Higher contrast navy for hover and active states
    light: theme.brand[600], // Softer navy for accents, borders, backgrounds
    ultraLight: theme.brand[100], // Very light tone for secondary backgrounds
  },
  
  // Typography
  text: {
    primary: "#FFFFFF", // White text for dark backgrounds
    body: theme.gray[900], // Default dark text for light backgrounds
    muted: theme.gray[600], // Secondary or de-emphasized content
  },
  
  // Accent Colors
  accent: {
    success: theme.status.success.base, // Green for confirming actions or positive status
    warning: theme.status.warning.base, // Amber for alerts and cautions
    error: theme.status.error.base, // Red for destructive actions or errors
    info: theme.status.info.base, // Blue for highlights or informational messages
  },
  
  // Backgrounds and Neutrals
  background: {
    base: theme.gray[50], // Default background for pages and content
    sidebar: theme.brand[900], // Very dark navy for navigation panels
    divider: theme.gray[200], // Soft grey for separating content
    card: "#FFFFFF", // White for content presentation in cards
    hover: "#435D85" // High contrast hover for dark sidebar/navbar elements
  }
};