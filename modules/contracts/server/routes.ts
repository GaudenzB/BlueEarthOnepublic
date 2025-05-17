import { Router, Request, Response } from 'express';
import { logger } from '../../../server/utils/logger';
import { db } from '../../../server/db';
import { 
  contracts, 
  contractClauses, 
  contractObligations
} from '../../../shared/schema';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

// Create router
const router = Router();

/**
 * @route GET /api/contracts
 * @desc Get all contracts for a tenant
 * @access Authenticated users
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get tenant ID from request - in development, use a default if not available
    const user = (req as any).user;
    const tenantId = user?.tenantId || (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
    
    // Log the tenantId we're using for debugging
    logger.info('Fetching contracts for tenant', { tenantId });
    
    // Handle case where the table might not exist yet - return empty array
    try {
      const contractList = await db.query.contracts.findMany({
        where: sql`${contracts.tenantId} = ${tenantId} AND ${contracts.documentId} IS NOT NULL`,
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

    // Ensure tenant ID is set
    // Convert userId to integer if available since the DB column is integer type
    let parsedUserId = null;
    if (userId) {
      try {
        parsedUserId = parseInt(userId, 10);
        if (isNaN(parsedUserId)) {
          parsedUserId = null;
        }
      } catch (e) {
        logger.warn('Could not parse userId as integer', { userId });
      }
    }
    
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
      // Convert to string for character varying field
      tenantId: tenantId.toString(), 
      // The documentId needs to be a valid UUID
      documentId: processedContractData.documentId,
      // User IDs need integer conversion
      createdBy: parsedUserId,
      updatedBy: parsedUserId,
      // Set confidence level explicitly to avoid type issues
      confidenceLevel: 'UNVERIFIED'
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

// Export router
export default router;