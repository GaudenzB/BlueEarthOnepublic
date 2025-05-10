import { Express, Request, Response } from "express";
import { authenticate, isSuperAdmin } from "../auth";
import { storage } from "../storage";
import { z } from "zod";
import { permissionAreaEnum } from "@shared/schema";

// Schema for adding a new permission
const addPermissionSchema = z.object({
  area: permissionAreaEnum,
  canView: z.boolean().default(true),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
});

// Schema for updating a permission
const updatePermissionSchema = z.object({
  canView: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

export function registerPermissionRoutes(app: Express) {
  // Get all permissions for a user
  app.get("/api/users/:userId/permissions", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Authorization check - only allow users to access their own permissions
      // unless they are a superadmin
      if (req.user?.id !== userId && req.user?.role !== "superadmin") {
        return res.status(403).json({ message: "Forbidden: Cannot access other users' permissions" });
      }
      
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  // Add a permission for a user
  app.post("/api/users/:userId/permissions", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Validate request body
      const validationResult = addPermissionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid permission data", errors: validationResult.error.errors });
      }
      
      const { area, canView, canEdit, canDelete } = validationResult.data;
      
      // Check if permission already exists for this area
      const existingPermissions = await storage.getUserPermissions(userId);
      const existingPermission = existingPermissions.find(p => p.area === area);
      
      if (existingPermission) {
        return res.status(409).json({ 
          message: `Permission for ${area} already exists for this user`,
          existingPermissionId: existingPermission.id
        });
      }
      
      // Add new permission
      const permission = await storage.addUserPermission({
        userId,
        area,
        canView,
        canEdit,
        canDelete,
      });
      
      res.status(201).json(permission);
    } catch (error) {
      console.error("Error adding user permission:", error);
      res.status(500).json({ message: "Failed to add user permission" });
    }
  });

  // Update a permission
  app.patch("/api/permissions/:id", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const permissionId = parseInt(req.params.id);
      
      // Validate request body
      const validationResult = updatePermissionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid permission data", errors: validationResult.error.errors });
      }
      
      // Update permission
      const updatedPermission = await storage.updateUserPermission(permissionId, validationResult.data);
      
      if (!updatedPermission) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      res.json(updatedPermission);
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ message: "Failed to update permission" });
    }
  });

  // Delete a permission
  app.delete("/api/permissions/:id", authenticate, isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const permissionId = parseInt(req.params.id);
      
      const deleted = await storage.deleteUserPermission(permissionId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      res.json({ message: "Permission deleted successfully" });
    } catch (error) {
      console.error("Error deleting permission:", error);
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });

  // Check if a user has a specific permission
  app.get("/api/check-permission/:area/:action", authenticate, async (req: Request, res: Response) => {
    try {
      const { area, action } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate action
      if (!['view', 'edit', 'delete'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'view', 'edit', or 'delete'" });
      }
      
      // Check permission
      const hasPermission = await storage.hasPermission(
        userId, 
        area, 
        action as 'view' | 'edit' | 'delete'
      );
      
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error checking permission:", error);
      res.status(500).json({ message: "Failed to check permission" });
    }
  });
}