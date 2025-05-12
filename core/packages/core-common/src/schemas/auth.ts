import { z } from 'zod';

/**
 * User-related schemas and types
 * These are used for authentication and user management
 */

/**
 * User role enum
 */
export const userRoleEnum = z.enum([
  'SUPERADMIN',
  'ADMIN',
  'MANAGER',
  'USER'
]);

export type UserRole = z.infer<typeof userRoleEnum>;

/**
 * Permission area enum
 */
export const permissionAreaEnum = z.enum([
  'FINANCE',
  'HR',
  'IT',
  'LEGAL',
  'OPERATIONS'
]);

export type PermissionArea = z.infer<typeof permissionAreaEnum>;

/**
 * Permission type enum
 */
export const permissionTypeEnum = z.enum([
  'VIEW',
  'EDIT',
  'DELETE'
]);

export type PermissionType = z.infer<typeof permissionTypeEnum>;

/**
 * User schema for client validation
 */
export const userBaseSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  role: userRoleEnum.optional().default('USER'),
  active: z.boolean().optional().default(true),
});

/**
 * User schema with ID
 */
export const userSchema = userBaseSchema.extend({
  id: z.number(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).nullable().optional(),
  lastLogin: z.string().or(z.date()).nullable().optional(),
});

export type User = z.infer<typeof userSchema>;

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type UserLogin = z.infer<typeof userLoginSchema>;

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password confirmation must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPassword = z.infer<typeof resetPasswordSchema>;