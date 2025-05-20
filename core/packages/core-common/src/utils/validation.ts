/**
 * Validation Utilities
 * 
 * This file provides common validation helpers and patterns
 * that can be used across both client and server code.
 */

import { z } from 'zod';

/**
 * Common regular expressions for validation
 */
export const VALIDATION_PATTERNS = {
  // Simple email regex for basic validation
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Phone number in various formats
  PHONE: /^(\+\d{1,3})?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
  
  // URL pattern
  URL: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  
  // Password with at least 8 characters, one uppercase, one lowercase, one number
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/,
  
  // Basic username (3-20 alphanumeric characters, underscores, and hyphens)
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  
  // ZIP/Postal code (handles common formats across different countries)
  ZIP_CODE: /^[A-Z0-9]{1,10}$/i,
};

/**
 * Common Zod validation schemas
 */

// Email validation
export const emailSchema = z.string()
  .email('Please enter a valid email address');

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine(
    (password) => VALIDATION_PATTERNS.STRONG_PASSWORD.test(password),
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// Phone number validation with optional format
export const phoneSchema = z.string()
  .refine(
    (phone) => VALIDATION_PATTERNS.PHONE.test(phone),
    'Please enter a valid phone number'
  );

// Username validation
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username cannot exceed 20 characters')
  .refine(
    (username) => VALIDATION_PATTERNS.USERNAME.test(username),
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

// URL validation
export const urlSchema = z.string()
  .url('Please enter a valid URL');

// Date validation (must be a valid date)
export const dateSchema = z.preprocess(
  (arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  },
  z.date({
    required_error: 'Please select a date',
    invalid_type_error: 'Please enter a valid date',
  })
);

/**
 * Helper to create pagination schema with defaults
 */
export const createPaginationSchema = (
  defaultLimit: number = 20,
  maxLimit: number = 100
) => {
  return z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(maxLimit).optional().default(defaultLimit)
  });
};

/**
 * Helper to create a sort schema with allowed fields
 */
export const createSortSchema = (
  allowedFields: string[],
  defaultField?: string,
  defaultOrder: 'asc' | 'desc' = 'asc'
) => {
  if (allowedFields.length === 0) {
    throw new Error('allowedFields must not be empty');
  }
  
  // Create a properly typed tuple with at least one element
  const nonEmptyFields = allowedFields.length > 0 
    ? allowedFields 
    : ['id']; // Fallback to 'id' if somehow the array is empty
  
  const firstField = nonEmptyFields[0] as string;
  const restFields = nonEmptyFields.slice(1) as string[];
  const typedFields = [firstField, ...restFields] as [string, ...string[]];
  
  return z.object({
    sort: z.enum(typedFields).optional().default(defaultField || firstField),
    order: z.enum(['asc', 'desc']).optional().default(defaultOrder)
  });
};

/**
 * Helper to trim all string fields in an object
 */
export const trimStringFields = <T extends Record<string, unknown>>(obj: T): T => {
  // Create a new object with the same type
  const result = { ...obj };
  
  // Create a mutable copy that we can safely modify
  const mutableCopy: Record<string, unknown> = { ...result };
  
  // Process each property
  Object.keys(mutableCopy).forEach(key => {
    const value = mutableCopy[key];
    if (typeof value === 'string') {
      // Trim string values
      mutableCopy[key] = value.trim();
    }
  });
  
  // Return the modified object with the original type
  return mutableCopy as T;
};

/**
 * Create a validation middleware for zod schemas
 */
export const validateSchema = <T>(schema: z.ZodType<T>) => {
  return (data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } => {
    try {
      const validData = schema.parse(data);
      return { success: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error };
      }
      throw error;
    }
  };
};