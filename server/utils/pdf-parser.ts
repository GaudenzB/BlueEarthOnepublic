/**
 * Custom PDF parser that safely wraps the pdf-parse library
 * and handles errors gracefully without relying on test files
 */

import fs from 'fs';
import { logger } from './logger';

/**
 * Parse a PDF file from a file path
 * @param filePath Path to the PDF file
 * @returns Extracted text from the PDF
 */
export async function parsePdfFile(filePath: string): Promise<string> {
  try {
    // Read the file buffer
    const pdfBuffer = fs.readFileSync(filePath);
    return await parsePdfBuffer(pdfBuffer);
  } catch (error) {
    logger.error(`Error parsing PDF file: ${filePath}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse a PDF from a buffer 
 * @param pdfBuffer Buffer containing PDF data
 * @returns Extracted text from the PDF
 */
export async function parsePdfBuffer(pdfBuffer: Buffer): Promise<string> {
  try {
    // Dynamically import pdf-parse to avoid CommonJS/ESM issues
    const pdfParse = (await import('pdf-parse')).default;
    
    // Define custom rendering context to avoid needing the test files
    const customRendererOptions = {
      pagerender: function customRenderer(pageData: any) {
        // This is the custom renderer that doesn't rely on canvas/test files
        return Promise.resolve(pageData.getTextContent()
          .then((textContent: any) => {
            let text = '';
            // Concatenate the text items
            textContent.items.forEach((item: any) => {
              text += item.str + ' ';
            });
            return text;
          }));
      },
      max: 0 // parse all pages
    };

    // Parse the PDF with custom options
    const data = await pdfParse(pdfBuffer, customRendererOptions);
    return data.text || '';
  } catch (error) {
    logger.error('Error parsing PDF buffer', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      bufferLength: pdfBuffer.length
    });
    throw new Error(`Failed to parse PDF buffer: ${error instanceof Error ? error.message : String(error)}`);
  }
}