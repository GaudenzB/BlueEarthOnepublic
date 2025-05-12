/**
 * Server-side Employee Models
 * 
 * This file extends the common employee types with server-specific
 * schemas and utilities for database operations.
 */

import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { employeeSchema, employeeBaseSchema, departmentEnum, employeeStatusEnum } from '@blueearth/core-common';

/**
 * Insert Employee Schema
 * This schema is used for inserting a new employee into the database
 * It omits auto-generated fields like id and timestamps
 */
export const insertEmployeeSchema = employeeBaseSchema;

/**
 * Update Employee Schema
 * This schema is used for updating an existing employee
 * All fields are optional to allow partial updates
 */
export const updateEmployeeSchema = employeeBaseSchema.partial();

/**
 * Type definitions
 * These are used for database operations
 */
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;