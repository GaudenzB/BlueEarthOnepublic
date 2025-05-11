import { pgTable, uuid, text, varchar, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { tenants } from '../tenants';

/**
 * Document Processing Status Enum
 * Tracks the AI processing status of documents
 */
export const processingStatusEnum = z.enum([
  'PENDING',    // Document is waiting to be processed
  'QUEUED',     // Document has been queued for processing
  'PROCESSING', // Document is currently being processed
  'COMPLETED',  // Processing completed successfully
  'FAILED',     // Processing failed
  'ERROR'       // Error occurred during processing
]);

export type ProcessingStatus = z.infer<typeof processingStatusEnum>;

/**
 * Document Type Enum
 * Describes the general type of document
 */
export const documentTypeEnum = z.enum([
  'CONTRACT',      // Legal contracts
  'AGREEMENT',     // Agreements and MOUs
  'POLICY',        // Internal policies
  'REPORT',        // Reports and analyses
  'PRESENTATION',  // Presentations and slides
  'CORRESPONDENCE', // Letters, emails, etc.
  'INVOICE',       // Financial documents
  'OTHER'          // Miscellaneous documents
]);

export type DocumentType = z.infer<typeof documentTypeEnum>;

/**
 * Documents Table
 * Stores metadata for all documents in the system
 */
export const documents = pgTable('documents', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: text('file_size').notNull(),
  storageKey: text('storage_key').notNull(),
  checksum: text('checksum').notNull(),
  documentType: text('document_type').$type<DocumentType>(),
  title: text('title'),
  description: text('description'),
  tags: text('tags').array(),
  uploadedBy: uuid('uploaded_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  deleted: boolean('deleted').default(false).notNull(),
  processingStatus: text('processing_status').$type<ProcessingStatus>().default('PENDING'),
  aiProcessed: boolean('ai_processed').default(false),
  aiMetadata: jsonb('ai_metadata'),
  retentionDate: timestamp('retention_date'),
  isConfidential: boolean('is_confidential').default(false),
  accessControlList: uuid('access_control_list').array(),
  customMetadata: jsonb('custom_metadata'),
  versionId: text('version_id').default('1'),
});

// Indexes removed for now to ensure the server starts

/**
 * Document Insert Schema
 * Validation schema for document creation
 */
export const insertDocumentSchema = createInsertSchema(documents)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    aiProcessed: true,
    aiMetadata: true,
    versionId: true
  })
  .extend({
    documentType: documentTypeEnum.optional(),
    tags: z.array(z.string()).optional(),
    customMetadata: z.record(z.string(), z.any()).optional(),
    accessControlList: z.array(z.string().uuid()).optional(),
  });

/**
 * Document Select Schema
 * Validation schema for document retrieval
 */
export const selectDocumentSchema = createSelectSchema(documents)
  .extend({
    documentType: documentTypeEnum.nullable(),
    processingStatus: processingStatusEnum,
    tags: z.array(z.string()).optional(),
    customMetadata: z.record(z.string(), z.any()).optional(),
    accessControlList: z.array(z.string().uuid()).optional(),
  });

export type Document = z.infer<typeof selectDocumentSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;