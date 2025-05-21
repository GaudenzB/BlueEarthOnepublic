/**
 * AI-powered Contract Analyzer Implementation
 * 
 * This implementation uses OpenAI to extract contract details with confidence scoring.
 */

import { IContractAnalyzer, AnalysisResult } from './IContractAnalyzer';
import { logger } from '../../../../server/utils/logger';
import { db } from '../../../../server/db';
import { documents } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { contractUploadAnalysis } from '../../../../shared/schema/contracts/contract_upload_analysis';
import * as documentStorage from '../../../../server/services/documentStorage';
import { extractTextFromPDFBuffer } from '../../../../server/utils/pdfUtils';

export class AIContractAnalyzer implements IContractAnalyzer {
  private openai: OpenAI | null;

  constructor() {
    // Initialize OpenAI client if API key is available
    const apiKey = process.env['OPENAI_API_KEY'];
    if (!apiKey) {
      logger.warn('OPENAI_API_KEY environment variable is not set. AI analysis will not be available.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ 
        apiKey, 
        timeout: 30000, // 30 second timeout
        maxRetries: 2   // Retry failed API calls twice 
      });
    }
  }

  /**
   * Check if AI analysis is available
   */
  public isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Analyze a contract document using AI
   */
  public async analyzeContract(documentId: string, userId: string, tenantId: string): Promise<AnalysisResult> {
    logger.info(`Starting AI analysis of contract document ${documentId}`);

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
      logger.info(`Checking AI analysis status for ID ${analysisId}`);
      
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
        effectiveDate: analysis.effectiveDate ? analysis.effectiveDate.toISOString() : undefined,
        terminationDate: analysis.terminationDate ? analysis.terminationDate.toISOString() : undefined,
        confidence: analysis.confidence as Record<string, number> || {},
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
      
      logger.info(`Processing document ${documentId} for analysis ${analysisId}`);
      
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
      
      // Analyze with OpenAI if available
      if (this.openai) {
        await this.analyzeWithOpenAI(documentText, document.title || '', analysisId);
      } else {
        throw new Error('OpenAI client not available for AI analysis');
      }
    } catch (error) {
      logger.error(`Error in document processing for analysis ${analysisId}:`, error);
      
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
      return textChunks.join('\n');
    } catch (error) {
      logger.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  /**
   * Analyze document with OpenAI
   * @private
   */
  private async analyzeWithOpenAI(text: string, documentTitle: string, analysisId: string): Promise<void> {
    if (!this.openai) {
      throw new Error('OpenAI client not available');
    }
    
    try {
      // Truncate text if it's too long
      const maxTextLength = 15000;
      const truncatedText = text.length > maxTextLength 
        ? text.substring(0, maxTextLength) + "... [content truncated for length]" 
        : text;
        
      // Make the OpenAI API call
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert contract analyst AI. Extract and analyze the following information from the contract:
            1. Vendor/counterparty name
            2. Contract title/subject
            3. Document type (e.g., Service Agreement, NDA, etc.)
            4. Effective date (in YYYY-MM-DD format)
            5. Termination/expiry date (in YYYY-MM-DD format)
            
            For each field, provide a confidence score between 0 and 1.
            Return your analysis as a JSON object with the following structure:
            {
              "vendor": "string",
              "contractTitle": "string",
              "docType": "string",
              "effectiveDate": "YYYY-MM-DD",
              "terminationDate": "YYYY-MM-DD",
              "confidence": {
                "vendor": 0.9,
                "contractTitle": 0.9,
                "docType": 0.8,
                "effectiveDate": 0.7,
                "terminationDate": 0.6
              }
            }`
          },
          {
            role: "user",
            content: `Document title: ${documentTitle}\n\nDocument content: ${truncatedText}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse the OpenAI response
      const content = completion.choices[0]?.message?.content;
      
      if (content) {
        try {
          const parsedData = JSON.parse(content);
          
          // Ensure confidence object exists
          if (!parsedData.confidence || typeof parsedData.confidence !== 'object') {
            parsedData.confidence = {
              vendor: 0.5,
              contractTitle: 0.5,
              docType: 0.5,
              effectiveDate: 0.5,
              terminationDate: 0.5
            };
          }
          
          // Convert dates to proper format if they exist
          let effectiveDate = null;
          let terminationDate = null;
          
          if (parsedData.effectiveDate && parsedData.effectiveDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            effectiveDate = new Date(parsedData.effectiveDate);
          }
          
          if (parsedData.terminationDate && parsedData.terminationDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            terminationDate = new Date(parsedData.terminationDate);
          }
          
          // Update the analysis record with the results
          await db.update(contractUploadAnalysis)
            .set({
              status: 'COMPLETED',
              vendor: parsedData.vendor,
              contractTitle: parsedData.contractTitle,
              docType: parsedData.docType,
              effectiveDate: effectiveDate,
              terminationDate: terminationDate,
              confidence: parsedData.confidence,
              rawAnalysisJson: content
            })
            .where(eq(contractUploadAnalysis.id, analysisId));
            
          logger.info(`Successfully analyzed document with OpenAI for analysis ${analysisId}`);
        } catch (parseError) {
          logger.error(`Failed to parse OpenAI response for analysis ${analysisId}:`, parseError);
          throw new Error('Could not parse OpenAI response');
        }
      } else {
        logger.warn(`OpenAI returned empty content for analysis ${analysisId}`);
        throw new Error('Empty response from OpenAI');
      }
    } catch (error) {
      logger.error(`Error using OpenAI for analysis ${analysisId}:`, error);
      throw error;
    }
  }
}