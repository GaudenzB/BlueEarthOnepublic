import { Router, Request, Response } from 'express';
import { authenticate } from '../auth';
import { tenantContext } from '../middleware/tenantContext';
import { logger } from '../utils/logger';
import { documentEmbeddingsRepository } from '../repositories/documentEmbeddingsRepository';
import { documentRepository } from '../repositories/documentRepository';
import { z } from 'zod';
import { generateEmbedding } from '../utils/embeddingGenerator';

const router = Router();

// Zod schema for validating semantic search requests
const semanticSearchRequestSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  minSimilarity: z.number().min(0).max(1).optional().default(0.7),
  limit: z.number().int().positive().optional().default(10),
  documentType: z.enum([
    'CONTRACT',
    'AGREEMENT',
    'POLICY',
    'REPORT',
    'PRESENTATION',
    'CORRESPONDENCE',
    'INVOICE',
    'OTHER'
  ]).optional()
});

/**
 * @route POST /api/semantic-search
 * @desc Search documents using semantic similarity
 * @access Authenticated users
 */
router.post('/', authenticate, tenantContext, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = semanticSearchRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid search parameters',
        errors: validationResult.error.errors
      });
    }

    const { query, minSimilarity, limit, documentType } = validationResult.data;
    const tenantId = (req as any).tenantId;
    
    logger.info('Semantic search request received', { 
      query, 
      minSimilarity, 
      limit, 
      documentType,
      tenantId
    });

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);
    
    if (!queryEmbedding) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate embedding for search query',
      });
    }
    
    // Perform semantic search
    const results = await documentEmbeddingsRepository.semanticSearch(
      queryEmbedding,
      minSimilarity,
      limit
    );
    
    if (!results || results.length === 0) {
      return res.json({
        success: true,
        message: 'No documents found matching the search criteria',
        data: {
          documents: [],
          total: 0
        }
      });
    }
    
    // Get document details for search results
    const documentIds = results.map(result => result.documentId);
    const documentDetails = await Promise.all(
      documentIds.map(async (docId) => {
        const doc = await documentRepository.getById(docId, tenantId);
        return doc;
      })
    );
    
    // Filter out any null results and documents that don't match the requested type
    const filteredDocuments = documentDetails
      .filter(doc => doc !== null)
      .filter(doc => !documentType || doc.documentType === documentType);
    
    // Map results to include similarity scores
    const documentsWithScores = filteredDocuments.map(doc => {
      const resultEntry = results.find(r => r.documentId === doc.id);
      return {
        ...doc,
        similarity: resultEntry ? resultEntry.similarity : 0
      };
    });
    
    // Sort by similarity score (highest first)
    documentsWithScores.sort((a, b) => b.similarity - a.similarity);
    
    logger.info('Semantic search completed', { 
      query, 
      resultsCount: documentsWithScores.length,
      totalMatches: results.length
    });
    
    return res.json({
      success: true,
      message: 'Semantic search completed',
      data: {
        documents: documentsWithScores,
        total: documentsWithScores.length,
        query,
        minSimilarity
      }
    });
  } catch (error) {
    logger.error('Error in semantic search', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.body.query
    });
    
    res.status(500).json({
      success: false,
      message: 'Server error performing semantic search'
    });
  }
});

export default router;