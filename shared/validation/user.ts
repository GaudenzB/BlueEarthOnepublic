/**
 * User-specific validation schemas
 * 
 * Contains all validation schemas related to user management,
 * authentication, and profile operations.
 */

import { z } from 'zod';
import { users, userRoleEnum } from '../schema';
import { createInsertSchema } from 'drizzle-zod';
import { ValidationMessages, EMAIL_REGEX } from './index';

/**
 * Base schema for creating a user
 * Directly derived from the database schema
 */
export const baseUserSchema = createInsertSchema(users);

/**
 * User registration schema
 * Used for validating user registration requests
 */
export const userRegistrationSchema = baseUserSchema.pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
}).extend({
  // Add confirmPassword field for registration
  confirmPassword: z.string().min(8),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: ValidationMessages.passwordMatch,
    path: ['confirmPassword'],
  }
);

/**
 * User login schema
 * Used for validating login requests
 */
export const userLoginSchema = z.object({
  username: z.string().min(1, ValidationMessages.required),
  password: z.string().min(1, ValidationMessages.required),
  remember: z.boolean().optional(),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().email(ValidationMessages.email),
});

/**
 * Password reset completion schema
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1, ValidationMessages.required),
  password: z.string().min(8, ValidationMessages.passwordLength),
  confirmPassword: z.string().min(8, ValidationMessages.passwordLength),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: ValidationMessages.passwordMatch,
    path: ['confirmPassword'],
  }
);

/**
 * User profile update schema
 */
export const userProfileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email(ValidationMessages.email).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, ValidationMessages.passwordLength).optional(),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => {
    // If changing password, require both new password and confirmation
    if (data.currentPassword || data.newPassword) {
      return !!data.currentPassword && !!data.newPassword && !!data.confirmPassword;
    }
    return true;
  },
  {
    message: "All password fields are required when changing password",
    path: ['newPassword'],
  }
).refine(
  (data) => {
    // If passwords are provided, they should match
    if (data.newPassword && data.confirmPassword) {
      return data.newPassword === data.confirmPassword;
    }
    return true;
  },
  {
    message: ValidationMessages.passwordMatch,
    path: ['confirmPassword'],
  }
);

/**
 * Admin user creation schema
 * Used by administrators to create new users
 */
export const adminUserCreationSchema = baseUserSchema.extend({
  role: userRoleEnum,
  active: z.boolean().default(true),
});

/**
 * Admin user update schema
 * Used by administrators to update existing users
 */
export const adminUserUpdateSchema = adminUserCreationSchema.partial();

// Export types for use throughout the application
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;
export type AdminUserCreation = z.infer<typeof adminUserCreationSchema>;
export type AdminUserUpdate = z.infer<typeof adminUserUpdateSchema>;