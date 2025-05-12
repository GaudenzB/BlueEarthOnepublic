import { z } from 'zod';

/**
 * Common employee-related schemas and types
 * These will be used throughout the application for validation and type safety
 */

/**
 * Employee department enum
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
  'SALES'
]);

/**
 * Employee status enum
 */
export const employeeStatusEnum = z.enum([
  'ACTIVE',
  'ON_LEAVE',
  'CONTRACT',
  'INACTIVE',
  'INTERN'
]);

// Type for the employee status enum
export type EmployeeStatus = z.infer<typeof employeeStatusEnum>;

// Type for the department enum
export type Department = z.infer<typeof departmentEnum>;

/**
 * Base employee schema for client-side validation
 */
export const employeeBaseSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  position: z.string().optional(),
  department: departmentEnum.optional().default('OPERATIONS'),
  phone: z.string().nullable().optional(),
  profileImage: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  responsibilities: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  status: employeeStatusEnum.optional().default('ACTIVE'),
});

/**
 * Base employee schema with ID
 */
export const employeeSchema = employeeBaseSchema.extend({
  id: z.number(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).nullable().optional(),
  syncedAt: z.string().or(z.date()).nullable().optional(),
});

/**
 * Schema for employee search parameters
 */
export const employeeSearchSchema = z.object({
  search: z.string().optional(),
  department: departmentEnum.optional(),
  status: employeeStatusEnum.optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
});

// Type for employee records
export type Employee = z.infer<typeof employeeSchema>;

// Type for employee search parameters
export type EmployeeSearchParams = z.infer<typeof employeeSearchSchema>;