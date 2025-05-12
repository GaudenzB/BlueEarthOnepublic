/**
 * Server-side Document Models
 * 
 * This file extends the common document types with server-specific
 * schemas and utilities for database operations.
 */

import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { 
  documentSchema, 
  documentBaseSchema,
  documentTypeEnum,
  documentStatusEnum,
  accessLevelEnum 
} from '@blueearth/core-common';

/**
 * Insert Document Schema
 * This schema is used for inserting a new document into the database
 * It omits auto-generated fields like id and timestamps
 */
export const insertDocumentSchema = documentBaseSchema;

/**
 * Update Document Schema
 * This schema is used for updating an existing document
 * All fields are optional to allow partial updates
 */
export const updateDocumentSchema = documentBaseSchema.partial();

/**
 * Document Version Schema
 * This schema is used for document versioning
 */
export const documentVersionSchema = z.object({
  id: z.number().optional(),
  documentId: z.number(),
  versionNumber: z.number(),
  fileUrl: z.string().url(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  createdAt: z.date().optional(),
  createdBy: z.number(),
  changeDescription: z.string().optional()
});

/**
 * Document Share Schema
 * This schema is used for document sharing
 */
export const documentShareSchema = z.object({
  id: z.number().optional(),
  documentId: z.number(),
  userId: z.number(),
  accessLevel: accessLevelEnum,
  expiresAt: z.date().optional(),
  createdAt: z.date().optional(),
  createdBy: z.number(),
  accessCount: z.number().default(0)
});

/**
 * Document Comment Schema
 * This schema is used for document comments
 */
export const documentCommentSchema = z.object({
  id: z.number().optional(),
  documentId: z.number(),
  userId: z.number(),
  content: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  parentId: z.number().optional(),
  isResolved: z.boolean().default(false)
});

/**
 * Type definitions
 * These are used for database operations
 */
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
export type DocumentVersion = z.infer<typeof documentVersionSchema>;
export type DocumentShare = z.infer<typeof documentShareSchema>;
export type DocumentComment = z.infer<typeof documentCommentSchema>;