import fs from 'fs';
import { logger } from './logger';
// Using dynamic import to avoid test file loading on startup
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extract text content from a PDF file
 * 
 * @param filePath Path to the PDF file
 * @returns Promise resolving to the extracted text
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    logger.debug(`Starting PDF extraction from: ${filePath}`);
    
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse the PDF
    logger.debug(`PDF loaded, parsing content from: ${filePath}`);
    const pdfData = await pdfParse(dataBuffer);
    
    // Log extraction stats
    logger.debug(`PDF extraction completed`, {
      filePath,
      pageCount: pdfData.numpages,
      textLength: pdfData.text.length
    });
    
    return pdfData.text;
  } catch (error) {
    // Enhance error with diagnostic info
    const enhancedError = new Error(
      `PDF text extraction failed: ${error instanceof Error ? error.message : String(error)}`
    );
    if (error instanceof Error && error.stack) {
      enhancedError.stack = error.stack;
    }
    
    logger.error(`PDF extraction error`, {
      filePath,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw enhancedError;
  }
}