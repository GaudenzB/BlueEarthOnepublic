import { eq, and, desc, sql, or, like } from 'drizzle-orm';
import { db } from '../db';
import { 
  documents, 
  type Document, 
  type InsertDocument,
  analysisVersions,
  type AnalysisVersion,
  type InsertAnalysisVersion
} from '../../shared/schema/index';
import { logger } from '../utils/logger';

/**
 * Repository for Document-related database operations
 */
export const documentRepository = {
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
      if (process.env.NODE_ENV !== 'production') {
        const queryConditions = and(...conditions);
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
   * Update document AI processing status
   * 
   * @param id - Document ID
   * @param tenantId - Tenant ID
   * @param status - New processing status
   * @returns The updated document
   */
  async updateProcessingStatus(id: string, tenantId: string, status: string): Promise<Document | undefined> {
    try {
      const [result] = await db
        .update(documents)
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