import express, { type Express } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
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

/**
 * Initialize the application and start the server
 */
async function bootstrap(): Promise<void> {
  try {
    // Create Express application
    const app: Express = express();
    
    // Apply essential middleware
    setupSecurityMiddleware(app);
    setupSession(app);
    app.use(requestLoggerMiddleware);
    
    // Database initialization
    const isDatabaseConnected = await checkDatabaseConnection();
    if (!isDatabaseConnected) {
      throw new Error('Failed to connect to database. Please check your DATABASE_URL environment variable.');
    }
    
    // Run database migrations through the migration manager
    try {
      await runMigrations();
      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Database migration failed', { error });
      throw new Error('Database migration failed');
    }
    
    // Setup API documentation
    setupSwaggerDocs(app);
    
    // Initialize all feature modules (before main routes)
    logger.info('Starting feature module initialization...');
    try {
      const appModules = await initializeModules(app);
      logger.info(`Successfully initialized ${appModules.modules.length} feature modules`);
      
      // Store the module manager in app.locals for access in routes and middleware
      app.locals.modules = appModules;
    } catch (error) {
      logger.error('Feature module initialization failed', { error });
      throw new Error('Feature module initialization failed');
    }
    
    // Register main application routes
    logger.info('Registering main application routes...');
    const server = await registerRoutes(app);
    logger.info('Main application routes registered successfully');

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
    
    // Start the server
    server.listen({
      port,
      host,
      reusePort: true,
    }, () => {
      logger.info(`Server started successfully`, { 
        port, 
        host, 
        environment: config.env.current,
        nodeVersion: process.version,
        moduleCount: app.locals.modules.modules.length
      });
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received. Shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Application initialization failed', { 
      error, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
    process.exit(1);
  }
}

// Start the application
bootstrap().catch(error => {
  console.error('Fatal error during application bootstrap:', error);
  process.exit(1);
});
