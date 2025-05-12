import { colors } from './colors';
import { spacingSystem } from './spacing';
import { typography } from './typography';

/**
 * Export all theme-related constants
 */
export const theme = {
  colors,
  ...spacingSystem,
  ...typography,
};

export * from './colors';
export * from './spacing';
export * from './typography';