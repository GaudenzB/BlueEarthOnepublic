import { documentEmbeddings, type DocumentEmbedding, type InsertDocumentEmbedding } from '@shared/schema';
import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

/**
 * Document Embeddings Repository
 * Handles database operations for document embeddings
 */
export const documentEmbeddingsRepository = {
  /**
   * Store an embedding for a document chunk
   * Note that the embedding vector is stored using a raw SQL query since
   * Drizzle ORM doesn't directly support pgvector types
   * 
   * @param documentId - Document ID
   * @param textChunk - The text that was embedded
   * @param chunkIndex - Index of the chunk within the document
   * @param embedding - The vector embedding as a number array
   * @param model - The embedding model used
   * @returns The created embedding record
   */
  async storeEmbedding(
    documentId: string,
    textChunk: string,
    chunkIndex: number,
    embedding: number[],
    model: string = 'text-embedding-ada-002'
  ): Promise<DocumentEmbedding | null> {
    try {
      // Convert embedding array to string for SQL
      const embeddingStr = `[${embedding.join(',')}]`;
      
      // First, insert the record without the embedding
      const [record] = await db
        .insert(documentEmbeddings)
        .values({
          documentId,
          textChunk,
          chunkIndex,
          embeddingModel: model
        })
        .returning();
      
      if (!record || !record.id) {
        logger.error('Failed to create initial embedding record', { documentId, chunkIndex });
        return null;
      }
      
      // Then update the embedding using raw SQL
      // This is necessary because pgvector types aren't directly supported by Drizzle
      const updateResult = await db.execute(
        sql`UPDATE document_embeddings 
            SET embedding = ${embeddingStr}::vector 
            WHERE id = ${record.id} 
            RETURNING *`
      );
      
      if (!updateResult || !updateResult.rows || updateResult.rows.length === 0) {
        logger.error('Failed to update embedding vector', { recordId: record.id });
        return record; // Return the record without the embedding vector
      }
      
      logger.debug('Successfully stored document embedding', { 
        documentId, 
        chunkIndex, 
        recordId: record.id,
        dimensions: embedding.length
      });
      
      return record;
    } catch (error) {
      logger.error('Error storing document embedding', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        documentId, 
        chunkIndex 
      });
      return null;
    }
  },
  
  /**
   * Store multiple embeddings for a document in a batch
   * 
   * @param documentId - Document ID
   * @param embeddings - Array of text chunks with embeddings
   * @returns Number of successfully stored embeddings
   */
  async storeEmbeddingsBatch(
    documentId: string,
    embeddings: Array<{
      textChunk: string;
      embedding: number[];
      chunkIndex: number;
      model?: string;
    }>
  ): Promise<number> {
    try {
      let successCount = 0;
      
      // Process each embedding in sequence to avoid transaction issues
      for (const item of embeddings) {
        if (!item.embedding) continue;
        
        const result = await this.storeEmbedding(
          documentId,
          item.textChunk,
          item.chunkIndex,
          item.embedding,
          item.model || 'text-embedding-ada-002'
        );
        
        if (result) {
          successCount++;
        }
      }
      
      logger.info('Batch stored document embeddings', { 
        documentId, 
        totalEmbeddings: embeddings.length,
        successfulEmbeddings: successCount,
        failedEmbeddings: embeddings.length - successCount
      });
      
      return successCount;
    } catch (error) {
      logger.error('Error in batch storing document embeddings', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        documentId, 
        count: embeddings.length 
      });
      return 0;
    }
  },
  
  /**
   * Get all embeddings for a document
   * 
   * @param documentId - Document ID
   * @returns Array of document embeddings
   */
  async getEmbeddingsByDocumentId(documentId: string): Promise<DocumentEmbedding[]> {
    try {
      const results = await db
        .select()
        .from(documentEmbeddings)
        .where(eq(documentEmbeddings.documentId, documentId))
        .orderBy(documentEmbeddings.chunkIndex);
      
      return results;
    } catch (error) {
      logger.error('Error getting document embeddings', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        documentId 
      });
      return [];
    }
  },
  
  /**
   * Delete all embeddings for a document
   * 
   * @param documentId - Document ID
   * @returns Number of embeddings deleted
   */
  async deleteEmbeddingsByDocumentId(documentId: string): Promise<number> {
    try {
      const result = await db
        .delete(documentEmbeddings)
        .where(eq(documentEmbeddings.documentId, documentId))
        .returning();
      
      logger.info('Deleted document embeddings', { documentId, count: result.length });
      return result.length;
    } catch (error) {
      logger.error('Error deleting document embeddings', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        documentId 
      });
      return 0;
    }
  },
  
  /**
   * Perform a semantic search using vector similarity
   * 
   * @param queryText - The search query text
   * @param embedding - The embedding of the search query
   * @param minSimilarity - Minimum similarity threshold (0-1)
   * @param limit - Maximum number of results to return
   * @returns Array of document IDs with their similarity scores
   */
  async semanticSearch(
    embedding: number[],
    minSimilarity: number = 0.7,
    limit: number = 10
  ): Promise<Array<{ documentId: string, similarity: number }>> {
    try {
      // Convert embedding array to string for SQL
      const embeddingStr = `[${embedding.join(',')}]`;
      
      // Execute the semantic search using the custom function
      const searchResult = await db.execute(
        sql`SELECT * FROM search_similar_documents(
          ${embeddingStr}::vector, 
          ${minSimilarity}::float, 
          ${limit}::int
        )`
      );
      
      if (!searchResult || !searchResult.rows) {
        return [];
      }
      
      // Transform results into the expected format
      const results = searchResult.rows.map(row => ({
        documentId: row.document_id as string,
        similarity: parseFloat(row.similarity as string)
      }));
      
      logger.info('Semantic search executed', { 
        resultsCount: results.length,
        minSimilarity,
        limit
      });
      
      return results;
    } catch (error) {
      logger.error('Error in semantic search', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        minSimilarity, 
        limit 
      });
      return [];
    }
  }
};