import { users, type User, type InsertUser, employees, type Employee, type InsertEmployee, userPermissions as userPermissionsTable, type UserPermission, type InsertUserPermission } from "@shared/schema";
import { db } from "./db";
import { eq, like, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Password reset operations
  setResetToken(email: string, token: string, expiresAt: string): Promise<boolean>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  resetUserPassword(userId: number, password: string): Promise<boolean>;
  
  // Employee CRUD operations
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  searchEmployees(search: string): Promise<Employee[]>;
  filterEmployeesByDepartment(department: string): Promise<Employee[]>;
  filterEmployeesByStatus(status: string): Promise<Employee[]>;
  
  // User permissions operations
  getUserPermissions(userId: number): Promise<UserPermission[]>;
  addUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  updateUserPermission(id: number, permission: Partial<InsertUserPermission>): Promise<UserPermission | undefined>;
  deleteUserPermission(id: number): Promise<boolean>;
  hasPermission(userId: number, area: string, permission: 'view' | 'edit' | 'delete'): Promise<boolean>;
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
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return result.length > 0;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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
          sql`LOWER(${employees.name}) LIKE ${'%' + searchLower + '%'}`,
          sql`LOWER(${employees.position}) LIKE ${'%' + searchLower + '%'}`,
          sql`LOWER(${employees.department}) LIKE ${'%' + searchLower + '%'}`,
          sql`LOWER(${employees.email}) LIKE ${'%' + searchLower + '%'}`,
          sql`LOWER(${employees.location}) LIKE ${'%' + searchLower + '%'}`
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
  
  // Password reset operations
  async setResetToken(email: string, token: string, expiresAt: string): Promise<boolean> {
    const [user] = await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpires: expiresAt
      })
      .where(eq(users.email, email))
      .returning();
    
    return !!user;
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token));
    
    if (!user) {
      return undefined;
    }
    
    // Check if token is expired
    if (user.resetTokenExpires) {
      const now = new Date();
      const tokenExpiry = new Date(user.resetTokenExpires);
      
      if (now > tokenExpiry) {
        // Token has expired, clear it
        await this.clearResetToken(user.id);
        return undefined;
      }
    }
    
    return user;
  }
  
  async resetUserPassword(userId: number, password: string): Promise<boolean> {
    const [user] = await db
      .update(users)
      .set({
        password,
        resetToken: null,
        resetTokenExpires: null
      })
      .where(eq(users.id, userId))
      .returning();
    
    return !!user;
  }
  
  private async clearResetToken(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        resetToken: null,
        resetTokenExpires: null
      })
      .where(eq(users.id, userId));
  }

  // User permissions methods
  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    return await db.select()
      .from(userPermissionsTable)
      .where(eq(userPermissionsTable.userId, userId));
  }

  async addUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    const [newPermission] = await db.insert(userPermissionsTable)
      .values(permission)
      .returning();
    return newPermission;
  }

  async updateUserPermission(id: number, permission: Partial<InsertUserPermission>): Promise<UserPermission | undefined> {
    const [updatedPermission] = await db.update(userPermissionsTable)
      .set(permission)
      .where(eq(userPermissionsTable.id, id))
      .returning();
    return updatedPermission;
  }

  async deleteUserPermission(id: number): Promise<boolean> {
    const result = await db.delete(userPermissionsTable)
      .where(eq(userPermissionsTable.id, id))
      .returning({ id: userPermissionsTable.id });
    return result.length > 0;
  }

  async hasPermission(userId: number, area: string, permission: 'view' | 'edit' | 'delete'): Promise<boolean> {
    // Super admins always have all permissions
    const user = await this.getUser(userId);
    if (user?.role === 'superadmin') {
      return true;
    }

    // For admins, grant view access to all areas by default
    if (user?.role === 'admin' && permission === 'view') {
      return true;
    }

    // Check specific permissions
    const permissions = await db.select()
      .from(userPermissionsTable)
      .where(eq(userPermissionsTable.userId, userId));
    
    // Filter for the specific area
    const areaPermissions = permissions.filter(p => p.area === area);

    if (areaPermissions.length === 0) {
      return false;
    }

    const userPermission = areaPermissions[0];
    if (permission === 'view') return userPermission.canView;
    if (permission === 'edit') return userPermission.canEdit;
    if (permission === 'delete') return userPermission.canDelete;

    return false;
  }
}

export const storage = new DatabaseStorage();