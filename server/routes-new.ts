import type { Express } from "express";
import { createServer, type Server } from "http";
import { json, urlencoded } from "express";
import cors from "cors";
import { setupSwaggerDocs } from "./middleware/swagger";
import { registerRoutes as registerOriginalRoutes } from "./routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply common middleware
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(cors());
  
  // Set up API documentation
  setupSwaggerDocs(app);
  
  // For now, we'll use the original routes setup but with our new auth system
  // This will let us keep existing functionality while transitioning to the new auth
  // We'll update route modules gradually as we get the auth system working
  const httpServer = await registerOriginalRoutes(app);
  
  return httpServer;
}