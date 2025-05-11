import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { scheduleEmployeeSync } from "./services/employeeSync";
import { runMigrations } from "./migrations";
import { checkDatabaseConnection } from "./db";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestLoggerMiddleware } from "./middleware/requestLogger";
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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware (replaces custom logging)
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
  
  const server = await registerRoutes(app);

  // Register 404 handler (after routes, before error handler)
  app.use((req, res) => notFoundHandler(req, res));
  
  // Global error handler (must be registered last)
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

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
