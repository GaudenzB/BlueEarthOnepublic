import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { scheduleEmployeeSync } from "./services/employeeSync";
import { runMigrations } from "./migrations";
import { checkDatabaseConnection } from "./db";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestLoggerMiddleware } from "./middleware/requestLogger";
import { setupSecurityMiddleware } from "./middleware/security";
import { setupSwaggerDocs } from "./middleware/swagger";
import { setupSession } from "./middleware/session";
import { logger } from "./utils/logger";

/**
 * Express Application Setup
 * 
 * This module sets up the Express application with all middleware,
 * routes, and error handlers.
 */

// Create Express application
const app = express();

// Basic middleware
app.use(express.json({
  limit: '1mb',  // Limit request body size to prevent DoS attacks
  verify: (req: Request, res: Response, buf: Buffer) => {
    // Store raw body for certain routes that need it (like webhooks)
    if (req.path.startsWith('/api/webhooks/')) {
      (req as any).rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Apply security middleware (CORS, Helmet, CSRF)
setupSecurityMiddleware(app);

// Set up session handling (Redis or PostgreSQL)
setupSession(app);

// Request logging middleware
app.use(requestLoggerMiddleware);

(async () => {
  // Check database connection before proceeding
  const isDatabaseConnected = await checkDatabaseConnection();
  if (!isDatabaseConnected) {
    log('ERROR: Failed to connect to database. Please check your DATABASE_URL environment variable.');
    process.exit(1);
  }
  
  // Run database migrations through the migration manager
  try {
    await runMigrations();
  } catch (error) {
    log(`ERROR: Database migration failed: ${error}`);
    process.exit(1);
  }
  
  // Setup API documentation
  setupSwaggerDocs(app);
  
  const server = await registerRoutes(app);

  // importantly setup vite in development before the catch-all routes
  // so vite middleware can handle frontend routes properly
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Register 404 handler (after routes and Vite setup)
  app.use((req, res) => notFoundHandler(req, res));
  
  // Global error handler (must be registered last)
  app.use(errorHandler);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Schedule employee sync from Bubble.io
    if (process.env.BUBBLE_API_KEY) {
      log('Initializing Bubble.io employee sync');
      scheduleEmployeeSync(60); // Sync every 60 minutes
    } else {
      log('Bubble.io API key not set, employee sync disabled');
    }
  });
})();
