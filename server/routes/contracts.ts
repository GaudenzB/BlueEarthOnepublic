import express, { Request, Response } from 'express';
import { authenticate } from '../auth';
import { tenantContext } from '../middleware/tenantContext';
import { contractUpload, sanitizeFile } from '../middleware/upload';
import { contractRepository } from '../repositories/contractRepository';
import { documentRepository } from '../repositories/documentRepository';
import { uploadFile, generateStorageKey } from '../services/documentStorage';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { 
  contractStatusEnum, 
  contractTypeEnum,
  insertContractSchema
} from '../../shared/schema/index';

const router = express.Router();

// Contract filter/search validation schema
const getContractsSchema = z.object({
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
  contractType: contractTypeEnum.optional(),
  status: contractStatusEnum.optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  tags: z.array(z.string()).optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
  expirationFrom: z.string().datetime().optional(),
  expirationTo: z.string().datetime().optional(),
  internalOwner: z.string().uuid().optional(),
});

/**
 * @route POST /api/contracts
 * @desc Create a new contract with document upload
 * @access Authenticated users
 */
router.post('/', authenticate, tenantContext, (req: Request, res: Response) => {
  contractUpload(req, res, async (err) => {
    try {
      if (err) {
        logger.error('Contract upload error', { error: err });
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading contract'
        });
      }

      // Check if file was provided
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No contract document uploaded'
        });
      }

      // Validate request body (omitting the required file fields that we handle separately)
      const contractSchema = insertContractSchema.omit({
        documentId: true,
        createdBy: true,
        updatedBy: true,
        tenantId: true,
      });

      const validationResult = contractSchema.safeParse(req.body);
      if (!validationResult.success) {
        logger.warn('Contract creation validation failed', { 
          errors: validationResult.error.errors 
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid contract data',
          errors: validationResult.error.errors
        });
      }

      const contractData = validationResult.data;
      const file = req.file;
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user.id;

      // Sanitize filename
      const sanitizedFilename = sanitizeFile(file.originalname);

      // Generate storage key
      const storageKey = generateStorageKey(
        tenantId,
        'CONTRACT',
        sanitizedFilename
      );

      // Upload file to storage
      const uploadResult = await uploadFile(
        file.buffer,
        storageKey,
        file.mimetype
      );

      // Prepare tags if provided
      let tags: string[] | undefined;
      if (contractData.tags && contractData.tags.length > 0) {
        tags = contractData.tags;
      }

      // First create document record
      const document = await documentRepository.create({
        filename: sanitizedFilename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size.toString(),
        storageKey: uploadResult.storageKey,
        checksum: uploadResult.checksum,
        documentType: 'CONTRACT',
        title: contractData.title,
        description: contractData.description,
        tags,
        uploadedBy: userId,
        tenantId,
        deleted: false,
        processingStatus: 'PENDING',
        isConfidential: contractData.isConfidential || false,
        customMetadata: contractData.customMetadata,
      });

      // Now create contract record linked to the document
      const contract = await contractRepository.create({
        ...contractData,
        documentId: document.id,
        createdBy: userId,
        updatedBy: userId,
        tenantId,
      });

      // Queue the document for AI processing
      // TODO: Implement AI processing queue

      res.status(201).json({
        success: true,
        message: 'Contract created successfully',
        data: {
          contract,
          document
        }
      });
    } catch (error) {
      logger.error('Error in contract creation', { error });
      res.status(500).json({
        success: false,
        message: 'Server error during contract creation'
      });
    }
  });
});

/**
 * @route GET /api/contracts
 * @desc Get all contracts for tenant with filtering
 * @access Authenticated users
 */
router.get('/', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    // Parse and validate query parameters
    const queryParams = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      contractType: req.query.contractType as string,
      status: req.query.status as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      effectiveFrom: req.query.effectiveFrom as string,
      effectiveTo: req.query.effectiveTo as string,
      expirationFrom: req.query.expirationFrom as string,
      expirationTo: req.query.expirationTo as string,
      internalOwner: req.query.internalOwner as string,
    };

    const validationResult = getContractsSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validationResult.error.errors
      });
    }

    const tenantId = (req as any).tenantId;
    const validatedParams = validationResult.data;
    
    // Convert string dates to Date objects
    const options = {
      ...validatedParams,
      effectiveFrom: validatedParams.effectiveFrom ? new Date(validatedParams.effectiveFrom) : undefined,
      effectiveTo: validatedParams.effectiveTo ? new Date(validatedParams.effectiveTo) : undefined,
      expirationFrom: validatedParams.expirationFrom ? new Date(validatedParams.expirationFrom) : undefined,
      expirationTo: validatedParams.expirationTo ? new Date(validatedParams.expirationTo) : undefined,
    };
    
    // Get contracts from repository
    const result = await contractRepository.getAll(tenantId, options);
    
    res.json({
      success: true,
      message: 'Contracts retrieved successfully',
      data: result.contracts,
      pagination: {
        total: result.total,
        limit: validatedParams.limit,
        offset: validatedParams.offset
      }
    });
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
 * @desc Get a contract by ID
 * @access Authenticated users
 */
router.get('/:id', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const contractId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    const contract = await contractRepository.getById(contractId, tenantId);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Get associated document
    const document = await documentRepository.getById(contract.documentId, tenantId);
    
    res.json({
      success: true,
      message: 'Contract retrieved successfully',
      data: {
        contract,
        document
      }
    });
  } catch (error) {
    logger.error('Error getting contract by ID', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving contract'
    });
  }
});

/**
 * @route PATCH /api/contracts/:id
 * @desc Update contract metadata
 * @access Authenticated users
 */
router.patch('/:id', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const contractId = req.params.id;
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    
    // Only allow updating specific fields
    const allowedUpdates = insertContractSchema.omit({
      documentId: true,
      createdBy: true,
      tenantId: true,
    }).partial();
    
    const validationResult = allowedUpdates.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update data',
        errors: validationResult.error.errors
      });
    }
    
    // Check if contract exists
    const contract = await contractRepository.getById(contractId, tenantId);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Prepare update payload
    const updates = {
      ...validationResult.data,
      updatedBy: userId
    };
    
    // Convert string dates to Date objects
    if (updates.effectiveDate) {
      updates.effectiveDate = new Date(updates.effectiveDate as any) as any;
    }
    if (updates.expirationDate) {
      updates.expirationDate = new Date(updates.expirationDate as any) as any;
    }
    if (updates.renewalDate) {
      updates.renewalDate = new Date(updates.renewalDate as any) as any;
    }
    
    // Update contract
    const updatedContract = await contractRepository.update(contractId, tenantId, updates);
    
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
 * @route PATCH /api/contracts/:id/status
 * @desc Update contract status
 * @access Authenticated users
 */
router.patch('/:id/status', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const contractId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    // Validate status
    const statusSchema = z.object({
      status: contractStatusEnum
    });
    
    const validationResult = statusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        errors: validationResult.error.errors
      });
    }
    
    // Check if contract exists
    const contract = await contractRepository.getById(contractId, tenantId);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Update contract status
    const { status } = validationResult.data;
    const updatedContract = await contractRepository.updateStatus(contractId, tenantId, status);
    
    res.json({
      success: true,
      message: 'Contract status updated successfully',
      data: updatedContract
    });
  } catch (error) {
    logger.error('Error updating contract status', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error updating contract status'
    });
  }
});

/**
 * @route GET /api/contracts/expiring
 * @desc Get contracts that are near expiration
 * @access Authenticated users
 */
router.get('/expiring/:days?', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const days = req.params.days ? parseInt(req.params.days) : 30;
    
    if (isNaN(days) || days <= 0 || days > 365) {
      return res.status(400).json({
        success: false,
        message: 'Days parameter must be a number between 1 and 365'
      });
    }
    
    const contracts = await contractRepository.getExpiringContracts(tenantId, days);
    
    res.json({
      success: true,
      message: 'Expiring contracts retrieved successfully',
      data: contracts
    });
  } catch (error) {
    logger.error('Error getting expiring contracts', { error, days: req.params.days });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving expiring contracts'
    });
  }
});

/**
 * @route GET /api/contracts/:id/versions
 * @desc Get version history for a contract
 * @access Authenticated users
 */
router.get('/:id/versions', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    const contractId = req.params.id;
    const tenantId = (req as any).tenantId;
    
    // Check if contract exists
    const contract = await contractRepository.getById(contractId, tenantId);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Get version history
    const versions = await contractRepository.getVersionHistory(contractId, tenantId);
    
    res.json({
      success: true,
      message: 'Contract versions retrieved successfully',
      data: versions
    });
  } catch (error) {
    logger.error('Error getting contract versions', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Server error retrieving contract versions'
    });
  }
});

/**
 * @route POST /api/contracts/:id/versions
 * @desc Create a new version of a contract
 * @access Authenticated users
 */
router.post('/:id/versions', authenticate, tenantContext, (req: Request, res: Response) => {
  contractUpload(req, res, async (err) => {
    try {
      if (err) {
        logger.error('Contract version upload error', { error: err });
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading contract version'
        });
      }

      const contractId = req.params.id;
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user.id;

      // Check if parent contract exists
      const parentContract = await contractRepository.getById(contractId, tenantId);
      if (!parentContract) {
        return res.status(404).json({
          success: false,
          message: 'Parent contract not found'
        });
      }

      // Validate contract data (omitting the fields we'll set separately)
      const contractSchema = insertContractSchema.omit({
        documentId: true,
        createdBy: true,
        updatedBy: true,
        tenantId: true,
        parentContractId: true,
      }).partial();

      const validationResult = contractSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contract version data',
          errors: validationResult.error.errors
        });
      }

      const contractData = validationResult.data;
      
      // If no file was uploaded, create a new version using the same document
      if (!req.file) {
        // Create new version with data from parent + updates
        const newContract = await contractRepository.createNewVersion(contractId, {
          ...parentContract,
          ...contractData,
          documentId: parentContract.documentId,
          createdBy: userId,
          updatedBy: userId,
          tenantId,
          parentContractId: contractId,
        });
        
        return res.status(201).json({
          success: true,
          message: 'Contract version created successfully (no new document)',
          data: {
            contract: newContract,
            documentId: parentContract.documentId
          }
        });
      }

      // If file was uploaded, create a new document and link the contract to it
      const file = req.file;
      const sanitizedFilename = sanitizeFile(file.originalname);
      const storageKey = generateStorageKey(
        tenantId,
        'CONTRACT',
        sanitizedFilename
      );

      // Upload file to storage
      const uploadResult = await uploadFile(
        file.buffer,
        storageKey,
        file.mimetype
      );

      // Prepare tags (transfer from parent by default)
      let tags = parentContract.tags;
      if (contractData.tags && contractData.tags.length > 0) {
        tags = contractData.tags;
      }

      // Create new document record
      const newDocument = await documentRepository.create({
        filename: sanitizedFilename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size.toString(),
        storageKey: uploadResult.storageKey,
        checksum: uploadResult.checksum,
        documentType: 'CONTRACT',
        title: contractData.title || parentContract.title,
        description: contractData.description || parentContract.description,
        tags,
        uploadedBy: userId,
        tenantId,
        deleted: false,
        processingStatus: 'PENDING',
        isConfidential: contractData.isConfidential ?? parentContract.isConfidential,
        customMetadata: contractData.customMetadata || parentContract.customMetadata,
      });

      // Create new contract version
      const newContract = await contractRepository.createNewVersion(contractId, {
        ...parentContract,
        ...contractData,
        documentId: newDocument.id,
        createdBy: userId,
        updatedBy: userId,
        tenantId,
        parentContractId: contractId,
      });

      // Queue the document for AI processing
      // TODO: Implement AI processing queue

      res.status(201).json({
        success: true,
        message: 'Contract version created successfully with new document',
        data: {
          contract: newContract,
          document: newDocument
        }
      });
    } catch (error) {
      logger.error('Error creating contract version', { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: 'Server error creating contract version'
      });
    }
  });
});

export default router;