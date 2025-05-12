/**
 * Document Schema
 * 
 * This file defines the common document-related types and
 * schemas that are used across both client and server.
 */

import { z } from 'zod';

/**
 * Document Type Enum
 * Defines all possible document types
 */
export const documentTypeEnum = z.enum([
  'contract',
  'agreement',
  'policy',
  'report',
  'presentation',
  'legal',
  'financial',
  'other'
]);

export type DocumentType = z.infer<typeof documentTypeEnum>;

/**
 * Document Status Enum
 * Defines all possible document statuses
 */
export const documentStatusEnum = z.enum([
  'draft',
  'pending_review',
  'under_review',
  'approved',
  'rejected',
  'published',
  'archived',
  'expired'
]);

export type DocumentStatus = z.infer<typeof documentStatusEnum>;

/**
 * Access Level Enum
 * Defines document access permission levels
 */
export const accessLevelEnum = z.enum([
  'public',
  'restricted',
  'confidential',
  'private'
]);

export type AccessLevel = z.infer<typeof accessLevelEnum>;

/**
 * Base Document Schema
 * This represents the core document data without DB-specific fields
 */
export const documentBaseSchema = z.object({
  title: z.string().min(1),
  type: documentTypeEnum,
  status: documentStatusEnum,
  accessLevel: accessLevelEnum,
  ownerId: z.number(),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
  expiresAt: z.date().optional(),
  versionNumber: z.number().default(1),
});

/**
 * Full Document Schema (with ID and timestamps)
 */
export const documentSchema = documentBaseSchema.extend({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastAccessedAt: z.date().optional()
});

/**
 * Document Search Schema
 * For searching and filtering documents
 */
export const documentSearchSchema = z.object({
  query: z.string().optional(),
  type: documentTypeEnum.optional(),
  status: documentStatusEnum.optional(),
  accessLevel: accessLevelEnum.optional(),
  ownerId: z.number().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  sort: z.enum(['title', 'createdAt', 'updatedAt', 'expiresAt']).optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(20)
});

// Type definitions
export type DocumentBase = z.infer<typeof documentBaseSchema>;
export type Document = z.infer<typeof documentSchema>;
export type DocumentSearch = z.infer<typeof documentSearchSchema>;