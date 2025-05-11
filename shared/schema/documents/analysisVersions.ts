import { pgTable, uuid, text, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { documents } from './documents';
import { tenants } from '../tenants';

/**
 * Analysis Status Enum
 */
export const analysisStatusEnum = pgEnum('analysis_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'ERROR'
]);

/**
 * Analysis Versions Table
 * Stores different versions of AI analysis for documents
 */
export const analysisVersions = pgTable('analysis_versions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  version: text('version').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Analysis data
  status: analysisStatusEnum('status').default('PENDING'),
  aiModel: text('ai_model').notNull(),
  modelVersion: text('model_version'),
  processingTime: text('processing_time'),
  
  // Analysis results
  summary: text('summary'),
  keyInsights: text('key_insights').array(),
  entities: jsonb('entities'),
  topics: jsonb('topics'),
  sentiment: jsonb('sentiment'),
  timeline: jsonb('timeline'),
  riskFactors: jsonb('risk_factors'),
  rawAnalysis: jsonb('raw_analysis'),
  
  // Error data
  errorMessage: text('error_message'),
  errorDetails: jsonb('error_details'),
}, (table) => {
  return {
    documentIdx: index('analysis_versions_document_idx').on(table.documentId),
    tenantIdx: index('analysis_versions_tenant_idx').on(table.tenantId),
    versionIdx: index('analysis_versions_version_idx').on(table.version),
    createdAtIdx: index('analysis_versions_created_at_idx').on(table.createdAt),
  };
});

/**
 * Schema for inserting an analysis version
 */
export const insertAnalysisVersionSchema = createInsertSchema(analysisVersions)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true
  });

/**
 * Schema for selecting an analysis version
 */
export const selectAnalysisVersionSchema = createSelectSchema(analysisVersions);

export type AnalysisVersion = typeof analysisVersions.$inferSelect;
export type InsertAnalysisVersion = z.infer<typeof insertAnalysisVersionSchema>;

// Create Zod enum for type safety in application code
export const analysisStatusZod = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'ERROR'
]);

export type AnalysisStatus = z.infer<typeof analysisStatusZod>;