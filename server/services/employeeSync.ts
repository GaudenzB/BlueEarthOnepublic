import { storage } from '../storage';
import { getEmployeesFromBubble } from './bubbleApi';
import { Employee, employeeStatusEnum, insertEmployeeSchema } from '@shared/schema';
import { logger } from '../utils/logger';

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
    const bubbleEmployees = await getEmployeesFromBubble();
    stats.totalEmployees = bubbleEmployees.length;
    
    // Log a sample of the first employee to see its structure
    if (bubbleEmployees.length > 0) {
      const firstEmployee = bubbleEmployees[0];
      
      // Log specific fields individually for better debugging
      logger.debug('First Bubble employee data (name):', { name: firstEmployee.name });
      logger.debug('First Bubble employee data (email):', { email: firstEmployee.email });
      logger.debug('First Bubble employee data (status):', { status: firstEmployee.status });
      logger.debug('First Bubble employee data (status type):', { statusType: typeof firstEmployee.status });
      
      // Also add more error catching
      try {
        // Attempt to parse this status with our enum to see if that's the issue
        const validStatus = employeeStatusEnum.parse(firstEmployee.status);
        logger.debug('Status validation successful:', { validStatus });
      } catch (error) {
        logger.error('Status validation failed:', { 
          status: firstEmployee.status,
          error: error instanceof Error ? error.message : String(error)
        });
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
            existingEmployee.location !== bubbleEmployee.location ||
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
            
            // Validate employee data before update
            try {
              // Create a partial schema for update operations
              const updateEmployeeSchema = insertEmployeeSchema.partial();
              const validEmployee = updateEmployeeSchema.parse(bubbleEmployee);
              
              await storage.updateEmployee(existingEmployee.id, validEmployee);
              stats.updated++;
            } catch (validationError) {
              logger.error('Employee update validation failed:', {
                id: existingEmployee.id,
                email,
                error: validationError instanceof Error ? validationError.message : String(validationError),
                status: bubbleEmployee.status
              });
              stats.errors++;
            }
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
          
          // Ensure the employee data is valid before creating
          try {
            // This will throw if any required fields are missing or invalid
            const validEmployee = insertEmployeeSchema.parse(bubbleEmployee);
            await storage.createEmployee(validEmployee);
            stats.created++;
          } catch (validationError) {
            logger.error('Employee validation failed:', {
              email,
              error: validationError instanceof Error ? validationError.message : String(validationError),
              employee: {
                name: bubbleEmployee.name,
                email: bubbleEmployee.email,
                status: bubbleEmployee.status,
                department: bubbleEmployee.department,
              }
            });
            stats.errors++;
          }
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