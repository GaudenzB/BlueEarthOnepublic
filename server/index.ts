import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./migrations";
import { checkDatabaseConnection } from "./db";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestLoggerMiddleware } from "./middleware/requestLogger";
import { setupSecurityMiddleware } from "./middleware/security";
import { setupSwaggerDocs } from "./middleware/swagger";
import { setupSession } from "./middleware/session";
import { logger } from "./utils/logger";
import config from "./utils/config";

// Import the modular system
import { initializeModules } from "../modules";

/**
 * Express Application Setup
 * 
 * This module sets up the Express application with all middleware,
 * routes, and error handlers.
 */

// Create Express application
const app = express();

// Apply security middleware (includes JSON body parsing, CORS, Helmet)
setupSecurityMiddleware(app);

// Set up session handling (Redis or PostgreSQL)
setupSession(app);

// Request logging middleware
app.use(requestLoggerMiddleware);

(async () => {
  // Check database connection before proceeding
  const isDatabaseConnected = await checkDatabaseConnection();
  if (!isDatabaseConnected) {
    logger.error('Failed to connect to database. Please check your DATABASE_URL environment variable.');
    process.exit(1);
  }
  
  // Run database migrations through the migration manager
  try {
    await runMigrations();
  } catch (error) {
    logger.error('Database migration failed', { error });
    process.exit(1);
  }
  
  // Setup API documentation
  setupSwaggerDocs(app);
  
  // Initialize all feature modules (before main routes)
  logger.info('Initializing feature modules');
  const appModules = initializeModules(app);
  logger.info(`Initialized ${appModules.modules.length} feature modules`);
  
  // Register main application routes
  const server = await registerRoutes(app);

  // Set up Vite middleware for development or serve static files in production
  if (config.env.isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Register 404 handler (after routes and Vite setup)
  app.use((req, res) => notFoundHandler(req, res));
  
  // Global error handler (must be registered last)
  app.use(errorHandler);

  // Get server port and host from config
  const { port, host } = config.server;
  
  server.listen({
    port,
    host,
    reusePort: true,
  }, () => {
    logger.info(`Server started successfully`, { port, host, environment: config.env.current });
    
    // Module initialization has now replaced the direct scheduling of employee syncs
    // Each module handles its own initialization through the setupXModule function
  });
})();
