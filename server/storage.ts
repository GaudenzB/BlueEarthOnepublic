import { users, type User, type InsertUser, employees, type Employee, type InsertEmployee } from "@shared/schema";
import { db } from "./db";
import { eq, like, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employee CRUD operations
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  searchEmployees(search: string): Promise<Employee[]>;
  filterEmployeesByDepartment(department: string): Promise<Employee[]>;
  filterEmployeesByStatus(status: string): Promise<Employee[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(insertEmployee)
      .returning();
    return employee;
  }

  async updateEmployee(id: number, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updatedEmployee] = await db
      .update(employees)
      .set(updates)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db
      .delete(employees)
      .where(eq(employees.id, id))
      .returning({ id: employees.id });
    return result.length > 0;
  }

  async searchEmployees(search: string): Promise<Employee[]> {
    if (!search) {
      return this.getAllEmployees();
    }
    const searchLower = search.toLowerCase();
    return await db
      .select()
      .from(employees)
      .where(
        or(
          like(employees.name.toLowerCase(), `%${searchLower}%`),
          like(employees.position.toLowerCase(), `%${searchLower}%`),
          like(employees.department.toLowerCase(), `%${searchLower}%`),
          like(employees.email.toLowerCase(), `%${searchLower}%`),
          like(employees.location.toLowerCase(), `%${searchLower}%`)
        )
      );
  }

  async filterEmployeesByDepartment(department: string): Promise<Employee[]> {
    if (!department || department === "all") {
      return this.getAllEmployees();
    }
    return await db
      .select()
      .from(employees)
      .where(eq(employees.department, department));
  }

  async filterEmployeesByStatus(status: string): Promise<Employee[]> {
    if (!status || status === "all") {
      return this.getAllEmployees();
    }
    return await db
      .select()
      .from(employees)
      .where(eq(employees.status, status));
  }
}

export const storage = new DatabaseStorage();