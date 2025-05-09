import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { authenticate, authorize, comparePassword, generateToken, hashPassword, isSuperAdmin } from "./auth";
import { insertUserSchema, userLoginSchema, userRoleEnum } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  
  // Register a new user (public route)
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      if (userData.email) {
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Generate token
      const token = generateToken(user);
      
      // Return user data without password and token
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  // Login (public route)
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const loginData = userLoginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(loginData.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if user is active
      if (!user.active) {
        return res.status(401).json({ message: "Your account has been deactivated" });
      }
      
      // Verify password
      const isPasswordValid = await comparePassword(loginData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate token
      const token = generateToken(user);
      
      // Return user data without password and token
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });
  
  // Get current user (protected route)
  app.get("/api/auth/me", authenticate, async (req: Request, res: Response) => {
    try {
      // Get user from database
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // User management routes (superadmin only)
  
  // Get all users (superadmin only)
  app.get("/api/users", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Return users without passwords
      const usersWithoutPasswords = users.map(({ password, ...rest }) => rest);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Get user by ID (superadmin only)
  app.get("/api/users/:id", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Create a new user (superadmin only)
  app.post("/api/users", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      if (userData.email) {
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Update user (superadmin only)
  app.patch("/api/users/:id", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate request body
      const updateSchema = z.object({
        username: z.string().min(3).optional(),
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        role: userRoleEnum.optional(),
        active: z.boolean().optional(),
        password: z.string().min(6).optional(),
      });
      
      const userData = updateSchema.parse(req.body);
      
      // If updating username, check if it already exists
      if (userData.username && userData.username !== existingUser.username) {
        const existingUsername = await storage.getUserByUsername(userData.username);
        if (existingUsername) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // If updating email, check if it already exists
      if (userData.email && userData.email !== existingUser.email) {
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // If updating password, hash it
      let updateData: any = { ...userData };
      if (userData.password) {
        updateData.password = await hashPassword(userData.password);
      }
      
      // Update user
      const updatedUser = await storage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Delete user (superadmin only)
  app.delete("/api/users/:id", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent superadmin from deleting themselves
      if (req.user!.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  
  // Employee routes (protected - require authentication)
  
  // Get all employees
  app.get("/api/employees", authenticate, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Get employee by ID
  app.get("/api/employees/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  // Search employees
  app.get("/api/employees/search/:query", authenticate, async (req, res) => {
    try {
      const query = req.params.query;
      const employees = await storage.searchEmployees(query);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to search employees" });
    }
  });

  // Filter employees by department
  app.get("/api/employees/department/:department", authenticate, async (req, res) => {
    try {
      const department = req.params.department;
      const employees = await storage.filterEmployeesByDepartment(department);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter employees by department" });
    }
  });

  // Filter employees by status
  app.get("/api/employees/status/:status", authenticate, async (req, res) => {
    try {
      const status = req.params.status;
      const employees = await storage.filterEmployeesByStatus(status);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter employees by status" });
    }
  });

  // Create employee
  app.post("/api/employees", async (req, res) => {
    try {
      const employeeSchema = z.object({
        name: z.string().min(1, "Name is required"),
        position: z.string().min(1, "Position is required"),
        department: z.string().min(1, "Department is required"),
        location: z.string().min(1, "Location is required"),
        email: z.string().email("Invalid email format"),
        phone: z.string().optional(),
        avatarUrl: z.string().optional(),
        status: z.string().default("active"),
      });

      const validatedData = employeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  // Update employee
  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeSchema = z.object({
        name: z.string().min(1, "Name is required").optional(),
        position: z.string().min(1, "Position is required").optional(),
        department: z.string().min(1, "Department is required").optional(),
        location: z.string().min(1, "Location is required").optional(),
        email: z.string().email("Invalid email format").optional(),
        phone: z.string().optional(),
        avatarUrl: z.string().optional(),
        status: z.string().optional(),
      });

      const validatedData = employeeSchema.parse(req.body);
      const employee = await storage.updateEmployee(id, validatedData);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Delete employee
  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
