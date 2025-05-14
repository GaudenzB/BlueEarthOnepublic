/**
 * BlueEarth Capital color palette
 * 
 * This file is deprecated and will be replaced with the theme system.
 * For new components, please import from theme.ts instead.
 * This file remains for backward compatibility.
 */

// Define backwards-compatible color values
export const colors = {
  // Primary Colors
  primary: {
    base: '#0e4a86', // Deep blue for headers, sidebars, primary buttons
    hover: '#1e63a5', // Higher contrast blue for hover and active states
    light: '#f0f7ff', // Softer blue for accents, borders, backgrounds
    dark: '#0a3a68', // Darker blue for active states
  },
  
  // Typography
  text: {
    primary: '#1e293b', // Dark text for light backgrounds
    secondary: '#64748b', // Secondary text color
    muted: '#94a3b8', // De-emphasized content
    inverse: '#ffffff', // White text for dark backgrounds
  },
  
  // Accent Colors
  accent: {
    success: '#10b981', // Green for confirming actions or positive status
    warning: '#f59e0b', // Amber for alerts and cautions
    error: '#ef4444', // Red for destructive actions or errors
    info: '#3b82f6', // Blue for highlights or informational messages
    draft: '#94a3b8', // Gray for draft status
  },
  
  // Status Colors (for compatibility)
  status: {
    active: '#10b981', // Green for active status
    inactive: '#ef4444', // Red for inactive status
    pending: '#f59e0b', // Amber for pending status
    completed: '#10b981', // Green for completed status
    in_review: '#3b82f6', // Blue for in review status
    approved: '#10b981', // Green for approved status
    rejected: '#ef4444', // Red for rejected status
    draft: '#94a3b8', // Gray for draft status
  },
  
  // Backgrounds and Neutrals
  background: {
    page: '#f9fafc', // Default background for pages and content
    card: '#ffffff', // White for content presentation in cards
    subtle: '#f8fafc', // Soft gray for secondary backgrounds
    selected: '#f0f7ff', // Light blue for selected items
    hover: '#f0f7ff', // Light blue for hover states
  },
  
  // Borders
  border: {
    light: '#eaecf0',
    default: '#d1d5db',
    focus: '#0e4a86',
  }
};