/**
 * Document Search Service for server-side
 * 
 * Handles document search operations using pgvector for semantic search
 */

import { sql } from 'drizzle-orm';
import { db } from '../db';
import { documents, documentEmbeddings } from '@/shared/schema';
import { and, eq, like, not, gt, isNull, desc, asc } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { env } from '../config/env';
import { formatRelevanceScore } from '../utils/formatting';

/**
 * Interface for semantic search parameters
 */
export interface SemanticSearchParams {
  /** Search query text */
  query: string;
  
  /** Tenant ID for multi-tenancy */
  tenantId: string;
  
  /** Maximum number of results to return */
  limit?: number;
  
  /** Document type filter */
  documentType?: string;
  
  /** Minimum similarity threshold (0-1) */
  minSimilarity?: number;
  
  /** User role for permission filtering */
  userRole?: string;
  
  /** User-accessible confidential document IDs */
  userAccessibleConfidentialDocs?: string[];
}

/**
 * Interface for similar document search parameters
 */
export interface SimilarDocumentsParams {
  /** Document ID to find similar documents for */
  documentId: string;
  
  /** Tenant ID for multi-tenancy */
  tenantId: string;
  
  /** Maximum number of results to return */
  limit?: number;
  
  /** Minimum similarity threshold (0-1) */
  minSimilarity?: number;
  
  /** User role for permission filtering */
  userRole?: string;
  
  /** User-accessible confidential document IDs */
  userAccessibleConfidentialDocs?: string[];
}

/**
 * Result interface for document search results
 */
export interface SearchResult {
  id: string;
  title: string | null;
  description: string | null;
  documentType: string;
  createdAt: string;
  isConfidential: boolean;
  textChunk: string;
  relevanceScore: number;
}

/**
 * Service for document search operations
 */
export const documentSearchService = {
  /**
   * Perform a semantic search for documents
   * 
   * @param params Search parameters
   * @returns Promise with search results
   */
  async semanticSearch(params: SemanticSearchParams): Promise<SearchResult[]> {
    try {
      const {
        query,
        tenantId,
        limit = 10,
        documentType,
        minSimilarity = 0.5,
        userRole,
        userAccessibleConfidentialDocs = []
      } = params;

      // First, we need to get the query embedding from OpenAI
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) {
        logger.error('Failed to generate embedding for query');
        return [];
      }

      // Build the base query with tenant isolation
      let queryBuilder = sql`
        SELECT 
          d.id,
          d.title,
          d.description,
          d.document_type as "documentType",
          d.created_at as "createdAt",
          d.is_confidential as "isConfidential",
          de.text_chunk as "textChunk",
          (1 - (de.embedding <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'`)})::float) as "relevanceScore"
        FROM document_embeddings de
        JOIN documents d ON de.document_id = d.id
        WHERE 
          d.tenant_id = ${tenantId}
          AND d.deleted IS NOT TRUE
          AND (1 - (de.embedding <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'`)})::float) > ${minSimilarity}
      `;

      // Apply document type filter if specified
      if (documentType) {
        queryBuilder = sql`${queryBuilder} AND d.document_type = ${documentType}`;
      }

      // Apply permissions filters based on user role
      // If not a superadmin, apply confidential document filtering
      if (userRole !== 'superadmin') {
        if (userRole === 'admin') {
          // Admins can see all documents in their tenant
        } else if (userAccessibleConfidentialDocs.length > 0) {
          // Users with specific confidential document access
          queryBuilder = sql`${queryBuilder} AND (
            d.is_confidential IS NOT TRUE 
            OR d.id IN (${sql.join(userAccessibleConfidentialDocs)})
          )`;
        } else {
          // Regular users can't see confidential documents
          queryBuilder = sql`${queryBuilder} AND d.is_confidential IS NOT TRUE`;
        }
      }

      // Finish query with order and limit
      queryBuilder = sql`${queryBuilder}
        ORDER BY "relevanceScore" DESC
        LIMIT ${limit}
      `;

      // Execute the query
      const result = await db.execute(queryBuilder);
      
      return (result as any[]).map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        documentType: row.documentType,
        createdAt: row.createdAt,
        isConfidential: row.isConfidential,
        textChunk: row.textChunk,
        relevanceScore: row.relevanceScore
      }));
    } catch (error) {
      logger.error({ error }, 'Error in semantic search');
      return [];
    }
  },

  /**
   * Find similar documents to a specific document
   * 
   * @param params Similar documents search parameters
   * @returns Promise with similar documents
   */
  async findSimilarDocuments(params: SimilarDocumentsParams): Promise<SearchResult[]> {
    try {
      const {
        documentId,
        tenantId,
        limit = 5,
        minSimilarity = 0.6,
        userRole,
        userAccessibleConfidentialDocs = []
      } = params;

      // Find the document embeddings for the target document
      const documentEmbeddingRows = await db.query.documentEmbeddings.findMany({
        where: eq(documentEmbeddings.documentId, documentId),
        limit: 1
      });

      if (!documentEmbeddingRows.length) {
        logger.warn(`No embeddings found for document ID: ${documentId}`);
        return [];
      }

      const embedding = documentEmbeddingRows[0].embedding;
      if (!embedding) {
        logger.warn(`Embedding is null for document ID: ${documentId}`);
        return [];
      }

      // Build the base query
      let queryBuilder = sql`
        SELECT 
          d.id,
          d.title,
          d.description,
          d.document_type as "documentType",
          d.created_at as "createdAt",
          d.is_confidential as "isConfidential",
          de.text_chunk as "textChunk",
          (1 - (de.embedding <=> ${sql.raw(`'[${embedding.join(',')}]'`)})::float) as "relevanceScore"
        FROM document_embeddings de
        JOIN documents d ON de.document_id = d.id
        WHERE 
          d.tenant_id = ${tenantId}
          AND d.deleted IS NOT TRUE
          AND d.id != ${documentId}
          AND (1 - (de.embedding <=> ${sql.raw(`'[${embedding.join(',')}]'`)})::float) > ${minSimilarity}
      `;

      // Apply permissions filters based on user role
      // If not a superadmin, apply confidential document filtering
      if (userRole !== 'superadmin') {
        if (userRole === 'admin') {
          // Admins can see all documents in their tenant
        } else if (userAccessibleConfidentialDocs.length > 0) {
          // Users with specific confidential document access
          queryBuilder = sql`${queryBuilder} AND (
            d.is_confidential IS NOT TRUE 
            OR d.id IN (${sql.join(userAccessibleConfidentialDocs)})
          )`;
        } else {
          // Regular users can't see confidential documents
          queryBuilder = sql`${queryBuilder} AND d.is_confidential IS NOT TRUE`;
        }
      }

      // Finish query with order and limit
      queryBuilder = sql`${queryBuilder}
        ORDER BY "relevanceScore" DESC
        LIMIT ${limit}
      `;

      // Execute the query
      const result = await db.execute(queryBuilder);
      
      return (result as any[]).map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        documentType: row.documentType,
        createdAt: row.createdAt,
        isConfidential: row.isConfidential,
        textChunk: row.textChunk,
        relevanceScore: row.relevanceScore
      }));
    } catch (error) {
      logger.error({ error }, 'Error finding similar documents');
      return [];
    }
  },

  /**
   * Generate embedding for a text query using OpenAI or similar service
   * 
   * @param text Text to generate embedding for
   * @returns Float array embedding
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const openai = require('openai');
      
      // Create API client
      const client = new openai.OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      // Generate embedding using text-embedding-ada-002 model
      const response = await client.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });
      
      // Return the embedding vector
      return response.data[0].embedding;
    } catch (error) {
      logger.error({ error }, 'Error generating embeddings');
      return null;
    }
  }
};