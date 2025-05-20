import { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../../../server/storage';
import { logger } from '../../../server/utils/logger';
import { departmentEnum, employeeStatusEnum, insertEmployeeSchema } from '@shared/schema';
import { employeeStatusEnum as coreEmployeeStatusEnum } from '../../../core/packages/core-common/src/schemas/employee';
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  sendNotFound, 
  sendServerError 
} from '../../../server/utils/apiResponse';
import { ErrorCode, HttpStatus } from '../../../core/packages/core-common/src/types/api';

/**
 * Maps the core schema status values to the shared schema status values
 * This helps maintain compatibility between the two different enum definitions
 */
function mapCoreStatusToSharedStatus(coreStatus?: string): "active" | "inactive" | "on_leave" | "remote" | undefined {
  if (!coreStatus) return undefined;
  
  // Map from uppercase format to lowercase with underscores
  switch (coreStatus.toUpperCase()) {
    case "ACTIVE": // Fall through
       return "active";
    case "INACTIVE": // Fall through
       return "inactive";
    case "ON_LEAVE": // Fall through
       return "on_leave";
    case "CONTRACT": // Fall through
       // Fall through
    case "INTERN": // Fall through
       return "active"; // Consider contractors and interns as active employees
    default: return undefined;
  }
}

/**
 * Get all employees
 */
export async function getAllEmployees(req: Request, res: Response) {
  try {
    // Disable response caching for this endpoint
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    
    // Define schema for query parameters
    const employeeQuerySchema = z.object({
      query: z.object({
        search: z.string().optional(),
        department: departmentEnum.optional(),
        status: employeeStatusEnum.optional(),
        _t: z.string().optional() // Allow cache-busting timestamp parameter
      })
    });
    
    // Validate query parameters
    try {
      await employeeQuerySchema.parseAsync({
        query: req.query
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.debug({ 
          path: req.path, 
          errors: error.format()
        }, 'Query parameter validation error');
        
        return sendValidationError(res, error);
      }
      throw error;
    }
    
    // Get sanitized parameters
    const search = req.query['search'] as string;
    const department = req.query['department'] as string;
    const status = req.query['status'] as string;
    
    // Log the query including cache-buster parameter if present
    logger.debug({
      requestPath: req.path,
      search,
      department,
      status,
      cacheBuster: req.query['_t']
    }, 'Employee list request received');
    
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
    
    // Debugging - log employee count
    logger.debug({
      employeeCount: employees?.length || 0,
      isArray: Array.isArray(employees),
      sampleEmployee: employees && Array.isArray(employees) && employees.length > 0 
        ? { 
            id: typeof employees[0]?.id === 'string' ? employees[0].id : 'unknown',
            name: typeof employees[0]?.name === 'string' ? employees[0].name : 'unknown',
            department: typeof employees[0]?.department === 'string' ? employees[0].department : 'unknown'
          } 
        : null
    }, 'Employee data retrieved');
    
    return sendSuccess(res, employees, "Employees retrieved successfully");
  } catch (error) {
    logger.error({ error }, "Failed to get employees");
    return sendServerError(res, "Failed to get employees");
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(req: Request, res: Response) {
  try {
    const idParam = req.params['id'];
    if (!idParam) {
      return sendError(res, "Employee ID is required", HttpStatus.BAD_REQUEST);
    }
    
    // Parse as integer and validate
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      return sendError(res, "Invalid employee ID format", HttpStatus.BAD_REQUEST);
    }
    
    // Log detailed request information
    logger.info({
      employeeId: id,
      requestId: req.headers['x-request-id'] || 'none',
      authHeader: !!req.headers['authorization'],
      userId: req.user?.['id'] || 'not-authenticated'
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
      employeeName: employee?.name || 'unknown',
      employeeDepartment: employee?.department || 'unknown',
    }, `Employee detail response for ID ${id}`);
    
    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }
    
    return sendSuccess(res, employee, "Employee retrieved successfully");
  } catch (error) {
    logger.error({ 
      employeeId: req.params['id'], 
      error: error instanceof Error ? error.message : String(error) 
    }, "Error retrieving employee");
    return sendServerError(res, "Failed to get employee");
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
      name: validatedData.name,
      email: validatedData.email,
      department: validatedData.department,
      status: validatedData.status
    });
    
    const employee = await storage.createEmployee(validatedData);
    
    return sendSuccess(res, employee, "Employee created successfully", HttpStatus.CREATED);
  } catch (error) {
    logger.error({ error }, "Error creating employee");
    return sendServerError(res, "Failed to create employee");
  }
}

/**
 * Update an employee
 */
export async function updateEmployee(req: Request, res: Response) {
  try {
    const idParam = req.params['id'];
    if (!idParam) {
      return sendError(res, "Employee ID is required", HttpStatus.BAD_REQUEST);
    }
    
    // Parse as integer and validate
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      return sendError(res, "Invalid employee ID format", HttpStatus.BAD_REQUEST);
    }
    
    // Create a partial schema based on the insertEmployeeSchema 
    // to validate update operations for complete type safety
    const updateEmployeeSchema = insertEmployeeSchema.partial();
    
    // Map status if provided to ensure compatibility between schemas
    if (req.body.status) {
      req.body.status = mapCoreStatusToSharedStatus(req.body.status) || "active";
    }
    
    // Validate request body
    let validatedData;
    try {
      validatedData = await updateEmployeeSchema.parseAsync(req.body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return sendValidationError(res, validationError);
      }
      throw validationError;
    }
    
    // Log the update operation
    logger.debug('Updating employee', {
      id,
      fields: Object.keys(validatedData),
    });
    
    // Create a type-safe cleaned up version of the data for storage
    const cleanedData = {
      ...(validatedData.name !== undefined && { name: validatedData.name }),
      ...(validatedData.status !== undefined && { status: validatedData.status }),
      ...(validatedData.email !== undefined && { email: validatedData.email }),
      ...(validatedData.location !== undefined && { location: validatedData.location }),
      ...(validatedData.position !== undefined && { position: validatedData.position }),
      ...(validatedData.department !== undefined && { department: validatedData.department }),
      ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
      ...(validatedData.avatarUrl !== undefined && { avatarUrl: validatedData.avatarUrl }),
      ...(validatedData.bio !== undefined && { bio: validatedData.bio }),
      ...(validatedData.responsibilities !== undefined && { responsibilities: validatedData.responsibilities })
    };
    
    const employee = await storage.updateEmployee(id, cleanedData);
    
    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }
    
    return sendSuccess(res, employee, "Employee updated successfully");
  } catch (error) {
    logger.error({ 
      employeeId: req.params['id'], 
      error: error instanceof Error ? error.message : String(error) 
    }, "Error updating employee");
    return sendServerError(res, "Failed to update employee");
  }
}

/**
 * Delete an employee
 */
export async function deleteEmployee(req: Request, res: Response) {
  try {
    const idParam = req.params['id'];
    if (!idParam) {
      return sendError(res, "Employee ID is required", HttpStatus.BAD_REQUEST);
    }
    
    // Parse as integer and validate
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      return sendError(res, "Invalid employee ID format", HttpStatus.BAD_REQUEST);
    }
    
    // Log the delete operation attempt
    logger.warn({
      employeeId: id,
      requestedBy: req.user?.['id'] || 'unknown'
    }, `Attempting to delete employee with ID ${id}`);
    
    const success = await storage.deleteEmployee(id);
    
    if (!success) {
      return sendNotFound(res, "Employee not found");
    }
    
    logger.info({ 
      employeeId: id, 
      deletedBy: req.user?.['id'] || 'unknown'
    }, "Employee deleted");
    
    return sendSuccess(res, null, "Employee deleted successfully");
  } catch (error) {
    logger.error({ 
      employeeId: req.params['id'], 
      error: error instanceof Error ? error.message : String(error)
    }, "Error deleting employee");
    return sendServerError(res, "Failed to delete employee");
  }
}