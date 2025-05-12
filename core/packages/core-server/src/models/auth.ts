import { z } from 'zod';
import { pgEnum } from 'drizzle-orm/pg-core';
import {
  userRoleEnum,
  permissionAreaEnum,
  permissionTypeEnum,
  userBaseSchema
} from '@blueearth/core-common';

/**
 * PostgreSQL enums for database schema definition
 * These are used when defining the database schema in Drizzle ORM
 */
export const pgUserRoleEnum = pgEnum('user_role', [
  'SUPERADMIN',
  'ADMIN',
  'MANAGER',
  'USER'
]);

export const pgPermissionAreaEnum = pgEnum('permission_area', [
  'FINANCE',
  'HR',
  'IT',
  'LEGAL',
  'OPERATIONS'
]);

export const pgPermissionTypeEnum = pgEnum('permission_type', [
  'VIEW',
  'EDIT',
  'DELETE'
]);

/**
 * User schema for insert operations
 * Extends the user base schema with server-specific fields
 */
export const insertUserSchema = userBaseSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

/**
 * Extended User schema with password reset fields
 */
export const userWithPasswordResetSchema = insertUserSchema.extend({
  id: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().nullable().optional(),
  lastLogin: z.date().nullable().optional(),
  passwordResetToken: z.string().nullable().optional(),
  passwordResetExpires: z.date().nullable().optional(),
});

export type UserWithPasswordReset = z.infer<typeof userWithPasswordResetSchema>;

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