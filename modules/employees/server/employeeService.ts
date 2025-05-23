import { storage } from '../../../server/storage';
import { logger } from '../../../server/utils/logger';
import { Employee, InsertEmployee, employeeStatusEnum } from '@shared/schema';
import { bubbleApiService } from './bubbleApiService';

/**
 * Sync employees from Bubble.io to our application database
 * Returns statistics about the sync operation
 */
export async function syncEmployeesFromBubble(): Promise<{
  totalEmployees: number;
  created: number;
  updated: number;
  unchanged: number;
  errors: number;
}> {
  // Stats to return
  const stats = {
    totalEmployees: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    errors: 0
  };
  
  try {
    // Get all employees from Bubble.io
    const bubbleEmployees = await bubbleApiService.getEmployeesFromBubble();
    stats.totalEmployees = bubbleEmployees.length;
    
    // Log a sample of the first employee to see its structure
    if (bubbleEmployees.length > 0) {
      const firstEmployee = bubbleEmployees[0];
      
      // Log specific fields individually for better debugging
      if (firstEmployee) {
        logger.debug('First Bubble employee data (name):', { 
          name: firstEmployee.name || 'undefined' 
        });
        logger.debug('First Bubble employee data (email):', { 
          email: firstEmployee.email || 'undefined' 
        });
        logger.debug('First Bubble employee data (status):', { 
          status: firstEmployee.status || 'undefined' 
        });
        
        // Also add more error catching
        try {
          // Attempt to parse this status with our enum to see if that's the issue
          if (firstEmployee.status) {
            const validStatus = employeeStatusEnum.parse(firstEmployee.status);
            logger.debug('Status validation successful:', { validStatus });
          } else {
            logger.warn('Cannot validate empty status field');
          }
        } catch (error) {
          logger.error('Status validation failed:', { 
            status: firstEmployee.status || 'undefined',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      } else {
        logger.warn('First employee in array is undefined');
      }
    }
    
    // Get all existing employees from our database
    const existingEmployees = await storage.getAllEmployees();
    
    // Map existing employees by email for quick lookup
    const employeesByEmail = existingEmployees.reduce<Record<string, Employee>>((acc, emp) => {
      if (emp.email) {
        acc[emp.email.toLowerCase()] = emp;
      }
      return acc;
    }, {});
    
    // Process each employee from Bubble.io
    for (const bubbleEmployee of bubbleEmployees) {
      try {
        if (!bubbleEmployee.email) {
          logger.warn('Skipping employee with no email address');
          continue;
        }
        
        const email = bubbleEmployee.email.toLowerCase();
        const existingEmployee = employeesByEmail[email];
        
        if (existingEmployee) {
          // Employee exists, check if we need to update
          const needsUpdate = 
            existingEmployee.name !== bubbleEmployee.name ||
            existingEmployee.position !== bubbleEmployee.position ||
            existingEmployee.department !== bubbleEmployee.department ||
            existingEmployee.phone !== bubbleEmployee.phone ||
            existingEmployee.avatarUrl !== bubbleEmployee.avatarUrl ||
            existingEmployee.status !== bubbleEmployee.status;
          
          if (needsUpdate) {
            // Update employee
            logger.debug('Updating existing employee', { 
              employeeId: existingEmployee.id,
              email: email,
              status: bubbleEmployee.status
            });
            
            await storage.updateEmployee(existingEmployee.id, bubbleEmployee);
            stats.updated++;
          } else {
            // No changes needed
            logger.debug('Employee unchanged', { 
              employeeId: existingEmployee.id,
              email: email 
            });
            stats.unchanged++;
          }
        } else {
          // Create new employee
          logger.info('Creating new employee', { 
            email: email,
            name: bubbleEmployee.name,
            status: bubbleEmployee.status
          });
          
          await storage.createEmployee(bubbleEmployee);
          stats.created++;
        }
      } catch (error) {
        logger.error('Error processing employee:', { 
          error: error instanceof Error ? error.message : String(error),
          employeeEmail: bubbleEmployee.email
        });
        stats.errors++;
      }
    }
    
    logger.info('Employee sync completed', { stats });
    return stats;
  } catch (error) {
    // Log the complete error details
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error syncing employees from Bubble.io:', { errorMessage });
    
    // Log the error directly to console as well for maximum visibility
    console.error('Employee sync error:', errorMessage);
    
    // Add a stack trace if available
    if (error instanceof Error && error.stack) {
      logger.error('Error stack trace:', { stack: error.stack });
    }
    
    throw error;
  }
}

/**
 * Schedule regular employee syncs
 * @param intervalMinutes Interval in minutes between syncs
 */
export function scheduleEmployeeSync(intervalMinutes: number = 60): NodeJS.Timeout {
  logger.info(`Scheduling employee sync every ${intervalMinutes} minutes`);
  
  // Run an initial sync
  syncEmployeesFromBubble()
    .then(stats => {
      logger.info('Initial employee sync completed', { stats });
    })
    .catch(error => {
      logger.error('Initial employee sync failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    });
    
  // Schedule recurring syncs
  return setInterval(() => {
    logger.info('Running scheduled employee sync');
    
    syncEmployeesFromBubble()
      .then(stats => {
        logger.info('Scheduled employee sync completed', { stats });
      })
      .catch(error => {
        logger.error('Scheduled employee sync failed', {
          error: error instanceof Error ? error.message : String(error),
          nextRetry: `${intervalMinutes} minutes`
        });
      });
  }, intervalMinutes * 60 * 1000);
}

// Export the employee service functions 
export const employeeService = {
  syncEmployeesFromBubble,
  scheduleEmployeeSync
};