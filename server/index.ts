// Load environment variables before any other imports
import './utils/env-loader.js';

import express, { type Express } from "express";
import { registerRoutes } from "./routes-new"; // Use our new routes file
import { setupVite, serveStatic } from "./vite";
import { runMigrations } from "./migrations";
import { checkDatabaseConnection } from "./db";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestLoggerMiddleware } from "./middleware/requestLogger";
import { setupSecurityMiddleware } from "./middleware/security";
import { setupSwaggerDocs } from "./middleware/swagger";
import { setupSession } from "./middleware/session";
import { setupAuth } from "./passport-auth"; // Import our new passport auth setup
import { logger } from "./utils/logger";
import { setupDefaultTenant } from "./utils/setupDefaultTenant";
import { env, isDevelopment } from "./config/env";
// Centralized environment configuration is imported from ./config/env

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
    // We're using our passport-auth.ts setup which includes session handling
    setupAuth(app); // Initialize Passport with its own session setup
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
      
      // Set up default tenant
      await setupDefaultTenant();
      logger.info('Default tenant setup completed');
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
      app.locals['moduleManager'] = appModules;
    } catch (error) {
      logger.error('Feature module initialization failed', { error });
      throw new Error('Feature module initialization failed');
    }
    
    // Register main application routes
    logger.info('Registering main application routes...');
    const server = await registerRoutes(app);
    logger.info('Main application routes registered successfully');

    // Set up Vite middleware for development or serve static files in production
    if (isDevelopment) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Register 404 handler (after routes and Vite setup)
    app.use((req, res) => notFoundHandler(req, res));
    
    // Global error handler (must be registered last)
    app.use(errorHandler);

    // Get server port and host from env
    const port = env.PORT;
    const host = env.HOST;
    
    // Start the server
    server.listen({
      port,
      host,
      reusePort: true,
    }, () => {
      logger.info(`Server started successfully`, { 
        port, 
        host, 
        environment: env.NODE_ENV,
        nodeVersion: process.version,
        moduleCount: app.locals['moduleManager'] ? app.locals['moduleManager']['modules'].length : 0
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
