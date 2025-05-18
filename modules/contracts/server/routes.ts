import { Router, Request, Response } from 'express';
import { logger } from '../../../server/utils/logger';
import { db } from '../../../server/db';
import { 
  contracts, 
  contractClauses, 
  contractObligations,
  contractDocuments,
  documents
} from '../../../shared/schema';
import { contractUploadAnalysis } from '../../../shared/schema/contracts/contract_upload_analysis';
import { analyzeContractDocument, getContractAnalysisStatus } from './ai/contractAnalyzer';
import { sql, eq, and } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { CONTRACT_TYPES } from '../../../shared/constants/contractTypes';

// Create router
const router = Router();

/**
 * @route GET /api/lookup/contract-types
 * @desc Get all contract types for dropdown lists
 * @access Public
 */
router.get('/lookup/contract-types', (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      data: CONTRACT_TYPES
    });
  } catch (error) {
    logger.error('Error retrieving contract types:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve contract types'
    });
  }
});

/**
 * @route GET /api/contracts
 * @desc Get all contracts for a tenant
 * @access Authenticated users
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get tenant ID from request - in development, use a default if not available
    const user = (req as any).user;
    const tenantId = user?.tenantId || (req as any).tenantId || '00000000-0000-0000-0000-000000000001';
    
    // Log the tenantId we're using for debugging
    logger.info('Fetching contracts for tenant', { tenantId });
    
    // Handle case where the table might not exist yet - return empty array
    try {
      const contractList = await db.query.contracts.findMany({
        where: sql`${contracts.tenantId} = ${tenantId}`,
        orderBy: [sql`${contracts.updatedAt} DESC`],
        limit: 100
      });
      
      res.json({
        success: true,
        message: 'Contracts retrieved successfully',
        data: contractList || []
      });
    } catch (dbError) {
      // If we get a database error, log it but return a valid empty response
      logger.error('Database error getting contracts', { error: dbError });
      res.json({
        success: true,
        message: 'No contracts found',
        data: []
      });
    }
  } catch (error) {
    logger.error('Error getting contracts', { error });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving contracts'
    });
  }
});

/**
 * @route GET /api/contracts/:id
 * @desc Get a specific contract by ID
 * @access Authenticated users
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contractId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    const contract = await db.query.contracts.findFirst({
      where: sql`${contracts.id} = ${contractId} AND ${contracts.tenantId} = ${tenantId}`,
    });
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Get associated clauses
    const clauses = await db.query.contractClauses.findMany({
      where: sql`${contractClauses.contractId} = ${contractId} AND ${contractClauses.tenantId} = ${tenantId}`,
      orderBy: [sql`${contractClauses.pageNumber} ASC NULLS LAST`]
    });
    
    // Get associated obligations
    const obligations = await db.query.contractObligations.findMany({
      where: sql`${contractObligations.contractId} = ${contractId} AND ${contractObligations.tenantId} = ${tenantId}`,
      orderBy: [sql`${contractObligations.dueDate} ASC NULLS LAST`]
    });
    
    res.json({
      success: true,
      message: 'Contract retrieved successfully',
      data: {
        ...contract,
        clauses,
        obligations
      }
    });
  } catch (error) {
    logger.error('Error getting contract', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving contract'
    });
  }
});

/**
 * @route GET /api/contracts/document/:documentId
 * @desc Get contract by document ID
 * @access Authenticated users
 */
router.get('/document/:documentId', async (req: Request, res: Response) => {
  try {
    const documentId = req.params.documentId;
    const tenantId = (req as any).tenantId;
    
    const contract = await db.query.contracts.findFirst({
      where: sql`${contracts.documentId} = ${documentId} AND ${contracts.tenantId} = ${tenantId}`,
    });
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'No contract found for this document'
      });
    }
    
    res.json({
      success: true,
      message: 'Contract retrieved successfully',
      data: contract
    });
  } catch (error) {
    logger.error('Error getting contract by document ID', { error, documentId: req.params.documentId });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving contract'
    });
  }
});

/**
 * @route PATCH /api/contracts/:id
 * @desc Update contract with additional metadata
 * @access Authenticated users
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const contractId = req.params.id;
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    
    // Validate request data
    const schema = z.object({
      contractStatus: z.enum(['DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED']).optional(),
      contractNumber: z.string().optional(),
      counterpartyName: z.string().optional(),
      counterpartyAddress: z.string().optional(),
      counterpartyContactEmail: z.string().email().optional().nullable(),
      effectiveDate: z.string().optional().nullable(),
      expiryDate: z.string().optional().nullable(),
      executionDate: z.string().optional().nullable(),
      renewalDate: z.string().optional().nullable(),
      totalValue: z.string().optional(),
      currency: z.string().optional(),
      customMetadata: z.record(z.any()).optional()
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }
    
    // Check if contract exists
    const existingContract = await db.query.contracts.findFirst({
      where: sql`${contracts.id} = ${contractId} AND ${contracts.tenantId} = ${tenantId}`,
    });
    
    if (!existingContract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Update contract with validated data
    const validData = validationResult.data;
    
    // Only update fields that were provided
    const updateData: any = {
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    };
    
    // Add provided fields to the update data
    Object.keys(validData).forEach(key => {
      if (validData[key as keyof typeof validData] !== undefined) {
        updateData[key] = validData[key as keyof typeof validData];
      }
    });
    
    // Perform update
    await db.update(contracts)
      .set(updateData)
      .where(sql`${contracts.id} = ${contractId} AND ${contracts.tenantId} = ${tenantId}`);
    
    // Get updated contract
    const updatedContract = await db.query.contracts.findFirst({
      where: sql`${contracts.id} = ${contractId} AND ${contracts.tenantId} = ${tenantId}`,
    });
    
    res.json({
      success: true,
      message: 'Contract updated successfully',
      data: updatedContract
    });
  } catch (error) {
    logger.error('Error updating contract', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error updating contract'
    });
  }
});

/**
 * @route GET /api/contracts/:id/obligations
 * @desc Get all obligations for a contract
 * @access Authenticated users
 */
router.get('/:id/obligations', async (req: Request, res: Response) => {
  try {
    const contractId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    // Check if contract exists
    const contract = await db.query.contracts.findFirst({
      where: sql`${contracts.id} = ${contractId} AND ${contracts.tenantId} = ${tenantId}`,
    });
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Get obligations
    const obligations = await db.query.contractObligations.findMany({
      where: sql`${contractObligations.contractId} = ${contractId} AND ${contractObligations.tenantId} = ${tenantId}`,
      orderBy: [sql`${contractObligations.dueDate} ASC NULLS LAST`]
    });
    
    res.json({
      success: true,
      message: 'Contract obligations retrieved successfully',
      data: obligations
    });
  } catch (error) {
    logger.error('Error getting contract obligations', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving contract obligations'
    });
  }
});

/**
 * @route POST /api/contracts
 * @desc Create a new contract
 * @access Authenticated users
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Get authenticated user info
    const user = (req as any).user;
    const tenantId = user?.tenantId || (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
    const userId = user?.id;

    logger.info('Contract creation request received', { body: req.body });

    // Build a validation schema for contract creation
    const createContractSchema = z.object({
      contractType: z.enum(['LPA', 'SUBSCRIPTION_AGREEMENT', 'SIDE_LETTER', 'AMENDMENT', 'NDA', 'SERVICE_AGREEMENT', 'OTHER']),
      // Allow documentId to be optional in development
      documentId: z.string().optional()
        .transform(val => {
          // In development mode, create a dummy document or use null
          if (!val || val === '') {
            logger.info('No document ID provided in development mode, creating contract without document reference');
            return null;
          }
          
          // If valid UUID, use it
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(val)) {
            return val;
          } else {
            logger.info('Invalid documentId format, treating as null', { providedValue: val });
            return null;
          }
        }),
      contractStatus: z.enum(['DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED']).default('DRAFT'),
      contractNumber: z.string().optional(),
      counterpartyName: z.string().optional(),
      counterpartyAddress: z.string().optional(),
      counterpartyContactEmail: z.string()
        .optional()
        .nullable()
        .transform(val => {
          if (!val) return null;
          // Basic email validation
          const emailRegex = /\S+@\S+\.\S+/;
          return emailRegex.test(val) ? val : null;
        }),
      effectiveDate: z.string().optional().nullable(),
      expiryDate: z.string().optional().nullable(),
      executionDate: z.string().optional().nullable(),
      renewalDate: z.string().optional().nullable(),
      totalValue: z.string().optional(),
      currency: z.string().optional(),
      customMetadata: z.record(z.any()).optional()
    });
    
    // Validate request data
    const validationResult = createContractSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logger.error('Contract creation validation failed', {
        errors: validationResult.error.errors
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid contract data',
        errors: validationResult.error.errors
      });
    }

    // Extract the validated data
    const contractData = validationResult.data;

    // No additional processing needed for userId
    // The user ID is already in the correct format or null
    
    // Create the contract object with proper types
    // Handle date fields - convert to null if they're empty strings
    const processedContractData = {
      ...contractData,
      effectiveDate: contractData.effectiveDate || null,
      expiryDate: contractData.expiryDate || null,
      executionDate: contractData.executionDate || null,
      renewalDate: contractData.renewalDate || null
    };
    
    // Create the new contract with proper type conversions
    const newContract = {
      ...processedContractData,
      // Use the valid tenant ID from the database
      tenantId: '00000000-0000-0000-0000-000000000001', 
      // The documentId needs to be a valid UUID
      documentId: processedContractData.documentId,
      // User IDs should be UUIDs or null
      createdBy: userId || null,
      updatedBy: userId || null,
      // Set confidence level explicitly to avoid type issues
      confidenceLevel: 'UNVERIFIED',
      // Use the correct column name as it exists in the database (camelCase)
      vendorId: null
    };

    // Log the full contract data for debugging
    logger.info('Creating new contract', { 
      documentId: contractData.documentId
    });
    
    // Debug log the complete contract data
    console.log('\n❌ [Contract POST] Raw Contract Data:', JSON.stringify(contractData, null, 2));
    console.log('\n❌ [Contract POST] Processed Contract Data:', JSON.stringify(newContract, null, 2));
    
    try {
      // Use type casting to ensure compatibility with Drizzle ORM
      const result = await db.insert(contracts).values(newContract as any).returning();
      logger.info('Contract created successfully', { contractId: result[0]?.id });
      
      // Get the created contract
      const createdContract = result[0];
      
      return res.status(201).json({
        success: true,
        message: 'Contract created successfully',
        data: createdContract
      });
    } catch (dbError: any) {
      // Log detailed error information
      console.error('\n❌ [Contract POST] Database Error:', dbError.message);
      console.error('\n❌ [Contract POST] Error Code:', dbError.code);
      console.error('\n❌ [Contract POST] Error Detail:', dbError.detail);
      console.error('\n❌ [Contract POST] Stack Trace:', dbError.stack);
      
      logger.error('Database error creating contract', { 
        error: dbError.message,
        stack: dbError.stack,
        details: dbError.detail || 'No additional details',
        code: dbError.code
      });
      
      // Send the detailed error back to the client in development mode
      if (process.env.NODE_ENV === 'development') {
        return res.status(500).json({
          success: false,
          message: 'Database error creating contract',
          error: dbError.message,
          code: dbError.code,
          detail: dbError.detail,
          stack: dbError.stack
        });
      }
      
      throw dbError; // Let the outer catch block handle this
    }
  } catch (error: any) {
    logger.error('Error creating contract', { 
      error: error.message || error,
      stack: error.stack,
      code: error.code
    });
    
    // In development, send detailed error information to client
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({
        success: false,
        message: 'Server error creating contract',
        error: error.message,
        stack: error.stack, 
        code: error.code
      });
    } else {
      // In production, hide sensitive details
      return res.status(500).json({
        success: false,
        message: 'Server error creating contract. Please try again later.'
      });
    }
  }
});

/**
 * @route GET /api/contracts/:id/documents
 * @desc Get all documents attached to a contract
 * @access Authenticated users
 */
router.get('/:id/documents', async (req: Request, res: Response) => {
  try {
    const contractId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    // Check if contract exists
    const contract = await db.query.contracts.findFirst({
      where: sql`${contracts.id} = ${contractId} AND ${contracts.tenantId} = ${tenantId}`,
    });
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Get documents attached to this contract with join to document details
    const attachedDocs = await db.query.contractDocuments.findMany({
      where: sql`${contractDocuments.contractId} = ${contractId}`,
      with: {
        document: true
      },
      orderBy: [
        // Primary documents first, then by type, then by effectiveDate descending
        sql`${contractDocuments.isPrimary} DESC`,
        sql`${contractDocuments.docType} ASC`,
        sql`${contractDocuments.effectiveDate} DESC NULLS LAST`
      ]
    });
    
    res.json({
      success: true,
      message: 'Contract documents retrieved successfully',
      data: attachedDocs
    });
  } catch (error) {
    logger.error('Error getting contract documents', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving contract documents'
    });
  }
});

/**
 * @route POST /api/contracts/:id/documents
 * @desc Attach a document to a contract
 * @access Authenticated users
 */
router.post('/:id/documents', async (req: Request, res: Response) => {
  try {
    const contractId = req.params.id;
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user?.id;
    
    // Validate request data
    const schema = z.object({
      documentId: z.string().uuid(),
      docType: z.enum(['MAIN', 'AMENDMENT', 'SIDE_LETTER', 'EXHIBIT', 'TERMINATION', 'RENEWAL', 'OTHER']),
      isPrimary: z.boolean().default(false),
      notes: z.string().optional(),
      effectiveDate: z.string().optional()
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }
    
    // Check if contract exists
    const contract = await db.query.contracts.findFirst({
      where: sql`${contracts.id} = ${contractId} AND ${contracts.tenantId} = ${tenantId}`,
    });
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Check if document exists
    const document = await db.query.documents.findFirst({
      where: sql`${documents.id} = ${validationResult.data.documentId}`
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if document is already attached to this contract
    const existingAttachment = await db.query.contractDocuments.findFirst({
      where: sql`${contractDocuments.contractId} = ${contractId} AND ${contractDocuments.documentId} = ${validationResult.data.documentId}`,
    });
    
    if (existingAttachment) {
      return res.status(400).json({
        success: false,
        message: 'Document is already attached to this contract'
      });
    }
    
    // If this is a primary document, clear any existing primary flag
    if (validationResult.data.isPrimary) {
      await db.update(contractDocuments)
        .set({ isPrimary: false })
        .where(sql`${contractDocuments.contractId} = ${contractId}`);
    }
    
    // Create attachment
    const attachment = await db.insert(contractDocuments)
      .values({
        contractId,
        documentId: validationResult.data.documentId,
        docType: validationResult.data.docType,
        isPrimary: validationResult.data.isPrimary,
        notes: validationResult.data.notes,
        effectiveDate: validationResult.data.effectiveDate ? new Date(validationResult.data.effectiveDate) : undefined,
      })
      .returning();
    
    res.json({
      success: true,
      message: 'Document attached successfully',
      data: attachment[0]
    });
  } catch (error) {
    logger.error('Error attaching document to contract', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error attaching document to contract'
    });
  }
});

/**
 * @route DELETE /api/contracts/:contractId/documents/:attachmentId
 * @desc Remove a document attachment from a contract
 * @access Authenticated users
 */
router.delete('/:contractId/documents/:attachmentId', async (req: Request, res: Response) => {
  try {
    const { contractId, attachmentId } = req.params;
    const tenantId = (req as any).tenantId;
    
    // Check if contract exists
    const contract = await db.query.contracts.findFirst({
      where: sql`${contracts.id} = ${contractId} AND ${contracts.tenantId} = ${tenantId}`,
    });
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Check if attachment exists
    const attachment = await db.query.contractDocuments.findFirst({
      where: sql`${contractDocuments.id} = ${attachmentId} AND ${contractDocuments.contractId} = ${contractId}`,
    });
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Document attachment not found'
      });
    }
    
    // Delete the attachment
    await db.delete(contractDocuments)
      .where(sql`${contractDocuments.id} = ${attachmentId}`);
    
    res.json({
      success: true,
      message: 'Document attachment removed successfully'
    });
  } catch (error) {
    logger.error('Error removing document from contract', { 
      error, 
      contractId: req.params.contractId,
      attachmentId: req.params.attachmentId 
    });
    res.status(500).json({
      success: false,
      message: 'Server error removing document from contract'
    });
  }
});



/**
 * @route POST /api/contracts/upload/analyze/:documentId
 * @desc Analyze a contract document and extract key details with AI
 * @access Authenticated users
 */
router.post('/upload/analyze/:documentId', async (req: Request, res: Response) => {
  // This ensures the response is always JSON, even if an error occurs
  res.setHeader('Content-Type', 'application/json');
  
  // Use a unique request ID for tracing this request through logs
  const requestId = crypto.randomUUID();
  
  try {
    // Log the full request information for debugging
    logger.info('Starting contract document analysis', {
      requestId,
      path: req.path, 
      documentId: req.params.documentId,
      hasUser: !!(req as any).user,
      headers: {
        contentType: req.headers['content-type'],
        authorization: req.headers.authorization ? 'Present' : 'Missing'
      }
    });
    
    // Get document ID from params
    const { documentId } = req.params;
    
    // Get user and tenant IDs from request
    const user = (req as any).user;
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';
    const tenantId = user?.tenantId || (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
    
    // Validate document ID
    if (!documentId || !documentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      logger.warn('Invalid document ID format', { requestId, documentId });
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format',
        error: 'INVALID_DOCUMENT_ID'
      });
    }
    
    try {
      // Check if document exists first
      const document = await db.query.documents.findFirst({
        where: eq(documents.id, documentId)
      });
      
      if (!document) {
        logger.error('Document not found for analysis', { requestId, documentId });
        return res.status(404).json({
          success: false,
          message: `Document not found with ID: ${documentId}`,
          error: 'DOCUMENT_NOT_FOUND'
        });
      }
      
      // Log document details
      logger.info('Document found for analysis', {
        requestId,
        documentId,
        filename: document.filename,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        title: document.title
      });
      
      // Import the simpleContractAnalyzer for direct analysis
      const { analyzeContractDocumentSimple } = await import('./simpleContractAnalyzer');
      
      // Get user ID from request if available
      const userId = (req as any).userId;
      
      // Use the simple analyzer for more reliable results
      const analysisResult = await analyzeContractDocumentSimple(documentId, userId);
      
      if (!analysisResult.success) {
        logger.error('Document analysis failed', { 
          requestId, 
          documentId,
          error: analysisResult.error 
        });
        
        return res.status(500).json({
          success: false,
          message: 'Document analysis failed',
          error: analysisResult.error
        });
      }
      
      // Extract the analysis data
      const { analysis } = analysisResult;
      
      // Store the results in the database
      try {
        await db.insert(contractUploadAnalysis).values({
          documentId,
          tenantId,
          userId,
          vendor: analysis.vendor,
          contractTitle: analysis.contractTitle,
          docType: analysis.docType,
          effectiveDate: analysis.effectiveDate,
          terminationDate: analysis.terminationDate,
          confidence: analysis.confidence,
          status: 'COMPLETED',
          rawAnalysisJson: analysis
        });
        
        logger.info(`Successfully stored analysis results for document ${documentId}`, { requestId });
      } catch (dbError) {
        logger.error(`Error storing analysis results for document ${documentId}:`, dbError, { requestId });
        // Continue even if DB storage fails
      }
      
      // Return the analysis results
      return res.status(200).json({
        success: true,
        documentId,
        documentTitle: analysisResult.documentTitle,
        analysis: analysis,
        status: 'COMPLETED'
      });
      
    } catch (err) {
      // Guaranteed catch-all for ANY error
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Log the detailed error information
      logger.error('❌ AI document analysis failed:', {
        requestId,
        documentId,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      });
      
      // Failsafe error response - guaranteed to work even if errors happen in the error handler
      try {
        return res.status(500).json({
          success: false,
          message: 'AI document analysis failed',
          error: errorMessage,
          errorCode: 'ANALYSIS_ERROR',
          details: err instanceof Error ? err.constructor.name : 'Unknown error type',
          data: { documentId }
        });
      } catch (responseError) {
        // Ultimate fallback - if even the JSON response fails
        logger.error('Critical error: Failed to send JSON error response', {
          requestId,
          originalError: errorMessage,
          responseError: responseError instanceof Error ? responseError.message : String(responseError)
        });
        
        // Manual JSON string as a last resort
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: false,
          message: 'Fatal: Could not return JSON response',
          error: 'SERVER_ERROR',
          data: { documentId }
        }));
      }
    }
  } catch (error) {
    // Handle any unexpected errors in the route itself
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Unhandled error in document analysis route:', {
      requestId,
      error: errorMessage,
      stack: errorStack,
      documentId: req.params.documentId
    });
    
    // Always return a structured JSON response, never let Express send an HTML error page
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze document',
      error: errorMessage,
      errorType: 'ROUTE_ERROR'
    });
  }
});

/**
 * @route GET /api/contracts/upload/analysis/:analysisId
 * @desc Get status and results of a document analysis
 * @access Authenticated users
 */
router.get('/upload/analysis/:analysisId', async (req: Request, res: Response) => {
  // Use a unique request ID for tracing this request through logs
  const requestId = crypto.randomUUID();
  
  try {
    const { analysisId } = req.params;
    
    // Log request information
    logger.info('Getting contract analysis status', {
      requestId,
      analysisId,
      path: req.path
    });
    
    // Validate analysis ID
    if (!analysisId) {
      logger.warn('Missing analysis ID in request', { requestId });
      return res.status(400).json({
        success: false,
        message: 'Analysis ID is required',
        error: 'MISSING_ANALYSIS_ID'
      });
    }
    
    // Validate UUID format
    if (!analysisId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      logger.warn('Invalid analysis ID format', { requestId, analysisId });
      return res.status(400).json({
        success: false,
        message: 'Invalid analysis ID format',
        error: 'INVALID_ANALYSIS_ID'
      });
    }
    
    try {
      // Import the analyzer functions
      const { getAnalysisById } = await import('./simpleContractAnalyzer');
      
      // Get analysis result
      const analysis = await getAnalysisById(analysisId);
      
      // Log for debugging
      logger.info('Retrieved analysis record', {
        requestId,
        analysisId,
        status: analysis?.status || 'unknown',
        hasError: !!analysis?.error
      });
      
      // Ensure we have a valid analysis result
      if (!analysis) {
        logger.error('Analysis not found', { requestId, analysisId });
        return res.status(404).json({
          success: false,
          message: `Analysis not found with ID: ${analysisId}`,
          error: 'ANALYSIS_NOT_FOUND'
        });
      }
      
      // Return the appropriate response based on analysis status
      if (analysis.status === 'FAILED') {
        return res.status(500).json({
          success: false,
          message: 'Document analysis failed',
          error: analysis.error || 'Unknown error during analysis',
          errorType: 'ANALYSIS_FAILED',
          data: {
            id: analysis.id,
            status: analysis.status
          }
        });
      }
      
      if (analysis.status === 'PENDING' || analysis.status === 'PROCESSING') {
        return res.status(200).json({
          success: true,
          message: 'Document analysis in progress',
          data: {
            id: analysis.id,
            status: analysis.status
          }
        });
      }
      
      // Analysis is complete, return full results with type safety
      return res.status(200).json({
        success: true,
        message: 'Document analysis complete',
        data: {
          id: analysis.id,
          documentId: analysis.documentId || null,
          vendor: analysis.vendor || null,
          contractTitle: analysis.contractTitle || null,
          docType: analysis.docType || null,
          effectiveDate: analysis.effectiveDate || null,
          terminationDate: analysis.terminationDate || null,
          confidence: analysis.confidence || {},
          suggestedContractId: analysis.suggestedContractId || null,
          status: analysis.status || 'UNKNOWN'
        }
      });
    } catch (analysisError) {
      // Handle errors getting the analysis
      logger.error('Error retrieving analysis', {
        requestId,
        analysisId, 
        error: analysisError instanceof Error ? analysisError.message : String(analysisError)
      });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve analysis',
        error: analysisError instanceof Error ? analysisError.message : 'Unknown database error',
        errorType: 'DATABASE_ERROR'
      });
    }
  } catch (error) {
    // Handle any completely unexpected errors in the route itself
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Unhandled error in analysis route', {
      requestId,
      route: 'GET /upload/analysis/:analysisId',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Always return a structured JSON response
    return res.status(500).json({
      success: false,
      message: 'Failed to get analysis result',
      error: errorMessage,
      errorType: 'ROUTE_ERROR'
    });
  }
});

/**
 * @route POST /api/contracts/prefill
 * @desc Save analysis data for use in contract creation
 * @access Authenticated users
 */
router.post('/prefill', async (req: Request, res: Response) => {
  try {
    // Get user and tenant IDs from request
    const user = (req as any).user;
    const tenantId = user?.tenantId || (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
    
    // Validate request body
    const { documentId, title, vendor, docType, effectiveDate, terminationDate } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }
    
    // Save the prefill data
    const prefillData = await savePrefillData({
      documentId,
      title,
      vendor,
      docType,
      effectiveDate,
      terminationDate
    }, tenantId);
    
    return res.status(200).json({
      success: true,
      message: 'Prefill data saved successfully',
      data: {
        id: prefillData.id
      }
    });
  } catch (error) {
    logger.error('Error saving prefill data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save prefill data'
    });
  }
});

/**
 * @route GET /api/contracts/prefill/:prefillId
 * @desc Get prefill data for contract creation
 * @access Authenticated users
 */
router.get('/prefill/:prefillId', async (req: Request, res: Response) => {
  try {
    const { prefillId } = req.params;
    
    // Validate prefill ID
    if (!prefillId) {
      return res.status(400).json({
        success: false,
        message: 'Prefill ID is required'
      });
    }
    
    // Get prefill data
    const prefillData = await getAnalysisById(prefillId);
    
    // Return prefill data
    return res.status(200).json({
      success: true,
      message: 'Prefill data retrieved successfully',
      data: {
        documentId: prefillData.documentId,
        title: prefillData.contractTitle,
        vendor: prefillData.vendor,
        docType: prefillData.docType,
        effectiveDate: prefillData.effectiveDate,
        terminationDate: prefillData.terminationDate
      }
    });
  } catch (error) {
    logger.error('Error getting prefill data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get prefill data'
    });
  }
});

/**
 * @route GET /api/contracts/lookup/contract-types
 * @desc Get a list of available contract types
 * @access Authenticated users
 */
router.get('/lookup/contract-types', async (req: Request, res: Response) => {
  try {
    // Return a list of contract types
    return res.json({
      success: true,
      data: [
        { id: 'SERVICE', name: 'Service Agreement' },
        { id: 'LEASE', name: 'Lease Agreement' },
        { id: 'EMPLOYMENT', name: 'Employment Contract' },
        { id: 'LICENSE', name: 'License Agreement' },
        { id: 'SALE', name: 'Sale Agreement' },
        { id: 'CONSULTING', name: 'Consulting Agreement' },
        { id: 'SUBSCRIPTION', name: 'Subscription Agreement' },
        { id: 'NDA', name: 'Non-Disclosure Agreement' },
        { id: 'OTHER', name: 'Other' }
      ]
    });
  } catch (error) {
    logger.error('Error fetching contract types:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contract types'
    });
  }
});

// Export router
export default router;