import express, { Request, Response } from 'express';
import { authenticate } from '../auth';
import { tenantContext } from '../middleware/tenantContext';
import { singleFileUpload, sanitizeFile } from '../middleware/upload';
import { documentRepository } from '../repositories/documentRepository';
import { uploadFile, generateStorageKey, downloadFile, deleteFile } from '../services/documentStorage';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { documentTypeZod, processingStatusZod } from '../../shared/schema/documents/documents';

const router = express.Router();

// Document upload validation schema
const uploadDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  documentType: documentTypeZod.optional(),
  tags: z.array(z.string()).optional(),
  isConfidential: z.boolean().optional(),
  retentionDate: z.string().datetime().optional(),
  customMetadata: z.record(z.string(), z.any()).optional(),
});

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
    try {
      if (err) {
        logger.error('File upload error', { error: err });
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading file'
        });
      }

      // Check if file was provided
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Parse JSON array & boolean strings before validation
      if (typeof req.body.tags === 'string') {
        try { 
          req.body.tags = JSON.parse(req.body.tags); 
        } catch (e) { 
          /* let Zod catch invalid JSON */ 
          logger.warn('Failed to parse tags JSON string', { tags: req.body.tags });
        }
      }
      
      if (typeof req.body.isConfidential === 'string') {
        req.body.isConfidential = req.body.isConfidential === 'true';
      }
      
      if (typeof req.body.customMetadata === 'string') {
        try {
          req.body.customMetadata = JSON.parse(req.body.customMetadata);
        } catch (e) {
          logger.warn('Failed to parse customMetadata JSON string', { raw: req.body.customMetadata });
          // Don't set to undefined, let Zod handle validation
        }
      }
      
      // Validate request body
      const validationResult = uploadDocumentSchema.safeParse(req.body);
      if (!validationResult.success) {
        logger.warn('Document upload validation failed', { 
          errors: validationResult.error.errors,
          body: req.body 
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid document data',
          errors: validationResult.error.errors
        });
      }

      const documentData = validationResult.data;
      const file = req.file;
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user.id;

      // Sanitize filename
      const sanitizedFilename = sanitizeFile(file.originalname);

      // Generate storage key
      const storageKey = generateStorageKey(
        tenantId,
        documentData.documentType || 'OTHER',
        sanitizedFilename
      );

      try {
        // Upload file to storage
        const uploadResult = await uploadFile(
          file.buffer,
          storageKey,
          file.mimetype
        );

        // Build a payload object with only defined values
        const createPayload: Record<string, any> = {
          filename: sanitizedFilename,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size.toString(),
          storageKey: uploadResult.storageKey,
          checksum: uploadResult.checksum,
          title: documentData.title,
          uploadedBy: userId,
          tenantId,
          deleted: false,
          processingStatus: 'PENDING',
        };

        // Add optional fields only if they're defined
        if (documentData.documentType) createPayload.documentType = documentData.documentType;
        if (documentData.description) createPayload.description = documentData.description;
        if (documentData.tags?.length > 0) createPayload.tags = documentData.tags;
        if (documentData.isConfidential) createPayload.isConfidential = documentData.isConfidential;
        if (documentData.customMetadata) createPayload.customMetadata = documentData.customMetadata;
        // Note: retentionDate is not included since it's not in our schema yet

        try {
          // Create document record in database
          const document = await documentRepository.create(createPayload);

          // Queue the document for AI processing
          // TODO: Implement AI processing queue

          res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: document
          });
        } catch (dbError) {
          // Clean up the uploaded file if database insert fails
          try {
            await deleteFile(storageKey);
            logger.warn('Cleaned up orphaned file after DB insert failure', { storageKey });
          } catch (cleanupError) {
            logger.error('Failed to clean up orphaned file', { storageKey, cleanupError });
          }

          // Log the database error
          logger.error('Database error during document creation', { dbError });
          throw dbError; // Re-throw to be caught by outer catch
        }
      } catch (error: any) {
        logger.error('Error in document upload', { error });
        
        // More detailed error message in development
        const message = process.env.NODE_ENV === 'production'
          ? 'Server error during document upload'
          : `Upload error: ${error.message}`;
          
        res.status(500).json({
          success: false,
          message
        });
      }
    } catch (error) {
      logger.error('Error in document upload middleware', { error });
      
      // More detailed error message in development
      const message = process.env.NODE_ENV === 'production'
        ? 'Server error during document upload'
        : `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        
      res.status(500).json({
        success: false,
        message
      });
    }
  });
});

/**
 * @route GET /api/documents
 * @desc Get all documents for tenant with filtering
 * @access Authenticated users
 */
router.get('/', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    // Parse and validate query parameters
    const queryParams = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      documentType: req.query.documentType as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    };

    const validationResult = getDocumentsSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validationResult.error.errors
      });
    }

    const tenantId = (req as any).tenantId;
    
    // Get documents from repository
    const result = await documentRepository.getAll(tenantId, validationResult.data);
    
    res.json({
      success: true,
      message: 'Documents retrieved successfully',
      data: result.documents,
      pagination: {
        total: result.total,
        limit: validationResult.data.limit,
        offset: validationResult.data.offset
      }
    });
  } catch (error) {
    logger.error('Error getting documents', { error });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving documents'
    });
  }
});

/**
 * @route GET /api/documents/:id
 * @desc Get a document by ID
 * @access Authenticated users
 */
router.get('/:id', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    const document = await documentRepository.getById(documentId, tenantId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Document retrieved successfully',
      data: document
    });
  } catch (error) {
    logger.error('Error getting document by ID', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving document'
    });
  }
});

/**
 * @route GET /api/documents/:id/download
 * @desc Download a document
 * @access Authenticated users
 */
router.get('/:id/download', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    // Get document metadata
    const document = await documentRepository.getById(documentId, tenantId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Download file from storage
    const fileBuffer = await downloadFile(document.storageKey);
    
    // Set response headers
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    // Send file
    res.send(fileBuffer);
  } catch (error) {
    logger.error('Error downloading document', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error downloading document'
    });
  }
});

/**
 * @route PATCH /api/documents/:id
 * @desc Update document metadata
 * @access Authenticated users
 */
router.patch('/:id', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    // Only allow updating specific fields
    const allowedUpdates = z.object({
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      documentType: documentTypeEnum.optional(),
      tags: z.array(z.string()).optional(),
      isConfidential: z.boolean().optional(),
      retentionDate: z.string().datetime().optional(),
      customMetadata: z.record(z.string(), z.any()).optional(),
    });
    
    const validationResult = allowedUpdates.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update data',
        errors: validationResult.error.errors
      });
    }
    
    // Check if document exists
    const document = await documentRepository.getById(documentId, tenantId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Prepare update payload
    const updates = validationResult.data;
    if (updates.retentionDate) {
      updates.retentionDate = new Date(updates.retentionDate) as any;
    }
    
    // Update document
    const updatedDocument = await documentRepository.update(documentId, tenantId, updates);
    
    res.json({
      success: true,
      message: 'Document updated successfully',
      data: updatedDocument
    });
  } catch (error) {
    logger.error('Error updating document', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error updating document'
    });
  }
});

/**
 * @route DELETE /api/documents/:id
 * @desc Soft delete a document
 * @access Authenticated users
 */
router.delete('/:id', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    // Check if document exists
    const document = await documentRepository.getById(documentId, tenantId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Soft delete the document
    await documentRepository.softDelete(documentId, tenantId);
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting document', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error deleting document'
    });
  }
});

/**
 * @route GET /api/documents/:id/analysis
 * @desc Get AI analysis for a document
 * @access Authenticated users
 */
router.get('/:id/analysis', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    // Get document
    const document = await documentRepository.getById(documentId, tenantId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Get analysis data
    if (!document.aiProcessed) {
      return res.json({
        success: true,
        message: 'Document not yet processed by AI',
        data: {
          documentId,
          aiProcessed: false,
          processingStatus: document.processingStatus
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Analysis retrieved successfully',
      data: {
        documentId,
        aiProcessed: document.aiProcessed,
        processingStatus: document.processingStatus,
        aiMetadata: document.aiMetadata
      }
    });
  } catch (error) {
    logger.error('Error getting document analysis', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving document analysis'
    });
  }
});

/**
 * @route GET /api/documents/:id/versions
 * @desc Get AI analysis version history
 * @access Authenticated users
 */
router.get('/:id/versions', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    // Get document
    const document = await documentRepository.getById(documentId, tenantId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Get analysis versions
    const versions = await documentRepository.getAnalysisVersions(documentId, tenantId);
    
    res.json({
      success: true,
      message: 'Analysis versions retrieved successfully',
      data: versions
    });
  } catch (error) {
    logger.error('Error getting analysis versions', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving analysis versions'
    });
  }
});

export default router;