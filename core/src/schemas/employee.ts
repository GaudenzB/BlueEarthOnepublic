import { z } from 'zod';

/**
 * Employee schema for validation and type safety
 */
export const EmployeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  position: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  responsibilities: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive', 'on-leave']).default('active'),
  updatedAt: z.string().nullable().optional(),
  syncedAt: z.string().nullable().optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

/**
 * Schema for creating/updating an employee
 */
export const EmployeeInputSchema = EmployeeSchema.omit({ 
  id: true, 
  updatedAt: true, 
  syncedAt: true 
});

export type EmployeeInput = z.infer<typeof EmployeeInputSchema>;

/**
 * Schema for search and filtering
 */
export const EmployeeSearchSchema = z.object({
  query: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on-leave']).optional(),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(20),
});

export type EmployeeSearch = z.infer<typeof EmployeeSearchSchema>;