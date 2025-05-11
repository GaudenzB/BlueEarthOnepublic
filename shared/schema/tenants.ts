import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Tenants Table
 * Supports multi-tenancy for the application
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  domain: varchar('domain', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 255 }),
  primaryColor: varchar('primary_color', { length: 20 }),
  secondaryColor: varchar('secondary_color', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  maxUsers: varchar('max_users', { length: 10 }),
  maxStorage: varchar('max_storage', { length: 20 }),
  settings: text('settings'),
});

/**
 * Tenant Insert Schema
 */
export const insertTenantSchema = createInsertSchema(tenants)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true
  });

/**
 * Tenant Select Schema
 */
export const selectTenantSchema = createSelectSchema(tenants);

export type Tenant = z.infer<typeof selectTenantSchema>;
export type InsertTenant = z.infer<typeof insertTenantSchema>;