/**
 * Rule-Based Contract Analyzer
 * 
 * This implementation uses pattern matching and rule-based extraction
 * to analyze contract documents without relying on external APIs.
 */

import { IContractAnalyzer } from '../types/IContractAnalyzer';
import { AnalysisResult } from '../types/AnalysisResult';
import { logger } from '../../../../../server/utils/logger';
import crypto from 'crypto';
import { db } from '../../../../../shared/db';
import { contractUploadAnalysis } from '../../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { getDocumentContent, extractTextFromPDFBuffer } from '../../../../documents/server/services/documentService';

export class RuleBasedContractAnalyzer implements IContractAnalyzer {
  /**
   * Check if this analyzer is available
   */
  public isAvailable(): boolean {
    // Rule-based analyzer is always available as a fallback
    return true;
  }
  
  /**
   * Analyze contract document using rule-based extraction
   */
  public async analyzeContract(documentId: string, userId: string, tenantId: string): Promise<AnalysisResult> {
    try {
      logger.info(`Starting rule-based contract analysis for document ${documentId}`);
      
      // Get document information
      const document = await getDocumentContent(documentId, tenantId);
      
      if (!document) {
        logger.error(`Document ${documentId} not found or content retrieval failed`);
        return {
          id: 'error',
          status: 'FAILED',
          documentId: documentId,
          error: `Document ${documentId} not found or content retrieval failed`
        };
      }
      
      // Create an initial analysis record
      const initialRecord = (await db.insert(contractUploadAnalysis)
        .values({
          id: crypto.randomUUID(),
          documentId: documentId,
          status: 'PENDING',
          userId: userId,
          tenantId: tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning())[0];
      
      // Process document with rule-based extraction
      this.processDocumentWithRules(initialRecord.id, documentId, userId, tenantId, document.title).catch(error => {
        logger.error(`Error in rule-based processing of document ${documentId}:`, error);
      });
      
      return {
        id: initialRecord.id,
        status: 'PENDING',
        documentId: documentId,
        filename: document.filename || undefined,
        title: document.title || undefined
      };
    } catch (error) {
      logger.error(`Error initiating rule-based contract analysis for document ${documentId}:`, error);
      
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
   * Process document using rule-based extraction
   * @private
   */
  private async processDocumentWithRules(
    analysisId: string, 
    documentId: string, 
    userId: string, 
    tenantId: string,
    documentTitle?: string
  ): Promise<void> {
    try {
      logger.info(`Processing document ${documentId} with rule-based extraction, analysis ID ${analysisId}`);
      
      // Update the status to PROCESSING
      await db.update(contractUploadAnalysis)
        .set({
          status: 'PROCESSING',
          updatedAt: new Date()
        })
        .where(eq(contractUploadAnalysis.id, analysisId));
      
      // Get document content for analysis
      const documentContent = await getDocumentContent(documentId, tenantId);
      
      if (!documentContent) {
        logger.error(`Failed to get document content for document ${documentId}`);
        await this.updateAnalysisRecord(analysisId, {
          status: 'FAILED',
          error: `Failed to get document content for document ${documentId}`
        });
        return;
      }
      
      try {
        // Extract text from document
        const documentText = await this.extractTextFromBuffer(documentContent.buffer);
        
        if (!documentText) {
          throw new Error('Failed to extract text from document');
        }
        
        // Extract information using rule-based approach
        const extractionResult = this.extractContractInformation(documentText, documentTitle);
        
        // Update the analysis record with the results
        await db.update(contractUploadAnalysis)
          .set({
            status: 'COMPLETED',
            vendor: extractionResult.vendor,
            contractTitle: extractionResult.contractTitle,
            docType: extractionResult.docType,
            effectiveDate: extractionResult.effectiveDate ? extractionResult.effectiveDate : null,
            terminationDate: extractionResult.terminationDate ? extractionResult.terminationDate : null,
            confidence: extractionResult.confidence,
            rawAnalysisJson: JSON.stringify(extractionResult)
          })
          .where(eq(contractUploadAnalysis.id, analysisId));
          
        logger.info(`Successfully analyzed document with rule-based extraction for analysis ${analysisId}`);
      } catch (error) {
        logger.error(`Rule-based extraction failed for document ${documentId}:`, error);
        await this.updateAnalysisRecord(analysisId, {
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (error) {
      logger.error(`Error processing document ${documentId} with rule-based extraction:`, error);
      await this.updateAnalysisRecord(analysisId, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error)
      });
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
  private extractContractInformation(text: string, documentTitle?: string): {
    vendor?: string;
    contractTitle?: string;
    docType?: string;
    effectiveDate?: string;
    terminationDate?: string;
    confidence: Record<string, number>;
  } {
    // Initialize result with default values and low confidence
    const result = {
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
    
    for (const pattern of docTypePatterns) {
      if (pattern.pattern.test(text)) {
        result.docType = pattern.type;
        result.confidence.docType = pattern.confidence;
        break;
      }
    }
    
    // Extract contract title from first lines if not already found
    if (!result.contractTitle) {
      const lines = text.split('\n').slice(0, 10); // Check first 10 lines
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && 
            trimmedLine.length > 5 && 
            trimmedLine.length < 100 && 
            !trimmedLine.includes('©') &&
            !trimmedLine.match(/^page \d+$/i)) {
          result.contractTitle = trimmedLine;
          result.confidence.contractTitle = 0.5;
          break;
        }
      }
    }
    
    // Extract vendor name
    result.vendor = this.extractVendor(text);
    if (result.vendor) {
      result.confidence.vendor = 0.6;
    }
    
    // Extract dates
    const dates = this.extractDates(text);
    if (dates.effectiveDate) {
      result.effectiveDate = dates.effectiveDate;
      result.confidence.effectiveDate = dates.effectiveConfidence;
    }
    if (dates.terminationDate) {
      result.terminationDate = dates.terminationDate;
      result.confidence.terminationDate = dates.terminationConfidence;
    }
    
    return result;
  }
  
  /**
   * Extract vendor name from text using patterns
   * @private
   */
  private extractVendor(text: string): string | undefined {
    // Common vendor patterns
    const vendorPatterns = [
      /between\s+([A-Z][A-Za-z0-9\s,\.]+?)\s+(?:and|&)/i,
      /([A-Z][A-Za-z0-9\s,\.]+?)\s+\((?:["']?the\s*)?["']?(?:Vendor|Company|Provider|Contractor|Seller|Supplier|Consultant)["']?\)/i,
      /([A-Z][A-Za-z0-9\s,\.]+?),?\s+(?:a|an)\s+(?:corporation|company|LLC|Inc\.)/i
    ];
    
    for (const pattern of vendorPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const vendor = match[1].trim();
        // Validate: not too short, not too long, not all uppercase (likely a header)
        if (vendor.length > 2 && vendor.length < 50 && vendor !== vendor.toUpperCase()) {
          return vendor;
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract dates from contract text
   * @private
   */
  private extractDates(text: string): {
    effectiveDate?: string;
    terminationDate?: string;
    effectiveConfidence: number;
    terminationConfidence: number;
  } {
    const result = {
      effectiveConfidence: 0.3,
      terminationConfidence: 0.3
    };
    
    // Look for effective date patterns
    const effectiveDatePatterns = [
      /(?:effective|commencement|start)\s+date.*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
      /(?:this|the)\s+agreement\s+(?:shall|will)\s+(?:be\s+)?(?:effective|commence|begin).*?(?:on|as\s+of)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
      /(?:dated|agreement\s+date).*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
      /(?:this|the)\s+agreement\s+is\s+made\s+(?:on|as\s+of)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
      /(?:this|the)\s+agreement\s+is\s+entered\s+into\s+(?:on|as\s+of)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
      /executed\s+(?:on|as\s+of)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i
    ];
    
    // Look for termination date patterns
    const terminationDatePatterns = [
      /(?:termination|expiration|end)\s+date.*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
      /(?:shall|will)\s+(?:terminate|expire|end).*?(?:on|at)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
      /(?:term|agreement)\s+(?:shall|will)\s+(?:continue|remain\s+in\s+(?:effect|force)).*?(?:until|through)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
      /in\s+effect\s+(?:until|through)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i
    ];
    
    // Also look for term duration patterns
    const termDurationPatterns = [
      /(?:term|duration).*?(?:shall\s+be|is)\s+(?:for\s+)?(\d+)\s+(day|month|year)s?/i,
      /(?:shall|will)\s+(?:terminate|expire|end).*?(\d+)\s+(day|month|year)s?\s+(?:after|from|following)/i,
      /(?:shall|will)\s+continue\s+(?:for|in\s+effect\s+for)\s+(?:a\s+period\s+of\s+)?(\d+)\s+(day|month|year)s?/i
    ];
    
    // Check for effective date patterns
    for (const pattern of effectiveDatePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        try {
          const dateString = this.standardizeDate(match[1]);
          if (dateString) {
            result.effectiveDate = dateString;
            result.effectiveConfidence = 0.7;
            break;
          }
        } catch (e) {
          // Continue to next pattern if date parsing fails
        }
      }
    }
    
    // Check for termination date patterns
    for (const pattern of terminationDatePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        try {
          const dateString = this.standardizeDate(match[1]);
          if (dateString) {
            result.terminationDate = dateString;
            result.terminationConfidence = 0.7;
            break;
          }
        } catch (e) {
          // Continue to next pattern if date parsing fails
        }
      }
    }
    
    // If we have an effective date but no termination date, try to calculate from duration
    if (result.effectiveDate && !result.terminationDate) {
      for (const pattern of termDurationPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[2]) {
          const duration = parseInt(match[1], 10);
          const unit = match[2].toLowerCase();
          
          try {
            const effectiveDate = new Date(result.effectiveDate);
            let terminationDate = new Date(effectiveDate);
            
            // Add the duration to effective date
            if (unit === 'day' || unit === 'days') {
              terminationDate.setDate(effectiveDate.getDate() + duration);
            } else if (unit === 'month' || unit === 'months') {
              terminationDate.setMonth(effectiveDate.getMonth() + duration);
            } else if (unit === 'year' || unit === 'years') {
              terminationDate.setFullYear(effectiveDate.getFullYear() + duration);
            }
            
            result.terminationDate = terminationDate.toISOString().split('T')[0];
            result.terminationConfidence = 0.6; // Slightly lower confidence since it's calculated
            break;
          } catch (e) {
            // Continue if date calculation fails
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * Standardize date string to YYYY-MM-DD format
   * @private
   */
  private standardizeDate(dateStr: string): string {
    // Handle different date formats
    let parts: string[] = [];
    let year: string;
    let month: string;
    let day: string;
    
    // Check format
    if (dateStr.includes('/')) {
      parts = dateStr.split('/');
    } else if (dateStr.includes('-')) {
      parts = dateStr.split('-');
    } else {
      throw new Error('Unsupported date format');
    }
    
    if (parts.length !== 3) {
      throw new Error('Invalid date parts');
    }
    
    // Determine format based on year position
    if (parts[0].length === 4) {
      // YYYY-MM-DD format
      [year, month, day] = parts;
    } else {
      // MM-DD-YYYY or DD-MM-YYYY format (assume MM-DD-YYYY for US documents)
      [month, day, year] = parts;
    }
    
    // Ensure 4-digit year
    if (year.length === 2) {
      // Assume 20xx for years less than 50, 19xx otherwise
      const yearNum = parseInt(year, 10);
      year = yearNum < 50 ? `20${year}` : `19${year}`;
    }
    
    // Pad month and day with leading zeros if necessary
    month = month.padStart(2, '0');
    day = day.padStart(2, '0');
    
    // Validate parts
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    
    if (yearNum < 1900 || yearNum > 2100 || 
        monthNum < 1 || monthNum > 12 || 
        dayNum < 1 || dayNum > 31) {
      throw new Error('Invalid date values');
    }
    
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Update analysis record
   * @private
   */
  private async updateAnalysisRecord(analysisId: string, updates: Partial<AnalysisResult>): Promise<void> {
    try {
      await db.update(contractUploadAnalysis)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(contractUploadAnalysis.id, analysisId));
    } catch (error) {
      logger.error(`Error updating analysis record ${analysisId}:`, error);
    }
  }
}