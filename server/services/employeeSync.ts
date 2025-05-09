import { storage } from '../storage';
import { getEmployeesFromBubble } from './bubbleApi';
import { Employee } from '@shared/schema';

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
          console.warn('Skipping employee with no email address');
          continue;
        }
        
        const email = bubbleEmployee.email.toLowerCase();
        const existingEmployee = employeesByEmail[email];
        
        if (existingEmployee) {
          // Employee exists, check if we need to update
          if (
            existingEmployee.name !== bubbleEmployee.name ||
            existingEmployee.position !== bubbleEmployee.position ||
            existingEmployee.department !== bubbleEmployee.department ||
            existingEmployee.location !== bubbleEmployee.location ||
            existingEmployee.phone !== bubbleEmployee.phone ||
            existingEmployee.avatarUrl !== bubbleEmployee.avatarUrl ||
            existingEmployee.status !== bubbleEmployee.status
          ) {
            // Update employee
            await storage.updateEmployee(existingEmployee.id, bubbleEmployee);
            stats.updated++;
          } else {
            // No changes needed
            stats.unchanged++;
          }
        } else {
          // Create new employee
          await storage.createEmployee(bubbleEmployee);
          stats.created++;
        }
      } catch (error) {
        console.error('Error processing employee:', error);
        stats.errors++;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error syncing employees from Bubble.io:', error);
    throw error;
  }
}

/**
 * Schedule regular employee syncs
 * @param intervalMinutes Interval in minutes between syncs
 */
export function scheduleEmployeeSync(intervalMinutes: number = 60): NodeJS.Timeout {
  console.log(`Scheduling employee sync every ${intervalMinutes} minutes`);
  
  // Run an initial sync
  syncEmployeesFromBubble()
    .then(stats => {
      console.log('Initial employee sync completed:', stats);
    })
    .catch(error => {
      console.error('Initial employee sync failed:', error);
    });
    
  // Schedule recurring syncs
  return setInterval(() => {
    syncEmployeesFromBubble()
      .then(stats => {
        console.log('Scheduled employee sync completed:', stats);
      })
      .catch(error => {
        console.error('Scheduled employee sync failed:', error);
      });
  }, intervalMinutes * 60 * 1000);
}