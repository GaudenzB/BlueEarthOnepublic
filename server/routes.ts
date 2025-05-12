import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  authenticate, 
  authorize, 
  comparePassword, 
  generateToken,
  revokeToken, 
  hashPassword, 
  isSuperAdmin,
  generateResetToken,
  calculateExpiryTime
} from "./auth";
import { 
  insertUserSchema, 
  userLoginSchema, 
  userRoleEnum, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  employeeStatusEnum,
  departmentEnum,
  insertEmployeeSchema,
  employeeSearchSchema
} from "@shared/schema";
import apiResponse from "./utils/apiResponse";
import { logger } from "./utils/logger";
import { sendPasswordResetEmail } from "./email/sendgrid";
import { validate, validateIdParameter } from "./middleware/validation";
import { ApiError } from "./middleware/errorHandler";
import { syncEmployeesFromBubble, scheduleEmployeeSync } from "./services/employeeSync";
import { registerPermissionRoutes } from "./routes/permissions";
import documentsRoutes from "./routes/documents";
import { apiLimiter, authLimiter, passwordResetLimiter } from "./middleware/rateLimit";
import contractsRoutes from "./routes/contracts";
import healthRoutes from "./routes/health";
import monitoringRoutes from "./routes/monitoring";
import { authController } from "./controllers/authController";

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug middleware to log all requests
  app.use((req, res, next) => {
    logger.debug(`Received request: ${req.method} ${req.path}`);
    next();
  });
  
  // Apply rate limiting to all API routes (except auth which has stricter limits)
  app.use('/api', (req, res, next) => {
    // Skip if it's an auth route (auth has its own rate limits)
    if (req.path.startsWith('/api/auth/')) {
      return next();
    }
    return apiLimiter(req, res, next);
  });
  
  // Register permission routes
  registerPermissionRoutes(app);

  // Register document and contract routes
  app.use('/api/documents', documentsRoutes);
  app.use('/api/contracts', contractsRoutes);
  
  // Register health and monitoring routes
  app.use('/api/health', healthRoutes);
  app.use('/api/monitoring', monitoringRoutes);

  // Auth routes
  
  // Register a new user (public route)
  app.post("/api/auth/register", authLimiter, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return sendError(res, "Username already exists", 400);
      }
      
      // Check if email already exists
      if (userData.email) {
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return sendError(res, "Email already exists", 400);
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
      return sendSuccess(res, { user: userWithoutPassword, token }, "User registered successfully", 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(res, error.errors);
      }
      console.error("Registration error:", error);
      return sendError(res, "Failed to register user");
    }
  });
  
  // Login (public route) - using the controller with error handling wrapper
  app.post("/api/auth/login", authLimiter, authController.login);
  
  // Logout (protected route) - using controller with error handling wrapper
  app.post("/api/auth/logout", authenticate, authController.logout);
  
  // Get current user (protected route) - using controller with error handling wrapper
  app.get("/api/auth/me", authenticate, authController.getCurrentUser);
  
  // Forgot password (public route) - using controller with error handling wrapper
  app.post("/api/auth/forgot-password", passwordResetLimiter, authController.forgotPassword);
  
  // Reset password (public route) - using controller with error handling wrapper
  app.post("/api/auth/reset-password", passwordResetLimiter, authController.resetPassword);
  
  // User management routes (protected, superadmin only)
  
  // Get all users
  app.get("/api/users", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return sendSuccess(res, usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      return sendError(res, "Failed to get users");
    }
  });
  
  // Get user by ID
  app.get("/api/users/:id", authenticate, isSuperAdmin, validateIdParameter(), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return sendNotFound(res, "User not found");
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return sendSuccess(res, userWithoutPassword);
    } catch (error) {
      logger.error({ userId: req.params.id, error }, "Error retrieving user");
      return sendError(res, "Failed to get user");
    }
  });
  
  // Create user
  app.post("/api/users", authenticate, isSuperAdmin, validate(insertUserSchema), async (req: Request, res: Response) => {
    try {
      // Get validated data from request body
      const userData = req.body;
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return sendError(res, "Username already exists", 400);
      }
      
      // Check if email already exists
      if (userData.email) {
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return sendError(res, "Email already exists", 400);
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
      return sendSuccess(res, userWithoutPassword, "User created successfully", 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(res, error.errors);
      }
      console.error("Create user error:", error);
      return sendError(res, "Failed to create user");
    }
  });
  
  // Update user
  app.patch("/api/users/:id", authenticate, isSuperAdmin, validateIdParameter(), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Define reusable validation schema for user updates
      const updateUserSchema = z.object({
        body: z.object({
          username: z.string().min(3, "Username must be at least 3 characters").optional(),
          email: z.string().email("Invalid email format").optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          role: userRoleEnum.optional(),
          active: z.boolean().optional(),
          password: z.string().min(6, "Password must be at least 6 characters").optional(),
        })
      });
      
      // Validate request before processing
      await updateUserSchema.parseAsync({
        body: req.body
      });
      
      const updateData = req.body;
      
      // If updating username, check if it already exists
      if (updateData.username) {
        const existingUsername = await storage.getUserByUsername(updateData.username);
        if (existingUsername && existingUsername.id !== id) {
          return sendError(res, "Username already exists", 400);
        }
      }
      
      // If updating email, check if it already exists
      if (updateData.email) {
        const existingEmail = await storage.getUserByEmail(updateData.email);
        if (existingEmail && existingEmail.id !== id) {
          return sendError(res, "Email already exists", 400);
        }
      }
      
      // If updating password, hash it
      let updatedData = { ...updateData };
      if (updateData.password) {
        const hashedPassword = await hashPassword(updateData.password);
        updatedData = { ...updatedData, password: hashedPassword };
      }
      
      // Update user
      const user = await storage.updateUser(id, updatedData);
      
      if (!user) {
        return sendNotFound(res, "User not found");
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      return sendSuccess(res, userWithoutPassword, "User updated successfully");
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(res, error.errors);
      }
      console.error("Update user error:", error);
      return sendError(res, "Failed to update user");
    }
  });
  
  // Delete user
  app.delete("/api/users/:id", authenticate, isSuperAdmin, validateIdParameter(), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent deleting yourself
      if (id === req.user!.id) {
        return sendError(res, "You cannot delete your own account", 400);
      }
      
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return sendNotFound(res, "User not found");
      }
      
      logger.info({ userId: id, deletedBy: req.user!.id }, "User deleted");
      return sendSuccess(res, null, "User deleted successfully");
    } catch (error) {
      logger.error({ userId: req.params.id, error }, "Error deleting user");
      return sendError(res, "Failed to delete user");
    }
  });

  // Employee routes
  
  // Get all employees
  app.get("/api/employees", authenticate, async (req, res) => {
    try {
      // Define schema for query parameters
      const employeeQuerySchema = z.object({
        query: z.object({
          search: z.string().optional(),
          department: departmentEnum.optional(),
          status: employeeStatusEnum.optional()
        })
      });
      
      // Validate query parameters
      try {
        await employeeQuerySchema.parseAsync({
          query: req.query
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formattedErrors = error.errors.reduce((acc: Record<string, string>, curr) => {
            const path = curr.path.join('.').replace(/^query\./, '');
            acc[path] = curr.message;
            return acc;
          }, {});
          
          logger.debug({ 
            path: req.path, 
            errors: formattedErrors 
          }, 'Query parameter validation error');
          
          return sendValidationError(res, formattedErrors);
        }
        throw error;
      }
      
      // Get sanitized parameters
      const search = req.query.search as string;
      const department = req.query.department as string;
      const status = req.query.status as string;
      
      let employees;
      
      if (search) {
        employees = await storage.searchEmployees(search);
      } else if (department) {
        employees = await storage.filterEmployeesByDepartment(department);
      } else if (status) {
        employees = await storage.filterEmployeesByStatus(status);
      } else {
        employees = await storage.getAllEmployees();
      }
      
      return sendSuccess(res, employees);
    } catch (error) {
      console.error("Get employees error:", error);
      return sendError(res, "Failed to get employees");
    }
  });
  
  // Get employee by ID
  app.get("/api/employees/:id", authenticate, validateIdParameter(), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return sendNotFound(res, "Employee not found");
      }
      
      return sendSuccess(res, employee);
    } catch (error) {
      logger.error({ employeeId: req.params.id, error }, "Error retrieving employee");
      return sendError(res, "Failed to get employee");
    }
  });
  
  // Create employee (manual entry, not via Bubble sync)
  app.post("/api/employees", authenticate, validate(z.object({ body: insertEmployeeSchema })), async (req, res) => {
    try {
      // Since we've already validated with the middleware, we can use the body directly
      const validatedData = req.body;
      
      // Log the validated employee data
      logger.debug('Creating employee with validated data', {
        name: validatedData.name,
        email: validatedData.email,
        department: validatedData.department,
        status: validatedData.status
      });
      
      const employee = await storage.createEmployee(validatedData);
      
      return sendSuccess(res, employee, "Employee created successfully", 201);
    } catch (error) {
      logger.error({ error }, "Error creating employee");
      return sendError(res, "Failed to create employee");
    }
  });
  
  // Update employee
  app.patch("/api/employees/:id", authenticate, validateIdParameter(), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Create a partial schema based on the insertEmployeeSchema 
      // to validate update operations for complete type safety
      const updateEmployeeSchema = z.object({
        body: insertEmployeeSchema.partial()
      });
      
      // Validate request
      await updateEmployeeSchema.parseAsync({
        body: req.body
      });
      
      // We've already validated the request with the schema
      // Now we can use the body directly
      const validatedData = req.body;
      
      // Log the update operation
      logger.debug('Updating employee', {
        id,
        fields: Object.keys(validatedData),
      });
      
      const employee = await storage.updateEmployee(id, validatedData.body);
      
      if (!employee) {
        return sendNotFound(res, "Employee not found");
      }
      
      return sendSuccess(res, employee, "Employee updated successfully");
    } catch (error) {
      logger.error({ employeeId: req.params.id, error }, "Error updating employee");
      return sendError(res, "Failed to update employee");
    }
  });

  // Delete employee
  app.delete("/api/employees/:id", authenticate, validateIdParameter(), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return sendNotFound(res, "Employee not found");
      }
      
      logger.info({ employeeId: id, deletedBy: req.user!.id }, "Employee deleted");
      return sendSuccess(res, null, "Employee deleted successfully");
    } catch (error) {
      logger.error({ employeeId: req.params.id, error }, "Error deleting employee");
      return sendError(res, "Failed to delete employee");
    }
  });
  
  // Trigger manual employee sync from Bubble.io
  app.post("/api/sync/employees", authenticate, isSuperAdmin, async (req, res) => {
    try {
      // Check if the Bubble API key is configured
      if (!process.env.BUBBLE_API_KEY) {
        logger.error("Bubble API key not configured");
        return sendError(res, "External API key not configured", 400);
      }
      
      logger.info({ initiatedBy: req.user!.id }, "Manual employee sync initiated");
      const result = await syncEmployeesFromBubble();
      
      logger.info({ 
        totalEmployees: result.totalEmployees,
        created: result.created,
        updated: result.updated,
        unchanged: result.unchanged,
        errors: result.errors
      }, "Employee sync completed");
      
      return sendSuccess(res, result, "Employee sync completed");
    } catch (error) {
      logger.error({ error }, "Employee sync error");
      return sendError(res, "Failed to sync employees from external system");
    }
  });

  // Add a catch-all route for client-side navigation
  // This needs to be added after all API routes but before creating the HTTP server
  app.get("*", (req, res, next) => {
    // Skip API routes (they should be handled by their own handlers)
    if (req.path.startsWith('/api/')) {
      logger.debug(`API route not found: ${req.method} ${req.path}`);
      return next();
    }
    
    // Log request for debugging
    logger.debug(`Serving client-side route: ${req.path}`);
    
    // This will be handled by the Vite middleware in development
    // or the static file serving in production
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}