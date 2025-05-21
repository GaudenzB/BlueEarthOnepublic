/**
 * AI-powered Contract Analyzer
 * 
 * This implementation uses AI (OpenAI) to analyze contract documents
 * and extract key information with confidence scores.
 */

import { IContractAnalyzer } from '../types/IContractAnalyzer';
import { AnalysisResult } from '../types/AnalysisResult';
import { logger } from '../../../../../server/utils/logger';
import { env } from '../../../../../server/env';
import OpenAI from 'openai';
import crypto from 'crypto';
import { db } from '../../../../../shared/db';
import { contractUploadAnalysis } from '../../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { getDocumentContent, extractTextFromPDFBuffer } from '../../../../documents/server/services/documentService';

/**
 * AI-powered contract analyzer using OpenAI
 */
export class AIContractAnalyzer implements IContractAnalyzer {
  private openai: OpenAI | null = null;
  
  constructor() {
    try {
      if (env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: env.OPENAI_API_KEY
        });
      } else {
        logger.warn('OpenAI API key not found, AI contract analysis will not be available');
      }
    } catch (error) {
      logger.error('Error initializing OpenAI client:', error);
      this.openai = null;
    }
  }
  
  /**
   * Check if this analyzer is available
   */
  public isAvailable(): boolean {
    return Boolean(this.openai && env.AI_ENABLED === 'true');
  }
  
  /**
   * Analyze contract document and extract key information
   */
  public async analyzeContract(documentId: string, userId: string, tenantId: string): Promise<AnalysisResult> {
    try {
      logger.info(`Starting AI contract analysis for document ${documentId}`);
      
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
      
      // Process document asynchronously
      this.processDocument(initialRecord.id, documentId, userId, tenantId).catch(error => {
        logger.error(`Error in async processing of document ${documentId}:`, error);
      });
      
      return {
        id: initialRecord.id,
        status: 'PENDING',
        documentId: documentId,
        filename: document.filename || undefined,
        title: document.title || undefined
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
  private async processDocument(analysisId: string, documentId: string, userId: string, tenantId: string): Promise<void> {
    try {
      logger.info(`Processing document ${documentId} with analysis ID ${analysisId}`);
      
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
      
      // Analyze the document content using OpenAI
      try {
        const extractedInfo = await this.analyzeWithOpenAI(analysisId, documentContent.buffer);
        logger.info(`Successfully analyzed document ${documentId}`);
      } catch (aiError) {
        logger.error(`AI analysis failed for document ${documentId}:`, aiError);
        await this.updateAnalysisRecord(analysisId, {
          status: 'FAILED',
          error: aiError instanceof Error ? aiError.message : String(aiError)
        });
      }
    } catch (error) {
      logger.error(`Error processing document ${documentId}:`, error);
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
   * Analyze document with OpenAI
   * @private
   */
  private async analyzeWithOpenAI(analysisId: string, documentBuffer: Buffer): Promise<void> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }
      
      // Extract text from document
      const documentText = await this.extractTextFromBuffer(documentBuffer);
      
      if (!documentText) {
        throw new Error('Failed to extract text from document');
      }
      
      // Limit text length for OpenAI API (model dependent)
      const maxTokens = 3000;
      const truncatedText = documentText.slice(0, maxTokens * 4); // Approximate chars to tokens
      
      // Send to OpenAI for analysis
      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a contract analysis expert. Extract the following information from the contract text:
              1. Vendor/counterparty name
              2. Contract title
              3. Document type (e.g., SERVICE, NDA, EMPLOYMENT, LEASE, PURCHASE_ORDER, etc.)
              4. Effective date (in YYYY-MM-DD format)
              5. Termination date (in YYYY-MM-DD format)
              
              For each extracted field, include a confidence score between 0 and 1.
              Return the extracted information as a JSON object with the following structure:
              {
                "vendor": "string",
                "contractTitle": "string",
                "docType": "string",
                "effectiveDate": "YYYY-MM-DD",
                "terminationDate": "YYYY-MM-DD",
                "confidence": {
                  "vendor": 0.8,
                  "contractTitle": 0.9,
                  "docType": 0.7,
                  "effectiveDate": 0.6,
                  "terminationDate": 0.5
                }
              }
              
              If you can't determine a field with at least moderate confidence, leave it as null and set its confidence score to 0.1.`
          },
          {
            role: 'user',
            content: `Analyze the following contract text and extract the requested information:\n\n${truncatedText}`
          }
        ],
        model: 'gpt-3.5-turbo-0125',
      });
      
      const content = completion.choices[0]?.message?.content;
      
      if (content) {
        try {
          // Parse JSON response
          const parsedData = JSON.parse(content);
          
          // Convert date strings to Date objects for database storage
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
              effectiveDate: effectiveDate ? effectiveDate.toISOString() : null,
              terminationDate: terminationDate ? terminationDate.toISOString() : null,
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