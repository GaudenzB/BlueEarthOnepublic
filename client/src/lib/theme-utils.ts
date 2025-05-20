/**
 * Theme Utilities for BlueEarthOne Portal
 * 
 * This file provides utility functions to help consistently apply the design tokens
 * across the application, making it easier to maintain a cohesive design system.
 */

import { cn } from "@/lib/utils";
import { 
  blueEarthTheme,
  type ThemeSpacingKey,
  type ThemeShadowKey,
  type ThemeZIndexKey,
  type ThemeFontSizeKey,
  type ThemeFontWeightKey,
  type ThemeBorderRadiusKey
} from "@/theme/blueearth-theme";

/**
 * Apply theme-based spacing values
 * @param size The spacing size key from the theme
 * @returns The spacing value
 */
export function spacing(size: ThemeSpacingKey): string {
  return blueEarthTheme.spacing[size];
}

/**
 * Apply theme-based shadow values
 * @param size The shadow size key from the theme
 * @returns The shadow value
 */
export function shadow(size: ThemeShadowKey): string {
  return blueEarthTheme.shadow[size];
}

/**
 * Apply theme-based z-index values
 * @param layer The z-index layer key from the theme
 * @returns The z-index value
 */
export function zIndex(layer: ThemeZIndexKey): number {
  return blueEarthTheme.zIndex[layer];
}

/**
 * Apply theme-based font size values
 * @param size The font size key from the theme
 * @returns The font size value
 */
export function fontSize(size: ThemeFontSizeKey): string {
  return blueEarthTheme.fontSize[size];
}

/**
 * Apply theme-based font weight values
 * @param weight The font weight key from the theme
 * @returns The font weight value
 */
export function fontWeight(weight: ThemeFontWeightKey): string {
  return blueEarthTheme.fontWeight[weight];
}

/**
 * Apply theme-based border radius values
 * @param size The border radius key from the theme
 * @returns The border radius value
 */
export function borderRadius(size: ThemeBorderRadiusKey): string {
  return blueEarthTheme.borderRadius[size];
}

/**
 * Theme-aware className utility that combines class names with theme values
 * It extends the cn utility from shadcn/ui
 * 
 * @param classes ClassValue[] to be processed
 * @returns The combined class string
 */
export function themeClass(...classes: any[]): string {
  return cn(...classes as any[]);
}

/**
 * Theme constants to be used across the application
 */
export const themeConstants = {
  headerHeight: '64px',
  sidebarWidth: '260px',
  sidebarCollapsedWidth: '80px',
  mainContentMaxWidth: '1320px'
};

/**
 * Common style combinations for reuse across components
 */
export const themeStyles = {
  card: themeClass(
    "bg-card text-card-foreground rounded-md border border-border shadow-sm",
    "p-md"
  ),
  section: themeClass(
    "bg-background rounded-md border border-border",
    "p-lg"
  ),
  button: {
    primary: themeClass(
      "bg-primary text-primary-foreground hover:bg-primary/90",
      "rounded-md font-medium"
    ),
    secondary: themeClass(
      "bg-secondary text-secondary-foreground hover:bg-secondary/90",
      "rounded-md font-medium"
    ),
    outline: themeClass(
      "bg-background border border-input hover:bg-accent hover:text-accent-foreground",
      "rounded-md font-medium"
    ),
    ghost: themeClass(
      "hover:bg-accent hover:text-accent-foreground",
      "rounded-md font-medium"
    ),
    destructive: themeClass(
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      "rounded-md font-medium"
    ),
  }
};

/**
 * Media query breakpoints for responsive design
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};