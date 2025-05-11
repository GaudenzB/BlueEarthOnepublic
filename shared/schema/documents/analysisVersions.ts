import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { documents } from './documents';
import { tenants } from '../tenants';

/**
 * Analysis Versions Table
 * Tracks the history of AI analysis results for documents
 */
export const analysisVersions = pgTable('analysis_versions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  modelVersion: text('model_version').notNull(),
  result: jsonb('result').notNull(),
  diffSummary: text('diff_summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
});

// Indexes removed for now to ensure the server starts

/**
 * Analysis Diffs Table
 * Stores the differences between two analysis versions
 */
export const analysisDiffs = pgTable('analysis_diffs', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  fromVersionId: uuid('from_version_id').notNull().references(() => analysisVersions.id),
  toVersionId: uuid('to_version_id').notNull().references(() => analysisVersions.id),
  diff: text('diff').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Indexes removed for now to ensure the server starts

/**
 * Analysis Version Insert Schema
 * Validation schema for creating analysis versions
 */
export const insertAnalysisVersionSchema = createInsertSchema(analysisVersions)
  .omit({
    id: true,
    createdAt: true,
  });

/**
 * Analysis Version Select Schema
 * Validation schema for retrieving analysis versions
 */
export const selectAnalysisVersionSchema = createSelectSchema(analysisVersions);

/**
 * Analysis Diff Insert Schema
 * Validation schema for creating analysis diffs
 */
export const insertAnalysisDiffSchema = createInsertSchema(analysisDiffs)
  .omit({
    id: true,
    createdAt: true,
  });

/**
 * Analysis Diff Select Schema
 * Validation schema for retrieving analysis diffs
 */
export const selectAnalysisDiffSchema = createSelectSchema(analysisDiffs);

export type AnalysisVersion = z.infer<typeof selectAnalysisVersionSchema>;
export type InsertAnalysisVersion = z.infer<typeof insertAnalysisVersionSchema>;
export type AnalysisDiff = z.infer<typeof selectAnalysisDiffSchema>;
export type InsertAnalysisDiff = z.infer<typeof insertAnalysisDiffSchema>;