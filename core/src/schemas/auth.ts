import { z } from 'zod';
import { passwordSchema } from '../utils/validation';

/**
 * User role enum
 */
export const userRoleEnum = z.enum([
  'SUPERADMIN',
  'ADMIN',
  'MANAGER',
  'USER',
]);

export type UserRole = z.infer<typeof userRoleEnum>;

/**
 * Permission area enum
 */
export const permissionAreaEnum = z.enum([
  'FINANCE',
  'HUMAN_RESOURCES',
  'INFORMATION_TECHNOLOGY',
  'LEGAL',
  'OPERATIONS',
]);

export type PermissionArea = z.infer<typeof permissionAreaEnum>;

/**
 * User schema
 */
export const userSchema = z.object({
  id: z.number(),
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string(), // Hashed password in DB
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: userRoleEnum,
  active: z.boolean().default(true),
  resetToken: z.string().optional(),
  resetTokenExpiry: z.string().datetime().optional(),
  lastLogin: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Schema for creating a new user
 */
export const createUserSchema = userSchema
  .omit({ 
    id: true,
    resetToken: true,
    resetTokenExpiry: true,
    lastLogin: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Schema for updating a user
 */
export const updateUserSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }).optional(),
  email: z.string().email({ message: 'Invalid email address' }).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: userRoleEnum.optional(),
  active: z.boolean().optional(),
});

/**
 * Schema for user login
 */
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
  rememberMe: z.boolean().optional(),
});

/**
 * Schema for forgot password
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

/**
 * Schema for reset password
 */
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * User permission schema
 */
export const userPermissionSchema = z.object({
  id: z.number(),
  userId: z.number(),
  area: permissionAreaEnum,
  canView: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Schema for creating a user permission
 */
export const createUserPermissionSchema = userPermissionSchema.omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Type definitions
 */
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Login = z.infer<typeof loginSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type UserPermission = z.infer<typeof userPermissionSchema>;
export type CreateUserPermission = z.infer<typeof createUserPermissionSchema>;