import { logger } from '../../../../server/utils/logger';
import { db } from '../../../../server/db';
import { documents } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { contracts } from '../../../../shared/schema/contracts/contracts';
import { contractUploadAnalysis } from '../../../../shared/schema/contracts/contract_upload_analysis';
import * as documentStorage from '../../../../server/services/documentStorage';
import * as openaiUtils from '../../../../server/utils/openai';

// Create a properly configured OpenAI client for contract analysis
const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) {
  logger.warn('OPENAI_API_KEY environment variable is not set. AI contract analysis will use fallback methods');
}

// Create the OpenAI client with proper configuration
const openai = apiKey ? new OpenAI({ 
  apiKey, 
  timeout: 30000, // 30 second timeout
  maxRetries: 2   // Retry failed API calls twice 
}) : null;

/**
 * Analyze a contract document and extract key information
 * @param documentId Document ID to analyze
 * @param userId User who initiated the analysis 
 * @param tenantId Tenant context
 */
export async function analyzeContractDocument(documentId: string, userId: string, tenantId: string) {
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
    processDocumentAsync(documentId, initialRecord.id, tenantId).catch(error => {
      logger.error(`Error in async processing of document ${documentId}:`, error);
      // We don't rethrow here since this is async and not part of the request-response cycle
    });

    return {
      id: initialRecord.id,
      status: 'PENDING',
      documentId: documentId,
      filename: document.filename,
      title: document.title
    };
  } catch (error) {
    // Ensure we return a structured error that can be sent to the client
    logger.error(`Error initiating contract analysis for document ${documentId}:`, error);
    
    // Re-wrap the error so it's guaranteed to be a proper Error object with message and stack
    const structuredError = new Error(error instanceof Error 
      ? error.message 
      : `Analysis initialization failed: ${String(error)}`);
    
    // Add additional context to the error for better debugging
    (structuredError as any).context = {
      documentId,
      userId,
      timestamp: new Date().toISOString()
    };
    
    throw structuredError;
  }
}

/**
 * Process the document asynchronously
 */
async function processDocumentAsync(documentId: string, analysisId: string, tenantId: string) {
  try {
    // Update status to PROCESSING
    try {
      await db.update(contractUploadAnalysis)
        .set({ status: 'PROCESSING' })
        .where(eq(contractUploadAnalysis.id, analysisId));
    } catch (dbError) {
      logger.error(`Database error updating analysis status to PROCESSING: ${analysisId}`, dbError);
      // Continue processing, this error is non-fatal
    }

    // Get document details
    let document;
    try {
      document = await db.query.documents.findFirst({
        where: eq(documents.id, documentId)
      });

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }
    } catch (docError) {
      logger.error(`Error retrieving document ${documentId}:`, docError);
      await updateAnalysisWithError(analysisId, docError);
      return; // Exit early
    }

    // Get document details and content
    let documentText = '';
    try {
      logger.info(`Downloading document content for ${documentId}`, { 
        storageKey: document.storageKey, 
        mimeType: document.mimeType 
      });
      
      try {
        // Use the imported modules directly
        // Download the file content
        const fileBuffer = await documentStorage.downloadFile(document.storageKey);
        
        logger.info(`Document downloaded successfully, extracting text`, {
          documentId,
          bufferSize: fileBuffer.length
        });
        
        // Extract text based on mime type
        documentText = await openaiUtils.extractTextFromDocument(
          fileBuffer,
          document.mimeType,
          document.originalFilename
        );
      } catch (error: any) {
        logger.error(`Error processing document: ${error.message}`, {
          error: error,
          documentId
        });
        
        // Fallback to just using the document title and metadata as the content
        documentText = `Contract document: ${document.title || 'Untitled Document'}\nFilename: ${document.originalFilename || document.filename}`;
      }
      
      logger.info(`Successfully extracted text from document`, {
        documentId,
        textLength: documentText.length,
        textPreview: documentText.substring(0, 100) + '...'
      });
      
      // If no text was extracted or it's very short, add document metadata
      if (!documentText || documentText.length < 50) {
        logger.warn(`Document text extraction returned limited content, adding metadata`, {
          documentId,
          extractedLength: documentText?.length || 0
        });
        
        // Start with document title
        documentText = (documentText || '') + `\nContract: ${document.title || 'Untitled Document'}\n`;
        
        // Add description if available
        if (document.description) {
          documentText += `\nDescription: ${document.description}\n`;
        }
        
        // Add filename information that might contain useful clues
        documentText += `\nFilename: ${document.originalFilename || document.filename}\n`;
      }
      
      // Try to get content from aiMetadata if available
      if (document.aiMetadata) {
        try {
          const aiMetadata = typeof document.aiMetadata === 'string'
            ? JSON.parse(document.aiMetadata)
            : document.aiMetadata;
            
          documentText += `\nAI extracted content:\n`;
          Object.entries(aiMetadata).forEach(([key, value]) => {
            documentText += `${key}: ${value}\n`;
          });
        } catch (e) {
          logger.warn(`Could not parse AI metadata for ${documentId}`);
        }
      }
    } catch (textError) {
      logger.error(`Error retrieving document text for ${documentId}:`, textError);
      // Non-fatal, use document title as fallback
      documentText = `Contract document: ${document.title || 'Untitled Document'}`;
    }

    // Run AI analysis - wrap in try/catch to handle analysis errors
    let analysisResult;
    try {
      logger.info(`Starting AI analysis for document ${documentId}`);
      
      // Always use AI analysis in development for testing
      analysisResult = await runAiAnalysis(documentText, document.title || 'Untitled Document');
      
      if (!analysisResult) {
        throw new Error('AI analysis returned null result');
      }
      
      logger.info('AI analysis completed successfully', { 
        documentId,
        analysisId,
        vendor: analysisResult.vendor,
        contractTitle: analysisResult.contractTitle
      });
    } catch (aiError) {
      logger.error(`Error running AI analysis for document ${documentId}:`, aiError);
      await updateAnalysisWithError(analysisId, aiError);
      return; // Exit early
    }

    // Look for potential matching contracts
    let suggestedContractId = null;
    if (analysisResult.vendor) {
      // Search for contracts with similar vendor names
      const potentialMatches = await db.query.contracts.findMany({
        where: eq(contracts.tenantId, tenantId),
        limit: 5,
      });

      // Simple matching logic for demo purposes
      // In a real implementation, you'd use more sophisticated matching
      for (const contract of potentialMatches) {
        if (contract.counterpartyName && 
            analysisResult.vendor && 
            contract.counterpartyName.toLowerCase().includes(analysisResult.vendor.toLowerCase())) {
          suggestedContractId = contract.id;
          break;
        }
      }
    }

    // Update the analysis record with results
    await db.update(contractUploadAnalysis)
      .set({
        vendor: analysisResult.vendor,
        contractTitle: analysisResult.contractTitle,
        docType: analysisResult.docType,
        effectiveDate: analysisResult.effectiveDate,
        terminationDate: analysisResult.terminationDate,
        confidence: analysisResult.confidence,
        suggestedContractId,
        status: 'COMPLETED',
        rawAnalysisJson: JSON.stringify(analysisResult),
        updatedAt: new Date()
      })
      .where(eq(contractUploadAnalysis.id, analysisId));

    logger.info(`Successfully completed AI analysis of document ${documentId}`);
  } catch (error) {
    logger.error(`Error processing document ${documentId}:`, error);
    
    // Update the analysis record with error
    await updateAnalysisWithError(analysisId, error);
  }
}

/**
 * Run the AI analysis on the document text
 * @param text Document text content
 * @param documentTitle Document title
 * @returns Analysis result with extracted contract data
 */
async function runAiAnalysis(text: string, documentTitle: string) {
  try {
    // Log details about what we're analyzing
    logger.info('Analyzing document for contract details', {
      titleLength: documentTitle?.length || 0,
      textLength: text?.length || 0,
      hasOpenAI: !!openai,
      openAIKeyPresent: !!process.env['OPENAI_API_KEY']
    });
    
    // First attempt to use OpenAI if available
    if (openai) {
      try {
        logger.info('Attempting OpenAI analysis of contract document');
        
        // Truncate text if it's too long - OpenAI has token limits
        const maxTextLength = 15000; // Limit to avoid token issues
        const truncatedText = text.length > maxTextLength 
          ? text.substring(0, maxTextLength) + "... [content truncated for length]" 
          : text;
          
        // Make the OpenAI API call with error handling
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo", // Using widely available model
          messages: [
            {
              role: "system",
              content: `You are an expert contract analyst AI. Extract and analyze the following information from the contract:
              1. Vendor/counterparty name
              2. Contract title/subject
              3. Document type (e.g., MAIN_AGREEMENT, AMENDMENT, ADDENDUM, SIDE_LETTER, etc.)
              4. Effective date (in YYYY-MM-DD format)
              5. Termination date (in YYYY-MM-DD format)
              
              Provide confidence scores for each field (0.0 to 1.0). If you're uncertain about a field, still provide your best guess but with a lower confidence score.
              
              Return a JSON object with the following structure:
              {
                "vendor": string or null,
                "contractTitle": string or null,
                "docType": string or null,
                "effectiveDate": string or null,
                "terminationDate": string or null,
                "confidence": {
                  "vendor": number,
                  "contractTitle": number,
                  "docType": number,
                  "effectiveDate": number,
                  "terminationDate": number
                }
              }
              `
            },
            {
              role: "user", 
              content: `Document title: ${documentTitle || 'Untitled'}\n\nDocument content: ${truncatedText}`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000,
          temperature: 0.3
        });
        
        // Parse the AI response
        const content = completion.choices[0]?.message?.content;
        if (content) {
          logger.info('Successfully received OpenAI analysis response');
          try {
            const parsedData = JSON.parse(content);
            // Verify that the response has the expected structure
            if (parsedData && typeof parsedData === 'object') {
              // Ensure confidence object exists to prevent errors
              if (!parsedData.confidence || typeof parsedData.confidence !== 'object') {
                parsedData.confidence = {
                  vendor: 0.5,
                  contractTitle: 0.5,
                  docType: 0.5,
                  effectiveDate: 0.5,
                  terminationDate: 0.5
                };
              }
              return parsedData;
            } else {
              throw new Error('Invalid response structure from OpenAI');
            }
          } catch (parseError) {
            logger.error('Failed to parse OpenAI response:', { error: parseError, content });
            throw new Error('Could not parse OpenAI response');
          }
        } else {
          logger.warn('OpenAI returned empty content');
          throw new Error('Empty response from OpenAI');
        }
      } catch (aiError) {
        logger.error('Error calling OpenAI for contract analysis:', {
          error: aiError instanceof Error ? aiError.message : 'Unknown error',
          stack: aiError instanceof Error ? aiError.stack : undefined
        });
        // Continue to fallback
      }
    } else {
      logger.info('OpenAI client not available, using fallback extraction');
    }
    
    // Fallback extraction when OpenAI isn't available or fails
    logger.info('Using fallback extraction for contract document');
    
    // Extract data from document title as fallback
    let extractedVendor = "Unknown Vendor";
    let extractedTitle = documentTitle || "Untitled Contract";
    
    // If document title has format like "Contract with XYZ Corp" or similar patterns
    if (documentTitle) {
      const vendorPatterns = [
        /(?:with|from|for|by)\s+([A-Za-z0-9\s&]+(?:Inc|LLC|Ltd|Corp|Corporation|Company))/i,
        /-\s*([A-Za-z0-9\s&]+(?:Inc|LLC|Ltd|Corp|Corporation|Company))/i,
        /([A-Za-z0-9\s&]+(?:Inc|LLC|Ltd|Corp|Corporation|Company))/i
      ];
      
      for (const pattern of vendorPatterns) {
        const match = documentTitle.match(pattern);
        if (match && match[1]) {
          extractedVendor = match[1].trim();
          break;
        }
      }
      
      // Try to extract contract type/title
      if (documentTitle.includes("Agreement") || 
          documentTitle.includes("Contract") || 
          documentTitle.includes("License")) {
        extractedTitle = documentTitle;
      } else {
        extractedTitle = `Agreement with ${extractedVendor}`;
      }
    }
    
    // Look for date patterns in the text
    let extractedEffectiveDate = null;
    let extractedTerminationDate = null;
    
    // Simple regex for dates in various formats
    const datePatterns = [
      /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g, // MM/DD/YYYY
      /\b(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/g, // YYYY/MM/DD
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+(19|20)\d{2}\b/gi // Month DD, YYYY
    ];
    
    // Try to find dates
    const foundDates = [];
    for (const pattern of datePatterns) {
      let match;
      const regex = new RegExp(pattern);
      let textToSearch = text || '';
      
      while ((match = regex.exec(textToSearch)) !== null) {
        foundDates.push(match[0]);
      }
    }
    
    // If dates were found, use first as effective and last as termination
    if (foundDates.length > 0) {
      // Try to parse dates into standard YYYY-MM-DD format
      const parsedDates = foundDates.map(dateStr => {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
          return null;
        } catch (e) {
          // Ignore parsing errors
          return null;
        }
      }).filter(Boolean);
      
      if (parsedDates.length > 0) {
        extractedEffectiveDate = parsedDates[0];
        extractedTerminationDate = parsedDates.length > 1 ? parsedDates[parsedDates.length - 1] : null;
      }
    }
    
    // Determine document type based on keywords in title and text
    let extractedDocType = "MAIN_AGREEMENT"; // Default
    const textToSearch = (text || '') + ' ' + (documentTitle || '');
    
    // Check for document type indicators
    if (textToSearch.toLowerCase().includes("amendment")) {
      extractedDocType = "AMENDMENT";
    } else if (textToSearch.toLowerCase().includes("addendum")) {
      extractedDocType = "ADDENDUM";
    } else if (textToSearch.toLowerCase().includes("exhibit")) {
      extractedDocType = "EXHIBIT";
    } else if (textToSearch.toLowerCase().includes("side letter")) {
      extractedDocType = "SIDE_LETTER";
    }
    
    // Return fallback extraction results
    return {
      vendor: extractedVendor,
      contractTitle: extractedTitle,
      docType: extractedDocType,
      effectiveDate: extractedEffectiveDate,
      terminationDate: extractedTerminationDate,
      confidence: {
        vendor: 0.5,
        contractTitle: 0.7,
        docType: 0.6,
        effectiveDate: extractedEffectiveDate ? 0.6 : 0.1,
        terminationDate: extractedTerminationDate ? 0.4 : 0.1
      }
    };
  } catch (error) {
    logger.error(`Error in AI analysis:`, error);
    
    // Return minimal fallback data to avoid breaking the process
    return {
      vendor: "Unknown Vendor",
      contractTitle: documentTitle || "Untitled Contract",
      docType: "MAIN_AGREEMENT",
      effectiveDate: null,
      terminationDate: null,
      confidence: {
        vendor: 0.1,
        contractTitle: 0.5,
        docType: 0.3,
        effectiveDate: 0.1,
        terminationDate: 0.1
      }
    };
  }
}

/**
 * Update analysis record with error status
 */
async function updateAnalysisWithError(analysisId: string, error: any) {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await db.update(contractUploadAnalysis)
      .set({
        status: 'FAILED',
        rawAnalysisJson: JSON.stringify({ error: errorMessage }),
        updatedAt: new Date()
      })
      .where(eq(contractUploadAnalysis.id, analysisId));
    
    logger.info(`Updated analysis record ${analysisId} with error status`);
  } catch (dbError) {
    // Just log - this is best effort
    logger.error(`Failed to update analysis record ${analysisId} with error:`, dbError);
  }
}

/**
 * Get analysis status for a document
 */
export async function getContractAnalysisStatus(documentId: string) {
  try {
    // Use direct query instead of db.query.table format
    const analysisRecord = await db
      .select()
      .from(contractUploadAnalysis)
      .where(eq(contractUploadAnalysis.documentId, documentId))
      .orderBy(contractUploadAnalysis.createdAt)
      .limit(1)
      .then(results => results[0]);
    
    if (!analysisRecord) {
      return { 
        status: 'NOT_FOUND',
        documentId 
      };
    }
    
    return {
      id: analysisRecord.id,
      status: analysisRecord.status,
      documentId,
      vendor: analysisRecord.vendor,
      contractTitle: analysisRecord.contractTitle,
      docType: analysisRecord.docType,
      effectiveDate: analysisRecord.effectiveDate,
      terminationDate: analysisRecord.terminationDate,
      confidence: analysisRecord.confidence,
      suggestedContractId: analysisRecord.suggestedContractId,
      createdAt: analysisRecord.createdAt,
      updatedAt: analysisRecord.updatedAt
    };
  } catch (error) {
    logger.error(`Error retrieving analysis status for document ${documentId}:`, error);
    throw new Error(`Failed to retrieve analysis status: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get analysis by ID
 */
export async function getAnalysisById(analysisId: string) {
  try {
    // Use direct query instead of db.query.table format
    const analysisRecord = await db
      .select()
      .from(contractUploadAnalysis)
      .where(eq(contractUploadAnalysis.id, analysisId))
      .then(results => results[0]);
    
    if (!analysisRecord) {
      return null;
    }
    
    return analysisRecord;
  } catch (error) {
    logger.error(`Error retrieving analysis record ${analysisId}:`, error);
    throw new Error(`Failed to retrieve analysis record: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Save prefill data from analysis
 */
export async function savePrefillData(analysisId: string, prefillData: any) {
  try {
    // Update the analysis record with prefill data stored in rawAnalysisJson
    // Since prefillData doesn't exist in the schema, we'll store it in rawAnalysisJson
    await db.update(contractUploadAnalysis)
      .set({
        rawAnalysisJson: JSON.stringify({ prefillData }),
        updatedAt: new Date()
      })
      .where(eq(contractUploadAnalysis.id, analysisId));
    
    return { success: true };
  } catch (error) {
    logger.error(`Error saving prefill data for analysis ${analysisId}:`, error);
    throw new Error(`Failed to save prefill data: ${error instanceof Error ? error.message : String(error)}`);
  }
}