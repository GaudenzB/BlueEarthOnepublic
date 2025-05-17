import { pgTable, uuid, text, timestamp, varchar, boolean, jsonb, pgEnum, index, integer, date, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { tenants } from '../tenants';
import { users } from '../../schema';
import { documents } from '../documents/documents';

/**
 * Contract Status Enum
 */
export const contractStatusEnum = pgEnum('contract_status', [
  'DRAFT',
  'UNDER_REVIEW',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'RENEWED'
]);

/**
 * Contract Type Enum
 */
export const contractTypeEnum = pgEnum('contract_type', [
  'LPA', // Limited Partnership Agreement
  'SUBSCRIPTION_AGREEMENT',
  'SIDE_LETTER',
  'AMENDMENT',
  'NDA',
  'SERVICE_AGREEMENT',
  'OTHER'
]);

/**
 * Obligation Status Enum
 */
export const obligationStatusEnum = pgEnum('obligation_status', [
  'PENDING',
  'COMPLETED',
  'OVERDUE',
  'WAIVED'
]);

/**
 * Obligation Type Enum
 */
export const obligationTypeEnum = pgEnum('obligation_type', [
  'REPORTING',
  'PAYMENT',
  'DISCLOSURE',
  'COMPLIANCE',
  'OPERATIONAL',
  'OTHER'
]);

/**
 * Extraction Confidence Enum
 */
export const confidenceLevelEnum = pgEnum('confidence_level', [
  'HIGH',
  'MEDIUM',
  'LOW',
  'UNVERIFIED'
]);

/**
 * Contracts Table
 * Stores contract metadata extracted from documents
 */
export const contracts = pgTable('contracts', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  
  // Contract metadata
  contractType: contractTypeEnum('contract_type').notNull(),
  contractStatus: contractStatusEnum('contract_status').notNull().default('DRAFT'),
  contractNumber: varchar('contract_number', { length: 100 }),
  
  // Parties information
  counterpartyName: varchar('counterparty_name', { length: 255 }),
  counterpartyAddress: text('counterparty_address'),
  counterpartyContactEmail: varchar('counterparty_contact_email', { length: 255 }),
  
  // Key dates
  effectiveDate: date('effective_date'),
  expiryDate: date('expiry_date'),
  executionDate: date('execution_date'),
  renewalDate: date('renewal_date'),
  
  // Financial terms
  totalValue: varchar('total_value', { length: 100 }),
  currency: varchar('currency', { length: 20 }),
  
  // Extraction confidence
  confidenceLevel: confidenceLevelEnum('confidence_level').default('UNVERIFIED'),
  
  // References
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  
  // Auditing
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Raw extraction data from AI
  rawExtraction: jsonb('raw_extraction'),
  
  // Additional metadata
  sourcePageReferences: jsonb('source_page_references'), // Map of field names to page/coordinate references
  customMetadata: jsonb('custom_metadata'),
}, (table) => {
  return {
    documentIdIdx: index('contract_document_id_idx').on(table.documentId),
    contractTypeIdx: index('contract_type_idx').on(table.contractType),
    contractStatusIdx: index('contract_status_idx').on(table.contractStatus),
    tenantIdIdx: index('contract_tenant_id_idx').on(table.tenantId),
    effectiveDateIdx: index('contract_effective_date_idx').on(table.effectiveDate),
    expiryDateIdx: index('contract_expiry_date_idx').on(table.expiryDate),
  };
});

/**
 * Contract Clauses Table
 * Stores individual contract clauses extracted from the document
 */
export const contractClauses = pgTable('contract_clauses', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  contractId: uuid('contract_id').notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  
  // Clause metadata
  title: varchar('title', { length: 255 }),
  sectionNumber: varchar('section_number', { length: 50 }),
  content: text('content').notNull(),
  
  // Page references in source document
  pageNumber: integer('page_number'),
  pageCoordinates: jsonb('page_coordinates'), // {x, y, width, height}
  
  // Extraction confidence
  confidenceLevel: confidenceLevelEnum('confidence_level').default('UNVERIFIED'),
  
  // References
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  // Auditing
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    contractIdIdx: index('clause_contract_id_idx').on(table.contractId),
    tenantIdIdx: index('clause_tenant_id_idx').on(table.tenantId),
  };
});

/**
 * Contract Obligations Table
 * Stores individual obligations and commitments extracted from contract clauses
 */
export const contractObligations = pgTable('contract_obligations', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  contractId: uuid('contract_id').notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  clauseId: uuid('clause_id').references(() => contractClauses.id),
  
  // Obligation details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  obligationType: obligationTypeEnum('obligation_type').notNull(),
  
  // Responsible parties
  responsibleParty: varchar('responsible_party', { length: 255 }),
  
  // Due date and status
  dueDate: date('due_date'),
  recurringPattern: varchar('recurring_pattern', { length: 100 }), // e.g., "YEARLY", "QUARTERLY-15"
  obligationStatus: obligationStatusEnum('obligation_status').default('PENDING'),
  
  // Completion metadata
  completedDate: date('completed_date'),
  completedBy: uuid('completed_by').references(() => users.id),
  completionNotes: text('completion_notes'),
  
  // Notification settings
  reminderDays: integer('reminder_days').array(), // Days before due date to send reminders
  notifyUserIds: uuid('notify_user_ids').array(), // Users to notify
  
  // Extraction confidence
  confidenceLevel: confidenceLevelEnum('confidence_level').default('UNVERIFIED'),
  
  // References
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdBy: uuid('created_by').references(() => users.id),
  
  // Auditing
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    contractIdIdx: index('obligation_contract_id_idx').on(table.contractId),
    obligationTypeIdx: index('obligation_type_idx').on(table.obligationType),
    dueDateIdx: index('obligation_due_date_idx').on(table.dueDate),
    statusIdx: index('obligation_status_idx').on(table.obligationStatus),
    tenantIdIdx: index('obligation_tenant_id_idx').on(table.tenantId),
  };
});

// Zod schemas for validation

/**
 * Schema for inserting a contract
 */
export const insertContractSchema = createInsertSchema(contracts)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    rawExtraction: true,
  });

/**
 * Schema for selecting a contract
 */
export const selectContractSchema = createSelectSchema(contracts);

/**
 * Schema for inserting a contract clause
 */
export const insertContractClauseSchema = createInsertSchema(contractClauses)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

/**
 * Schema for selecting a contract clause
 */
export const selectContractClauseSchema = createSelectSchema(contractClauses);

/**
 * Schema for inserting a contract obligation
 */
export const insertContractObligationSchema = createInsertSchema(contractObligations)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    completedDate: true,
    completedBy: true,
    completionNotes: true,
  });

/**
 * Schema for selecting a contract obligation
 */
export const selectContractObligationSchema = createSelectSchema(contractObligations);

/**
 * Schema for searching contracts
 */
export const contractSearchSchema = z.object({
  query: z.string().optional(),
  contractType: z.enum(['LPA', 'SUBSCRIPTION_AGREEMENT', 'SIDE_LETTER', 'AMENDMENT', 'NDA', 'SERVICE_AGREEMENT', 'OTHER']).optional(),
  contractStatus: z.enum(['DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED']).optional(),
  counterpartyName: z.string().optional(),
  fromEffectiveDate: z.string().optional(),
  toEffectiveDate: z.string().optional(),
  fromExpiryDate: z.string().optional(),
  toExpiryDate: z.string().optional(),
});

// Type definitions for better TypeScript support
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type ContractClause = typeof contractClauses.$inferSelect;
export type InsertContractClause = z.infer<typeof insertContractClauseSchema>;
export type ContractObligation = typeof contractObligations.$inferSelect;
export type InsertContractObligation = z.infer<typeof insertContractObligationSchema>;
export type ContractSearch = z.infer<typeof contractSearchSchema>;

// Zod enums for type safety in application code
export const contractStatusZod = z.enum([
  'DRAFT',
  'UNDER_REVIEW',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'RENEWED'
]);

export const contractTypeZod = z.enum([
  'LPA',
  'SUBSCRIPTION_AGREEMENT',
  'SIDE_LETTER',
  'AMENDMENT',
  'NDA',
  'SERVICE_AGREEMENT',
  'OTHER'
]);

export const obligationStatusZod = z.enum([
  'PENDING',
  'COMPLETED',
  'OVERDUE',
  'WAIVED'
]);

export const obligationTypeZod = z.enum([
  'REPORTING',
  'PAYMENT',
  'DISCLOSURE',
  'COMPLIANCE',
  'OPERATIONAL',
  'OTHER'
]);

export const confidenceLevelZod = z.enum([
  'HIGH',
  'MEDIUM',
  'LOW',
  'UNVERIFIED'
]);

export type ContractStatus = z.infer<typeof contractStatusZod>;
export type ContractType = z.infer<typeof contractTypeZod>;
export type ObligationStatus = z.infer<typeof obligationStatusZod>;
export type ObligationType = z.infer<typeof obligationTypeZod>;
export type ConfidenceLevel = z.infer<typeof confidenceLevelZod>;