import { logger } from '../utils/logger';
import { analyzeDocumentText, extractTextFromDocument } from '../utils/openai';
import { generateEmbeddingsForText } from '../utils/embeddingGenerator';
import { documentRepository } from '../repositories/documentRepository';
import { documentEmbeddingsRepository } from '../repositories/documentEmbeddingsRepository';
import { downloadFile } from '../services/documentStorage';

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
      let fileContent: Buffer;
      try {
        fileContent = await downloadFile(document.storageKey);    // ✅ handles local *or* S3
        logger.info('Document file loaded successfully', {
          documentId,
          fileSize: fileContent.length,
          storageKey: document.storageKey
        });
      } catch (error: any) {
        logger.error('Error reading document file', { error, documentId });
        await documentRepository.updateProcessingStatusWithError(
          documentId,
          tenantId,
          'ERROR',
          `File load failed: ${error.message}`
        );
        return false;
      }
      
      // Step 4: Extract text from document
      logger.info('Starting text extraction from document', { 
        documentId, 
        mimeType: document.mimeType,
        fileName: document.originalFilename,
        fileSize: fileContent.length,
        storageKey: document.storageKey
      });
      
      let textContent;
      try {
        textContent = await extractTextFromDocument(
          fileContent, 
          document.mimeType, 
          document.originalFilename,
          { throwErrors: true } // Enable error throwing for debugging
        );
        
        if (!textContent) {
          logger.error('Failed to extract text from document - empty result', { documentId });
          await documentRepository.updateProcessingStatusWithError(documentId, tenantId, 'ERROR', 'Text extraction returned empty result');
          return false;
        }
        
        logger.info('Text extraction successful', { 
          documentId, 
          textLength: textContent.length,
          textPreview: textContent.substring(0, 100) + '...'
        });
      } catch (extractionError: any) {
        logger.error('Exception during text extraction', { 
          documentId,
          error: extractionError?.message || 'Unknown error',
          stack: extractionError?.stack,
          mimeType: document.mimeType,
          fileName: document.originalFilename
        });
        await documentRepository.updateProcessingStatusWithError(documentId, tenantId, 'ERROR', 
          `Text extraction failed: ${extractionError?.message || 'Unknown error'}`);
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
          // Store embeddings in database - explicitly set model for each embedding
          const embeddingsWithModel = embeddings.map(e => ({
            textChunk: e.textChunk,
            embedding: e.embedding as number[], // Guaranteed to be non-null by generateEmbeddingsForText
            chunkIndex: e.chunkIndex,
            model: 'text-embedding-ada-002'
          }));
          
          const storedCount = await documentEmbeddingsRepository.storeEmbeddingsBatch(
            documentId,
            embeddingsWithModel
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