/**
 * Core Server Package
 * 
 * This package contains server-specific code, models,
 * database schemas, and utilities for the backend.
 */

// Import common package
import * as coreCommon from '@blueearth/core-common';

// Re-export common for convenience
export { coreCommon };

// Export server utilities when created
// export * from './utils';

// Export server models
export * from './models';

// Export server validation when created
// export * from './validation';