/**
 * Re-export all public server APIs
 */
export * from './server';

/**
 * Re-export all shared types, constants, and utilities
 */
export * from './shared';

/**
 * This file serves as the main entry point for the employee module.
 * It re-exports all public APIs from the server and shared directories.
 * 
 * When importing from this module, you can use:
 * 
 * import { setupEmployeeModule, EMPLOYEE_ROUTES } from 'modules/employees';
 * 
 * instead of:
 * 
 * import { setupEmployeeModule } from 'modules/employees/server';
 * import { EMPLOYEE_ROUTES } from 'modules/employees/shared';
 */