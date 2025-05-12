/**
 * Authentication Schema
 * 
 * This file defines the common authentication and user-related
 * types and schema that are used across both client and server.
 */

import { z } from 'zod';

/**
 * User Roles Enum
 * Defines the possible roles a user can have
 */
export const userRoleEnum = z.enum([
  'superadmin',
  'admin',
  'manager',
  'user'
]);

export type UserRole = z.infer<typeof userRoleEnum>;

/**
 * Functional Area Permissions Enum
 * Defines the functional areas a user can have permissions for
 */
export const functionalAreaEnum = z.enum([
  'finance',
  'hr',
  'it',
  'legal',
  'operations'
]);

export type FunctionalArea = z.infer<typeof functionalAreaEnum>;

/**
 * Permission Level Enum
 * Defines the level of permission a user can have in a functional area
 */
export const permissionLevelEnum = z.enum([
  'read',
  'write',
  'admin'
]);

export type PermissionLevel = z.infer<typeof permissionLevelEnum>;

/**
 * Permission Schema
 * Defines a specific permission with functional area and level
 */
export const permissionSchema = z.object({
  area: functionalAreaEnum,
  level: permissionLevelEnum
});

export type Permission = z.infer<typeof permissionSchema>;

/**
 * Base User Schema
 * This represents the core user data without DB-specific fields
 */
export const userBaseSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  role: userRoleEnum,
  permissions: z.array(permissionSchema).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isActive: z.boolean().default(true)
});

/**
 * Full User Schema (with ID and timestamps)
 */
export const userSchema = userBaseSchema.extend({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLogin: z.date().optional()
});

/**
 * Login Request Schema
 */
export const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

/**
 * Forgot Password Request Schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

/**
 * Reset Password Request Schema
 */
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8)
});

/**
 * Change Password Request Schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8)
});

// Type definitions
export type UserBase = z.infer<typeof userBaseSchema>;
export type User = z.infer<typeof userSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;