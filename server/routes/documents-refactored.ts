import express, { Request, Response } from 'express';
import { authenticate } from '../auth';
import { tenantContext } from '../middleware/tenantContext';
import { singleFileUpload } from '../middleware/upload';
import { documentController } from '../controllers/documentController';
import { authorize } from '../auth';
import { z } from 'zod';
import { documentTypeZod } from '../../shared/schema/documents/documents';

const router = express.Router();

// Schema for document search/filter
const getDocumentsSchema = z.object({
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
  documentType: documentTypeZod.optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  tags: z.array(z.string()).optional(),
});

/**
 * @route POST /api/documents
 * @desc Upload a new document
 * @access Authenticated users
 */
router.post('/', authenticate, tenantContext, (req: Request, res: Response) => {
  singleFileUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file'
      });
    }
    
    await documentController.uploadDocument(req, res);
  });
});

/**
 * @route GET /api/documents
 * @desc Get all documents
 * @access Authenticated users
 */
router.get('/', authenticate, tenantContext, documentController.getDocuments.bind(documentController));

/**
 * @route GET /api/documents/:id
 * @desc Get a document by ID
 * @access Authenticated users
 */
router.get('/:id', authenticate, tenantContext, documentController.getDocumentById.bind(documentController));

/**
 * @route DELETE /api/documents/:id
 * @desc Delete a document (soft delete)
 * @access Authenticated users with delete permission
 */
router.delete('/:id', authenticate, tenantContext, authorize(['admin', 'superadmin']), documentController.deleteDocument.bind(documentController));

/**
 * @route GET /api/documents/download-url/:id
 * @desc Generate a pre-signed URL for direct document download
 * @access Authenticated users
 */
router.get('/download-url/:id', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenantId;
    const contentType = req.query.contentType as string;
    const expiresInSeconds = req.query.expiresIn ? parseInt(req.query.expiresIn as string, 10) : 3600;
    
    // Get document from database to verify existence and access rights
    const document = await documentRepository.getById(id, tenantId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
        error: 'DOCUMENT_NOT_FOUND'
      });
    }
    
    // Import dynamically to avoid circular dependencies
    const { getDownloadUrl } = await import('../services/documentStorage');
    
    // Generate pre-signed URL
    const downloadUrl = await getDownloadUrl(
      document.storageKey,
      expiresInSeconds,
      contentType || document.mimeType
    );
    
    // Return the URL to the client
    return res.status(200).json({
      success: true,
      data: {
        url: downloadUrl,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
        documentId: id,
        documentName: document.originalFilename
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Failed to generate download URL: ${error.message}`,
      error: 'DOWNLOAD_URL_GENERATION_FAILED'
    });
  }
});

/**
 * @route GET /api/documents/upload-url
 * @desc Generate a pre-signed URL for direct document upload
 * @access Authenticated users
 */
router.get('/upload-url', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const documentType = (req.query.documentType as string) || 'OTHER';
    const filename = req.query.filename as string;
    const contentType = req.query.contentType as string;
    const expiresInSeconds = req.query.expiresIn ? parseInt(req.query.expiresIn as string, 10) : 900; // 15 minutes
    
    // Validate input
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required',
        error: 'MISSING_FILENAME'
      });
    }
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content type is required',
        error: 'MISSING_CONTENT_TYPE'
      });
    }
    
    // Import dynamically to avoid circular dependencies
    const { generateStorageKey, getUploadUrl } = await import('../services/documentStorage');
    
    // Generate a storage key
    const sanitizedFilename = sanitizeFile(filename);
    const storageKey = generateStorageKey(tenantId, documentType, sanitizedFilename);
    
    // Generate pre-signed URL for upload
    const uploadUrlResult = await getUploadUrl(storageKey, contentType, expiresInSeconds);
    
    // Return the URL and additional information to the client
    return res.status(200).json({
      success: true,
      data: {
        ...uploadUrlResult,
        documentKey: storageKey,
        filename: sanitizedFilename,
        originalFilename: filename,
        contentType,
        tenantId,
        userId
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Failed to generate upload URL: ${error.message}`,
      error: 'UPLOAD_URL_GENERATION_FAILED'
    });
  }
});

export default router;