/**
 * Server-side Contract Models
 * 
 * This file extends the common contract types with server-specific
 * schemas and utilities for database operations.
 */

import { z } from 'zod';
import { 
  contractBaseSchema
} from '@blueearth/core-common';

/**
 * Insert Contract Schema
 * This schema is used for inserting a new contract into the database
 * It omits auto-generated fields like id and timestamps
 */
export const insertContractSchema = contractBaseSchema;

/**
 * Update Contract Schema
 * This schema is used for updating an existing contract
 * All fields are optional to allow partial updates
 */
export const updateContractSchema = contractBaseSchema.partial();

/**
 * Contract Audit Log Schema
 * This schema is used for tracking contract changes
 */
export const contractAuditSchema = z.object({
  id: z.number().optional(),
  contractId: z.number(),
  userId: z.number(),
  action: z.enum(['create', 'update', 'delete', 'share', 'download', 'sign', 'review']),
  details: z.string().optional(),
  timestamp: z.date().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

/**
 * Contract Reminder Schema
 * This schema is used for contract reminders and notifications
 */
export const contractReminderSchema = z.object({
  id: z.number().optional(),
  contractId: z.number(),
  userId: z.number(),
  type: z.enum(['expiration', 'renewal', 'review', 'custom']),
  dueDate: z.date(),
  reminderDate: z.date(),
  message: z.string().optional(),
  isCompleted: z.boolean().default(false),
  completedAt: z.date().optional(),
  completedBy: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

/**
 * Contract Approval Schema
 * This schema is used for contract approval workflows
 */
export const contractApprovalSchema = z.object({
  id: z.number().optional(),
  contractId: z.number(),
  approverId: z.number(),
  sequence: z.number(),
  status: z.enum(['pending', 'approved', 'rejected', 'skipped']),
  comments: z.string().optional(),
  actionDate: z.date().optional(),
  dueDate: z.date().optional(),
  notificationSent: z.boolean().default(false),
  notificationDate: z.date().optional()
});

/**
 * Type definitions
 * These are used for database operations
 */
export type InsertContract = z.infer<typeof insertContractSchema>;
export type UpdateContract = z.infer<typeof updateContractSchema>;
export type ContractAudit = z.infer<typeof contractAuditSchema>;
export type ContractReminder = z.infer<typeof contractReminderSchema>;
export type ContractApproval = z.infer<typeof contractApprovalSchema>;