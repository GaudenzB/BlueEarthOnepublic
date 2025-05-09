import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Get all employees
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Get employee by ID
  app.get("/api/employees/:id", async (req, res) => {
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
  app.get("/api/employees/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const employees = await storage.searchEmployees(query);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to search employees" });
    }
  });

  // Filter employees by department
  app.get("/api/employees/department/:department", async (req, res) => {
    try {
      const department = req.params.department;
      const employees = await storage.filterEmployeesByDepartment(department);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter employees by department" });
    }
  });

  // Filter employees by status
  app.get("/api/employees/status/:status", async (req, res) => {
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
