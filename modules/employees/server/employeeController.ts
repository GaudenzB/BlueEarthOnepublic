import { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../../../server/storage';
import { logger } from '../../../server/utils/logger';
import { departmentEnum, employeeStatusEnum, insertEmployeeSchema } from '@blueearth/core/schemas';
import { createSuccessResponse, createErrorResponse } from '@blueearth/core/utils';

/**
 * Get all employees
 */
export async function getAllEmployees(req: Request, res: Response) {
  try {
    // Define schema for query parameters
    const employeeQuerySchema = z.object({
      query: z.object({
        search: z.string().optional(),
        department: departmentEnum.optional(),
        status: employeeStatusEnum.optional()
      })
    });
    
    // Validate query parameters
    try {
      await employeeQuerySchema.parseAsync({
        query: req.query
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.reduce((acc: Record<string, string[]>, curr) => {
          const path = curr.path.join('.').replace(/^query\./, '');
          if (!acc[path]) acc[path] = [];
          acc[path].push(curr.message);
          return acc;
        }, {});
        
        logger.debug({ 
          path: req.path, 
          errors: formattedErrors 
        }, 'Query parameter validation error');
        
        return res.status(400).json(createErrorResponse('Invalid query parameters', formattedErrors));
      }
      throw error;
    }
    
    // Get sanitized parameters
    const search = req.query.search as string;
    const department = req.query.department as string;
    const status = req.query.status as string;
    
    let employees;
    
    if (search) {
      employees = await storage.searchEmployees(search);
    } else if (department) {
      employees = await storage.filterEmployeesByDepartment(department);
    } else if (status) {
      employees = await storage.filterEmployeesByStatus(status);
    } else {
      employees = await storage.getAllEmployees();
    }
    
    return res.json(createSuccessResponse(employees));
  } catch (error) {
    logger.error({ error }, "Failed to get employees");
    return res.status(500).json(createErrorResponse("Failed to get employees"));
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    // Log detailed request information
    logger.info({
      employeeId: id,
      requestId: req.headers['x-request-id'] || 'none',
      authHeader: !!req.headers.authorization,
      userId: req.user?.id || 'not-authenticated'
    }, `Employee detail request received for ID ${id}`);
    
    // Disable response caching for this endpoint
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    
    const employee = await storage.getEmployee(id);
    
    // Log detailed response information
    logger.info({
      employeeId: id,
      employeeFound: !!employee,
      employeeName: employee?.firstName || 'unknown',
      employeeDepartment: employee?.department || 'unknown',
    }, `Employee detail response for ID ${id}`);
    
    if (!employee) {
      return res.status(404).json(createErrorResponse("Employee not found"));
    }
    
    return res.json(createSuccessResponse(employee));
  } catch (error) {
    logger.error({ employeeId: req.params.id, error }, "Error retrieving employee");
    return res.status(500).json(createErrorResponse("Failed to get employee"));
  }
}

/**
 * Create a new employee
 */
export async function createEmployee(req: Request, res: Response) {
  try {
    // We're assuming the body has already been validated by middleware
    const validatedData = req.body;
    
    // Log the validated employee data
    logger.debug('Creating employee with validated data', {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      department: validatedData.department,
      status: validatedData.status
    });
    
    const employee = await storage.createEmployee(validatedData);
    
    return res.status(201).json(createSuccessResponse(employee, "Employee created successfully"));
  } catch (error) {
    logger.error({ error }, "Error creating employee");
    return res.status(500).json(createErrorResponse("Failed to create employee"));
  }
}

/**
 * Update an employee
 */
export async function updateEmployee(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    // Create a partial schema based on the insertEmployeeSchema 
    // to validate update operations for complete type safety
    const updateEmployeeSchema = insertEmployeeSchema.partial();
    
    // Validate request
    const validatedData = await updateEmployeeSchema.parseAsync(req.body);
    
    // Log the update operation
    logger.debug('Updating employee', {
      id,
      fields: Object.keys(validatedData),
    });
    
    const employee = await storage.updateEmployee(id, validatedData);
    
    if (!employee) {
      return res.status(404).json(createErrorResponse("Employee not found"));
    }
    
    return res.json(createSuccessResponse(employee, "Employee updated successfully"));
  } catch (error) {
    logger.error({ employeeId: req.params.id, error }, "Error updating employee");
    return res.status(500).json(createErrorResponse("Failed to update employee"));
  }
}

/**
 * Delete an employee
 */
export async function deleteEmployee(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteEmployee(id);
    
    if (!success) {
      return res.status(404).json(createErrorResponse("Employee not found"));
    }
    
    logger.info({ employeeId: id, deletedBy: req.user!.id }, "Employee deleted");
    return res.json(createSuccessResponse(null, "Employee deleted successfully"));
  } catch (error) {
    logger.error({ employeeId: req.params.id, error }, "Error deleting employee");
    return res.status(500).json(createErrorResponse("Failed to delete employee"));
  }
}