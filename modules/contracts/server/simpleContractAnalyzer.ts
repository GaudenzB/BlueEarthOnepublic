/**
 * Simple Contract Analyzer 
 * 
 * This is a simplified version of the contract analyzer that directly processes
 * documents without complex database interactions to avoid errors.
 */

import { logger } from '../../../server/utils/logger';
import { db } from '../../../server/db';
import { documents } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import * as documentStorage from '../../../server/services/documentStorage';

// Create OpenAI client instance
const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) {
  logger.warn('OPENAI_API_KEY environment variable is not set. Using fallback contract analysis.');
}

// Initialize OpenAI client with proper configuration
const openai = apiKey ? new OpenAI({ 
  apiKey, 
  timeout: 30000, // 30 second timeout
  maxRetries: 2   // Retry failed API calls twice 
}) : null;

/**
 * Simple function to analyze a contract document
 * This bypasses the complex database setup and directly returns analysis results
 */
export async function analyzeContractDocumentSimple(documentId: string) {
  logger.info(`Starting simple contract analysis for document ${documentId}`);
  
  try {
    // Check if document exists
    const document = await db.select().from(documents)
      .where(eq(documents.id, documentId))
      .then(results => results[0]);
    
    if (!document) {
      throw new Error(`Document not found with ID: ${documentId}`);
    }
    
    logger.info(`Found document: ${document.title}`, { documentId });
    
    // Get document content
    let documentText = '';
    try {
      // Download the file content
      const fileBuffer = await documentStorage.downloadFile(document.storageKey);
      
      // Extract text based on the document type
      if (document.mimeType.includes('pdf')) {
        // For PDFs use a simple text extraction from the first few pages
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
    
    return {
      success: true,
      documentId,
      documentTitle: document.title,
      analysis: analysisResult
    };
    
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
    // Here you would typically use a library like pdf-parse
    // For simplicity, we'll just return the buffer as string with some basic formatting
    const text = buffer.toString('utf8').replace(/\r\n/g, '\n');
    
    // Split into chunks of reasonable size
    const chunks: string[] = [];
    const maxChunkSize = 10000;
    
    for (let i = 0; i < text.length; i += maxChunkSize) {
      chunks.push(text.substring(i, i + maxChunkSize));
    }
    
    return chunks.length > 0 ? chunks : ['No text extracted'];
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
        
      // Call OpenAI API for analysis
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert contract analyst AI. Extract and analyze the following information from the contract:
            1. Vendor/counterparty name
            2. Contract title/subject
            3. Document type (e.g., MAIN_AGREEMENT, AMENDMENT, ADDENDUM, SIDE_LETTER, etc.)
            4. Effective date (in YYYY-MM-DD format)
            5. Termination date (in YYYY-MM-DD format)
            
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
            `
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
      
      const content = completion.choices[0]?.message?.content;
      if (content) {
        try {
          const parsedData = JSON.parse(content);
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