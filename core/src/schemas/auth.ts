import { z } from 'zod';

/**
 * User roles enum
 */
export const UserRoleEnum = z.enum(['user', 'manager', 'admin', 'superadmin']);
export type UserRole = z.infer<typeof UserRoleEnum>;

/**
 * User schema
 */
export const UserSchema = z.object({
  id: z.number(),
  username: z.string().min(3),
  email: z.string().email(),
  role: UserRoleEnum,
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Login credentials schema
 */
export const LoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginCredentials = z.infer<typeof LoginSchema>;

/**
 * Schema for password reset request
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;

/**
 * Schema for password reset
 */
export const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;

/**
 * Permission area enum
 */
export const PermissionAreaEnum = z.enum([
  'employees', 
  'users', 
  'documents', 
  'contracts', 
  'finance', 
  'hr', 
  'it', 
  'legal', 
  'operations'
]);

export type PermissionArea = z.infer<typeof PermissionAreaEnum>;

/**
 * Permission action enum
 */
export const PermissionActionEnum = z.enum(['view', 'edit', 'delete']);
export type PermissionAction = z.infer<typeof PermissionActionEnum>;

/**
 * User permission schema
 */
export const UserPermissionSchema = z.object({
  id: z.number(),
  userId: z.number(),
  area: PermissionAreaEnum,
  action: PermissionActionEnum,
  granted: z.boolean().default(true),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export type UserPermission = z.infer<typeof UserPermissionSchema>;