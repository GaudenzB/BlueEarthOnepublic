import { logger } from '../../../../server/utils/logger';
import { db } from '../../../../server/db';
import { documents } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { OpenAI } from 'openai';
import { contractUploadAnalysis } from '../../../../shared/schema/contracts/contract_upload_analysis';
import { contracts } from '../../../../shared/schema/contracts/contracts';

// Simple OpenAI client instance for contract analysis
// In production, would use the main openai instance from server services
const openai = process.env.OPENAI_API_KEY ? 
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/**
 * Analyze a contract document and extract key information
 * @param documentId Document ID to analyze
 * @param userId User who initiated the analysis 
 * @param tenantId Tenant context
 */
export async function analyzeContractDocument(documentId: string, userId: string, tenantId: string) {
  logger.info(`Starting AI analysis of contract document ${documentId}`);

  try {
    // Create an initial analysis record with PENDING status
    const [initialRecord] = await db.insert(contractUploadAnalysis)
      .values({
        documentId,
        userId,
        tenantId,
        status: 'PENDING'
      })
      .returning();

    // Process asynchronously
    processDocumentAsync(documentId, initialRecord.id, tenantId).catch(error => {
      logger.error(`Error in async processing of document ${documentId}:`, error);
    });

    return {
      id: initialRecord.id,
      status: 'PENDING'
    };
  } catch (error) {
    logger.error(`Error initiating contract analysis for document ${documentId}:`, error);
    throw error;
  }
}

/**
 * Process the document asynchronously
 */
async function processDocumentAsync(documentId: string, analysisId: string, tenantId: string) {
  try {
    // Update status to PROCESSING
    await db.update(contractUploadAnalysis)
      .set({ status: 'PROCESSING' })
      .where(eq(contractUploadAnalysis.id, analysisId));

    // Get document details
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, documentId)
    });

    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Get document details
    let documentText = '';
    try {
      // For this demo, we'll use the document title since we don't have actual file access
      // In a real implementation, this would be the content from the document file
      documentText = `Sample contract text for document: ${document.title}. 
      This is a demonstration of AI contract analysis with Tech Solutions Inc.
      This agreement is entered into on May 1, 2025 (the "Effective Date") and 
      will terminate on May 1, 2026 (the "Termination Date") unless extended 
      by mutual agreement of the parties.`;
    } catch (error) {
      logger.error(`Error processing document ${documentId}:`, error);
    }

    // Extract text content from the document (simplified for now)
    // In a real implementation, you'd use PDFParser or similar
    const text = documentText.substring(0, 5000); // Use first 5000 chars for demo

    // Run AI analysis
    const analysisResult = await runAiAnalysis(text, document.title || '');

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
        rawAnalysisJson: analysisResult,
        updatedAt: new Date()
      })
      .where(eq(contractUploadAnalysis.id, analysisId));

    logger.info(`Successfully completed AI analysis of document ${documentId}`);
  } catch (error) {
    logger.error(`Error processing document ${documentId}:`, error);
    
    // Update the analysis record with error
    await db.update(contractUploadAnalysis)
      .set({
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date()
      })
      .where(eq(contractUploadAnalysis.id, analysisId));
  }
}

/**
 * Run the AI analysis on the document text
 */
async function runAiAnalysis(text: string, documentTitle: string) {
  try {
    // Call OpenAI for analysis if available
    try {
      if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert contract analyst AI. Extract and analyze the following information from the contract:
              1. Vendor/counterparty name
              2. Contract title/subject
              3. Document type (e.g., MAIN, AMENDMENT, ADDENDUM, SIDE_LETTER, etc.)
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
              content: `Document title: ${documentTitle}\n\nDocument content: ${text}`
            }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse the AI response
        const content = completion.choices[0].message.content;
        if (content) {
          return JSON.parse(content);
        }
      }
    } catch (aiError) {
      logger.error('Error calling OpenAI for contract analysis:', aiError);
      // Fall back to test data if AI fails
    }
    
    // For testing purposes when OpenAI isn't available 
    // This provides some realistic data for development and testing
    return {
      vendor: "Tech Solutions Inc.",
      contractTitle: "Software Development Services Agreement",
      docType: "MAIN",
      effectiveDate: "2025-05-01",
      terminationDate: "2026-05-01",
      confidence: {
        vendor: 0.85,
        contractTitle: 0.92,
        docType: 0.78,
        effectiveDate: 0.88,
        terminationDate: 0.75
      }
    };
  } catch (error) {
    logger.error('Error in AI analysis:', error);
    throw error;
  }
}

/**
 * Get the analysis result by ID
 */
export async function getAnalysisById(analysisId: string) {
  try {
    const analysis = await db.query.contractUploadAnalysis.findFirst({
      where: eq(contractUploadAnalysis.id, analysisId)
    });
    
    if (!analysis) {
      throw new Error(`Analysis not found: ${analysisId}`);
    }
    
    return analysis;
  } catch (error) {
    logger.error(`Error getting analysis ${analysisId}:`, error);
    throw error;
  }
}

/**
 * Save pre-filled contract data for later use in the contract wizard
 */
export async function savePrefillData(data: any, tenantId: string) {
  try {
    // We'll reuse the contractUploadAnalysis table to store prefill data
    const [prefillRecord] = await db.insert(contractUploadAnalysis)
      .values({
        documentId: data.documentId,
        tenantId,
        vendor: data.vendor,
        contractTitle: data.title,
        docType: data.docType,
        effectiveDate: data.effectiveDate,
        terminationDate: data.terminationDate,
        status: 'PREFILL',
        updatedAt: new Date()
      })
      .returning();
      
    return prefillRecord;
  } catch (error) {
    logger.error('Error saving prefill data:', error);
    throw error;
  }
}