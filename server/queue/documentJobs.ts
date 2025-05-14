import { jobQueue } from './jobQueue';
import { documentProcessor } from '../services/documentProcessor';
import { documentRepository } from '../repositories/documentRepository';
import { logger } from '../utils/logger';

// Define document job types
export enum DocumentJobType {
  PROCESS_DOCUMENT = 'process_document',
  CLEANUP_ORPHANED_DOCUMENTS = 'cleanup_orphaned_documents',
  PROCESS_ALL_PENDING = 'process_all_pending'
}

// Define document processing job data interface
export interface ProcessDocumentJobData {
  documentId: string;
  tenantId: string;
}

// Define cleanup job data interface
export interface CleanupOrphanedDocumentsJobData {
  tenantId: string;
  olderThanDays?: number;
}

// Define process all pending job data interface
export interface ProcessAllPendingJobData {
  tenantId: string;
  limit?: number;
}

/**
 * Initialize document job handlers
 */
export function initializeDocumentJobs(): void {
  // Register document processing job handler
  jobQueue.registerHandler<ProcessDocumentJobData>(
    DocumentJobType.PROCESS_DOCUMENT, 
    async (data) => {
      const { documentId, tenantId } = data;
      logger.info('Processing document job started', { documentId, tenantId });
      
      try {
        // Process the document
        const success = await documentProcessor.processDocument(documentId, tenantId);
        
        if (!success) {
          throw new Error('Document processing failed');
        }
        
        logger.info('Document processing job completed successfully', { documentId, tenantId });
      } catch (error) {
        logger.error('Error in document processing job', { 
          documentId, 
          tenantId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        
        // Update document status to error
        try {
          await documentRepository.updateProcessingStatusWithError(
            documentId,
            tenantId,
            'ERROR',
            error instanceof Error ? error.message : 'Unknown error during processing'
          );
        } catch (updateError) {
          logger.error('Failed to update document status to ERROR', { 
            documentId, 
            tenantId, 
            error: updateError 
          });
        }
        
        // Re-throw the error to trigger job retry
        throw error;
      }
    }
  );

  // Register cleanup job handler
  jobQueue.registerHandler<CleanupOrphanedDocumentsJobData>(
    DocumentJobType.CLEANUP_ORPHANED_DOCUMENTS,
    async (data) => {
      const { tenantId, olderThanDays = 7 } = data;
      // Calculate cutoff date for orphaned documents
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      logger.info('Cleaning up orphaned documents', { tenantId, olderThanDays });
      
      // TODO: Implement cleanup logic to mark orphaned documents for deletion
      // This would involve checking for incomplete documents that haven't been updated
      // in a while and either deleting them or marking them as orphaned.
      
      logger.info('Orphaned document cleanup completed', { tenantId });
    }
  );

  // Register process all pending documents job handler
  jobQueue.registerHandler<ProcessAllPendingJobData>(
    DocumentJobType.PROCESS_ALL_PENDING,
    async (data) => {
      const { tenantId, limit = 5 } = data;
      
      logger.info('Processing all pending documents job started', { tenantId, limit });
      
      try {
        const count = await documentProcessor.processPendingDocuments(tenantId, limit);
        logger.info('Processed pending documents', { tenantId, count });
      } catch (error) {
        logger.error('Error processing pending documents', { 
          tenantId, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }
  );
}

/**
 * Queue a document for processing
 * 
 * @param documentId - The ID of the document to process
 * @param tenantId - The tenant ID
 * @returns The job ID
 */
export async function queueDocumentProcessing(
  documentId: string, 
  tenantId: string
): Promise<string> {
  return jobQueue.addJob<ProcessDocumentJobData>(
    DocumentJobType.PROCESS_DOCUMENT,
    { documentId, tenantId },
    { priority: 1 } // Standard priority
  );
}

/**
 * Queue all pending documents for processing
 * 
 * @param tenantId - The tenant ID
 * @param limit - The maximum number of documents to process
 * @returns The job ID
 */
export async function queueAllPendingDocuments(
  tenantId: string,
  limit: number = 5
): Promise<string> {
  return jobQueue.addJob<ProcessAllPendingJobData>(
    DocumentJobType.PROCESS_ALL_PENDING,
    { tenantId, limit },
    { priority: 0 } // Lower priority
  );
}

/**
 * Queue a cleanup of orphaned documents
 * 
 * @param tenantId - The tenant ID
 * @param olderThanDays - Only clean up documents older than this many days
 * @returns The job ID
 */
export async function queueOrphanedDocumentCleanup(
  tenantId: string,
  olderThanDays: number = 7
): Promise<string> {
  return jobQueue.addJob<CleanupOrphanedDocumentsJobData>(
    DocumentJobType.CLEANUP_ORPHANED_DOCUMENTS,
    { tenantId, olderThanDays },
    { priority: -1 } // Lowest priority
  );
}

// Initialize job handlers when this module is loaded
initializeDocumentJobs();