import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { documentRepository } from '../repositories/documentRepository';
import { uploadFile, generateStorageKey, deleteFile } from '../services/documentStorage';
import { documentProcessor } from '../services/documentProcessor';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { sanitizeFile } from '../middleware/upload';
import {
  documentTypeZod,
  type InsertDocument,
  type DocumentType
} from '../../shared/schema/documents/documents';
import { jwtConfig, createToken, TokenType } from '../utils/jwtConfig';

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
 * Generate a JWT token for document preview
 * This creates a short-lived token specifically for document preview
 * @param documentId - The ID of the document to preview
 * @param tenantId - The tenant ID associated with the document
 * @returns The generated JWT token
 */
function createPreviewToken(documentId: string, tenantId: string): string {
  return createToken(
    { 
      documentId,
      tenantId,
      purpose: 'preview'
    },
    TokenType.PREVIEW
  );
}

/**
 * Pre-process the request body to handle form data conversion and validation
 */
function preprocessRequestBody(req: Request): any {
  // Parse JSON array & boolean strings before validation
  if (typeof req.body.tags === 'string') {
    try { 
      req.body.tags = JSON.parse(req.body.tags); 
    } catch (e) { 
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
    }
  }
  
  // Additional parsing for any future JSON fields
  if (typeof req.body.retentionDate === 'string' && req.body.retentionDate) {
    try {
      const date = new Date(req.body.retentionDate);
      req.body.retentionDate = date.toISOString();
    } catch (e) {
      logger.warn('Failed to parse retentionDate', { value: req.body.retentionDate });
    }
  }

  return req.body;
}

/**
 * Validate the document upload data
 * @returns The validated data or null if validation failed
 */
function validateUploadData(req: Request, res: Response): z.infer<typeof uploadDocumentSchema> | null {
  const validationResult = uploadDocumentSchema.safeParse(req.body);
  
  if (!validationResult.success) {
    logger.warn('Document upload validation failed', { 
      errors: validationResult.error.errors,
      body: req.body 
    });
    
    res.status(400).json({
      success: false,
      message: 'Invalid document data',
      errors: validationResult.error.errors,
      fieldErrors: validationResult.error.format() // Include formatted field errors for UI
    });
    
    return null;
  }
  
  return validationResult.data;
}

/**
 * Create the document insert payload from the validated data
 */
function createDocumentPayload(
  documentData: z.infer<typeof uploadDocumentSchema>,
  file: Express.Multer.File,
  uploadResult: { storageKey: string; checksum: string },
  sanitizedFilename: string,
  tenantId: string,
  userId: string
): InsertDocument {
  // Build a payload object with correct typing
  const createPayload: InsertDocument = {
    filename: sanitizedFilename,
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size.toString(),
    storageKey: uploadResult.storageKey,
    checksum: uploadResult.checksum,
    title: documentData.title || sanitizedFilename,
    uploadedBy: userId,
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
  
  // Handle retention date in customMetadata
  if (documentData && 'retentionDate' in documentData && documentData['retentionDate']) {
    try {
      const retentionDate = new Date(documentData['retentionDate'].toString());
      if (!createPayload.customMetadata) {
        createPayload.customMetadata = {};
      }
      
      // Create a new metadata object to avoid direct property assignment issues
      const updatedMetadata: Record<string, string> = {};
      
      // Copy existing properties if any
      if (createPayload.customMetadata) {
        Object.entries(createPayload.customMetadata as Record<string, unknown>).forEach(([key, value]) => {
          updatedMetadata[key] = String(value);
        });
      }
      
      // Add the retention date
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

  return createPayload;
}

/**
 * Start asynchronous document processing in the background
 */
function startDocumentProcessing(documentId: string, tenantId: string, fileInfo: any): void {
  logger.info('Starting document processing in the background', { 
    documentId,
    tenantId,
    fileInfo
  });
  
  // Start processing in the background with proper error handling
  documentProcessor.processDocument(documentId, tenantId)
    .then(success => {
      logger.info('Document processing completed', { documentId, success });
    })
    .catch(error => {
      logger.error('Document processing failed with uncaught exception', { 
        documentId, 
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        type: typeof error,
        name: error?.name
      });
      
      // Try to update the document status to ERROR in case of uncaught exception
      try {
        documentRepository.updateProcessingStatusWithError(
          documentId, 
          tenantId, 
          'ERROR', 
          `Processing failed with error: ${error?.message || 'Unknown error'}`
        ).catch(updateError => {
          logger.error('Failed to update document status after processing error', {
            documentId,
            error: updateError?.message
          });
        });
      } catch (updateError) {
        logger.error('Failed to execute error status update', {
          documentId,
          error: updateError?.message
        });
      }
    });
}

/**
 * Clean up orphaned resources if partial success
 */
async function cleanupOrphanedFile(storageKey: string): Promise<void> {
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

/**
 * Handle specific error responses
 */
function handleUploadError(error: any, res: Response): Response {
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
      message: 'Unexpected file field provided',
      error: 'INVALID_FORM_DATA'
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

class DocumentController {
  /**
   * Upload a new document
   */
  async uploadDocument(req: Request, res: Response) {
    try {
      // Enhanced debug logging to help diagnose upload issues
      logger.debug('→ multer upload debug:', {
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

      // Check if file was provided
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Pre-process request body (parse JSON, convert types)
      preprocessRequestBody(req);
      
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
      
      // Validate request data
      const documentData = validateUploadData(req, res);
      if (!documentData) {
        // Response already sent by validateUploadData
        return;
      }

      const file = req.file;
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user.id || '00000000-0000-0000-0000-000000000001'; // Default admin UUID as fallback

      // Sanitize filename
      const sanitizedFilename = sanitizeFile(file.originalname);

      // Generate storage key
      const storageKey = generateStorageKey(
        tenantId,
        documentData.documentType || 'OTHER',
        sanitizedFilename
      );

      // Implement pseudo-transaction for storage + DB operations
      let uploadResult;
      let document;
      let uploadSuccess = false;
      let dbSuccess = false;
      
      try {
        // Step 1: Upload file to storage but don't commit it yet
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
        
        // Step 2: Create database payload
        const createPayload = createDocumentPayload(
          documentData,
          file,
          uploadResult,
          sanitizedFilename,
          tenantId,
          userId
        );
        
        // Step 3: Create database record
        document = await documentRepository.create(createPayload);
        dbSuccess = true;
        logger.debug('Document record created in database', { documentId: document.id });

        // Step 4: Queue the document for AI processing
        startDocumentProcessing(document.id, tenantId, {
          size: req.file.size,
          mimetype: req.file.mimetype,
          originalname: req.file.originalname
        });
        
        // Step 5: Generate a preview token for the document
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
          await cleanupOrphanedFile(storageKey);
        }
        
        // Re-throw to be caught by outer error handler
        throw error;
      }
    } catch (error: any) {
      return handleUploadError(error, res);
    }
  }

  /**
   * Get all documents for a tenant
   */
  async getDocuments(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const documents = await documentRepository.getAllForTenant(tenantId);
      
      res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error: any) {
      logger.error('Error getting documents', { error });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve documents',
        error: error.message
      });
    }
  }

  /**
   * Get a document by ID
   */
  async getDocumentById(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const documentId = req.params.id;
      
      const document = await documentRepository.getById(documentId, tenantId);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: document
      });
    } catch (error: any) {
      logger.error('Error getting document by ID', { error });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve document',
        error: error.message
      });
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const documentId = req.params.id;
      
      const document = await documentRepository.getById(documentId, tenantId);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }
      
      // Soft delete in the database
      await documentRepository.softDelete(documentId, tenantId);
      
      res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting document', { error });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }
}

export const documentController = new DocumentController();