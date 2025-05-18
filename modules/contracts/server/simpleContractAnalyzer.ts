/**
 * Contract Analyzer 
 * 
 * This module provides contract analysis functionality using both OpenAI for AI-powered extraction
 * and fallback mechanisms for basic metadata extraction from contract documents.
 * 
 * It handles document processing, text extraction from PDFs, and metadata analysis.
 */

import { logger } from '../../../server/utils/logger';
import { db } from '../../../server/db';
import { documents } from '../../../shared/schema';
import { contractUploadAnalysis } from '../../../shared/schema/contracts/contract_upload_analysis';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import * as documentStorage from '../../../server/services/documentStorage';
import { extractTextFromPDFBuffer } from '../../../server/utils/pdfUtils';

// Create OpenAI client instance
const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) {
  logger.warn('OPENAI_API_KEY environment variable is not set. Using fallback contract analysis.');
}

// Initialize OpenAI client with proper configuration
const openai = apiKey ? new OpenAI({ 
  apiKey, 
  timeout: 45000, // 45 second timeout for longer documents
  maxRetries: 2   // Retry failed API calls twice 
}) : null;

/**
 * Get contract analysis by ID
 */
export async function getAnalysisById(analysisId: string) {
  try {
    const analysis = await db.select()
      .from(contractUploadAnalysis)
      .where(eq(contractUploadAnalysis.id, analysisId))
      .then(results => results[0]);
    
    if (!analysis) {
      throw new Error(`Analysis record not found with ID: ${analysisId}`);
    }
    
    return analysis;
  } catch (error) {
    logger.error(`Error retrieving analysis record ${analysisId}:`, error);
    throw new Error(`Failed to retrieve analysis: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Analyze a contract document and store the results in the database
 * This function handles both document text extraction and AI-powered analysis
 */
export async function analyzeContractDocumentSimple(documentId: string, userId?: string) {
  logger.info(`Starting contract analysis for document ${documentId}`);
  
  try {
    // Check if document exists
    const document = await db.select().from(documents)
      .where(eq(documents.id, documentId))
      .then(results => results[0]);
    
    if (!document) {
      throw new Error(`Document not found with ID: ${documentId}`);
    }
    
    logger.info(`Found document: ${document.title}`, { documentId });
    
    // Get tenant ID from the document
    const tenantId = document.tenantId;
    
    // Create initial analysis record in the database using typed values
    // First create basic record structure
    const analysisRecord: any = {
      documentId,
      tenantId,
      status: 'PENDING'
    };
    
    // Add optional userId if provided
    if (userId) {
      analysisRecord.userId = userId;
    }
    
    // Execute the insert
    const insertResult = await db.insert(contractUploadAnalysis)
      .values(analysisRecord)
      .returning();
    
    if (!insertResult || insertResult.length === 0) {
      throw new Error('Failed to create analysis record');
    }
    
    const initialRecord = insertResult[0];
    
    logger.info(`Created analysis record ${initialRecord.id}`, { 
      documentId, 
      analysisId: initialRecord.id
    });
    
    // Update the status to PROCESSING
    await db.update(contractUploadAnalysis)
      .set({ status: 'PROCESSING' })
      .where(eq(contractUploadAnalysis.id, initialRecord.id));
    
    try {
      // Get document content
      let documentText = '';
      try {
        // Download the file content
        logger.info(`Downloading document ${documentId} with storage key ${document.storageKey}`);
        const fileBuffer = await documentStorage.downloadFile(document);
        
        // Extract text based on the document type
        if (document.mimeType.includes('pdf')) {
          // For PDFs use proper text extraction
          logger.info(`Extracting text from PDF document ${documentId}`);
          const textChunks = await extractTextFromBuffer(fileBuffer);
          documentText = textChunks.join('\n');
        } else if (document.mimeType.includes('text')) {
          // For text files, just convert buffer to string
          documentText = fileBuffer.toString('utf8');
        } else {
          // For other types, use document metadata
          documentText = `Document title: ${document.title || 'Untitled'}\nFilename: ${document.originalFilename || document.filename}`;
        }
        
        // If text extraction failed or produced minimal text, use document metadata
        if (!documentText || documentText.length < 50) {
          documentText = `Contract document: ${document.title || 'Untitled'}\nFilename: ${document.originalFilename || document.filename}`;
        }
        
      } catch (error) {
        logger.error(`Error extracting text from document ${documentId}:`, error);
        // Fall back to using document metadata
        documentText = `Contract document: ${document.title || 'Untitled'}\nFilename: ${document.originalFilename || document.filename}`;
      }
      
      // Analyze the document text
      const analysisResult = await performSimpleAnalysis(documentText, document.title || 'Untitled Document');
      
      // Update the analysis record with the results
      await db.update(contractUploadAnalysis)
        .set({
          status: 'SUCCESS',
          vendor: analysisResult.vendor || null,
          contractTitle: analysisResult.contractTitle || null,
          docType: analysisResult.docType || null,
          effectiveDate: analysisResult.effectiveDate || null,
          terminationDate: analysisResult.terminationDate || null,
          confidence: analysisResult.confidence || null,
          rawAnalysisJson: JSON.stringify(analysisResult),
          updatedAt: new Date()
        })
        .where(eq(contractUploadAnalysis.id, initialRecord.id));
      
      logger.info(`Analysis completed successfully for document ${documentId}`, {
        analysisId: initialRecord.id,
        docType: analysisResult.docType,
        vendor: analysisResult.vendor
      });
      
      // Return the analysis result
      return {
        success: true,
        documentId,
        documentTitle: document.title,
        analysisId: initialRecord.id,
        analysis: analysisResult
      };
      
    } catch (analysisError) {
      // Update the record with the error
      await db.update(contractUploadAnalysis)
        .set({
          status: 'FAILED',
          error: analysisError instanceof Error ? analysisError.message : String(analysisError),
          updatedAt: new Date()
        })
        .where(eq(contractUploadAnalysis.id, initialRecord.id));
      
      logger.error(`Analysis failed for document ${documentId}:`, analysisError);
      
      throw analysisError;
    }
    
  } catch (error) {
    logger.error(`Error analyzing contract document ${documentId}:`, error);
    return {
      success: false,
      documentId,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Extract text from document buffer
 */
async function extractTextFromBuffer(buffer: Buffer): Promise<string[]> {
  try {
    // Use the proper PDF extraction utility we've already imported
    const extractedText = await extractTextFromPDFBuffer(buffer);
    
    // If we got text, split it into manageable chunks
    if (extractedText && extractedText.length > 0) {
      logger.info(`Successfully extracted ${extractedText.length} characters from PDF buffer`);
      
      // Split into chunks of reasonable size
      const chunks: string[] = [];
      const maxChunkSize = 10000;
      
      for (let i = 0; i < extractedText.length; i += maxChunkSize) {
        chunks.push(extractedText.substring(i, i + maxChunkSize));
      }
      
      return chunks.length > 0 ? chunks : ['No text extracted'];
    } else {
      logger.warn('PDF extraction returned empty text');
      return ['No text extracted'];
    }
  } catch (error) {
    logger.error('Error extracting text from buffer:', error);
    return ['Error extracting text'];
  }
}

/**
 * Perform simple analysis on document text
 */
async function performSimpleAnalysis(text: string, documentTitle: string) {
  // Try to use OpenAI if available
  if (openai) {
    try {
      logger.info('Using OpenAI to analyze contract document');
      
      // Truncate text if it's too long to avoid token limits
      const maxTextLength = 15000;
      const truncatedText = text.length > maxTextLength 
        ? text.substring(0, maxTextLength) + "... [content truncated for length]" 
        : text;
        
      // Improved prompt with more detailed extraction guidelines
      const systemPrompt = `You are an expert contract analyst AI. Extract and analyze the following information from the contract:
      1. Vendor/counterparty name - Extract the name of the company that is the counterparty in this contract
      2. Contract title/subject - Determine the main subject or title of this contract
      3. Document type - Classify as one of: MAIN_AGREEMENT, AMENDMENT, ADDENDUM, SIDE_LETTER, NDA, SERVICE_AGREEMENT, OTHER
      4. Effective date - Find the date when this contract becomes effective (in YYYY-MM-DD format)
      5. Termination date - Find the date when this contract ends or terminates (in YYYY-MM-DD format)
      
      Important guidelines:
      - If you cannot confidently determine a specific field, use null instead of guessing
      - For dates, only return in YYYY-MM-DD format, or null if unclear
      - Pay attention to phrases like "effective as of", "shall commence on", "agreement date" for effective date
      - For termination date, look for terms like "expiration", "termination", "shall end on"
      - Analyze the whole document, not just the header or first page
      
      Return a JSON object with the following structure:
      {
        "vendor": string or null,
        "contractTitle": string or null,
        "docType": string or null,
        "effectiveDate": string or null,
        "terminationDate": string or null,
        "confidence": {
          "vendor": number from 0.0 to 1.0,
          "contractTitle": number from 0.0 to 1.0,
          "docType": number from 0.0 to 1.0,
          "effectiveDate": number from 0.0 to 1.0,
          "terminationDate": number from 0.0 to 1.0
        }
      }
      `;
        
      // Call OpenAI API for analysis
      const completion = await openai.chat.completions.create({
        // Use GPT-4 for better extraction if available, fallback to 3.5
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user", 
            content: `Document title: ${documentTitle}\n\nDocument content: ${truncatedText}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.2  // Lower temperature for more deterministic extraction
      });
      
      const content = completion.choices[0]?.message?.content;
      if (content) {
        try {
          // Parse and validate the response
          const parsedData = JSON.parse(content);
          
          // Log successful analysis
          logger.info('Contract analysis successful', {
            vendor: parsedData.vendor,
            contractTitle: parsedData.contractTitle,
            docType: parsedData.docType,
            confidenceScores: parsedData.confidence
          });
          
          return parsedData;
        } catch (parseError) {
          logger.error('Error parsing OpenAI response:', parseError);
          return useFallbackAnalysis(text, documentTitle);
        }
      } else {
        logger.warn('Empty content from OpenAI');
        return useFallbackAnalysis(text, documentTitle);
      }
    } catch (openaiError) {
      logger.error('Error using OpenAI for contract analysis:', openaiError);
      return useFallbackAnalysis(text, documentTitle);
    }
  } else {
    // No OpenAI available, use fallback
    logger.info('OpenAI not available, using fallback analysis');
    return useFallbackAnalysis(text, documentTitle);
  }
}

/**
 * Simple fallback analysis that uses regex and basic text patterns
 */
function useFallbackAnalysis(text: string, documentTitle: string) {
  logger.info('Using fallback contract analysis');
  
  // Extract vendor name
  let vendor = extractVendorName(text, documentTitle);
  
  // Extract dates
  const dates = extractDates(text);
  let effectiveDate = dates.length > 0 ? dates[0] : null;
  let terminationDate = dates.length > 1 ? dates[dates.length - 1] : null;
  
  // Determine document type
  const docType = determineDocumentType(text, documentTitle);
  
  // Use document title for contract title
  const contractTitle = documentTitle || "Untitled Contract";
  
  return {
    vendor,
    contractTitle,
    docType,
    effectiveDate,
    terminationDate,
    confidence: {
      vendor: 0.5,
      contractTitle: 0.7,
      docType: 0.6,
      effectiveDate: effectiveDate ? 0.6 : 0.1,
      terminationDate: terminationDate ? 0.4 : 0.1
    }
  };
}

/**
 * Extract vendor name from text
 */
function extractVendorName(text: string, documentTitle: string): string {
  // Try to extract from document title first
  const vendorPatterns = [
    /(?:with|from|for|by)\s+([A-Za-z0-9\s&]+(?:Inc|LLC|Ltd|Corp|Corporation|Company))/i,
    /-\s*([A-Za-z0-9\s&]+(?:Inc|LLC|Ltd|Corp|Corporation|Company))/i,
    /([A-Za-z0-9\s&]+(?:Inc|LLC|Ltd|Corp|Corporation|Company))/i
  ];
  
  for (const pattern of vendorPatterns) {
    const match = documentTitle.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Try to find "parties" section
  const partiesSection = extractSection(text, /(?:PARTIES|BETWEEN|PARTY A|PARTY B):/i, 500);
  if (partiesSection) {
    for (const pattern of vendorPatterns) {
      const match = partiesSection.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  
  return "Unknown Vendor";
}

/**
 * Extract dates from text
 */
function extractDates(text: string): string[] {
  const datePatterns = [
    /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g, // MM/DD/YYYY
    /\b(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/g, // YYYY/MM/DD
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+(19|20)\d{2}\b/gi // Month DD, YYYY
  ];
  
  // Find dates
  const foundDates: string[] = [];
  for (const pattern of datePatterns) {
    let match;
    const regex = new RegExp(pattern);
    while ((match = regex.exec(text)) !== null) {
      foundDates.push(match[0]);
    }
  }
  
  // Try to parse dates into standard format
  const parsedDates: string[] = [];
  
  for (const dateStr of foundDates) {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString().split('T')[0];
        if (isoDate) {
          parsedDates.push(isoDate);
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  return parsedDates;
}

/**
 * Determine document type based on content
 */
function determineDocumentType(text: string, documentTitle: string): string {
  const content = (text + ' ' + documentTitle).toLowerCase();
  
  if (content.includes("amendment")) {
    return "AMENDMENT";
  } else if (content.includes("addendum")) {
    return "ADDENDUM";
  } else if (content.includes("exhibit")) {
    return "EXHIBIT";
  } else if (content.includes("side letter")) {
    return "SIDE_LETTER";
  } else if (content.includes("service agreement") || content.includes("services agreement")) {
    return "SERVICE_AGREEMENT";
  } else if (content.includes("nda") || content.includes("non-disclosure") || content.includes("confidentiality")) {
    return "NDA";
  } else {
    return "MAIN_AGREEMENT";
  }
}

/**
 * Extract a section of text around a pattern
 */
function extractSection(text: string, pattern: RegExp, radius: number): string | null {
  const match = text.match(pattern);
  if (!match || !match.index) {
    return null;
  }
  
  const start = Math.max(0, match.index - radius);
  const end = Math.min(text.length, match.index + match[0].length + radius);
  
  return text.substring(start, end);
}