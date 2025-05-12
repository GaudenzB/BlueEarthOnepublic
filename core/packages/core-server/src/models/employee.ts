import { pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { departmentEnum, employeeStatusEnum, employeeBaseSchema } from '@blueearth/core-common';

/**
 * PostgreSQL enums for database schema definition
 * These are used when defining the database schema in Drizzle ORM
 */

// For database schema
export const pgDepartmentEnum = pgEnum('department', [
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

// For database schema
export const pgEmployeeStatusEnum = pgEnum('employee_status', [
  'ACTIVE',
  'ON_LEAVE',
  'CONTRACT',
  'INACTIVE',
  'INTERN'
]);

/**
 * Employee schema for insert operations
 * Extends the base schema with database-specific fields
 */
export const insertEmployeeSchema = employeeBaseSchema.extend({
  bubbleId: z.string().optional(),
});

// Type for employee insert operations
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

/**
 * Schema for synchronization statistics
 */
export const syncStatsSchema = z.object({
  totalEmployees: z.number(),
  created: z.number(),
  updated: z.number(),
  unchanged: z.number(),
  errors: z.number(),
});

// Type for synchronization statistics
export type SyncStats = z.infer<typeof syncStatsSchema>;