import express, { Request, Response } from 'express';
import { documentRepository } from '../repositories/documentRepository';
import { downloadFile } from '../services/documentStorage';
import { logger } from '../utils/logger';
// Use our custom verifyToken function
import { verifyToken } from '../utils/jwtHelper';

// Get the JWT secret key - use same approach as in server/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'development' 
  ? 'development_only_secret_key_not_for_production' 
  : ''
);

const router = express.Router();

/**
 * @route GET /api/documents/:id/preview
 * @desc Get a document preview (HTML format)
 * @access Authenticated users with token in query parameter
 */
router.get('/:id/preview', async (req: Request, res: Response) => {
  try {
    // Custom authentication for preview that accepts token as a URL parameter
    // This is needed because iframes don't send authentication headers
    const token = req.query.token as string | undefined;
    
    if (!token) {
      logger.debug('Preview access attempted without token');
      return res.status(400).json({
        success: false,
        message: "Missing preview token"
      });
    }
    
    if (!JWT_SECRET) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: "Server configuration error - missing JWT_SECRET"
      });
    }
    
    // Log token verification attempt
    logger.debug('Token verification attempt', {
      tokenPrefix: token.substring(0, 10) + '...'
    });

    // Verify the token using our custom verifyToken function
    const payload = verifyToken(token, JWT_SECRET);
    
    if (!payload) {
      logger.error('Token verification failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    logger.debug('Token verified successfully');
    
    // Set tenant ID (either from token or default)
    const tenantId = payload.tenantId || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
    
    // Get document ID from URL or JWT payload
    const documentId = req.params.id || payload.documentId;
    
    // Verify the document ID is from the same document specified in the token
    if (payload.documentId && payload.documentId !== documentId) {
      logger.warn('Token document ID mismatch', { 
        tokenDocId: payload.documentId, 
        requestDocId: documentId 
      });
      return res.status(403).json({
        success: false,
        message: 'Token is not valid for this document'
      });
    }
    
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
      
      // For other file types, prompt download with proper headers
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalFilename)}"`);
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