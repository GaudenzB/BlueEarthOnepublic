import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, isSuperAdmin } from '../../../server/auth';
import { validate, validateIdParameter } from '../../../server/middleware/validation';
import { logger } from '../../../server/utils/logger';
import { sendSuccess, sendError } from '../../../server/utils/apiResponse';
import { employeeService } from './employeeService';
import { employeeController } from './index';
import { insertEmployeeSchema } from '../../../core/src/schemas/employee';

/**
 * Register all employee-related routes
 */
export function registerEmployeeRoutes(app: Express) {
  // Get all employees - temporarily disable authentication for debugging
  app.get("/api/employees", employeeController.getAllEmployees);
  
  // Get employee by ID
  app.get("/api/employees/:id", authenticate, validateIdParameter(), employeeController.getEmployeeById);
  
  // Create employee (manual entry, not via Bubble sync)
  app.post("/api/employees", 
    authenticate, 
    validate(z.object({ body: insertEmployeeSchema })), 
    employeeController.createEmployee
  );
  
  // Update employee
  app.patch("/api/employees/:id", 
    authenticate, 
    validateIdParameter(), 
    employeeController.updateEmployee
  );
  
  // Delete employee
  app.delete("/api/employees/:id", 
    authenticate, 
    validateIdParameter(), 
    employeeController.deleteEmployee
  );
  
  // Trigger manual employee sync from Bubble.io
  app.post("/api/sync/employees", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      // Check if the Bubble API key is configured
      if (!process.env["BUBBLE_API_KEY"]) {
        logger.error("Bubble API key not configured");
        return sendError(res, "External API key not configured", 400);
      }
      
      logger.info({ initiatedBy: req.user!.id }, "Manual employee sync initiated");
      const result = await employeeService.syncEmployeesFromBubble();
      
      logger.info({ 
        totalEmployees: result.totalEmployees,
        created: result.created,
        updated: result.updated,
        unchanged: result.unchanged,
        errors: result.errors
      }, "Employee sync completed");
      
      return sendSuccess(res, {
        totalEmployees: result.totalEmployees,
        created: result.created,
        updated: result.updated,
        unchanged: result.unchanged,
        errors: result.errors
      }, "Employee sync completed successfully");
      
    } catch (error) {
      logger.error({ error }, "Employee sync error");
      return sendError(res, "Failed to sync employees from external system", 500);
    }
  });
}