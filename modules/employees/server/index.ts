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
 * in one call, like: await setupEmployeeModule(app)
 * 
 * @param app Express application instance
 * @returns Promise resolving to the employee module instance
 */
export async function setupEmployeeModule(app: any) {
  try {
    // Register all employee routes
    registerEmployeeRoutes(app);
    
    // Calculate sync interval from environment configuration or use default
    const syncIntervalMinutes = process.env["EMPLOYEE_SYNC_INTERVAL_MINUTES"] 
      ? parseInt(process.env["EMPLOYEE_SYNC_INTERVAL_MINUTES"], 10)
      : 60; // Default to hourly if not specified
    
    // Schedule regular employee synchronization
    // Only if we're in a production or staging environment
    if (process.env["NODE_ENV"] === 'production' || process.env["NODE_ENV"] === 'staging') {
      employeeService.scheduleEmployeeSync(syncIntervalMinutes);
    }
    
    // Perform initial synchronization of employee data if needed
    const isDevelopment = process.env["NODE_ENV"] === 'development';
    const shouldSyncOnStartup = process.env["SYNC_EMPLOYEES_ON_STARTUP"] === 'true';
    
    if (shouldSyncOnStartup || isDevelopment) {
      try {
        // Perform initial sync but don't await it to avoid blocking startup
        void employeeService.syncEmployeesFromBubble().then(results => {
          console.log('Initial employee sync complete:', results);
        }).catch(error => {
          console.error('Initial employee sync failed:', error);
        });
      } catch (error) {
        console.error('Failed to initialize employee sync:', error);
        // Non-critical error, continue with module initialization
      }
    }
    
    return {
      controller: employeeController,
      service: employeeService,
      bubbleApiService
    };
  } catch (error) {
    console.error('Failed to initialize employee module:', error);
    // Re-throw to allow proper error handling in the main initialization function
    throw error;
  }
}