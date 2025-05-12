import { z } from 'zod';
import { pgEnum } from 'drizzle-orm/pg-core';

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

export const pgUserRoleEnum = pgEnum('user_role', [
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

export const pgPermissionAreaEnum = pgEnum('permission_area', [
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

export const pgPermissionTypeEnum = pgEnum('permission_type', [
  'VIEW',
  'EDIT',
  'DELETE'
]);

export type PermissionType = z.infer<typeof permissionTypeEnum>;

/**
 * User schema for insert operations
 */
export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: userRoleEnum.optional().default('USER'),
  active: z.boolean().optional().default(true),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

/**
 * User schema with ID
 */
export const userSchema = insertUserSchema.extend({
  id: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().nullable().optional(),
  lastLogin: z.date().nullable().optional(),
  passwordResetToken: z.string().nullable().optional(),
  passwordResetExpires: z.date().nullable().optional(),
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

/**
 * User permission schema for insert operations
 */
export const insertUserPermissionSchema = z.object({
  userId: z.number(),
  area: permissionAreaEnum,
  permission: permissionTypeEnum,
});

export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;

/**
 * User permission schema with ID
 */
export const userPermissionSchema = insertUserPermissionSchema.extend({
  id: z.number(),
  createdAt: z.date().optional(),
});

export type UserPermission = z.infer<typeof userPermissionSchema>;