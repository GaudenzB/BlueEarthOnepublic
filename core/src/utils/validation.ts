import { z } from 'zod';

/**
 * Common validation utilities used across the application
 */

/**
 * Password validation schema with strength requirements
 */
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' });

/**
 * Email validation schema with common business email domains
 */
export const emailSchema = z
  .string()
  .email({ message: 'Invalid email address' })
  .refine(email => {
    // This could be expanded to check for company-specific domains if needed
    return true;
  }, { message: 'Please use a valid business email address' });

/**
 * Phone number validation schema
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9\s()-]+$/, { message: 'Invalid phone number format' });

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url({ message: 'Invalid URL format' });