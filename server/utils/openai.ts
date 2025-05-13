import OpenAI from "openai";
import { logger } from "./logger";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

/**
 * Analyze document text content using OpenAI
 * 
 * @param text The document text content to analyze
 * @param documentTitle The title of the document
 * @param documentType The type of document (CONTRACT, REPORT, etc.)
 * @returns AI metadata with summary, entities, etc.
 */
export async function analyzeDocumentText(
  text: string, 
  documentTitle: string, 
  documentType: string
): Promise<{
  summary: string;
  entities: any[];
  timeline: any[];
  keyInsights: string[];
  categories: string[];
  confidence: number;
}> {
  try {
    // Truncate text if it's too long (API limits)
    const truncatedText = text.length > 15000 ? text.substring(0, 15000) + "..." : text;
    
    // Prepare prompt
    const prompt = `
      Please analyze the following document content comprehensively.
      
      DOCUMENT TITLE: ${documentTitle}
      DOCUMENT TYPE: ${documentType}
      
      DOCUMENT CONTENT:
      ${truncatedText}
      
      Provide a detailed analysis in JSON format with the following structure:
      {
        "summary": "A concise 2-3 paragraph summary of the document's key points and overall purpose",
        "entities": [
          { "name": "entity name", "type": "person/organization/location/date", "mentions": [page/paragraph references] }
        ],
        "timeline": [
          { "date": "YYYY-MM-DD", "event": "description of what happens on this date" }
        ],
        "keyInsights": ["List of 3-5 key insights from the document"],
        "categories": ["Suggest 2-3 categories this document belongs to"],
        "confidence": 0.95 // A score between 0-1 indicating confidence in the analysis
      }
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "You are an expert document analyst with expertise in business, financial, and legal documents." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent results
    });

    // Extract and parse the response content
    const result = JSON.parse(response.choices[0].message.content);
    
    logger.info('Document analysis completed successfully', { 
      documentTitle, 
      contentLength: text.length,
      summaryLength: result.summary?.length || 0,
      entitiesCount: result.entities?.length || 0
    });

    return {
      summary: result.summary || "No summary available",
      entities: result.entities || [],
      timeline: result.timeline || [],
      keyInsights: result.keyInsights || [],
      categories: result.categories || [],
      confidence: result.confidence || 0.7
    };
  } catch (error) {
    logger.error('Error analyzing document with OpenAI', { error, documentTitle });
    
    // Return fallback values in case of error
    return {
      summary: "Unable to generate summary due to processing error.",
      entities: [],
      timeline: [],
      keyInsights: ["Analysis error occurred"],
      categories: [],
      confidence: 0
    };
  }
}

/**
 * Extract text from a document (placeholder for PDF extraction logic)
 * In a production app, this would use a PDF parsing library
 * 
 * @param documentContent Binary content of the document
 * @param mimeType The MIME type of the document
 * @returns Extracted text content
 */
export async function extractTextFromDocument(
  documentContent: Buffer,
  mimeType: string
): Promise<string> {
  // This is a simulated function - in a real app this would use PDF.js, pdf-parse, or similar
  // For testing purposes, we'll simulate extracting some text
  
  try {
    logger.info('Extracting text from document', { mimeType });
    
    if (mimeType === 'application/pdf') {
      // In a real implementation, this would use a PDF library
      // For now, we'll return a placeholder based on the document size
      const contentSizeKB = Math.round(documentContent.length / 1024);
      return `This is simulated text extracted from a ${contentSizeKB}KB PDF document.
      The document appears to contain multiple sections with various formatting.
      We have identified approximately ${Math.round(contentSizeKB / 3)} pages of content.
      Key terms frequently mentioned include: strategy, investments, analysis, performance, and evaluation.`;
    } else {
      return `Text extraction from ${mimeType} documents is not yet supported.`;
    }
  } catch (error) {
    logger.error('Error extracting text from document', { error, mimeType });
    return "Error extracting text from document.";
  }
}