import { pgTable, uuid, text, varchar, timestamp, boolean, jsonb, index, date, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { documents } from '../documents/documents';
import { tenants } from '../tenants';

/**
 * Contract Status Enum
 * Tracks the current status of a contract
 */
export const contractStatusEnum = z.enum([
  'DRAFT',        // Initial draft, not yet finalized
  'UNDER_REVIEW', // Being reviewed internally
  'PENDING',      // Waiting for counterparty signature
  'ACTIVE',       // Current active contract
  'EXPIRED',      // Contract term has ended
  'TERMINATED',   // Contract terminated before expiration
  'ARCHIVED'      // Historical contract, no longer relevant
]);

export type ContractStatus = z.infer<typeof contractStatusEnum>;

/**
 * Contract Type Enum
 * Classifies the type of contract
 */
export const contractTypeEnum = z.enum([
  'SERVICE_AGREEMENT',    // Service provider agreements
  'EMPLOYMENT',           // Employment contracts
  'VENDOR',               // Vendor agreements
  'LICENSE',              // License agreements
  'LEASE',                // Property leases
  'NDA',                  // Non-disclosure agreements
  'INVESTMENT',           // Investment contracts
  'PARTNERSHIP',          // Partnership agreements
  'LOAN',                 // Loan agreements
  'OTHER'                 // Misc. contracts
]);

export type ContractType = z.infer<typeof contractTypeEnum>;

/**
 * Contracts Table
 * Stores contract metadata and links to document records
 */
// Forward declare the contracts table to avoid circular reference issues
const contractsTable = 'contracts';

export const contracts = pgTable(contractsTable, {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  contractNumber: varchar('contract_number', { length: 100 }).notNull(),
  title: text('title').notNull(),
  contractType: text('contract_type').$type<ContractType>().notNull(),
  status: text('status').$type<ContractStatus>().notNull().default('DRAFT'),
  description: text('description'),
  
  // Parties
  counterpartyName: text('counterparty_name'),
  counterpartyContact: text('counterparty_contact'),
  internalOwner: uuid('internal_owner').notNull(),
  
  // Important Dates
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  renewalDate: date('renewal_date'),
  
  // Financial details
  value: text('value'),
  currency: varchar('currency', { length: 3 }),
  paymentTerms: text('payment_terms'),
  
  // Tracking
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  // Compliance and Metadata
  hasAutoRenewal: boolean('has_auto_renewal').default(false),
  renewalNoticePeriod: integer('renewal_notice_period'),  // Days before expiration
  complianceStatus: jsonb('compliance_status'),
  riskRating: text('risk_rating'),
  tags: text('tags').array(),
  customMetadata: jsonb('custom_metadata'),
  
  // Version tracking
  version: integer('version').default(1).notNull(),
  parentContractId: uuid('parent_contract_id').references({ table: contractsTable, column: 'id' }),
  
  // Additional flags
  isTemplate: boolean('is_template').default(false),
  isConfidential: boolean('is_confidential').default(false),
  accessControlList: uuid('access_control_list').array(),
});

/**
 * Contract Indexes
 * Define database indexes for improved query performance
 */
export const contractsIndexes = {
  tenantIdIdx: index('contracts_tenant_id_idx').on(contracts.tenantId),
  documentIdIdx: index('contracts_document_id_idx').on(contracts.documentId),
  contractTypeIdx: index('contracts_contract_type_idx').on(contracts.contractType),
  statusIdx: index('contracts_status_idx').on(contracts.status),
  effectiveDateIdx: index('contracts_effective_date_idx').on(contracts.effectiveDate),
  expirationDateIdx: index('contracts_expiration_date_idx').on(contracts.expirationDate),
  internalOwnerIdx: index('contracts_internal_owner_idx').on(contracts.internalOwner),
  tagsIdx: index('contracts_tags_idx').on(contracts.tags),
  contractNumberIdx: index('contracts_contract_number_idx').on(contracts.contractNumber),
};

/**
 * Contract Insert Schema
 * Validation schema for contract creation
 */
export const insertContractSchema = createInsertSchema(contracts)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    version: true,
  })
  .extend({
    contractType: contractTypeEnum,
    status: contractStatusEnum.optional().default('DRAFT'),
    tags: z.array(z.string()).optional(),
    customMetadata: z.record(z.string(), z.any()).optional(),
    accessControlList: z.array(z.string().uuid()).optional(),
    complianceStatus: z.record(z.string(), z.any()).optional(),
    effectiveDate: z.string().datetime().optional(),
    expirationDate: z.string().datetime().optional(),
    renewalDate: z.string().datetime().optional(),
  });

/**
 * Contract Select Schema
 * Validation schema for contract retrieval
 */
export const selectContractSchema = createSelectSchema(contracts)
  .extend({
    contractType: contractTypeEnum,
    status: contractStatusEnum,
    tags: z.array(z.string()).optional(),
    customMetadata: z.record(z.string(), z.any()).optional(),
    accessControlList: z.array(z.string().uuid()).optional(),
    complianceStatus: z.record(z.string(), z.any()).optional(),
  });

export type Contract = z.infer<typeof selectContractSchema>;
export type InsertContract = z.infer<typeof insertContractSchema>;