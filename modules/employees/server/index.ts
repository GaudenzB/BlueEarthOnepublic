import * as employeeControllerFunctions from './employeeController';
import { bubbleApiService } from './bubbleApiService';
import { employeeService } from './employeeService';
import { registerEmployeeRoutes } from './employeeRoutes';

/**
 * Export the employee controller functions as an object
 * This allows us to use them like 'employeeController.functionName'
 * from other files like the routes.ts file
 */
export const employeeController = employeeControllerFunctions;

/**
 * Export all the employee related services, controllers and routes
 */
export {
  bubbleApiService,
  employeeService,
  registerEmployeeRoutes,
};

/**
 * This is the main export from the employee module
 * It allows consuming code to set up all employee functionality
 * in one call, like: setupEmployeeModule(app)
 */
export function setupEmployeeModule(app: any) {
  // Register all employee routes
  registerEmployeeRoutes(app);
  
  // Calculate sync interval from environment configuration or use default
  const syncIntervalMinutes = process.env.EMPLOYEE_SYNC_INTERVAL_MINUTES 
    ? parseInt(process.env.EMPLOYEE_SYNC_INTERVAL_MINUTES, 10)
    : 60; // Default to hourly if not specified
  
  // Schedule regular employee synchronization
  // Only if we're in a production or staging environment
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    employeeService.scheduleEmployeeSync(syncIntervalMinutes);
  }
  
  return {
    controller: employeeController,
    service: employeeService,
    bubbleApiService
  };
}