import { z } from 'zod';

/**
 * Employee status enum
 */
export const employeeStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'ON_LEAVE',
  'TERMINATED',
  'CONTRACT',
  'INTERN',
]);

export type EmployeeStatus = z.infer<typeof employeeStatusEnum>;

/**
 * Department enum
 */
export const departmentEnum = z.enum([
  'EXECUTIVE',
  'FINANCE',
  'HUMAN_RESOURCES',
  'INFORMATION_TECHNOLOGY',
  'LEGAL',
  'MARKETING',
  'OPERATIONS',
  'RESEARCH_AND_DEVELOPMENT',
  'SALES',
]);

export type Department = z.infer<typeof departmentEnum>;

/**
 * Base Employee schema
 */
export const employeeSchema = z.object({
  id: z.number(),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().optional(),
  position: z.string().min(1, { message: 'Position is required' }),
  department: departmentEnum,
  status: employeeStatusEnum,
  hireDate: z.string().datetime({ message: 'Invalid date format' }).optional(),
  endDate: z.string().datetime({ message: 'Invalid date format' }).optional(),
  profileImage: z.string().optional(),
  bio: z.string().optional(),
  responsibilities: z.string().optional(),
  syncedAt: z.string().datetime().optional(),
  locationId: z.number().optional(),
  managerId: z.number().optional(),
  bubbleId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Schema for creating a new employee
 */
export const createEmployeeSchema = employeeSchema.omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
  syncedAt: true,
});

/**
 * Schema for updating an employee
 */
export const updateEmployeeSchema = createEmployeeSchema.partial();

/**
 * Schema for searching employees
 */
export const employeeSearchSchema = z.object({
  search: z.string().optional(),
  department: departmentEnum.optional(),
  status: employeeStatusEnum.optional(),
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().default(10),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
});

/**
 * Type definitions
 */
export type Employee = z.infer<typeof employeeSchema>;
export type CreateEmployee = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;
export type EmployeeSearch = z.infer<typeof employeeSearchSchema>;