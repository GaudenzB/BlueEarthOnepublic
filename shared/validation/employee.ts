/**
 * Employee-specific validation schemas
 * 
 * Contains all validation schemas related to employee management,
 * department operations, and employee search functionality.
 */

import { z } from 'zod';
import { employees, employeeStatusEnum, departmentEnum } from '../schema';
import { createInsertSchema } from 'drizzle-zod';
import { ValidationMessages, EMAIL_REGEX } from './index';

/**
 * Base schema for employee data
 * Directly derived from the database schema
 */
export const baseEmployeeSchema = createInsertSchema(employees);

/**
 * Schema for employee search
 * Used for validating employee search requests
 */
export const employeeSearchSchema = z.object({
  query: z.string().optional(),
  department: z
    .string()
    .optional()
    .refine(
      (val) => !val || Object.values(departmentEnum.enum).includes(val as any),
      {
        message: "Invalid department",
      }
    ),
  status: z
    .string()
    .optional()
    .refine(
      (val) => !val || Object.values(employeeStatusEnum.enum).includes(val as any),
      {
        message: "Invalid status",
      }
    ),
  limit: z.number().int().positive().optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

/**
 * Schema for manual employee creation
 * Only used for creating employees outside of the Bubble.io sync
 */
export const employeeCreationSchema = baseEmployeeSchema.extend({
  // Make certain fields required for manual creation
  name: z.string().min(1, ValidationMessages.required),
  position: z.string().min(1, ValidationMessages.required),
  department: departmentEnum,
  status: employeeStatusEnum.default('active'),
}).omit({
  // These fields are calculated or set by system
  id: true,
  updatedAt: true, 
  syncedAt: true
});

/**
 * Schema for employee updates
 * Used for updating employee information
 */
export const employeeUpdateSchema = employeeCreationSchema
  .partial()
  .extend({
    // Ensure status is always a valid enum value
    status: employeeStatusEnum.optional(),
    // Ensure department is always a valid enum value
    department: departmentEnum.optional(),
  });

/**
 * Schema for bulk employee operations
 */
export const bulkEmployeeOperationSchema = z.object({
  employeeIds: z.array(z.number().int().positive()),
  operation: z.enum(['activate', 'deactivate', 'delete', 'changeDepartment']),
  department: departmentEnum.optional(),
}).refine(
  (data) => {
    // If operation is changeDepartment, department is required
    if (data.operation === 'changeDepartment') {
      return !!data.department;
    }
    return true;
  },
  {
    message: "Department is required for changeDepartment operation",
    path: ['department'],
  }
);

/**
 * Schema for employee synchronization configuration
 */
export const employeeSyncConfigSchema = z.object({
  enabled: z.boolean(),
  syncInterval: z.number().int().positive().min(5).max(1440), // Minutes
  bubbleApiUrl: z.string().url(),
  bubbleApiKey: z.string().min(1),
});

// Export types for use throughout the application
export type EmployeeSearch = z.infer<typeof employeeSearchSchema>;
export type EmployeeCreation = z.infer<typeof employeeCreationSchema>;
export type EmployeeUpdate = z.infer<typeof employeeUpdateSchema>;
export type BulkEmployeeOperation = z.infer<typeof bulkEmployeeOperationSchema>;
export type EmployeeSyncConfig = z.infer<typeof employeeSyncConfigSchema>;