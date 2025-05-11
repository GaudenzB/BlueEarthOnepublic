import { pgTable, uuid, text, varchar, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Tenants Table
 * For multi-tenant support in the application
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  active: boolean('active').default(true).notNull(),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Tenant Insert Schema
 * Validation schema for tenant creation
 */
export const insertTenantSchema = createInsertSchema(tenants)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    settings: z.record(z.string(), z.any()).optional(),
  });

/**
 * Tenant Select Schema
 * Validation schema for tenant retrieval
 */
export const selectTenantSchema = createSelectSchema(tenants)
  .extend({
    settings: z.record(z.string(), z.any()).optional(),
  });

export type Tenant = z.infer<typeof selectTenantSchema>;
export type InsertTenant = z.infer<typeof insertTenantSchema>;