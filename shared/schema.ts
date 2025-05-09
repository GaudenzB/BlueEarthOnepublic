import { pgTable, text, serial, integer, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Employee data model
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  position: varchar("position", { length: 100 }).notNull(),
  department: varchar("department", { length: 50 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatar_url"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
});

export const employeeStatusEnum = z.enum([
  "active",
  "inactive",
  "on_leave",
  "remote",
]);

export type EmployeeStatus = z.infer<typeof employeeStatusEnum>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export const departmentEnum = z.enum([
  "engineering",
  "marketing",
  "design",
  "product",
  "hr",
  "sales",
]);

export type Department = z.infer<typeof departmentEnum>;
