/**
 * Server-side Auth Models
 * 
 * This file extends the common auth types with server-specific
 * schemas and utilities for database operations.
 */

import { z } from 'zod';
import { 
  userBaseSchema
} from '@blueearth/core-common';

/**
 * Database Insert User Schema
 * This schema is used for inserting a new user into the database
 * It includes the password field and omits auto-generated fields
 */
export const insertUserSchema = userBaseSchema.extend({
  password: z.string().min(8)
});

/**
 * Database Update User Schema
 * This schema is used for updating an existing user
 * All fields are optional to allow partial updates
 */
export const updateUserSchema = userBaseSchema.extend({
  password: z.string().min(8).optional()
}).partial();

/**
 * Reset Password Token Schema
 * This schema is used for storing password reset tokens
 */
export const resetTokenSchema = z.object({
  userId: z.number(),
  token: z.string(),
  expires: z.date(),
  used: z.boolean().default(false)
});

/**
 * Session Schema
 * This schema is used for user sessions
 */
export const sessionSchema = z.object({
  id: z.string(),
  userId: z.number(),
  token: z.string(),
  expires: z.date(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  lastActivity: z.date().default(() => new Date())
});

/**
 * Type definitions
 * These are used for database operations
 */
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ResetToken = z.infer<typeof resetTokenSchema>;
export type Session = z.infer<typeof sessionSchema>;