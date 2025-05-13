import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { analyzeDocumentText, extractTextFromDocument } from '../utils/openai';
import { documentRepository } from '../repositories/documentRepository';

/**
 * Document Processing Service
 * 
 * Handles document processing, analysis, and metadata extraction
 */
class DocumentProcessorService {
  /**
   * Process a document that is currently in PENDING status
   * 
   * @param documentId The ID of the document to process
   * @param tenantId The tenant ID
   * @returns True if processing was successful, false otherwise
   */
  async processDocument(documentId: string, tenantId: string): Promise<boolean> {
    try {
      logger.info('Starting document processing', { documentId, tenantId });
      
      // Step 1: Update document status to PROCESSING
      await documentRepository.updateProcessingStatus(documentId, tenantId, 'PROCESSING');
      
      // Step 2: Get document data
      const document = await documentRepository.getById(documentId, tenantId);
      if (!document) {
        logger.error('Document not found', { documentId, tenantId });
        return false;
      }
      
      // Step 3: Load file content
      const storageRoot = process.env['STORAGE_LOCAL_PATH'] || './uploads';
      const filePath = path.join(storageRoot, document.storageKey);
      
      let fileContent: Buffer;
      try {
        fileContent = fs.readFileSync(filePath);
        logger.info('Document file loaded successfully', { 
          documentId, 
          fileSize: fileContent.length,
          filePath
        });
      } catch (error) {
        logger.error('Error reading document file', { error, documentId, filePath });
        await documentRepository.updateProcessingStatus(documentId, tenantId, 'ERROR');
        return false;
      }
      
      // Step 4: Extract text from document
      const textContent = await extractTextFromDocument(
        fileContent, 
        document.mimeType, 
        document.originalFilename
      );
      if (!textContent) {
        logger.error('Failed to extract text from document', { documentId });
        await documentRepository.updateProcessingStatus(documentId, tenantId, 'ERROR');
        return false;
      }
      
      // Step 5: Analyze document text with OpenAI
      const aiAnalysis = await analyzeDocumentText(
        textContent,
        document.title || document.originalFilename,
        document.documentType || 'OTHER'
      );
      
      // Step 6: Update document with AI metadata
      await documentRepository.updateAfterProcessing(documentId, tenantId, {
        processingStatus: 'COMPLETED',
        aiProcessed: true,
        aiMetadata: aiAnalysis
      });
      
      logger.info('Document processing completed successfully', { 
        documentId,
        tenantId,
        summaryLength: aiAnalysis.summary.length,
        entitiesCount: aiAnalysis.entities.length
      });
      
      return true;
    } catch (error) {
      logger.error('Error processing document', { error, documentId, tenantId });
      
      // Update status to ERROR only if we haven't already
      try {
        await documentRepository.updateProcessingStatus(documentId, tenantId, 'ERROR');
      } catch (updateError) {
        logger.error('Failed to update document status to ERROR', { updateError, documentId });
      }
      
      return false;
    }
  }

  /**
   * Process all pending documents for a tenant
   * 
   * @param tenantId The tenant ID
   * @param limit Maximum number of documents to process in one batch
   * @returns Number of documents successfully processed
   */
  async processPendingDocuments(tenantId: string, limit: number = 5): Promise<number> {
    try {
      // Get pending documents
      const pendingDocuments = await documentRepository.getPendingDocuments(tenantId, limit);
      
      logger.info('Found pending documents to process', { 
        count: pendingDocuments.length,
        tenantId,
        limit
      });
      
      if (pendingDocuments.length === 0) {
        return 0;
      }
      
      // Process each document
      let successCount = 0;
      for (const doc of pendingDocuments) {
        const success = await this.processDocument(doc.id, tenantId);
        if (success) {
          successCount++;
        }
      }
      
      return successCount;
    } catch (error) {
      logger.error('Error processing pending documents', { error, tenantId });
      return 0;
    }
  }
}

export const documentProcessor = new DocumentProcessorService();