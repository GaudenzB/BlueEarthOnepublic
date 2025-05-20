/**
 * Core Common Utilities
 * 
 * This file exports all utility functions that are shared
 * between client and server code.
 */

// Export validation utilities
export * from './validation';

// Export formatting utilities
export * from './formatting';

// Export TypeScript helpers
export * from './ts-helpers';

// Export form helpers
export * from './form-helpers';

// Export authentication helpers
export * from './auth-helpers';

// Export debug helpers
export * from './debug-helpers';

// Export data transformation utilities
// Note: We're using selective exports to avoid naming conflicts
import * as DataTransform from './data-transform';
export const {
  snakeToCamel,
  camelToSnake,
  slugify,
  groupBy,
  flattenObject,
  unflattenObject,
  pick,
  omit
} = DataTransform;