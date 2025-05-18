import { pgTable, uuid, jsonb, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Schema for storing AI analysis results from contract document uploads
 */
export const contractUploadAnalysis = pgTable('contract_upload_analysis', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Document ID of the uploaded file
  documentId: uuid('document_id').notNull().references(() => documents.id),
  
  // Tenant ID for data isolation
  tenantId: uuid('tenant_id').notNull(),
  
  // User who initiated the upload
  userId: uuid('user_id'),
  
  // Extracted metadata
  vendor: varchar('vendor', { length: 255 }),
  contractTitle: varchar('contract_title', { length: 255 }),
  docType: varchar('doc_type', { length: 50 }),
  effectiveDate: varchar('effective_date', { length: 50 }),
  terminationDate: varchar('termination_date', { length: 50 }),
  
  // Confidence scores for each extracted field (JSON)
  confidence: jsonb('confidence'),
  
  // Suggested existing contract ID if a match is found
  suggestedContractId: uuid('suggested_contract_id'),
  
  // Status of the analysis
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  
  // Error message if analysis fails
  error: text('error'),
  
  // Raw AI analysis result for debugging/auditing
  rawAnalysisJson: jsonb('raw_analysis_json'),
  
  // Standard timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Import documents schema
import { documents } from '../../schema/documents';

// Define Zod schema for insertion
export const insertContractUploadAnalysisSchema = createInsertSchema(contractUploadAnalysis)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Define Zod schema for responses
export const contractUploadAnalysisResponseSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  vendor: z.string().nullable(),
  contractTitle: z.string().nullable(),
  docType: z.string().nullable(),
  effectiveDate: z.string().nullable(),
  terminationDate: z.string().nullable(),
  confidence: z.record(z.string(), z.number()),
  suggestedContractId: z.string().uuid().optional(),
  status: z.string()
});

// Define types
export type ContractUploadAnalysisInsert = z.infer<typeof insertContractUploadAnalysisSchema>;
export type ContractUploadAnalysisSelect = typeof contractUploadAnalysis.$inferSelect;
export type ContractUploadAnalysisResponse = z.infer<typeof contractUploadAnalysisResponseSchema>;