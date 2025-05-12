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
import config from "./utils/config";

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
    
    // Schedule employee sync from Bubble.io if API key is available
    const { apiKey, syncIntervalMinutes } = config.integrations.bubble;
    if (apiKey) {
      logger.info('Initializing Bubble.io employee sync', { syncIntervalMinutes });
      scheduleEmployeeSync(syncIntervalMinutes);
    } else {
      logger.warn('Bubble.io API key not set, employee sync disabled');
    }
  });
})();
