/**
 * Centralized validation module
 * 
 * This module exports all validation schemas and utilities to be used
 * across the application, both in client and server code.
 * 
 * By centralizing validation logic, we ensure:
 * 1. Type safety between frontend and backend
 * 2. Single source of truth for validation rules
 * 3. Consistent error messages
 * 4. Reduced code duplication
 */

import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { userLoginSchema, insertUserSchema, forgotPasswordSchema, resetPasswordSchema } from '../schema';

// Re-export base schemas from schema.ts
export {
  userLoginSchema,
  insertUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};

/**
 * Enhanced user login validation with client-specific rules
 * 
 * Uses the base schema but adds client-side specific validations
 * like password strength visual indicators or real-time field validation
 */
export const enhancedUserLoginSchema = userLoginSchema.extend({
  // Password strength indicator (only used in frontend)
  passwordStrength: z.number().min(0).max(100).optional(),
});

/**
 * User profile update schema
 * 
 * Different from insert schema as it makes most fields optional
 * since users typically update only a subset of their profile.
 */
export const userProfileUpdateSchema = insertUserSchema
  .partial()
  .omit({ password: true })
  .extend({
    // If password is being updated, require current password too
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).max(100).optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // If any password field is filled, all should be filled
      const hasPasswordFields = !!data.currentPassword || !!data.newPassword || !!data.confirmNewPassword;
      if (hasPasswordFields) {
        return !!data.currentPassword && !!data.newPassword && !!data.confirmNewPassword;
      }
      return true;
    },
    {
      message: "When changing password, all password fields must be provided",
      path: ["newPassword"],
    }
  )
  .refine(
    (data) => {
      // If passwords provided, they should match
      if (data.newPassword && data.confirmNewPassword) {
        return data.newPassword === data.confirmNewPassword;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ["confirmNewPassword"],
    }
  );

/**
 * Email regex pattern used across the application
 * Used for consistent email validation
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Utility function to validate email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Common validation messages
 * These ensure consistent error messages across the application
 */
export const ValidationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  passwordLength: 'Password must be at least 8 characters',
  passwordMatch: 'Passwords must match',
  invalidUsername: 'Username can only contain letters, numbers, and underscores',
  nameFormat: 'Only letters, hyphens, and spaces are allowed',
  minLength: (field: string, length: number) => `${field} must be at least ${length} characters`,
  maxLength: (field: string, length: number) => `${field} cannot exceed ${length} characters`,
  uniqueConstraint: (field: string) => `This ${field} is already in use`,
};