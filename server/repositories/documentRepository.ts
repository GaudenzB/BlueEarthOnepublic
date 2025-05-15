import { eq, and, desc, asc, sql, or, like, inArray, SQL } from 'drizzle-orm';
import { db } from '../db';
import { 
  documents, 
  type Document, 
  type InsertDocument,
  analysisVersions,
  type AnalysisVersion,
  type InsertAnalysisVersion,
  documentEmbeddings,
  type DocumentEmbedding,
  type InsertDocumentEmbedding
} from '../../shared/schema/index';
import { logger } from '../utils/logger';
import { formatRelevanceScore } from '../utils/formatting';
import { isEmpty } from '../lib/utils';

/**
 * Repository for Document-related database operations
 */
export const documentRepository = {
  /**
   * Get all documents for a tenant
   * 
   * @param tenantId - Tenant ID
   * @param options - Query options (limit, offset, sort, etc.)
   * @returns Array of documents
   */
  async getAllForTenant(tenantId: string, options: { 
    limit?: number; 
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    documentType?: string;
    search?: string;
  } = {}): Promise<Document[]> {
    try {
      const { 
        limit = 100, 
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        documentType,
        search
      } = options;

      // Build conditions array for where clause
      const conditions = [
        eq(documents.tenantId, tenantId),
        eq(documents.deleted, false)
      ];

      // Add documentType filter if provided
      if (documentType) {
        conditions.push(eq(documents.documentType, documentType));
      }

      // Add text search if provided
      if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(
          or(
            like(documents.title, searchPattern),
            like(documents.description, searchPattern),
            like(documents.originalFilename, searchPattern)
          )
        );
      }

      // Create the query with all conditions
      let query = db.select()
        .from(documents)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

      // Add sorting based on sortBy parameter
      if (sortBy === 'createdAt') {
        query = sortOrder === 'asc' 
          ? query.orderBy(asc(documents.createdAt))
          : query.orderBy(desc(documents.createdAt));
      } else if (sortBy === 'updatedAt') {
        query = sortOrder === 'asc'
          ? query.orderBy(asc(documents.updatedAt))
          : query.orderBy(desc(documents.updatedAt));
      } else if (sortBy === 'title') {
        query = sortOrder === 'asc'
          ? query.orderBy(asc(documents.title))
          : query.orderBy(desc(documents.title));
      } else if (sortBy === 'documentType') {
        query = sortOrder === 'asc'
          ? query.orderBy(asc(documents.documentType))
          : query.orderBy(desc(documents.documentType));
      } else if (sortBy === 'fileSize') {
        query = sortOrder === 'asc'
          ? query.orderBy(asc(documents.fileSize))
          : query.orderBy(desc(documents.fileSize));
      } else {
        // Default to createdAt if an invalid sortBy is provided
        query = sortOrder === 'asc'
          ? query.orderBy(asc(documents.createdAt))
          : query.orderBy(desc(documents.createdAt));
      }

      const results = await query;
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching documents for tenant', { 
        error: errorMessage, 
        tenantId 
      });
      throw new Error(`Failed to fetch documents: ${errorMessage}`);
    }
  },
  /**
   * Update a document's processing status
   * 
   * @param id - Document ID
   * @param tenantId - Tenant ID
   * @param status - New processing status
   * @returns The updated document
   */
  async updateProcessingStatus(id: string, tenantId: string, status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'): Promise<Document | undefined> {
    try {
      const [result] = await db.update(documents)
        .set({ 
          processingStatus: status,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(documents.id, id),
            eq(documents.tenantId, tenantId)
          )
        )
        .returning();
      return result;
    } catch (error) {
      logger.error('Error updating document processing status', { error, id, tenantId, status });
      throw new Error(`Failed to update document processing status: ${error.message}`);
    }
  },

  /**
   * Update a document after processing is complete
   * 
   * @param id - Document ID
   * @param tenantId - Tenant ID
   * @param updates - Fields to update
   * @returns The updated document
   */
  async updateAfterProcessing(id: string, tenantId: string, updates: {
    processingStatus: 'COMPLETED' | 'ERROR';
    processingError?: string | null;
    aiProcessed: boolean;
    aiMetadata: any;
  }): Promise<Document | undefined> {
    try {
      const [result] = await db.update(documents)
        .set({ 
          processingStatus: updates.processingStatus,
          processingError: updates.processingError || null,
          aiProcessed: updates.aiProcessed,
          aiMetadata: updates.aiMetadata,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(documents.id, id),
            eq(documents.tenantId, tenantId)
          )
        )
        .returning();
      return result;
    } catch (error) {
      logger.error('Error updating document after processing', { error, id, tenantId });
      throw new Error(`Failed to update document after processing: ${error.message}`);
    }
  },

  /**
   * Get documents with PENDING processing status
   * 
   * @param tenantId - Tenant ID
   * @param limit - Maximum number of documents to return
   * @returns Array of pending documents
   */
  async getPendingDocuments(tenantId: string, limit: number = 5): Promise<Document[]> {
    try {
      const results = await db.select()
        .from(documents)
        .where(
          and(
            eq(documents.tenantId, tenantId),
            eq(documents.processingStatus, 'PENDING'),
            eq(documents.deleted, false)
          )
        )
        .limit(limit)
        .orderBy(documents.createdAt);
      
      return results;
    } catch (error) {
      logger.error('Error getting pending documents', { error, tenantId });
      throw new Error(`Failed to get pending documents: ${error.message}`);
    }
  },
  /**
   * Create a new document record
   * 
   * @param document - Document data to insert
   * @returns The created document
   */
  async create(document: InsertDocument): Promise<Document> {
    try {
      const [result] = await db.insert(documents)
        .values(document)
        .returning();
      return result;
    } catch (error) {
      logger.error('Error creating document', { error, document });
      throw new Error(`Failed to create document: ${error.message}`);
    }
  },

  /**
   * Get a document by its ID
   * 
   * @param id - Document ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns The document or undefined if not found
   */
  async getById(id: string, tenantId: string): Promise<Document & { uploadedByUser?: { id: number, username: string, name?: string } } | undefined> {
    try {
      // Validate inputs
      if (!id) {
        logger.warn('getById called with undefined or null id');
        return undefined;
      }
      
      if (!tenantId) {
        logger.warn('getById called with undefined or null tenantId');
        return undefined;
      }
      
      logger.info('Getting document by ID', { id, tenantId });
      
      // Execute a simpler query first to avoid join issues
      try {
        // First get just the document record
        const docResults = await db.select()
          .from(documents)
          .where(
            and(
              eq(documents.id, id),
              eq(documents.tenantId, tenantId)
            )
          );

        if (!docResults || docResults.length === 0) {
          logger.warn('No document found with ID', { id, tenantId });
          return undefined;
        }

        const docResult = docResults[0];
        
        // Now get the user info separately if uploadedBy exists
        let userInfo = undefined;
        if (docResult.uploadedBy) {
          // Import the users table from the schema
          const { users } = await import('@shared/schema');

          const userResults = await db.select({
            id: users.id,
            username: users.username,
            name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('name')
          })
          .from(users)
          .where(eq(users.id, parseInt(docResult.uploadedBy, 10)));

          if (userResults && userResults.length > 0) {
            userInfo = userResults[0];
          }
        }

        // Combine the results
        const result = {
          ...docResult,
          uploadedByUser: userInfo
        };

        logger.info('Document found successfully', { 
          id: result.id,
          title: result.title,
          documentType: result.documentType,
          hasUserInfo: !!userInfo
        });
        
        return result;
      } catch (innerError) {
        logger.error('Error in document query', { 
          error: innerError instanceof Error ? innerError.message : 'Unknown error',
          stack: innerError instanceof Error ? innerError.stack : undefined,
          id, 
          tenantId 
        });
        throw innerError;
      }
    } catch (error) {
      logger.error('Error getting document by ID', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        stack: error instanceof Error ? error.stack : undefined,
        id, 
        tenantId 
      });
      throw new Error(`Failed to get document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get all documents for a tenant with optional filtering and pagination
   * 
   * @param tenantId - Tenant ID
   * @param options - Query options for filtering and pagination
   * @returns Array of documents
   */
  async getAll(tenantId: string, options: {
    limit?: number;
    offset?: number;
    documentType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    tags?: string[];
  } = {}): Promise<{ documents: Document[]; total: number }> {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        documentType, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        tags 
      } = options;
      
      logger.info('🔍 Getting documents with options', { 
        tenantId, 
        limit, 
        offset, 
        documentType,
        search,
        sortBy,
        sortOrder,
        tags 
      });

      // Build query conditions
      const conditions = [
        eq(documents.tenantId, tenantId),
        eq(documents.deleted, false) // Only retrieve non-deleted documents
      ];

      if (documentType) {
        conditions.push(eq(documents.documentType, documentType));
      }

      if (search) {
        conditions.push(
          or(
            like(documents.title, `%${search}%`),
            like(documents.filename, `%${search}%`),
            like(documents.description, `%${search}%`)
          )
        );
      }

      if (tags && tags.length > 0) {
        // This is a simplified approach; for production, consider using a more robust tag filtering mechanism
        for (const tag of tags) {
          conditions.push(sql`${documents.tags} @> array[${tag}]::text[]`);
        }
      }

      // Log the SQL query for debugging (in development only)
      if (process.env['NODE_ENV'] !== 'production') {
        logger.debug('Document query conditions:', { 
          conditionsCount: conditions.length,
          tenantCondition: conditions[0],
          deletedCondition: conditions[1]
        });
      }

      // Count total records for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(and(...conditions));

      // Get documents with pagination
      const results = await db
        .select()
        .from(documents)
        .where(and(...conditions))
        .orderBy(
          sortOrder === 'desc' 
            ? desc(documents[sortBy as keyof typeof documents]) 
            : documents[sortBy as keyof typeof documents]
        )
        .limit(limit)
        .offset(offset);

      // Enhanced logging for document results
      logger.info('📄 Document query results', { 
        resultCount: results.length,
        totalCount: Number(count),
        sampleDocument: results.length > 0 ? {
          id: results[0].id,
          title: results[0].title,
          filename: results[0].filename,
          status: results[0].processingStatus,
          docType: results[0].documentType,
          createdAt: results[0].createdAt
        } : 'No documents found',
        tenantId
      });
      
      // For troubleshooting, dump all documents if there are fewer than 5
      if (results.length > 0 && results.length < 5) {
        logger.debug('All documents in result:', results.map(doc => ({
          id: doc.id,
          title: doc.title,
          status: doc.processingStatus
        })));
      }
      
      return {
        documents: results,
        total: Number(count)
      };
    } catch (error) {
      logger.error('Error getting documents', { error, tenantId, options });
      throw new Error(`Failed to get documents: ${error.message}`);
    }
  },

  /**
   * Update a document
   * 
   * @param id - Document ID
   * @param tenantId - Tenant ID
   * @param updates - Fields to update
   * @returns The updated document
   */
  async update(id: string, tenantId: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    try {
      const [result] = await db
        .update(documents)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(documents.id, id),
            eq(documents.tenantId, tenantId)
          )
        )
        .returning();
      return result;
    } catch (error) {
      logger.error('Error updating document', { error, id, tenantId, updates });
      throw new Error(`Failed to update document: ${error.message}`);
    }
  },

  /**
   * Soft delete a document (mark as deleted)
   * 
   * @param id - Document ID
   * @param tenantId - Tenant ID
   * @returns True if deleted successfully
   */
  async softDelete(id: string, tenantId: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(documents)
        .set({
          deleted: true,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(documents.id, id),
            eq(documents.tenantId, tenantId)
          )
        )
        .returning();
      return !!result;
    } catch (error) {
      logger.error('Error soft deleting document', { error, id, tenantId });
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  },

  /**
   * Update document with processing error
   * 
   * @param id - Document ID
   * @param tenantId - Tenant ID
   * @param status - Usually ERROR status
   * @param errorMessage - The error message to store
   * @returns The updated document
   */
  async updateProcessingStatusWithError(id: string, tenantId: string, status: string, errorMessage: string): Promise<Document | undefined> {
    try {
      logger.info('Updating document with error message', { id, tenantId, status, errorMessage });
      const [result] = await db
        .update(documents)
        .set({
          processingStatus: status,
          processingError: errorMessage,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(documents.id, id),
            eq(documents.tenantId, tenantId)
          )
        )
        .returning();
      return result;
    } catch (error) {
      logger.error('Error updating document with error message', { error, id, tenantId, status, errorMessage });
      throw new Error(`Failed to update document with error message: ${error.message}`);
    }
  },

  /**
   * Update document with AI analysis results
   * 
   * @param id - Document ID
   * @param tenantId - Tenant ID
   * @param metadata - AI metadata
   * @returns The updated document
   */
  async updateAIMetadata(id: string, tenantId: string, metadata: any): Promise<Document | undefined> {
    try {
      const [result] = await db
        .update(documents)
        .set({
          aiProcessed: true,
          aiMetadata: metadata,
          processingStatus: 'COMPLETED',
          updatedAt: new Date()
        })
        .where(
          and(
            eq(documents.id, id),
            eq(documents.tenantId, tenantId)
          )
        )
        .returning();
      return result;
    } catch (error) {
      logger.error('Error updating document AI metadata', { error, id, tenantId });
      throw new Error(`Failed to update document AI metadata: ${error.message}`);
    }
  },

  /**
   * Store document embeddings for semantic search
   * 
   * @param embedding - Document embedding data
   * @returns The stored document embedding
   */
  async storeEmbedding(embedding: InsertDocumentEmbedding & { embedding: number[] }): Promise<DocumentEmbedding | undefined> {
    try {
      // We need to use raw SQL for the vector type
      const result = await db.execute(sql`
        INSERT INTO document_embeddings (
          document_id, chunk_index, text_chunk, embedding, embedding_model
        ) VALUES (
          ${embedding.documentId}, 
          ${embedding.chunkIndex}, 
          ${embedding.textChunk}, 
          ${sql.raw(`'[${embedding.embedding.join(',')}]'`)}, 
          ${embedding.embeddingModel}
        )
        RETURNING *
      `);
      
      if (result.rows && result.rows.length > 0) {
        return result.rows[0] as DocumentEmbedding;
      }
      return undefined;
    } catch (error) {
      logger.error('Error storing document embedding', { error, documentId: embedding.documentId });
      throw new Error(`Failed to store document embedding: ${error.message}`);
    }
  },

  /**
   * Perform semantic search across document embeddings
   * 
   * @param params - Search parameters including tenant ID, query embedding, etc.
   * @returns Documents matching the semantic search with relevance scores
   */
  async semanticSearch(params: {
    tenantId: string;
    queryEmbedding: number[];
    limit?: number;
    minSimilarity?: number;
    documentType?: string;
    documentIds?: string[];
    userRole?: string;
    userAccessibleConfidentialDocs?: string[];
  }): Promise<{ documents: Document[], scores: Record<string, number> }> {
    try {
      const { 
        tenantId,
        queryEmbedding,
        limit = 10, 
        minSimilarity = 0.7, 
        documentType,
        documentIds,
        userRole,
        userAccessibleConfidentialDocs = []
      } = params;

      logger.info('Performing semantic search', { 
        tenantId, 
        vectorLength: queryEmbedding?.length || 0,
        limit,
        minSimilarity,
        documentType,
        hasDocumentIds: !!documentIds && documentIds.length > 0,
        userRole
      });

      if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        logger.error('Invalid query embedding provided for semantic search');
        return { documents: [], scores: {} };
      }

      // Convert the query embedding to a vector
      const embeddingVector = sql.raw(`'[${queryEmbedding.join(',')}]'`);
      
      // Build the base query using the search_similar_documents function
      let query = sql`
        WITH similarity_results AS (
          SELECT 
            document_id,
            similarity
          FROM 
            search_similar_documents(${embeddingVector}, ${minSimilarity}, ${limit * 3})
        )
        SELECT DISTINCT ON (d.id)
          d.*,
          sr.similarity
        FROM 
          similarity_results sr
        JOIN 
          documents d ON sr.document_id = d.id
        WHERE 
          d.tenant_id = ${tenantId}
          AND d.deleted IS NOT TRUE
      `;
      
      // Add optional filters
      if (documentType) {
        query = sql`${query} AND d.document_type = ${documentType}`;
      }
      
      if (documentIds && documentIds.length > 0) {
        const documentIdsStr = documentIds.map(id => `'${id}'`).join(',');
        query = sql`${query} AND d.id IN (${sql.raw(documentIdsStr)})`;
      }
      
      // Apply permissions filters based on user role
      if (userRole && userRole !== 'superadmin') {
        if (userRole === 'admin') {
          // Admins can see all documents in their tenant
        } else if (userAccessibleConfidentialDocs.length > 0) {
          // Users with specific confidential document access
          const accessibleDocsStr = userAccessibleConfidentialDocs.map(id => `'${id}'`).join(',');
          query = sql`${query} AND (
            d.is_confidential IS NOT TRUE 
            OR d.id IN (${sql.raw(accessibleDocsStr)})
          )`;
        } else {
          // Regular users can't see confidential documents
          query = sql`${query} AND d.is_confidential IS NOT TRUE`;
        }
      }
      
      // Add order and limit
      query = sql`${query} ORDER BY sr.similarity DESC LIMIT ${limit}`;
      
      // Execute the query
      const result = await db.execute(query);

      // Convert result to appropriate format
      const documents: Document[] = [];
      const scores: Record<string, number> = {};
      
      if (result && result.rows && result.rows.length > 0) {
        for (const row of result.rows) {
          documents.push(row as Document);
          scores[row.id] = row.similarity;
        }
      }
      
      logger.info('Semantic search results', { 
        resultCount: documents.length,
        topScore: documents.length > 0 ? scores[documents[0].id] : 0,
        sampleDocId: documents.length > 0 ? documents[0].id : null
      });
      
      return { documents, scores };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error performing semantic search', { 
        error: errorMessage,
        tenantId: params.tenantId
      });
      throw new Error(`Failed to perform semantic search: ${errorMessage}`);
    }
  },
  
  /**
   * Create a new analysis version for a document
   * 
   * @param version - Analysis version data
   * @returns The created analysis version
   */
  async createAnalysisVersion(version: InsertAnalysisVersion): Promise<AnalysisVersion> {
    try {
      const [result] = await db.insert(analysisVersions)
        .values(version)
        .returning();
      return result;
    } catch (error) {
      logger.error('Error creating analysis version', { error, version });
      throw new Error(`Failed to create analysis version: ${error.message}`);
    }
  },

  /**
   * Get analysis versions for a document
   * 
   * @param documentId - Document ID
   * @param tenantId - Tenant ID
   * @returns Array of analysis versions
   */
  async getAnalysisVersions(documentId: string, tenantId: string): Promise<AnalysisVersion[]> {
    try {
      const results = await db
        .select()
        .from(analysisVersions)
        .where(
          and(
            eq(analysisVersions.documentId, documentId),
            eq(analysisVersions.tenantId, tenantId)
          )
        )
        .orderBy(desc(analysisVersions.createdAt));
      return results;
    } catch (error) {
      logger.error('Error getting analysis versions', { error, documentId, tenantId });
      throw new Error(`Failed to get analysis versions: ${error.message}`);
    }
  }
};

export default documentRepository;