import { Request, Response } from "express";
import { authenticate, isSuperAdmin, authorize } from "../auth";
import { storage } from "../storage";
import { z } from "zod";
import { insertUserPermissionSchema, permissionAreaEnum } from "@shared/schema";
import { Express } from "express";

export function registerPermissionRoutes(app: Express) {
  // Get permissions for a user (requires superadmin or being the user)
  app.get("/api/users/:userId/permissions", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user is requesting their own permissions or is a superadmin
      if (req.user!.id !== userId && req.user!.role !== "superadmin") {
        return res.status(403).json({ message: "Forbidden: You can only view your own permissions" });
      }
      
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Get user permissions error:", error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });
  
  // Add a permission for a user (requires superadmin)
  app.post("/api/users/:userId/permissions", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate request body
      const permissionSchema = insertUserPermissionSchema.merge(
        z.object({
          area: permissionAreaEnum,
        })
      );
      
      const permissionData = permissionSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if permission for this area already exists
      const existingPermissions = await storage.getUserPermissions(userId);
      const areaExists = existingPermissions.some(p => p.area === permissionData.area);
      
      if (areaExists) {
        return res.status(400).json({ message: "Permission for this area already exists" });
      }
      
      // Create permission
      const permission = await storage.addUserPermission(permissionData);
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Add user permission error:", error);
      res.status(500).json({ message: "Failed to add user permission" });
    }
  });
  
  // Update a permission (requires superadmin)
  app.patch("/api/permissions/:id", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate request body
      const updateSchema = z.object({
        canView: z.boolean().optional(),
        canEdit: z.boolean().optional(),
        canDelete: z.boolean().optional(),
      });
      
      const permissionData = updateSchema.parse(req.body);
      
      // Update permission
      const permission = await storage.updateUserPermission(id, permissionData);
      
      if (!permission) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      res.json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update permission error:", error);
      res.status(500).json({ message: "Failed to update permission" });
    }
  });
  
  // Delete a permission (requires superadmin)
  app.delete("/api/permissions/:id", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const success = await storage.deleteUserPermission(id);
      
      if (!success) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      res.json({ message: "Permission deleted successfully" });
    } catch (error) {
      console.error("Delete permission error:", error);
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });
  
  // Check if user has a specific permission
  app.get("/api/check-permission/:area/:action", authenticate, async (req: Request, res: Response) => {
    try {
      const { area, action } = req.params;
      const userId = req.user!.id;
      
      if (!['view', 'edit', 'delete'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'view', 'edit', or 'delete'" });
      }
      
      const hasPermission = await storage.hasPermission(
        userId, 
        area, 
        action as 'view' | 'edit' | 'delete'
      );
      
      res.json({ hasPermission });
    } catch (error) {
      console.error("Check permission error:", error);
      res.status(500).json({ message: "Failed to check permission" });
    }
  });
}