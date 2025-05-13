import fs from 'fs';
import { logger } from './logger';
import { parsePdfBuffer, parsePdfFile } from './pdf-parser';

/**
 * Extract text content from a PDF file
 * 
 * @param filePath Path to the PDF file
 * @returns Promise resolving to the extracted text
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    logger.debug(`Starting PDF extraction from: ${filePath}`);
    
    // Use our custom PDF parser that safely handles extraction without test files
    const extractedText = await parsePdfFile(filePath);
    
    // Log extraction stats
    logger.debug(`PDF extraction completed`, {
      filePath,
      textLength: extractedText.length
    });
    
    return extractedText;
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

/**
 * Extract text content from a PDF buffer
 * 
 * @param pdfBuffer Buffer containing PDF data
 * @returns Promise resolving to the extracted text
 */
export async function extractTextFromPDFBuffer(pdfBuffer: Buffer): Promise<string> {
  try {
    logger.debug('Starting PDF extraction from buffer', {
      bufferLength: pdfBuffer.length
    });
    
    // Use our custom PDF parser that safely handles extraction without test files
    const extractedText = await parsePdfBuffer(pdfBuffer);
    
    // Log extraction stats
    logger.debug('PDF extraction from buffer completed', {
      textLength: extractedText.length
    });
    
    return extractedText;
  } catch (error) {
    // Enhance error with diagnostic info
    const enhancedError = new Error(
      `PDF buffer extraction failed: ${error instanceof Error ? error.message : String(error)}`
    );
    if (error instanceof Error && error.stack) {
      enhancedError.stack = error.stack;
    }
    
    logger.error('PDF buffer extraction error', {
      bufferLength: pdfBuffer.length,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw enhancedError;
  }
}