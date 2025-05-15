import { pgTable, text, serial, integer, boolean, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"),
  active: boolean("active").notNull().default(true),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  resetToken: text("reset_token"),
  resetTokenExpires: text("reset_token_expires"),
  // SSO integration fields
  azureAdId: text("azure_ad_id").unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
  azureAdId: true,
});

export const userRoleEnum = z.enum([
  "superadmin",
  "admin",
  "manager",
  "user",
]);

// Define functional permission areas
export const permissionAreaEnum = z.enum([
  "finance",
  "hr",
  "it",
  "legal",
  "operations",
  "documents",
]);

export type PermissionArea = z.infer<typeof permissionAreaEnum>;

export const userLoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  resetUrl: z.string().url("Invalid URL format").optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type UserRole = z.infer<typeof userRoleEnum>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

/**
 * Employee data model
 * 
 * Stores employee information synced from Bubble.io with additional fields
 * for detailed employee profiles.
 * 
 * @version 2
 * @changes 
 * - Added bio and responsibilities fields in migration 20250511_002
 */
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  position: varchar("position", { length: 100 }).notNull(),
  department: varchar("department", { length: 50 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  responsibilities: text("responsibilities"),
  // Status should match values in employeeStatusEnum
  status: varchar("status", { length: 20 }).notNull().default("active"),
  // Tracking fields for change management
  updatedAt: text("updated_at").default(new Date().toISOString()),
  syncedAt: text("synced_at").default(new Date().toISOString()),
});

/**
 * Enum for valid employee status values
 * Used for validation and type safety in both client and server code
 */
export const employeeStatusEnum = z.enum([
  "active",
  "inactive",
  "on_leave",
  "remote",
]);

/**
 * Schema for inserting an employee
 * Extends the base schema from the database table with additional validation
 */
export const insertEmployeeSchema = createInsertSchema(employees)
  .omit({
    id: true,
    updatedAt: true,
    syncedAt: true,
  })
  .extend({
    // Override status field to ensure it matches the enum values
    status: employeeStatusEnum.default("active"),
    // Add validation for email format
    email: z.string().email("Invalid email format").min(3).max(100),
  });

// Enhanced employee search schema for filtering
export const employeeSearchSchema = z.object({
  query: z.string().optional(),
  department: z.string().optional(),
  status: employeeStatusEnum.optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(20),
});

export type EmployeeStatus = z.infer<typeof employeeStatusEnum>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type EmployeeSearch = z.infer<typeof employeeSearchSchema>;

/**
 * Enum for valid department values
 * Used for validation and type safety in both client and server code
 */
export const departmentEnum = z.enum([
  "engineering",
  "marketing",
  "design",
  "product",
  "hr",
  "sales",
  "finance",
  "legal",
  "operations",
  "executive",
]);

/**
 * Department-related schemas for enhanced validation
 */
export const departmentFilterSchema = z.object({
  department: departmentEnum,
});

export type Department = z.infer<typeof departmentEnum>;
export type DepartmentFilter = z.infer<typeof departmentFilterSchema>;

// User permissions table
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  area: text("area").notNull(),
  canView: boolean("can_view").notNull().default(true),
  canEdit: boolean("can_edit").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  createdAt: true,
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;

/**
 * Sessions table for storing express-session data
 * Used by connect-pg-simple to store session information
 */
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey().notNull(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => {
  return {
    expireIdx: index('IDX_session_expire').on(table.expire)
  };
});

/**
 * Tenants Table
 * Supports multi-tenancy for the application
 */
export const tenants = pgTable('tenants', {
  id: varchar('id', { length: 36 }).primaryKey(),
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
export const selectTenantSchema = createInsertSchema(tenants);

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

// Import document schema from subdirectories
import { documents, processingStatusEnum as docProcessingStatusEnum, documentTypeEnum } from './schema/documents/documents';
import { analysisVersions, analysisStatusEnum } from './schema/documents/analysisVersions';
import { documentEmbeddings } from './schema/documents/embeddings';

// Re-export for easy access
export { 
  documents, 
  analysisVersions, 
  documentEmbeddings,
  docProcessingStatusEnum, 
  documentTypeEnum, 
  analysisStatusEnum
};
