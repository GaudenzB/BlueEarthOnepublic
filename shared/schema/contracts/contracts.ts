import { pgTable, uuid, text, timestamp, jsonb, varchar, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { documents } from '../documents/documents';
import { tenants } from '../tenants';

/**
 * Contract Type Enum
 */
export const contractTypeEnum = pgEnum('contract_type', [
  'SERVICE_AGREEMENT',
  'EMPLOYMENT',
  'VENDOR',
  'LICENSE',
  'LEASE',
  'NDA',
  'INVESTMENT',
  'PARTNERSHIP',
  'LOAN',
  'OTHER'
]);

/**
 * Contract Status Enum
 */
export const contractStatusEnum = pgEnum('contract_status', [
  'PENDING',
  'DRAFT',
  'UNDER_REVIEW',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'ARCHIVED'
]);

/**
 * Contracts Table
 * Stores metadata about contracts
 */
export const contracts = pgTable('contracts', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  documentId: uuid('document_id').references(() => documents.id),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  
  // Core contract fields
  title: text('title').notNull(),
  contractNumber: varchar('contract_number', { length: 100 }).notNull(),
  version: text('version').default('1.0').notNull(),
  contractType: contractTypeEnum('contract_type').default('OTHER').notNull(),
  
  // Dates
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  effectiveDate: text('effective_date'),
  expirationDate: text('expiration_date'),
  
  // Parties
  parties: jsonb('parties'),
  counterpartyName: text('counterparty_name'),
  counterpartyContact: text('counterparty_contact'),
  
  // Financial values
  value: text('value'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Status & metadata
  status: contractStatusEnum('status').default('DRAFT').notNull(),
  description: text('description'),
  isConfidential: boolean('is_confidential').default(false),
  renewalTerms: text('renewal_terms'),
  terminationClauses: text('termination_clauses'),
  tags: text('tags').array(),
  
  // Approval tracking
  approvalStatus: text('approval_status'),
  approvedBy: uuid('approved_by'),
  approvalDate: timestamp('approval_date'),
  
  // Versioning & parent relationships
  parentContractId: uuid('parent_contract_id'),
  
  // Access control
  accessControlList: text('access_control_list').array(),
  
  // Custom data
  customMetadata: jsonb('custom_metadata'),
}, (table) => {
  return {
    documentIdIdx: index('contracts_document_id_idx').on(table.documentId),
    tenantIdIdx: index('contracts_tenant_id_idx').on(table.tenantId),
    contractTypeIdx: index('contracts_contract_type_idx').on(table.contractType),
    statusIdx: index('contracts_status_idx').on(table.status),
    effectiveDateIdx: index('contracts_effective_date_idx').on(table.effectiveDate),
    expirationDateIdx: index('contracts_expiration_date_idx').on(table.expirationDate),
    createdAtIdx: index('contracts_created_at_idx').on(table.createdAt),
  };
});

/**
 * Schema for inserting a contract
 */
export const insertContractSchema = createInsertSchema(contracts)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
    tags: z.array(z.string()).optional(),
    accessControlList: z.array(z.string()).optional(),
  });

/**
 * Schema for selecting a contract
 */
export const selectContractSchema = createSelectSchema(contracts);

/**
 * Contract search schema
 */
export const contractSearchSchema = z.object({
  query: z.string().optional(),
  contractType: z.enum([
    'SERVICE_AGREEMENT',
    'EMPLOYMENT',
    'VENDOR',
    'LICENSE',
    'LEASE',
    'NDA',
    'INVESTMENT',
    'PARTNERSHIP',
    'LOAN',
    'OTHER'
  ]).optional(),
  status: z.enum([
    'PENDING',
    'DRAFT',
    'UNDER_REVIEW',
    'ACTIVE',
    'EXPIRED',
    'TERMINATED',
    'ARCHIVED'
  ]).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  counterpartyName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isConfidential: z.boolean().optional(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type ContractSearch = z.infer<typeof contractSearchSchema>;

// Create Zod enums for type safety in application code
export const contractTypeZod = z.enum([
  'SERVICE_AGREEMENT',
  'EMPLOYMENT',
  'VENDOR',
  'LICENSE',
  'LEASE',
  'NDA',
  'INVESTMENT',
  'PARTNERSHIP',
  'LOAN',
  'OTHER'
]);

export const contractStatusZod = z.enum([
  'PENDING',
  'DRAFT',
  'UNDER_REVIEW',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'ARCHIVED'
]);

export type ContractType = z.infer<typeof contractTypeZod>;
export type ContractStatus = z.infer<typeof contractStatusZod>;