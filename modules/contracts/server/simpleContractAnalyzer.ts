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
import { contractUploadAnalysis, ContractUploadAnalysisInsert } from '../../../shared/schema/contracts/contract_upload_analysis';
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
    logger.info(`Looking up analysis with ID ${analysisId}`);
    
    // Query the database for the analysis record
    const results = await db.select()
      .from(contractUploadAnalysis)
      .where(eq(contractUploadAnalysis.id, analysisId));
    
    const analysis = results[0];
    
    if (!analysis) {
      logger.warn(`Analysis record not found with ID: ${analysisId}`);
      throw new Error(`Analysis record not found with ID: ${analysisId}`);
    }
    
    logger.info(`Found analysis for document ${analysis.documentId}, status: ${analysis.status}`);
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
    
    // Prepare the insert data with proper types
    // Ensure we have a valid tenantId (database requires this field)
    if (!tenantId) {
      throw new Error(`Cannot analyze document ${documentId}: missing tenant ID`);
    }
    
    // Prepare the insert data with properly typed values
    const insertData: ContractUploadAnalysisInsert = {
      documentId,
      tenantId,  // We've validated it's not null
      status: 'PENDING',
      ...(userId ? { userId } : {})
    };
    
    // Execute the insert with proper error handling
    logger.debug(`Creating analysis record for document ${documentId}`, insertData);
    
    const insertResult = await db.insert(contractUploadAnalysis)
      .values([insertData]) // Note the array wrapper to match the expected type
      .returning({ 
        id: contractUploadAnalysis.id,
        documentId: contractUploadAnalysis.documentId,
        status: contractUploadAnalysis.status
      });
    
    if (!insertResult || insertResult.length === 0) {
      throw new Error('Failed to create analysis record');
    }
    
    // Get the record ID
    const analysisId = insertResult[0]?.id;
    if (!analysisId) {
      throw new Error('Failed to get analysis record ID');
    }
    
    logger.info(`Created analysis record ${analysisId}`, { 
      documentId,
      analysisId
    });
    
    // Update the status to PROCESSING
    logger.debug(`Updating analysis record ${analysisId} status to PROCESSING`);
    await db.update(contractUploadAnalysis)
      .set({ status: 'PROCESSING' })
      .where(eq(contractUploadAnalysis.id, analysisId));
    
    try {
      // Get document content
      let documentText = '';
      try {
        // Download the file content using the correct storage key
        if (!document.storageKey) {
          throw new Error(`Document ${documentId} has no storage key`);
        }
        
        logger.info(`Downloading document ${documentId} with storage key ${document.storageKey}`);
        const fileBuffer = await documentStorage.downloadFile(document.storageKey);
        
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
        .where(eq(contractUploadAnalysis.id, analysisId));
      
      logger.info(`Analysis completed successfully for document ${documentId}`, {
        analysisId,
        docType: analysisResult.docType,
        vendor: analysisResult.vendor
      });
      
      // Return the analysis result
      return {
        success: true,
        documentId,
        documentTitle: document.title,
        analysisId,
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
        .where(eq(contractUploadAnalysis.id, analysisId));
      
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
        
      // Call OpenAI API for analysis with proper error handling and timeouts
      logger.info('Calling OpenAI API for contract analysis');
      const completion = await openai.chat.completions.create({
        // Use GPT-4 for better extraction if available, fallback to 3.5-turbo if not accessible
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
      }).catch(error => {
        // Specific handling for OpenAI errors
        logger.error(`OpenAI API error: ${error.message}`, { 
          status: error.status, 
          type: error.type,
          code: error.code
        });
        
        // If it's a model-related error, try fallback to 3.5-turbo
        if (error.code === 'model_not_found' || error.message.includes('gpt-4')) {
          logger.info('Falling back to GPT-3.5-turbo model');
          return openai.chat.completions.create({
            model: "gpt-3.5-turbo",
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
            temperature: 0.3
          });
        }
        
        // Re-throw if it's not a model-related error
        throw error;
      });
      
      const content = completion.choices[0]?.message?.content;
      if (content) {
        try {
          // Parse and validate the response
          const parsedData = JSON.parse(content);
          
          // Add basic validation to ensure all required fields exist
          if (!parsedData.vendor && !parsedData.contractTitle && !parsedData.docType) {
            logger.warn('OpenAI response missing critical fields, using fallback analysis');
            return useFallbackAnalysis(text, documentTitle);
          }
          
          // If confidence scores are missing, add defaults
          if (!parsedData.confidence) {
            parsedData.confidence = {
              vendor: parsedData.vendor ? 0.8 : 0.1,
              contractTitle: parsedData.contractTitle ? 0.8 : 0.1,
              docType: parsedData.docType ? 0.8 : 0.1,
              effectiveDate: parsedData.effectiveDate ? 0.8 : 0.1,
              terminationDate: parsedData.terminationDate ? 0.8 : 0.1
            };
          }
          
          // Log successful analysis with detailed information
          logger.info('Contract analysis successful', {
            documentTitle,
            extractedVendor: parsedData.vendor,
            extractedTitle: parsedData.contractTitle,
            extractedType: parsedData.docType,
            confidenceScores: parsedData.confidence
          });
          
          return parsedData;
        } catch (parseError) {
          logger.error('Error parsing OpenAI response:', parseError);
          logger.debug('Raw OpenAI response content:', content);
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
 * Used when OpenAI is not available or fails
 */
function useFallbackAnalysis(text: string, documentTitle: string) {
  logger.info('Using fallback contract analysis with regex patterns');
  
  // Extract vendor name using various patterns
  let vendor = extractVendorName(text, documentTitle);
  
  // Extract dates with better prioritization for effective/termination dates
  const allDates = extractDates(text);
  
  // Try to find specific date references
  let effectiveDate = null;
  let terminationDate = null;
  
  // Look for effective date patterns first
  const effectiveDateSections = [
    extractSection(text, /effective\s+date/i, 100),
    extractSection(text, /commencement\s+date/i, 100),
    extractSection(text, /start\s+date/i, 100),
    extractSection(text, /begins\s+on/i, 100)
  ].filter(Boolean);
  
  // Look for termination date patterns
  const terminationDateSections = [
    extractSection(text, /termination\s+date/i, 100),
    extractSection(text, /expiration\s+date/i, 100),
    extractSection(text, /end\s+date/i, 100),
    extractSection(text, /expires\s+on/i, 100)
  ].filter(Boolean);
  
  // Try to extract dates from these specific sections first
  for (const section of effectiveDateSections) {
    if (section) {
      const sectionDates = extractDates(section);
      if (sectionDates.length > 0) {
        effectiveDate = sectionDates[0];
        break;
      }
    }
  }
  
  for (const section of terminationDateSections) {
    if (section) {
      const sectionDates = extractDates(section);
      if (sectionDates.length > 0) {
        terminationDate = sectionDates[0];
        break;
      }
    }
  }
  
  // If we couldn't find specific date references, fall back to using the first/last dates
  if (!effectiveDate && allDates.length > 0) {
    effectiveDate = allDates[0];
  }
  
  if (!terminationDate && allDates.length > 1) {
    terminationDate = allDates[allDates.length - 1];
  }
  
  // Determine document type with better pattern matching
  const docType = determineDocumentType(text, documentTitle);
  
  // Use document title for contract title, clean up common prefixes
  let contractTitle = documentTitle || "Untitled Contract";
  contractTitle = contractTitle
    .replace(/^(agreement|contract|nda|msa|sow)\s*[-:]\s*/i, '')
    .replace(/\.pdf$/i, '')
    .trim();
  
  logger.info(`Fallback analysis complete for "${contractTitle}"`, {
    vendor,
    docType,
    effectiveDate,
    terminationDate
  });
  
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