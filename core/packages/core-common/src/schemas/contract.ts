/**
 * Contract Schema
 * 
 * This file defines the common contract-related types and
 * schemas that are used across both client and server.
 * Contracts are specialized documents with additional fields.
 */

import { z } from 'zod';
import { documentBaseSchema, documentSchema } from './document';

/**
 * Contract Type Enum
 * Defines all possible contract types specific to financial industry
 */
export const contractTypeEnum = z.enum([
  'investment',
  'acquisition',
  'partnership',
  'service',
  'employment',
  'nda',
  'loan',
  'lease',
  'licensing',
  'maintenance',
  'consulting',
  'other'
]);

export type ContractType = z.infer<typeof contractTypeEnum>;

/**
 * Contract Status Enum
 * Defines all possible contract statuses
 */
export const contractStatusEnum = z.enum([
  'draft',
  'negotiation',
  'pending_signature',
  'signed',
  'active',
  'expired',
  'terminated',
  'renewed',
  'under_review'
]);

export type ContractStatus = z.infer<typeof contractStatusEnum>;

/**
 * Base Contract Schema
 * This extends documentBaseSchema with contract-specific fields
 */
export const contractBaseSchema = documentBaseSchema.extend({
  contractType: contractTypeEnum,
  contractStatus: contractStatusEnum,
  parties: z.array(z.object({
    name: z.string(),
    type: z.enum(['company', 'individual', 'government', 'other']),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    address: z.string().optional()
  })),
  effectiveDate: z.date(),
  expirationDate: z.date().optional(),
  renewalDate: z.date().optional(),
  autoRenew: z.boolean().default(false),
  value: z.number().optional(),
  currency: z.string().default('USD'),
  paymentTerms: z.string().optional(),
  signatories: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    email: z.string().email().optional(),
    signed: z.boolean().default(false),
    signatureDate: z.date().optional(),
    signatureId: z.string().optional()
  })).optional(),
  reviewers: z.array(z.number()).optional(), // User IDs
  customClauses: z.array(z.object({
    title: z.string(),
    text: z.string(),
    importance: z.enum(['low', 'medium', 'high', 'critical']).optional()
  })).optional(),
  riskAssessment: z.object({
    level: z.enum(['low', 'medium', 'high', 'critical']),
    notes: z.string().optional()
  }).optional()
});

/**
 * Full Contract Schema (with ID and timestamps)
 */
export const contractSchema = documentSchema.extend({
  contractType: contractTypeEnum,
  contractStatus: contractStatusEnum,
  parties: z.array(z.object({
    name: z.string(),
    type: z.enum(['company', 'individual', 'government', 'other']),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    address: z.string().optional()
  })),
  effectiveDate: z.date(),
  expirationDate: z.date().optional(),
  renewalDate: z.date().optional(),
  autoRenew: z.boolean().default(false),
  value: z.number().optional(),
  currency: z.string().default('USD'),
  paymentTerms: z.string().optional(),
  signatories: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    email: z.string().email().optional(),
    signed: z.boolean().default(false),
    signatureDate: z.date().optional(),
    signatureId: z.string().optional()
  })).optional(),
  reviewers: z.array(z.number()).optional(), // User IDs
  customClauses: z.array(z.object({
    title: z.string(),
    text: z.string(),
    importance: z.enum(['low', 'medium', 'high', 'critical']).optional()
  })).optional(),
  riskAssessment: z.object({
    level: z.enum(['low', 'medium', 'high', 'critical']),
    notes: z.string().optional()
  }).optional()
});

/**
 * Contract Search Schema
 * For searching and filtering contracts
 */
export const contractSearchSchema = z.object({
  query: z.string().optional(),
  contractType: contractTypeEnum.optional(),
  contractStatus: contractStatusEnum.optional(),
  partyName: z.string().optional(),
  effectiveDateFrom: z.date().optional(),
  effectiveDateTo: z.date().optional(),
  expirationDateFrom: z.date().optional(),
  expirationDateTo: z.date().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  reviewer: z.number().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  sort: z.enum(['title', 'effectiveDate', 'expirationDate', 'value', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(20)
});

// Type definitions
export type ContractBase = z.infer<typeof contractBaseSchema>;
export type Contract = z.infer<typeof contractSchema>;
export type ContractSearch = z.infer<typeof contractSearchSchema>;