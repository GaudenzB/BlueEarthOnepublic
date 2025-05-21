/**
 * Contract Analysis Routes
 * 
 * These routes handle contract document analysis using the new analyzer service.
 */

import { Router, Request, Response } from 'express';
import { logger } from '../../../../server/utils/logger';
import { contractAnalyzerService } from '../analyzers';
import crypto from 'crypto';

const router = Router();

/**
 * @route POST /api/contracts/upload/analyze/:documentId
 * @desc Analyze a document for contract information
 * @access Authenticated users
 */
router.post('/upload/analyze/:documentId', async (req: Request, res: Response) => {
  // Generate unique request ID for tracing
  const requestId = crypto.randomUUID();
  
  try {
    const { documentId } = req.params;
    
    // Log request information
    logger.info('Received contract analysis request', {
      requestId,
      documentId,
      path: req.path
    });
    
    // Validate document ID
    if (!documentId) {
      logger.warn('Missing document ID in request', { requestId });
      return res.status(400).json({
        success: false,
        message: 'Document ID is required',
        error: 'MISSING_DOCUMENT_ID'
      });
    }
    
    // Validate UUID format
    if (!documentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      logger.warn('Invalid document ID format', { requestId, documentId });
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format',
        error: 'INVALID_DOCUMENT_ID'
      });
    }
    
    try {
      // Get user ID from request if available
      const userId = (req as any).userId || 'system';
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000001';
      
      // Use the contract analyzer service (with fallback strategy)
      const analysisResult = await contractAnalyzerService.analyzeContract(documentId, userId, tenantId);
      
      if (analysisResult.status === 'FAILED') {
        logger.error('Document analysis failed', { 
          requestId, 
          documentId,
          error: analysisResult.error 
        });
        
        return res.status(500).json({
          success: false,
          message: `Analysis failed: ${analysisResult.error}`,
          error: 'ANALYSIS_FAILED'
        });
      }
      
      logger.info('Document analysis initiated successfully', {
        requestId,
        documentId,
        analysisId: analysisResult.id
      });
      
      return res.json({
        success: true,
        message: 'Document analysis initiated successfully',
        data: {
          analysisId: analysisResult.id,
          status: analysisResult.status,
          documentId: analysisResult.documentId
        }
      });
    } catch (analysisError) {
      logger.error('Error initiating document analysis', {
        error: analysisError,
        requestId,
        documentId
      });
      
      return res.status(500).json({
        success: false,
        message: analysisError instanceof Error ? analysisError.message : 'Error initiating document analysis',
        error: 'ANALYSIS_ERROR'
      });
    }
  } catch (error) {
    logger.error('Unexpected error in contract analysis endpoint', { 
      error, 
      path: req.path 
    });
    
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: 'SERVER_ERROR'
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
      // Get analysis result using the service
      const analysis = await contractAnalyzerService.getAnalysisStatus(analysisId);
      
      // Log for debugging
      logger.info('Retrieved analysis record', {
        requestId,
        analysisId,
        status: analysis.status
      });
      
      // Return the analysis status and any extracted data
      return res.json({
        success: true,
        message: `Analysis status: ${analysis.status}`,
        data: {
          id: analysis.id,
          status: analysis.status,
          documentId: analysis.documentId,
          vendor: analysis.vendor,
          contractTitle: analysis.contractTitle,
          docType: analysis.docType,
          effectiveDate: analysis.effectiveDate,
          terminationDate: analysis.terminationDate,
          confidence: analysis.confidence || {},
          error: analysis.error
        }
      });
    } catch (analysisError) {
      logger.error('Error retrieving analysis status', { 
        error: analysisError, 
        requestId,
        analysisId 
      });
      
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found or error retrieving status',
        error: 'ANALYSIS_NOT_FOUND'
      });
    }
  } catch (error) {
    logger.error('Unexpected error in analysis status endpoint', { 
      error, 
      path: req.path 
    });
    
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: 'SERVER_ERROR'
    });
  }
});

export default router;