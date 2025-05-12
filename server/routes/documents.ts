import express, { Request, Response } from 'express';
import { authenticate } from '../auth';
import { tenantContext } from '../middleware/tenantContext';
import { singleFileUpload, sanitizeFile } from '../middleware/upload';
import { documentRepository } from '../repositories/documentRepository';
import { uploadFile, generateStorageKey, downloadFile, deleteFile } from '../services/documentStorage';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { 
  documentTypeZod, 
  processingStatusZod,
  type InsertDocument,
  type DocumentType
} from '../../shared/schema/documents/documents';

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
      // Enhanced debug logging to help diagnose upload issues
      logger.debug('→ multer upload debug:', {
        error: err ? {
          message: err.message,
          name: err.name,
          code: err.code,
          stack: err.stack
        } : null, 
        hasFile: !!req.file,
        fileDetails: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          fieldname: req.file.fieldname,
          encoding: req.file.encoding,
          buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
        } : 'No file',
        bodyKeys: Object.keys(req.body),
        bodyValues: Object.fromEntries(
          Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? `${v.substring(0, 30)}${v.length > 30 ? '...' : ''}` : typeof v])
        ),
        isAuthenticated: !!(req as any).user,
        userId: (req as any).user?.id,
        tenantId: (req as any).tenantId,
        headers: {
          contentType: req.headers['content-type'],
          authorization: req.headers.authorization ? 'Present' : 'Missing',
        }
      });

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
      
      // Additional parsing for any future JSON fields
      if (typeof req.body.retentionDate === 'string' && req.body.retentionDate) {
        // Ensure the date is in proper ISO format for validation
        try {
          const date = new Date(req.body.retentionDate);
          req.body.retentionDate = date.toISOString();
        } catch (e) {
          logger.warn('Failed to parse retentionDate', { value: req.body.retentionDate });
          // Let Zod validation handle the error
        }
      }
      
      // Log the pre-validation state of request body for debugging
      logger.debug('Document upload pre-validation body:', {
        body: {
          ...req.body,
          file: req.file ? {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
          } : null
        }
      });
      
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
          errors: validationResult.error.errors,
          fieldErrors: validationResult.error.format() // Include formatted field errors for UI
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
        // Implement pseudo-transaction for storage + DB operations
        // Step 1: Upload file to storage but don't commit it yet
        let uploadResult;
        let document;
        let uploadSuccess = false;
        let dbSuccess = false;
        
        try {
          // Upload file to storage
          uploadResult = await uploadFile(
            file.buffer,
            storageKey,
            file.mimetype
          );
          uploadSuccess = true;
          logger.debug('File uploaded to storage successfully', { 
            storageKey, 
            checksum: uploadResult.checksum,
            mimeType: file.mimetype
          });
          
          // Build a payload object with correct typing
          const createPayload: InsertDocument = {
            filename: sanitizedFilename,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size.toString(),
            storageKey: uploadResult.storageKey,
            checksum: uploadResult.checksum,
            title: documentData.title || sanitizedFilename,
            // Convert userId to UUID format for compatibility with document schema
            // For now, we'll use a hardcoded UUID that matches the user in the system
            uploadedBy: '00000000-0000-0000-0000-000000000001', // Default admin UUID
            tenantId,
            deleted: false,
            processingStatus: 'PENDING',
          };

          // Verify all required columns from schema are included
          const requiredColumns = [
            'filename', 'originalFilename', 'mimeType', 'fileSize', 
            'storageKey', 'checksum', 'title', 'uploadedBy', 'tenantId'
          ];
          
          const missingColumns = requiredColumns.filter(col => !(col in createPayload));
          if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
          }

          // Add optional fields only if they're defined
          if (documentData.documentType) {
            const docType = documentData.documentType.toString() as DocumentType;
            if (documentTypeZod.safeParse(docType).success) {
              createPayload.documentType = docType;
            }
          }
          
          if (documentData.description) {
            createPayload.description = documentData.description.toString();
          }
          
          if (documentData.tags && Array.isArray(documentData.tags) && documentData.tags.length > 0) {
            createPayload.tags = documentData.tags.map(tag => tag.toString());
          }
          
          if (documentData.isConfidential !== undefined) {
            createPayload.isConfidential = Boolean(documentData.isConfidential);
          }
          
          if (documentData.customMetadata && typeof documentData.customMetadata === 'object') {
            const metadata: Record<string, string> = {};
            Object.entries(documentData.customMetadata).forEach(([key, value]) => {
              metadata[key] = String(value);
            });
            createPayload.customMetadata = metadata;
          }
          
          // Note: retentionDate is not in the current schema
          // If we need to store this, consider adding it to customMetadata
          if (documentData && 'retentionDate' in documentData && documentData['retentionDate']) {
            try {
              const retentionDate = new Date(documentData['retentionDate'].toString());
              if (!createPayload.customMetadata) {
                createPayload.customMetadata = {};
              }
              // Store as ISO string in customMetadata
              // Initialize as empty object if not already set
              if (!createPayload.customMetadata || typeof createPayload.customMetadata !== 'object') {
                createPayload.customMetadata = {};
              }
              
              // Add the retention date to the custom metadata
              // TypeScript doesn't allow direct property assignment on jsonb fields
              // So we need to create a new object and cast it
              const updatedMetadata: Record<string, string> = {};
              
              // Copy existing properties if any
              if (createPayload.customMetadata) {
                Object.entries(createPayload.customMetadata as Record<string, unknown>).forEach(([key, value]) => {
                  updatedMetadata[key] = String(value);
                });
              }
              
              // Add the new property
              updatedMetadata['retentionDate'] = retentionDate.toISOString();
              
              // Update the customMetadata field
              createPayload.customMetadata = updatedMetadata;
              logger.debug('Added retention date to customMetadata', { retentionDate });
            } catch (error) {
              logger.warn('Invalid retention date format, skipping field', { 
                retentionDate: documentData['retentionDate']
              });
            }
          }
          
          // Step 2: Create database record
          document = await documentRepository.create(createPayload);
          dbSuccess = true;
          logger.debug('Document record created in database', { documentId: document.id });

          // Step 3: Queue the document for AI processing if both operations succeeded
          // TODO: Implement AI processing queue
          
          // Return success response
          res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: document
          });
        } catch (error) {
          // Transaction error handling
          logger.error('Error in document upload transaction', { 
            error, 
            uploadSuccess, 
            dbSuccess, 
            storageKey
          });
          
          // Clean up orphaned resources if partial success
          if (uploadSuccess && !dbSuccess) {
            try {
              await deleteFile(storageKey);
              logger.info('Cleaned up orphaned file after DB insert failure', { storageKey });
            } catch (cleanupError) {
              logger.error('Failed to clean up orphaned file', { 
                storageKey, 
                error: cleanupError 
              });
            }
          }
          
          // Re-throw to be caught by outer error handler
          throw error;
        }
      } catch (error: any) {
        logger.error('Error in document upload transaction', { 
          error: error.message,
          stack: error.stack,
          code: error.code
        });
        
        // Handle specific error types
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'File is too large. Maximum size is 20MB.',
            error: 'FILE_TOO_LARGE'
          });
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected file field. Use "file" as the form field name.',
            error: 'INVALID_FORM_FIELD'
          });
        } else if (error.code === 'EACCES' || error.code === 'EPERM') {
          // File system permission errors
          return res.status(500).json({
            success: false,
            message: 'Server permission error occurred while saving the file.',
            error: 'PERMISSION_ERROR'
          });
        } else if (error.message && error.message.includes('storage credentials')) {
          // Storage provider authentication errors
          return res.status(500).json({
            success: false,
            message: 'Document storage service unavailable. Please try again later or contact support.',
            error: 'STORAGE_UNAVAILABLE'
          });
        } else if (error.message && error.message.includes('Missing required columns')) {
          // Schema/validation errors
          return res.status(400).json({
            success: false,
            message: error.message,
            error: 'SCHEMA_VALIDATION_ERROR'
          });
        }
        
        // Generic error with different detail level based on environment
        const isProduction = process.env['NODE_ENV'] === 'production';
        const message = isProduction
          ? 'Server error during document upload. Please try again later.'
          : `Upload error: ${error.message || 'Unknown error'}`;
          
        return res.status(500).json({
          success: false,
          message,
          error: 'UNKNOWN_ERROR'
        });
      }
    } catch (error) {
      // Handle middleware-level errors (multer, etc.)
      logger.error('Error in document upload middleware', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code: error instanceof Error ? (error as any).code : undefined
      });
      
      // Specific middleware error handling
      if (error instanceof Error) {
        const multerError = error as any;
        
        if (multerError.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'File is too large. Maximum size is 20MB.',
            error: 'FILE_TOO_LARGE'
          });
        } else if (multerError.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected file field. Use "file" as the form field name.',
            error: 'INVALID_FORM_FIELD'
          });
        } else if (multerError.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files uploaded. Please upload one file at a time.',
            error: 'TOO_MANY_FILES'
          });
        } else if (multerError.message && multerError.message.includes('File type not allowed')) {
          return res.status(415).json({
            success: false,
            message: multerError.message,
            error: 'UNSUPPORTED_FILE_TYPE'
          });
        }
      }
      
      // Generic error with different detail level based on environment
      const isProduction = process.env['NODE_ENV'] === 'production';
      const message = isProduction
        ? 'Server error during document upload. Please try again later.'
        : `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        
      return res.status(500).json({
        success: false,
        message,
        error: 'MIDDLEWARE_ERROR'
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
  // Enhanced debugging to diagnose documents API issues
  logger.info({
    method: req.method,
    path: req.path,
    auth: !!req.headers.authorization,
    userInfo: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    } : null,
    tenantId: (req as any).tenantId,
    queryParams: req.query
  }, '🔍 Documents API request received');
  
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
    
    // Log response details for debugging
    logger.info({
      documentsCount: result.documents.length,
      totalDocuments: result.total,
      firstDocument: result.documents.length > 0 ? {
        id: result.documents[0].id,
        title: result.documents[0].title,
        status: result.documents[0].processingStatus,
        createdAt: result.documents[0].createdAt
      } : null,
      tenantId
    }, '📄 Documents retrieved for response');
    
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