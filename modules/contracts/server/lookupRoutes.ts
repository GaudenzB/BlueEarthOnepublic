import { Router, Request, Response } from 'express';
import { logger } from '../../../server/utils/logger';
import { CONTRACT_TYPES } from '../../../shared/constants/contractTypes';

// Create router
const router = Router();

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