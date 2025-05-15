import type { Express } from "express";
import { createServer, type Server } from "http";
import { json, urlencoded } from "express";
import cors from "cors";
import { setupSwaggerDocs } from "./middleware/swagger";
import { registerRoutes as registerOriginalRoutes } from "./routes";
import { setupAuth, authenticate } from "./auth-minimal";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply common middleware
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(cors());
  
  // Set up API documentation
  setupSwaggerDocs(app);
  
  // Set up authentication (this will register the auth routes)
  setupAuth(app);
  
  // Register existing routes
  const httpServer = await registerOriginalRoutes(app);
  
  // Define a simple test endpoint to verify our auth is working
  app.get('/api/protected', authenticate, (req, res) => {
    res.json({ 
      message: 'This is a protected endpoint',
      user: req.user,
      authenticated: req.isAuthenticated()
    });
  });
  
  // Test API endpoint to verify our API is available
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok',
      message: 'API is running',
      authenticated: req.isAuthenticated()
    });
  });
  
  return httpServer;
}