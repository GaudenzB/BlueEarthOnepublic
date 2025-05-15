import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./passport-auth";
import { logger } from "./utils/logger";
import { authenticate } from "./auth"; // Keep existing auth middleware for other routes
import { apiLimiter, authLimiter } from "./middleware/rateLimit";
import documentsRoutes from "./routes/documents-refactored";
import documentPreviewRoutes from "./routes/documentPreview";
import semanticSearchRoutes from "./routes/semanticSearch";
import chunkedUploadsRoutes from "./routes/chunkedUploads";
import healthRoutes from "./routes/health";
import monitoringRoutes from "./routes/monitoring";
import testPdfRoutes from "./routes/test-pdf"; 
import entraSsoRoutes from "./routes/entraIdRoutes"; 
import authRoutes from "./routes/authRoutes"; 
import { registerPermissionRoutes } from "./routes/permissions";

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug middleware to log all requests
  app.use((req, res, next) => {
    logger.debug(`Received request: ${req.method} ${req.path}`);
    next();
  });
  
  // Setup session-based auth with Passport
  setupAuth(app);
  
  // Apply rate limiting to all API routes (except auth which has stricter limits)
  app.use('/api', (req, res, next) => {
    // Skip if it's an auth route (auth has its own rate limits)
    if (req.path.startsWith('/api/auth/')) {
      return next();
    }
    return apiLimiter(req, res, next);
  });
  
  // Register permission routes
  registerPermissionRoutes(app);

  // Register document and document preview routes
  app.use('/api/documents', documentsRoutes);
  app.use('/api/documents', documentPreviewRoutes);
  app.use('/api/semantic-search', semanticSearchRoutes);
  app.use('/api/chunked-uploads', chunkedUploadsRoutes);
  
  // Register health and monitoring routes
  app.use('/api/health', healthRoutes);
  app.use('/api/monitoring', monitoringRoutes);
  
  // Register Microsoft Entra ID SSO routes
  app.use('/api/auth/entra', entraSsoRoutes);
  
  // Register development auth routes
  app.use('/api/auth', authRoutes);
  
  // Register PDF testing route for debugging
  app.use('/api/test-pdf', testPdfRoutes);

  const httpServer = createServer(app);
  return httpServer;
}