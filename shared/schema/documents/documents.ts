import { pgTable, uuid, text, timestamp, varchar, boolean, jsonb, pgEnum, index, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { tenants } from '../tenants';
import { users } from '../../schema';

/**
 * Document Processing Status Enum
 */
export const processingStatusEnum = pgEnum('processing_status', [
  'PENDING',
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'ERROR'
]);

/**
 * Document Type Enum
 */
export const documentTypeEnum = pgEnum('document_type', [
  'CONTRACT',
  'AGREEMENT',
  'POLICY',
  'REPORT',
  'PRESENTATION',
  'CORRESPONDENCE',
  'INVOICE',
  'OTHER'
]);

/**
 * Documents Table
 * Stores metadata about uploaded documents
 */
export const documents = pgTable('documents', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  title: text('title'),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  // File details
  filename: varchar('filename', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: varchar('file_size', { length: 20 }).notNull(),
  storageKey: varchar('storage_key', { length: 255 }).notNull(),
  checksum: varchar('checksum', { length: 64 }).notNull(),
  
  // Document classification
  documentType: documentTypeEnum('document_type'),
  isConfidential: boolean('is_confidential').default(false),
  tags: text('tags').array(),
  
  // Processing status
  processingStatus: processingStatusEnum('processing_status').default('PENDING'),
  aiProcessed: boolean('ai_processed').default(false),
  aiMetadata: jsonb('ai_metadata'),
  
  // References
  uploadedBy: uuid('uploaded_by'),
  tenantId: uuid('tenant_id'),
  versionId: uuid('version_id'),
  
  // Additional metadata
  customMetadata: jsonb('custom_metadata'),
}, (table) => {
  return {
    tenantIdx: index('documents_tenant_idx').on(table.tenantId),
    uploadedByIdx: index('documents_uploaded_by_idx').on(table.uploadedBy),
    documentTypeIdx: index('documents_document_type_idx').on(table.documentType),
    createdAtIdx: index('documents_created_at_idx').on(table.createdAt),
  };
});

/**
 * Schema for inserting a document
 */
export const insertDocumentSchema = createInsertSchema(documents)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    aiProcessed: true,
    aiMetadata: true
  });

/**
 * Schema for selecting a document
 */
export const selectDocumentSchema = createSelectSchema(documents);

/**
 * Document search schema
 */
export const documentSearchSchema = z.object({
  query: z.string().optional(),
  documentType: z.enum([
    'CONTRACT',
    'AGREEMENT',
    'POLICY',
    'REPORT',
    'PRESENTATION',
    'CORRESPONDENCE',
    'INVOICE',
    'OTHER'
  ]).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isConfidential: z.boolean().optional(),
  uploadedBy: z.string().uuid().optional(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DocumentSearch = z.infer<typeof documentSearchSchema>;

// Create Zod enums for type safety in application code
export const processingStatusZod = z.enum([
  'PENDING',
  'QUEUED', 
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'ERROR'
]);

export const documentTypeZod = z.enum([
  'CONTRACT',
  'AGREEMENT',
  'POLICY',
  'REPORT',
  'PRESENTATION',
  'CORRESPONDENCE',
  'INVOICE',
  'OTHER'
]);

export type ProcessingStatus = z.infer<typeof processingStatusZod>;
export type DocumentType = z.infer<typeof documentTypeZod>;