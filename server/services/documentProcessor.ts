import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { analyzeDocumentText, extractTextFromDocument } from '../utils/openai';
import { generateEmbeddingsForText } from '../utils/embeddingGenerator';
import { documentRepository } from '../repositories/documentRepository';
import { documentEmbeddingsRepository } from '../repositories/documentEmbeddingsRepository';

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
      let aiAnalysis;
      let processingStatus: 'COMPLETED' | 'ERROR' = 'COMPLETED';
      let processingError: string | null = null;
      
      try {
        aiAnalysis = await analyzeDocumentText(
          textContent,
          document.title || document.originalFilename,
          document.documentType || 'OTHER'
        );
        
        // Check if there was a processing error indicated in the result
        if (aiAnalysis.errorDetails) {
          logger.warn('Document analysis completed with errors', { 
            documentId, 
            error: aiAnalysis.errorDetails 
          });
          processingStatus = 'COMPLETED';  // Still mark as completed but with errors
          processingError = aiAnalysis.errorDetails;
        } else {
          logger.info('Document analysis completed successfully', { 
            documentId, 
            summaryLength: aiAnalysis.summary.length
          });
        }
      } catch (error) {
        logger.error('Error in OpenAI document analysis', { 
          error, 
          documentId 
        });
        // Continue processing despite the error, just note it in the metadata
        processingStatus = 'COMPLETED';  // Still mark as completed but with errors
        processingError = `Analysis error: ${error.message || 'Unknown error'}`;
        
        // Make sure we have a valid aiAnalysis to continue
        aiAnalysis = aiAnalysis || {
          summary: "Unable to generate summary due to an error in the analysis process.",
          entities: [],
          timeline: [],
          keyInsights: ["Analysis error occurred"],
          categories: [],
          confidence: 0
        };
      }
      
      // Step 6: Generate embeddings for document text
      let embeddingsGenerated = false;
      try {
        logger.info('Generating embeddings for document text', { documentId });
        
        // Generate embeddings for document text
        const embeddings = await generateEmbeddingsForText(textContent);
        
        if (embeddings.length > 0) {
          // Store embeddings in database
          const storedCount = await documentEmbeddingsRepository.storeEmbeddingsBatch(
            documentId,
            embeddings
          );
          
          embeddingsGenerated = storedCount > 0;
          
          logger.info('Document embeddings generated and stored', { 
            documentId,
            embeddingsCount: embeddings.length,
            storedCount
          });
        } else {
          logger.warn('No embeddings were generated for document', { documentId });
        }
      } catch (embeddingError: any) {
        logger.error('Error generating embeddings for document', { 
          error: embeddingError?.message || 'Unknown error', 
          documentId 
        });
        // Continue processing despite embedding errors
      }
      
      // Step 7: Update document with AI metadata and embedding status
      await documentRepository.updateAfterProcessing(documentId, tenantId, {
        processingStatus,
        processingError,
        aiProcessed: true,
        aiMetadata: {
          ...aiAnalysis,
          embeddingsGenerated,
          embeddingsTimestamp: embeddingsGenerated ? new Date().toISOString() : null
        }
      });
      
      logger.info('Document processing completed successfully', { 
        documentId,
        tenantId,
        summaryLength: aiAnalysis.summary.length,
        entitiesCount: aiAnalysis.entities.length,
        embeddingsGenerated
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