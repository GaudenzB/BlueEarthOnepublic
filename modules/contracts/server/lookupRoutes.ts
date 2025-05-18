import { Router, Request, Response } from 'express';
import { logger } from '../../../server/utils/logger';

// Create router
const router = Router();

// Define contract types
const CONTRACT_TYPES = [
  { id: 'MSA', name: 'Master Services Agreement' },
  { id: 'SOW', name: 'Statement of Work' },
  { id: 'NDA', name: 'Non-Disclosure Agreement' },
  { id: 'SLA', name: 'Service Level Agreement' },
  { id: 'PO', name: 'Purchase Order' },
  { id: 'AMENDMENT', name: 'Amendment' },
  { id: 'LEASE', name: 'Lease Agreement' },
  { id: 'LICENSE', name: 'License Agreement' },
  { id: 'CONSULTING', name: 'Consulting Agreement' },
  { id: 'EMPLOYMENT', name: 'Employment Contract' },
  { id: 'OTHER', name: 'Other' }
];

/**
 * @route GET /contract-types
 * @desc Get all contract types for dropdown lists
 * @access Public
 */
router.get('/contract-types', (req: Request, res: Response) => {
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

export default router;