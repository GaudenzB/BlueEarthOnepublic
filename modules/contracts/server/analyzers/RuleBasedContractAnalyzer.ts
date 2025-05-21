/**
 * Rule-Based Contract Analyzer Implementation
 * 
 * This implementation uses simple pattern matching and rules to extract contract details.
 * It serves as a fallback when AI-powered analysis is not available.
 */

import { IContractAnalyzer, AnalysisResult } from './IContractAnalyzer';
import { logger } from '../../../../server/utils/logger';
import { db } from '../../../../server/db';
import { documents } from '../../../../shared/schema';
import { contractUploadAnalysis } from '../../../../shared/schema/contracts/contract_upload_analysis';
import { eq } from 'drizzle-orm';
import * as documentStorage from '../../../../server/services/documentStorage';
import { extractTextFromPDFBuffer } from '../../../../server/utils/pdfUtils';

export class RuleBasedContractAnalyzer implements IContractAnalyzer {
  /**
   * Analyze a contract document using rule-based methods
   */
  public async analyzeContract(documentId: string, userId: string, tenantId: string): Promise<AnalysisResult> {
    logger.info(`Starting rule-based analysis of contract document ${documentId}`);

    try {
      // First, check if the document exists
      const document = await db.query.documents.findFirst({
        where: eq(documents.id, documentId)
      });

      if (!document) {
        const errorMessage = `Document not found with ID: ${documentId}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Create an initial analysis record with PENDING status
      let initialRecord;
      try {
        const insertResult = await db.insert(contractUploadAnalysis)
          .values({
            documentId,
            userId,
            tenantId,
            status: 'PENDING',
            vendor: null,
            contractTitle: null,
            docType: null,
            effectiveDate: null,
            terminationDate: null,
            confidence: {},
            suggestedContractId: null,
            rawAnalysisJson: null
          })
          .returning();
        
        initialRecord = insertResult[0];
        
        if (!initialRecord || !initialRecord.id) {
          throw new Error('Failed to create analysis record');
        }
      } catch (dbError) {
        logger.error(`Database error creating analysis record for document ${documentId}:`, dbError);
        throw new Error(`Failed to initialize document analysis: ${dbError instanceof Error ? dbError.message : 'Database error'}`);
      }

      // Process asynchronously
      this.processDocumentAsync(documentId, initialRecord.id, tenantId).catch(error => {
        logger.error(`Error in async processing of document ${documentId}:`, error);
      });

      return {
        id: initialRecord.id,
        status: 'PENDING',
        documentId: documentId,
        filename: document.filename,
        title: document.title
      };
    } catch (error) {
      logger.error(`Error initiating contract analysis for document ${documentId}:`, error);
      
      // Return a structured error result
      return {
        id: 'error',
        status: 'FAILED',
        documentId: documentId,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get analysis status by ID
   */
  public async getAnalysisStatus(analysisId: string): Promise<AnalysisResult> {
    try {
      logger.info(`Checking rule-based analysis status for ID ${analysisId}`);
      
      // Query the database for the analysis record
      const results = await db.select()
        .from(contractUploadAnalysis)
        .where(eq(contractUploadAnalysis.id, analysisId));
      
      const analysis = results[0];
      
      if (!analysis) {
        logger.warn(`Analysis record not found with ID: ${analysisId}`);
        throw new Error(`Analysis record not found with ID: ${analysisId}`);
      }
      
      // Format the response
      return {
        id: analysis.id,
        status: analysis.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
        documentId: analysis.documentId,
        vendor: analysis.vendor || undefined,
        contractTitle: analysis.contractTitle || undefined,
        docType: analysis.docType || undefined,
        effectiveDate: analysis.effectiveDate ? new Date(analysis.effectiveDate).toISOString() : undefined,
        terminationDate: analysis.terminationDate ? new Date(analysis.terminationDate).toISOString() : undefined,
        confidence: analysis.confidence ? JSON.parse(analysis.confidence as string) : {},
        error: analysis.error || undefined
      };
    } catch (error) {
      logger.error(`Error getting analysis status for ID ${analysisId}:`, error);
      throw error;
    }
  }

  /**
   * Process document asynchronously
   * @private
   */
  private async processDocumentAsync(documentId: string, analysisId: string, tenantId: string): Promise<void> {
    try {
      // Update status to PROCESSING
      await db.update(contractUploadAnalysis)
        .set({ status: 'PROCESSING' })
        .where(eq(contractUploadAnalysis.id, analysisId));
      
      logger.info(`Processing document ${documentId} for analysis ${analysisId} with rule-based extraction`);
      
      // Get the document
      const document = await db.query.documents.findFirst({
        where: eq(documents.id, documentId)
      });
      
      if (!document) {
        throw new Error(`Document not found with ID: ${documentId}`);
      }
      
      // Download and extract text from document
      let documentText = '';
      if (document.storageKey) {
        const fileBuffer = await documentStorage.downloadFile(document.storageKey);
        
        if (document.mimeType.includes('pdf')) {
          documentText = await this.extractTextFromBuffer(fileBuffer);
        } else if (document.mimeType.includes('text')) {
          documentText = fileBuffer.toString('utf8');
        } else {
          documentText = `Document title: ${document.title || 'Untitled'}\nFilename: ${document.originalFilename || document.filename}`;
        }
      } else {
        documentText = `Document title: ${document.title || 'Untitled'}\nFilename: ${document.originalFilename || document.filename}`;
      }
      
      // Extract contract details using rule-based approach
      const extractionResult = this.extractContractDetails(documentText, document.title || '');
      
      // Update the analysis record with the results
      await db.update(contractUploadAnalysis)
        .set({
          status: 'COMPLETED',
          vendor: extractionResult.vendor,
          contractTitle: extractionResult.contractTitle,
          docType: extractionResult.docType,
          effectiveDate: extractionResult.effectiveDate ? new Date(extractionResult.effectiveDate) : null,
          terminationDate: extractionResult.terminationDate ? new Date(extractionResult.terminationDate) : null,
          confidence: extractionResult.confidence,
          rawAnalysisJson: JSON.stringify(extractionResult)
        })
        .where(eq(contractUploadAnalysis.id, analysisId));
        
      logger.info(`Successfully analyzed document with rule-based extraction for analysis ${analysisId}`);
    } catch (error) {
      logger.error(`Error in rule-based document processing for analysis ${analysisId}:`, error);
      
      // Update analysis status to FAILED
      await db.update(contractUploadAnalysis)
        .set({ 
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error)
        })
        .where(eq(contractUploadAnalysis.id, analysisId));
    }
  }

  /**
   * Extract text from a document buffer
   * @private
   */
  private async extractTextFromBuffer(buffer: Buffer): Promise<string> {
    try {
      const textChunks = await extractTextFromPDFBuffer(buffer);
      
      // Ensure textChunks is an array before calling join
      if (Array.isArray(textChunks)) {
        return textChunks.join('\n');
      } else if (typeof textChunks === 'string') {
        return textChunks; // Already a string, return as is
      } else {
        // Handle unexpected format
        return String(textChunks || '');
      }
    } catch (error) {
      logger.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  /**
   * Extract contract details using rule-based approach
   * @private
   */
  private extractContractDetails(text: string, documentTitle: string): {
    vendor?: string;
    contractTitle?: string;
    docType?: string;
    effectiveDate?: string;
    terminationDate?: string;
    confidence: Record<string, number>;
  } {
    // Initialize result with empty values
    const result = {
      vendor: undefined,
      contractTitle: undefined,
      docType: undefined,
      effectiveDate: undefined,
      terminationDate: undefined,
      confidence: {
        vendor: 0.3,
        contractTitle: 0.3,
        docType: 0.3,
        effectiveDate: 0.3,
        terminationDate: 0.3
      }
    };
    
    // Try to extract contract title from document title
    if (documentTitle) {
      result.contractTitle = documentTitle;
      result.confidence.contractTitle = 0.6;
    }
    
    // Extract document type using pattern matching
    const docTypePatterns = [
      { pattern: /service\s+agreement/i, type: 'SERVICE_AGREEMENT', confidence: 0.7 },
      { pattern: /non.disclosure\s+agreement|confidentiality\s+agreement|NDA/i, type: 'NDA', confidence: 0.7 },
      { pattern: /employment\s+agreement|employment\s+contract/i, type: 'EMPLOYMENT', confidence: 0.7 },
      { pattern: /lease\s+agreement/i, type: 'LEASE', confidence: 0.7 },
      { pattern: /purchase\s+order|PO\s+\d+/i, type: 'PURCHASE_ORDER', confidence: 0.7 },
      { pattern: /statement\s+of\s+work|SOW/i, type: 'STATEMENT_OF_WORK', confidence: 0.7 },
      { pattern: /license\s+agreement/i, type: 'LICENSE', confidence: 0.7 },
      { pattern: /subscription\s+agreement/i, type: 'SUBSCRIPTION_AGREEMENT', confidence: 0.7 },
      { pattern: /master\s+services\s+agreement|MSA/i, type: 'MSA', confidence: 0.7 },
    ];
    
    // Check document text against patterns
    for (const { pattern, type, confidence } of docTypePatterns) {
      if (pattern.test(text) || pattern.test(documentTitle)) {
        result.docType = type;
        result.confidence.docType = confidence;
        break;
      }
    }
    
    // Extract vendor/counterparty using pattern matching
    // Look for common patterns like "between [Company Name] and" or "Client: [Company Name]"
    const vendorPatterns = [
      /between\s+([A-Z][A-Za-z0-9\s,\.]+(?:Inc\.|LLC|Ltd\.|Corp\.|Corporation|Company))/i,
      /(?:client|customer|vendor|supplier|provider):\s+([A-Z][A-Za-z0-9\s,\.]+(?:Inc\.|LLC|Ltd\.|Corp\.|Corporation|Company)?)/i,
      /(?:this|the)\s+agreement\s+(?:is\s+)?(?:made\s+and\s+entered\s+into\s+)?(?:by\s+and\s+)?between\s+([A-Z][A-Za-z0-9\s,\.]+)(?:,|and)/i,
    ];
    
    for (const pattern of vendorPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.vendor = match[1].trim();
        result.confidence.vendor = 0.6;
        break;
      }
    }
    
    // Extract dates using pattern matching
    // Look for effective dates and termination dates
    const effectiveDatePatterns = [
      /effective\s+date[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
      /(?:this|the)\s+agreement\s+(?:is\s+)?effective\s+(?:as\s+of\s+)?(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
      /commencement\s+date[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
    ];
    
    const terminationDatePatterns = [
      /termination\s+date[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
      /expir(?:y|ation)\s+date[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
      /(?:this|the)\s+agreement\s+(?:shall|will)\s+(?:terminate|expire)\s+(?:on|as\s+of\s+)?(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
    ];
    
    // Helper to standardize date format to YYYY-MM-DD
    const formatDate = (dateStr: string): string | undefined => {
      try {
        const parts = dateStr.split(/[\/\-]/);
        if (parts.length !== 3) return undefined;
        
        let year, month, day;
        // Check if first part is year (YYYY-MM-DD)
        if (parts[0].length === 4) {
          year = parts[0];
          month = parts[1].padStart(2, '0');
          day = parts[2].padStart(2, '0');
        } else {
          // Assume MM/DD/YYYY or DD/MM/YYYY
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
          year = parts[2];
          // Add century if needed
          if (year.length === 2) {
            const currentYear = new Date().getFullYear();
            const century = Math.floor(currentYear / 100) * 100;
            year = century + parseInt(year) < currentYear + 50 ? `${century + parseInt(year)}` : `${century - 100 + parseInt(year)}`;
          }
        }
        
        // Basic validation
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
          return undefined;
        }
        
        return `${year}-${month}-${day}`;
      } catch (error) {
        return undefined;
      }
    };
    
    // Extract effective date
    for (const pattern of effectiveDatePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const formattedDate = formatDate(match[1]);
        if (formattedDate) {
          result.effectiveDate = formattedDate;
          result.confidence.effectiveDate = 0.6;
          break;
        }
      }
    }
    
    // Extract termination date
    for (const pattern of terminationDatePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const formattedDate = formatDate(match[1]);
        if (formattedDate) {
          result.terminationDate = formattedDate;
          result.confidence.terminationDate = 0.6;
          break;
        }
      }
    }
    
    return result;
  }
}