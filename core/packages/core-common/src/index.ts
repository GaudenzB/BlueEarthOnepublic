/**
 * Core Common Package
 * 
 * This package contains common types, schemas, and utilities
 * that are shared between client and server code.
 */

// Export all schemas through a namespace to avoid conflicts
import * as Schemas from './schemas';
export { Schemas };

// Export utility types and functions
export * from './utils';

// Export common types
export * from './types';

// Export constants
// export * from './constants';