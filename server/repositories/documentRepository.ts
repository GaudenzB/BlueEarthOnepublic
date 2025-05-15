import { eq, and, desc, asc, sql, or, like } from 'drizzle-orm';
import { db } from '../db';
import { 
  documents, 
  type Document, 
  type InsertDocument,
  analysisVersions,
  type AnalysisVersion,
  type InsertAnalysisVersion,
  type DocumentEmbedding,
  type InsertDocumentEmbedding
} from '../../shared/schema/index';
import { logger } from '../utils/logger';
import { formatRelevanceScore } from '../utils/formatting';
import { roleHelpers, UserRole } from '../utils/roleHelpers';

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
        // Type-safe string comparison using raw SQL to avoid type mismatches
        conditions.push(sql`${documents.documentType} = ${documentType}`);
      }

      // Add text search if provided
      if (search && search.trim() !== '') {
        const searchPattern = `%${search}%`;
        // Use SQL template to ensure type safety
        const searchCondition = sql`(
          ${documents.title} ILIKE ${searchPattern}
          OR ${documents.description} ILIKE ${searchPattern}
          OR ${documents.originalFilename} ILIKE ${searchPattern}
        )`;
        conditions.push(searchCondition);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Error updating document processing status', { 
        error: errorMessage, 
        id, 
        tenantId, 
        status 
      });
      
      throw new Error(`Failed to update document processing status: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Error updating document after processing', { 
        error: errorMessage, 
        id, 
        tenantId 
      });
      
      throw new Error(`Failed to update document after processing: ${errorMessage}`);
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
   * @throws Error if document creation fails
   */
  async create(document: InsertDocument): Promise<Document> {
    try {
      // Validate document data
      if (!document || !document.tenantId) {
        throw new Error('Invalid document data: missing required fields');
      }
      
      // Insert document with validation
      const [result] = await db.insert(documents)
        .values(document)
        .returning();
        
      // Check result
      if (!result) {
        throw new Error('Document created but no data returned');
      }
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating document', { 
        error: errorMsg, 
        tenantId: document?.tenantId,
        documentType: document?.documentType,
        fileName: document?.originalFilename 
      });
      throw new Error(`Failed to create document: ${errorMsg}`);
    }
  },

  /**
   * Get a document by its ID
   * 
   * @param id - Document ID
   * @param tenantIdOrOptions - Either a tenant ID string or an options object with security context
   * @returns The document with optional user info, or undefined if not found
   * @throws Error if the user doesn't have permission to access the document
   */
  async getById(
    id: string, 
    tenantIdOrOptions: string | {
      userRole: 'ADMIN' | 'MANAGER' | 'USER' | 'SUPER_ADMIN';
      userTenantId: string;
      userAccessibleConfidentialDocs?: string[];
    }
  ): Promise<(Document & { 
    uploadedByUser?: { 
      id: number; 
      username: string; 
      name?: string 
    } 
  }) | undefined> {
    try {
      // Extract tenant ID and security context info
      const tenantId = typeof tenantIdOrOptions === 'string' 
        ? tenantIdOrOptions 
        : tenantIdOrOptions.userTenantId;
      
      const userRole = typeof tenantIdOrOptions === 'string' 
        ? undefined 
        : tenantIdOrOptions.userRole;
      
      const userAccessibleConfidentialDocs = typeof tenantIdOrOptions === 'string' 
        ? undefined 
        : tenantIdOrOptions.userAccessibleConfidentialDocs || [];
      
      // Validate inputs
      if (!id) {
        logger.warn('getById called with undefined or null id');
        return undefined;
      }
      
      if (!tenantId) {
        logger.warn('getById called with undefined or null tenantId');
        return undefined;
      }
      
      logger.info('Getting document by ID', { 
        id, 
        tenantId,
        withPermissions: !!userRole
      });
      
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

        // We know docResult exists from the check above
        const docResult = docResults[0];
        
        // Check if user has permission to access confidential documents
        if (userRole && docResult && docResult.isConfidential === true) {
          // Check if user has admin privileges
          const isAdmin = roleHelpers.isAdmin(userRole as UserRole);
          
          // If not admin, check if document is in user's accessible confidential docs
          if (!isAdmin && 
              (!userAccessibleConfidentialDocs || 
               !userAccessibleConfidentialDocs.includes(id))) {
            logger.warn('User does not have permission to access confidential document', {
              id,
              userRole,
              isConfidential: docResult.isConfidential
            });
            throw new Error('User is not authorized to access this confidential document');
          }
        }
        
        // Now get the user info separately if uploadedBy exists
        let userInfo = undefined;
        if (docResult && docResult.uploadedBy) {
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

        // Create a document with user information
        // Type assertion to Document to satisfy TypeScript's strict checking
        const document = docResult as Document;

        // Combine the results using type assertion
        const result = {
          ...document,
          uploadedByUser: userInfo
        } as Document & { uploadedByUser?: { id: number; username: string; name?: string } };

        logger.info('Document found successfully', { 
          id: result.id,
          title: result.title,
          documentType: result.documentType,
          hasUserInfo: !!userInfo
        });
        
        return result;
      } catch (innerError) {
        const errorMessage = innerError instanceof Error ? innerError.message : 'Unknown error';
        const errorStack = innerError instanceof Error ? innerError.stack : undefined;
        
        logger.error('Error in document query', { 
          error: errorMessage,
          stack: errorStack,
          id, 
          tenantId 
        });
        throw innerError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Error getting document by ID', { 
        error: errorMessage, 
        stack: errorStack,
        id, 
        tenantId 
      });
      throw new Error(`Failed to get document: ${errorMessage}`);
    }
  },

  /**
   * Get all documents for a tenant with optional filtering and pagination
   * 
   * @param tenantId - Tenant ID
   * @param options - Query options for filtering and pagination
   * @returns Object containing documents array and total count
   */
  async getAll(tenantId: string, options: {
    limit?: number;
    offset?: number;
    documentType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    tags?: string[];
    isConfidential?: boolean;
    // Adding role-based access control parameters
    userRole?: 'ADMIN' | 'MANAGER' | 'USER' | 'SUPER_ADMIN';
    userAccessibleConfidentialDocs?: string[];
  } = {}): Promise<{ documents: Document[]; total: number }> {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        documentType, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        tags,
        isConfidential,
        userRole,
        userAccessibleConfidentialDocs = []
      } = options;
      
      logger.info('🔍 Getting documents with options', { 
        tenantId, 
        limit, 
        offset, 
        documentType,
        search,
        sortBy,
        sortOrder,
        tagCount: tags?.length || 0,
        isConfidential,
        userRole
      });

      // Build query conditions
      const conditions = [
        eq(documents.tenantId, tenantId),
        eq(documents.deleted, false) // Only retrieve non-deleted documents
      ];

      // Add document type filter
      if (documentType) {
        // Use sql template for type-safe comparison
        conditions.push(sql`${documents.documentType} = ${documentType}`);
      }

      // Add search filter
      if (search) {
        conditions.push(
          or(
            like(documents.title, `%${search}%`),
            like(documents.filename, `%${search}%`),
            like(documents.description, `%${search}%`)
          )
        );
      }

      // Add tag filters
      if (tags && tags.length > 0) {
        // This is a simplified approach; for production, consider using a more robust tag filtering mechanism
        for (const tag of tags) {
          conditions.push(sql`${documents.tags} @> array[${tag}]::text[]`);
        }
      }

      // Add confidentiality filter
      if (isConfidential !== undefined) {
        conditions.push(eq(documents.isConfidential, isConfidential));
      }

      // Apply permissions filters based on user role
      if (userRole) {
        // Handle both uppercase and lowercase role formats for compatibility
        const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'superadmin';
        const isAdmin = userRole === 'ADMIN' || userRole === 'admin' || isSuperAdmin;
        
        if (!isAdmin) {
          // For non-admin users, apply confidentiality restrictions
          if (userAccessibleConfidentialDocs && userAccessibleConfidentialDocs.length > 0) {
            // Create an array of SQL parameters for each document ID
            const accessibleDocIds = userAccessibleConfidentialDocs.map(id => sql`${id}`);
            
            // Users with specific confidential document access
            if (accessibleDocIds.length > 0) {
              conditions.push(
                or(
                  eq(documents.isConfidential, false),
                  sql`${documents.id}::text IN (${sql.join(accessibleDocIds, sql`, `)})`
                )
              );
            } else {
              // Empty array - only show non-confidential docs
              conditions.push(eq(documents.isConfidential, false));
            }
          } else {
            // Regular users can't see confidential documents
            conditions.push(eq(documents.isConfidential, false));
          }
        }
        // Admins can see all documents in their tenant (no additional filters)
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
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(and(...conditions));

      const total = countResult?.[0]?.count ? Number(countResult[0].count) : 0;

      // Build the query
      let query = db
        .select()
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

      // Execute query
      const results = await query;

      // Enhanced logging for document results
      logger.info('📄 Document query results', { 
        resultCount: results.length,
        totalCount: total,
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
        total
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting documents', { 
        error: errorMessage, 
        tenantId, 
        options: {
          ...options,
          userAccessibleConfidentialDocs: options.userAccessibleConfidentialDocs 
            ? `[${options.userAccessibleConfidentialDocs.length} items]` 
            : undefined
        }
      });
      throw new Error(`Failed to get documents: ${errorMessage}`);
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
  async updateProcessingStatusWithError(
    id: string, 
    tenantId: string, 
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ERROR', 
    errorMessage: string
  ): Promise<Document | undefined> {
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
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating document with error message', { 
        error: errorMsg, 
        id, 
        tenantId, 
        status, 
        errorLength: errorMessage?.length || 0 
      });
      throw new Error(`Failed to update document with error message: ${errorMsg}`);
    }
  },

  /**
   * Update document with AI analysis results
   * 
   * @param id - Document ID
   * @param tenantId - Tenant ID
   * @param metadata - AI metadata (JSON object with analysis data)
   * @returns The updated document
   */
  async updateAIMetadata(id: string, tenantId: string, metadata: Record<string, any>): Promise<Document | undefined> {
    try {
      // Validate inputs
      if (!id || !tenantId) {
        logger.warn('Missing required parameters in updateAIMetadata', { 
          hasId: !!id, 
          hasTenantId: !!tenantId 
        });
        throw new Error('Missing required parameters');
      }
      
      if (!metadata || typeof metadata !== 'object') {
        logger.warn('Invalid metadata in updateAIMetadata', { 
          id, 
          tenantId, 
          metadataType: typeof metadata 
        });
        throw new Error('Invalid metadata format');
      }
      
      // Log analysis metadata being stored
      logger.info('Updating document with AI metadata', { 
        id, 
        tenantId, 
        metadataKeys: Object.keys(metadata),
        metadataSize: JSON.stringify(metadata).length
      });
      
      // Update document record
      const [result] = await db
        .update(documents)
        .set({
          aiProcessed: true,
          aiMetadata: metadata,
          processingStatus: 'COMPLETED' as const,
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
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating document AI metadata', { 
        error: errorMsg, 
        id, 
        tenantId,
        metadataKeys: metadata ? Object.keys(metadata) : null
      });
      throw new Error(`Failed to update document AI metadata: ${errorMsg}`);
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
      // Validate input
      if (!embedding || !embedding.documentId || !embedding.embedding || !Array.isArray(embedding.embedding)) {
        logger.error('Invalid embedding data provided', { 
          hasDocumentId: !!embedding?.documentId,
          hasEmbedding: !!embedding?.embedding,
          isArray: Array.isArray(embedding?.embedding)
        });
        throw new Error('Invalid embedding data provided');
      }

      // We need to use raw SQL for the vector type
      const embeddingVector = embedding.embedding.join(',');
      
      const result = await db.execute(sql`
        INSERT INTO document_embeddings (
          document_id, chunk_index, text_chunk, embedding, embedding_model
        ) VALUES (
          ${embedding.documentId}, 
          ${embedding.chunkIndex}, 
          ${embedding.textChunk || ''}, 
          ${sql.raw(`'[${embeddingVector}]'`)}, 
          ${embedding.embeddingModel || 'text-embedding-ada-002'}
        )
        RETURNING *
      `);
      
      // Return the document embedding result
      if (result && result.rows && result.rows.length > 0) {
        return result.rows[0] as DocumentEmbedding;
      }
      
      logger.warn('No document embedding returned after insertion', { documentId: embedding.documentId });
      return undefined;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error storing document embedding', { 
        error: errorMessage, 
        documentId: embedding.documentId,
        chunkIndex: embedding.chunkIndex
      });
      throw new Error(`Failed to store document embedding: ${errorMessage}`);
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
    // Use the UserRole type for consistent role handling
    userRole?: UserRole;
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

      // Validate inputs
      if (!tenantId) {
        throw new Error('Tenant ID is required for semantic search');
      }
      
      logger.info('Performing semantic search', { 
        tenantId, 
        vectorLength: queryEmbedding?.length || 0,
        limit,
        minSimilarity,
        documentType,
        hasDocumentIds: !!documentIds && documentIds.length > 0,
        userRole,
        hasConfidentialAccess: userAccessibleConfidentialDocs.length > 0
      });

      // Validate query embedding
      if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        logger.error('Invalid query embedding provided for semantic search', {
          isEmpty: !queryEmbedding,
          isArray: Array.isArray(queryEmbedding),
          length: queryEmbedding?.length || 0
        });
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
          AND d.deleted = false
      `;
      
      // Add optional filters
      if (documentType) {
        // Use SQL template for type-safe comparison
        query = sql`${query} AND d.document_type = ${documentType}`;
      }
      
      // Add document ID filter with proper SQL parameters for safety
      if (documentIds && documentIds.length > 0) {
        const idParams = documentIds.map(id => sql`${id}`);
        query = sql`${query} AND d.id IN (${sql.join(idParams)})`;
      }
      
      // Apply permissions filters based on user role
      if (userRole) {
        // Handle both uppercase and lowercase role formats for compatibility
        const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'superadmin';
        const isAdmin = userRole === 'ADMIN' || userRole === 'admin' || isSuperAdmin;
        
        if (!isAdmin) {
          // For non-admin users, apply confidentiality restrictions
          if (userAccessibleConfidentialDocs && userAccessibleConfidentialDocs.length > 0) {
            // Users with specific confidential document access
            const accessParams = userAccessibleConfidentialDocs.map(id => sql`${id}`);
            query = sql`${query} AND (
              d.is_confidential = false 
              OR d.id IN (${sql.join(accessParams, sql`, `)})
            )`;
          } else {
            // Regular users can't see confidential documents
            query = sql`${query} AND d.is_confidential = false`;
          }
        }
        // Admins can see all documents in their tenant (no additional filters)
      }
      
      // Add order and limit
      query = sql`${query} ORDER BY sr.similarity DESC LIMIT ${limit}`;
      
      // Execute the query with proper error handling
      const result = await db.execute(query);

      // Convert result to appropriate format with proper type handling
      const documents: Document[] = [];
      const scores: Record<string, number> = {};
      
      if (result && result.rows && result.rows.length > 0) {
        for (const row of result.rows) {
          // Extract similarity score and convert from string to number
          const similarity = typeof row.similarity === 'string' 
            ? parseFloat(row.similarity) 
            : (typeof row.similarity === 'number' ? row.similarity : 0);
          
          // Store the document with proper typing
          documents.push(row as Document);
          
          // Store the score with proper ID type handling
          scores[row.id as string] = similarity;
        }
      }
      
      // Enhanced logging
      logger.info('Semantic search results', { 
        resultCount: documents.length,
        topScore: documents.length > 0 ? scores[documents[0].id] : 0,
        sampleDocId: documents.length > 0 ? documents[0].id : null,
        sampleDocTitle: documents.length > 0 ? documents[0].title : null,
        relevanceScore: documents.length > 0 
          ? formatRelevanceScore(scores[documents[0].id])
          : null
      });
      
      return { documents, scores };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error performing semantic search', { 
        error: errorMessage,
        tenantId: params.tenantId,
        embeddingLength: params.queryEmbedding?.length || 0
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
      // Validate input
      if (!version || !version.documentId || !version.tenantId) {
        throw new Error('Invalid analysis version data: missing required fields');
      }
      
      // Insert the new version record
      const [result] = await db.insert(analysisVersions)
        .values(version)
        .returning();
        
      logger.info('Created analysis version', { 
        documentId: version.documentId,
        tenantId: version.tenantId,
        versionId: result.id,
        analysisType: version.analysisType
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating analysis version', { 
        error: errorMessage, 
        documentId: version.documentId,
        tenantId: version.tenantId
      });
      throw new Error(`Failed to create analysis version: ${errorMessage}`);
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
      // Validate inputs
      if (!documentId || !tenantId) {
        logger.warn('Invalid parameters for getAnalysisVersions', { 
          hasDocumentId: !!documentId, 
          hasTenantId: !!tenantId 
        });
        return [];
      }
      
      // Query for analysis versions
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
      
      logger.info('Retrieved analysis versions', { 
        documentId, 
        tenantId, 
        count: results.length,
        latestVersion: results.length > 0 ? {
          id: results[0].id,
          analysisType: results[0].analysisType,
          status: results[0].status,
          createdAt: results[0].createdAt
        } : null
      });
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting analysis versions', { 
        error: errorMessage, 
        documentId, 
        tenantId 
      });
      throw new Error(`Failed to get analysis versions: ${errorMessage}`);
    }
  }
};

export default documentRepository;