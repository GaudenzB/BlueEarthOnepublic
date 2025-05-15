import express, { Request, Response, NextFunction } from 'express';
import { authenticate } from '../auth';
import { tenantContext } from '../middleware/tenantContext';
import { singleFileUpload, sanitizeFile } from '../middleware/upload';
import { documentRepository } from '../repositories/documentRepository';
import { uploadFile, generateStorageKey, downloadFile, deleteFile } from '../services/documentStorage';
import { documentProcessor } from '../services/documentProcessor';
import { logger } from '../utils/logger';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { apiResponse } from '../utils/apiResponse';
import { userRepository } from '../repositories/userRepository';
import { 
  documentTypeZod, 
  processingStatusZod,
  type InsertDocument,
  type DocumentType
} from '../../shared/schema/documents/documents';

// Function to get user by ID for session-based auth fallback
const getUserById = async (id: number) => {
  try {
    return await userRepository.findById(id);
  } catch (error) {
    logger.error('Error in getUserById', { error, userId: id });
    return null;
  }
};

// Get the JWT secret key - use same approach as in server/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'development' 
  ? 'development_only_secret_key_not_for_production' 
  : ''
);

/**
 * Generate a JWT token for document preview
 * This creates a short-lived token specifically for document preview
 * @param documentId - The ID of the document to preview
 * @param tenantId - The tenant ID associated with the document
 * @returns The generated JWT token
 */
function createPreviewToken(documentId: string, tenantId: string): string {
  return jwt.sign(
    { 
      documentId,
      tenantId,
      purpose: 'preview'
    },
    JWT_SECRET,
    { 
      expiresIn: '15m' // Short-lived token for security
    }
  );
}

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

/**
 * Custom middleware for document uploads that tries multiple auth approaches
 * This is used as a fallback if standard authentication fails
 */
const documentUploadAuth = async (req: Request, res: Response, next: NextFunction) => {
  // If request already has a user (from previous middleware), continue
  if (req.user) {
    return next();
  }
  
  // Check for session authentication
  if (req.session && req.session.userId) {
    logger.info('Document upload: Using session authentication fallback', {
      sessionUserId: req.session.userId
    });
    
    try {
      // Try to get user from database using session userId
      const user = await getUserById(req.session.userId);
      if (user) {
        // Set user in request
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        };
        return next();
      }
    } catch (err) {
      logger.error('Error getting user by ID from session', { error: err });
    }
  }
  
  // If we get here, both token and session auth failed
  logger.error('Document upload authentication completely failed', {
    hasSession: !!req.session,
    hasSessionUserId: !!(req.session && req.session.userId),
    path: req.path
  });
  
  // Fall back to the standard auth middleware response
  return apiResponse.unauthorized(res, "Authentication required");
};

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
/**
 * Custom middleware for document uploads that tries multiple auth approaches
 * This is used as a fallback if standard authentication fails
 */
const documentUploadAuth = async (req: Request, res: Response, next: NextFunction) => {
  // If request already has a user (from previous middleware), continue
  if (req.user) {
    return next();
  }
  
  // Check for session authentication
  if (req.session && req.session.user && req.session.user.id) {
    logger.info('Document upload: Using session authentication fallback', {
      sessionUserId: req.session.user.id
    });
    
    try {
      // Try to get user from database using session userId
      const user = await userRepository.findById(req.session.user.id);
      if (user) {
        // Set user in request
        req.user = {
          id: user.id,
          username: user.username || '',
          email: user.email || '',
          role: user.role || 'user'
        };
        return next();
      }
    } catch (err) {
      logger.error('Error getting user by ID from session', { error: err });
    }
  }
  
  // If we get here, both token and session auth failed
  logger.error('Document upload authentication completely failed', {
    hasSession: !!req.session,
    hasSessionUser: !!(req.session && req.session.user),
    path: req.path
  });
  
  // Fall back to the standard auth middleware response
  return apiResponse.unauthorized(res, "Authentication required");
};

router.post('/', authenticate, documentUploadAuth, tenantContext, (req: Request, res: Response) => {
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
          // Enhanced logging before upload attempt
          logger.info('Attempting to upload file to storage', {
            storageKey,
            mimeType: file.mimetype,
            fileSize: file.size,
            storage: process.env.FORCE_LOCAL_STORAGE === 'true' ? 'local' : 'S3',
            hasBuffer: !!file.buffer,
            bufferSize: file.buffer ? file.buffer.length : 0
          });
          
          // Upload file to storage
          uploadResult = await uploadFile(
            file.buffer,
            storageKey,
            file.mimetype
          );
          uploadSuccess = true;
          logger.info('File uploaded to storage successfully', { 
            storageKey, 
            checksum: uploadResult.checksum,
            mimeType: file.mimetype,
            storageType: uploadResult.storageType,
            fileSize: file.size
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
          logger.info('Starting document processing in the background', { 
            documentId: document.id,
            tenantId,
            fileInfo: {
              size: req.file.size,
              mimetype: req.file.mimetype,
              originalname: req.file.originalname
            }
          });
          
          // Start processing in the background with proper error handling
          documentProcessor.processDocument(document.id, tenantId)
            .then(success => {
              logger.info('Document processing completed', { documentId: document.id, success });
            })
            .catch(error => {
              logger.error('Document processing failed with uncaught exception', { 
                documentId: document.id, 
                error: error?.message || 'Unknown error',
                stack: error?.stack,
                type: typeof error,
                name: error?.name
              });
              
              // Try to update the document status to ERROR in case of uncaught exception
              try {
                documentRepository.updateProcessingStatusWithError(
                  document.id, 
                  tenantId, 
                  'ERROR', 
                  `Processing failed with error: ${error?.message || 'Unknown error'}`
                ).catch(updateError => {
                  logger.error('Failed to update document status after processing error', {
                    documentId: document.id,
                    error: updateError?.message
                  });
                });
              } catch (updateError) {
                logger.error('Failed to execute error status update', {
                  documentId: document.id,
                  error: updateError?.message
                });
              }
            });
          
          // Generate a preview token for the document
          const previewToken = createPreviewToken(document.id, tenantId);
          
          logger.debug('Generated preview token for uploaded document', { 
            documentId: document.id,
            tokenPrefix: previewToken.substring(0, 10) + '...' 
          });
          
          // Return success response with preview token
          res.status(201).json({
            success: true,
            message: 'Document uploaded successfully and processing has started',
            data: {
              ...document,
              previewToken
            }
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
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      documentType: req.query.documentType as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    };

    const validationResult = getDocumentsSchema.safeParse(queryParams);
    if (!validationResult.success) {
      logger.warn('Invalid document query parameters', {
        errors: validationResult.error.errors,
        params: queryParams
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validationResult.error.errors
      });
    }

    const tenantId = (req as any).tenantId;
    logger.info('📑 Fetching documents with params', {
      ...validationResult.data,
      tenantId
    });
    
    // Get documents from repository
    const result = await documentRepository.getAll(tenantId, validationResult.data);
    
    // Enhanced logging for debugging
    if (result.documents.length === 0) {
      logger.info('No documents found for request', {
        tenantId,
        queryParams: validationResult.data
      });
    } else {
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
      
      // Print the first 3 documents for detailed debugging
      if (result.documents.length > 0) {
        logger.debug('Sample documents:', 
          result.documents.slice(0, 3).map(doc => ({
            id: doc.id,
            title: doc.title,
            type: doc.documentType,
            status: doc.processingStatus,
            createdAt: doc.createdAt
          }))
        );
      }
    }
    
    // Add preview tokens to each document
    const documentsWithPreviewTokens = result.documents.map(doc => {
      const previewToken = createPreviewToken(doc.id, tenantId);
      return {
        ...doc,
        previewToken // Add the preview token to the document
      };
    });
    
    logger.debug('Added preview tokens to documents', { count: documentsWithPreviewTokens.length });
    
    // Ensure we're sending a proper response format
    const response = {
      success: true,
      message: 'Documents retrieved successfully',
      data: documentsWithPreviewTokens,
      pagination: {
        total: result.total,
        limit: validationResult.data.limit,
        offset: validationResult.data.offset
      }
    };
    
    logger.info('Response structure:', {
      keys: Object.keys(response),
      dataPresent: Array.isArray(response.data),
      dataCount: Array.isArray(response.data) ? response.data.length : 0
    });
    
    res.json(response);
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
    
    logger.info('Getting document by ID', { 
      documentId, 
      tenantId, 
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl
    });
    
    // Validate UUID format to prevent database errors
    if (!documentId || !documentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      logger.warn('Invalid document ID format', { documentId });
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format'
      });
    }
    
    try {
      // Log the default tenant ID for debugging
      logger.debug('Default tenant used for document retrieval', {
        documentId,
        tenantId,
        defaultTenantId: process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
      });
      
      const document = await documentRepository.getById(documentId, tenantId);
      
      if (!document) {
        logger.warn('Document not found', { documentId, tenantId });
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }
      
      // Generate a preview token for the document
      const previewToken = createPreviewToken(documentId, tenantId);
      logger.debug('Generated preview token for document', {
        documentId,
        tokenPrefix: previewToken.substring(0, 10) + '...'
      });
      
      logger.info('Document found successfully', { 
        documentId,
        title: document.title,
        status: document.processingStatus,
        responseStatus: 200
      });
      

      
      return res.json({
        success: true,
        message: 'Document retrieved successfully',
        data: {
          ...document,
          previewToken // Add the preview token to the response
        }
      });
    } catch (repoError) {
      logger.error('Repository error getting document by ID', { 
        error: repoError instanceof Error ? repoError.message : 'Unknown error', 
        stack: repoError instanceof Error ? repoError.stack : undefined,
        documentId, 
        tenantId 
      });
      throw repoError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    logger.error('Error getting document by ID', { 
      error: error instanceof Error ? error.message : 'Unknown error', 
      stack: error instanceof Error ? error.stack : undefined,
      id: req.params.id,
      path: req.path,
      baseUrl: req.baseUrl
    });
    return res.status(500).json({
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
 * @route GET /api/documents/:id/preview
 * @desc Get a document preview (HTML format)
 * @access Authenticated users with either token in header or as URL query param
 */
router.get('/:id/preview', async (req: Request, res: Response) => {
  // Custom authentication for preview that accepts token as a URL parameter
  // This is needed because iframes don't send authentication headers
  const tokenFromQuery = req.query.token as string | undefined;
  if (!tokenFromQuery && !req.headers.authorization) {
    return res.status(401).json({
      success: false,
      message: "No token, authorization denied"
    });
  }
  
  // Get the JWT secret key - use same approach as in server/auth.ts
  const JWT_SECRET = process.env['JWT_SECRET'] || (
    process.env['NODE_ENV'] === 'development' 
    ? 'development_only_secret_key_not_for_production' 
    : undefined
  );

  if (!JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error - missing JWT_SECRET"
    });
  }
  
  // If token is in query params, verify it and set req.user
  if (tokenFromQuery) {
    try {
      // Log the token info for debugging (be careful not to log the full token in production)
      console.log("Token verification attempt - first 10 chars:", tokenFromQuery.substring(0, 10));
      console.log("JWT_SECRET first 10 chars:", JWT_SECRET.substring(0, 10));
      console.log("NODE_ENV:", process.env.NODE_ENV);
      
      const jwt = require('jsonwebtoken');
      
      // Use a more permissive verification approach for development
      let decoded;
      try {
        // Try with default development secret
        decoded = jwt.verify(tokenFromQuery, 'development_only_secret_key_not_for_production');
        console.log("Token verified with development secret");
      } catch (innerError) {
        console.log("Failed with development secret, trying environment secret");
        
        // If that fails, try with environment variable
        if (process.env.JWT_SECRET) {
          decoded = jwt.verify(tokenFromQuery, process.env.JWT_SECRET);
          console.log("Token verified with environment secret");
        } else {
          throw new Error("No valid JWT_SECRET available");
        }
      }
      
      (req as any).user = decoded;
      console.log("Successfully verified token and set user:", (req as any).user.id);
    } catch (error: any) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({
        success: false,
        message: `Invalid token in query parameter: ${error.message}`
      });
    }
  } else {
    // Use standard authenticate middleware if token is in header
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: "No token, authorization denied"
        });
      }
      
      const token = authHeader.split(' ')[1];
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      console.log("Successfully verified token from Authorization header");
    } catch (error) {
      console.error("Header token verification failed:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid token in Authorization header"
      });
    }
  }
  
  // Apply tenant context middleware for multi-tenancy
  (req as any).tenantId = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
  
  try {
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
              <h2 style="color: #1f2937; margin-bottom: 10px;">404 Page Not Found</h2>
              <p style="color: #6b7280;">Did you forget to add the page to the router?</p>
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
      
      // For PDF files, we'll use PDF.js or embed directly
      if (document.mimeType === 'application/pdf') {
        // Send a simple HTML page that embeds the PDF
        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <html>
            <head>
              <title>${document.title || document.originalFilename} - Preview</title>
              <style>
                body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
                #pdf-viewer { width: 100%; height: 100%; }
              </style>
            </head>
            <body>
              <object id="pdf-viewer" data="/api/documents/${documentId}/download" type="application/pdf" width="100%" height="100%">
                <p>It appears you don't have a PDF plugin for this browser. 
                   You can <a href="/api/documents/${documentId}/download">download the PDF file</a> instead.</p>
              </object>
            </body>
          </html>
        `);
      } else if (document.mimeType.startsWith('image/')) {
        // For images, display them directly
        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <html>
            <head>
              <title>${document.title || document.originalFilename} - Preview</title>
              <style>
                body, html { margin: 0; padding: 0; height: 100%; display: flex; justify-content: center; align-items: center; background-color: #f3f4f6; }
                .image-container { max-width: 100%; max-height: 100%; display: flex; justify-content: center; align-items: center; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <div class="image-container">
                <img src="/api/documents/${documentId}/download" alt="${document.title || document.originalFilename}" />
              </div>
            </body>
          </html>
        `);
      } else {
        // For other file types, offer a download link
        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <html>
            <head>
              <title>${document.title || document.originalFilename} - Preview</title>
              <style>
                body, html { margin: 0; padding: 0; height: 100%; width: 100%; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; background-color: #f3f4f6; }
                .container { text-align: center; padding: 2rem; background-color: white; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .icon { font-size: 3rem; margin-bottom: 1rem; color: #6b7280; }
                h2 { color: #1f2937; margin-bottom: 1rem; }
                p { color: #6b7280; margin-bottom: 1.5rem; }
                .download-btn { display: inline-block; padding: 0.5rem 1rem; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 0.25rem; font-weight: 500; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">📄</div>
                <h2>Preview not available</h2>
                <p>This file type (${document.mimeType}) cannot be previewed directly in the browser.</p>
                <a href="/api/documents/${documentId}/download" class="download-btn">Download File</a>
              </div>
            </body>
          </html>
        `);
      }
    } catch (error) {
      logger.error('Error generating preview for document', { error, documentId });
      res.status(500).send(`
        <html>
          <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <div style="color: #ef4444; font-size: 48px; margin-bottom: 20px;">❌</div>
              <h2 style="color: #1f2937; margin-bottom: 10px;">Preview Error</h2>
              <p style="color: #6b7280;">An error occurred while generating the preview. Please try downloading the file instead.</p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    logger.error('Error generating document preview', { error, id: req.params.id });
    res.status(500).send(`
      <html>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <div style="color: #ef4444; font-size: 48px; margin-bottom: 20px;">❌</div>
            <h2 style="color: #1f2937; margin-bottom: 10px;">Server Error</h2>
            <p style="color: #6b7280;">An unexpected error occurred. Please try again later.</p>
          </div>
        </body>
      </html>
    `);
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

/**
 * @route POST /api/documents/:id/process
 * @desc Process a single document with AI
 * @access Authenticated users
 */
router.post('/:id/process', authenticate, tenantContext, async (req: Request, res: Response) => {
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
    
    // Check if document is already being processed
    if (document.processingStatus === 'PROCESSING') {
      return res.status(400).json({
        success: false,
        message: 'Document is already being processed'
      });
    }
    
    // Check if document is already processed
    if (document.processingStatus === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Document is already processed'
      });
    }
    
    // Process document asynchronously
    logger.info('Starting document processing', { documentId, tenantId });
    
    // Start processing in the background
    documentProcessor.processDocument(documentId, tenantId)
      .then(success => {
        logger.info('Document processing completed', { documentId, success });
      })
      .catch(error => {
        logger.error('Document processing failed', { documentId, error });
      });
    
    // Return immediately with a processing status
    return res.json({
      success: true,
      message: 'Document processing started',
      data: {
        id: documentId,
        processingStatus: 'PROCESSING'
      }
    });
  } catch (error) {
    logger.error('Error starting document processing', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error starting document processing'
    });
  }
});

/**
 * @route POST /api/documents/process-pending
 * @desc Process all pending documents
 * @access Authenticated users
 */
router.post('/process-pending', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    
    // Get pending documents
    const pendingDocuments = await documentRepository.getPendingDocuments(tenantId, limit);
    
    if (pendingDocuments.length === 0) {
      return res.json({
        success: true,
        message: 'No pending documents to process',
        data: { processed: 0 }
      });
    }
    
    // Process documents asynchronously
    const documentIds = pendingDocuments.map(doc => doc.id);
    logger.info('Starting batch document processing', { count: documentIds.length, tenantId });
    
    // Process each document in the background
    Promise.all(
      pendingDocuments.map(doc => 
        documentProcessor.processDocument(doc.id, tenantId)
          .catch(error => {
            logger.error('Error processing document in batch', { error, documentId: doc.id });
            return false;
          })
      )
    ).then(results => {
      const successCount = results.filter(Boolean).length;
      logger.info('Batch document processing completed', { 
        total: documentIds.length, 
        successful: successCount,
        failed: documentIds.length - successCount
      });
    });
    
    // Return immediately
    return res.json({
      success: true,
      message: 'Document processing started',
      data: {
        processing: documentIds,
        count: documentIds.length
      }
    });
  } catch (error) {
    logger.error('Error starting batch document processing', { error });
    res.status(500).json({
      success: false,
      message: 'Server error starting batch document processing'
    });
  }
});

export default router;