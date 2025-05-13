import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { documentRepository } from '../repositories/documentRepository';
import { downloadFile } from '../services/documentStorage';
import { logger } from '../utils/logger';

// Import constants from auth.ts for consistency
const TOKEN_AUDIENCE = 'blueearth-portal';
const TOKEN_ISSUER = 'blueearth-api';

const router = express.Router();

/**
 * @route GET /api/documents/:id/preview
 * @desc Get a document preview (HTML format)
 * @access Authenticated users with token in query parameter
 */
router.get('/:id/preview', async (req: Request, res: Response) => {
  // Custom authentication for preview that accepts token as a URL parameter
  // This is needed because iframes don't send authentication headers
  const tokenFromQuery = req.query.token as string | undefined;
  
  if (!tokenFromQuery) {
    logger.debug('Preview access attempted without token');
    return res.status(401).json({
      success: false,
      message: "No token provided for preview"
    });
  }
  
  // Get the JWT secret key - use same approach as in server/auth.ts
  const JWT_SECRET = process.env['JWT_SECRET'] || (
    process.env['NODE_ENV'] === 'development' 
    ? 'development_only_secret_key_not_for_production' 
    : undefined
  );

  if (!JWT_SECRET) {
    logger.error('JWT_SECRET not configured');
    return res.status(500).json({
      success: false,
      message: "Server configuration error - missing JWT_SECRET"
    });
  }
  
  try {
    // Log token verification attempt
    logger.debug('Token verification attempt', {
      tokenPrefix: tokenFromQuery.substring(0, 10) + '...',
      secretPrefix: JWT_SECRET.substring(0, 5) + '...',
      nodeEnv: process.env['NODE_ENV']
    });

    // Try to verify the token
    let decoded;
    try {
      // Use the verify function with options
      decoded = jwt.verify(tokenFromQuery, JWT_SECRET, {
        audience: TOKEN_AUDIENCE,
        issuer: TOKEN_ISSUER
      });
      logger.debug('Token verified successfully');
    } catch (verifyError: any) {
      // If in development, try with the development secret as fallback
      if (process.env['NODE_ENV'] === 'development') {
        try {
          // Also use options with the fallback secret
          decoded = jwt.verify(tokenFromQuery, 'development_only_secret_key_not_for_production', {
            audience: TOKEN_AUDIENCE,
            issuer: TOKEN_ISSUER
          });
          logger.debug('Token verified with development fallback secret');
        } catch (devSecretError) {
          logger.error('Token verification failed with both secrets', { error: verifyError.message });
          return res.status(401).json({
            success: false,
            message: `Invalid token: ${verifyError.message}`
          });
        }
      } else {
        // In production, don't try the fallback
        logger.error('Token verification failed', { error: verifyError.message });
        return res.status(401).json({
          success: false,
          message: `Invalid token: ${verifyError.message}`
        });
      }
    }

    // Set the user on the request based on the token
    (req as any).user = decoded;
    (req as any).tenantId = process.env['DEFAULT_TENANT_ID'] || '00000000-0000-0000-0000-000000000001';
    
    const documentId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    // Get document metadata
    const document = await documentRepository.getById(documentId, tenantId);
    if (!document) {
      return res.status(404).send(`
        <html>
          <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <div style="color: #f87171; font-size: 48px; margin-bottom: 20px;">⚠️</div>
              <h2 style="color: #1f2937; margin-bottom: 10px;">Document Not Found</h2>
              <p style="color: #6b7280;">The requested document could not be found.</p>
            </div>
          </body>
        </html>
      `);
    }
    
    if (document.processingStatus !== 'COMPLETED') {
      return res.status(202).send(`
        <html>
          <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <div style="color: #3b82f6; font-size: 48px; margin-bottom: 20px;">⏳</div>
              <h2 style="color: #1f2937; margin-bottom: 10px;">Processing</h2>
              <p style="color: #6b7280;">Document is currently being processed. Please check back soon.</p>
            </div>
          </body>
        </html>
      `);
    }
    
    try {
      // Download file from storage
      const fileBuffer = await downloadFile(document.storageKey);
      
      // For PDF files, embed directly
      if (document.mimeType === 'application/pdf') {
        // Send a simple HTML page that embeds the PDF
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${document.title || document.originalFilename}</title>
              <style>
                body, html {
                  margin: 0;
                  padding: 0;
                  height: 100%;
                  overflow: hidden;
                }
                #pdf-viewer {
                  width: 100%;
                  height: 100%;
                  border: none;
                }
              </style>
            </head>
            <body>
              <iframe id="pdf-viewer" src="data:application/pdf;base64,${fileBuffer.toString('base64')}" type="application/pdf"></iframe>
            </body>
          </html>
        `);
      }
      
      // For other file types, prompt download
      res.setHeader('Content-Disposition', `inline; filename="${document.originalFilename}"`);
      res.setHeader('Content-Type', document.mimeType);
      return res.send(fileBuffer);
    } catch (error: any) {
      logger.error('Error serving document preview', { 
        error: error.message, 
        documentId,
        tenantId
      });
      
      return res.status(500).send(`
        <html>
          <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <div style="color: #f87171; font-size: 48px; margin-bottom: 20px;">⚠️</div>
              <h2 style="color: #1f2937; margin-bottom: 10px;">Error Displaying Document</h2>
              <p style="color: #6b7280;">There was an error loading the document preview. Please try again later.</p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error: any) {
    logger.error('Error in document preview route', { error: error.message });
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

export default router;