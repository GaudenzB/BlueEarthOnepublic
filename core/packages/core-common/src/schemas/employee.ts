/**
 * Employee Schema
 * 
 * This file defines the common employee-related types and
 * schemas that are used across both client and server.
 */

import { z } from 'zod';

/**
 * Department Enum
 * Defines all possible departments in the organization
 */
export const departmentEnum = z.enum([
  'engineering',
  'marketing',
  'design',
  'product',
  'hr',
  'sales',
  'finance',
  'legal',
  'operations',
  'executive'
]);

export type Department = z.infer<typeof departmentEnum>;

/**
 * Employee Status Enum
 * Defines all possible employee statuses
 */
export const employeeStatusEnum = z.enum([
  'active',
  'inactive',
  'on_leave',
  'remote'
]);

export type EmployeeStatus = z.infer<typeof employeeStatusEnum>;

/**
 * Base Employee Schema
 * This represents the core employee data without DB-specific fields
 */
export const employeeBaseSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  status: employeeStatusEnum,
  position: z.string(),
  department: departmentEnum,
  location: z.string(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
  responsibilities: z.string().optional(),
  startDate: z.date().optional(),
  reportsTo: z.number().optional(),
  skills: z.array(z.string()).optional(),
});

/**
 * Full Employee Schema (with ID and timestamps)
 */
export const employeeSchema = employeeBaseSchema.extend({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastSyncedAt: z.date().optional()
});

/**
 * Employee Search Schema
 * For searching and filtering employees
 */
export const employeeSearchSchema = z.object({
  query: z.string().optional(),
  department: departmentEnum.optional(),
  status: employeeStatusEnum.optional(),
  location: z.string().optional(),
  sort: z.enum(['name', 'position', 'department', 'startDate']).optional(),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10)
});

// Type definitions
export type EmployeeBase = z.infer<typeof employeeBaseSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type EmployeeSearch = z.infer<typeof employeeSearchSchema>;