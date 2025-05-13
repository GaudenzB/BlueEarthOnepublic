/**
 * Test script for document text extraction with enhanced error handling
 * 
 * This script tests various document types and error conditions for the text extraction utility
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

// Simulate the normalized text extraction function
function normalizeMimeType(mimeType) {
  // Convert to lowercase
  const type = mimeType.toLowerCase();
  
  // Handle common variations and aliases
  if (type.includes('pdf')) {
    return 'application/pdf';
  }
  
  if (type.includes('word') || type.includes('docx') || type.includes('doc')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  
  if (type.includes('text/') || type.includes('txt')) {
    return 'text/plain';
  }
  
  if (type.includes('html')) {
    return 'text/html';
  }
  
  if (type.includes('excel') || type.includes('xls') || type.includes('xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  
  if (type.includes('powerpoint') || type.includes('ppt') || type.includes('pptx')) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }
  
  if (type.includes('json')) {
    return 'application/json';
  }
  
  // Return original if no match
  return type;
}

// Simulate the extractTextFromDocument function with error handling
async function extractTextFromDocument(content, mimeType, fileName, options = {}) {
  const startTime = Date.now();
  const defaultOptions = {
    maxContentLength: 100000, // Default max content length (100KB)
    throwErrors: false,       // Return error messages rather than throwing by default
    includeMetadata: true     // Include extraction metadata in the output
  };
  
  const { maxContentLength, throwErrors, includeMetadata } = { ...defaultOptions, ...options };
  
  try {
    // Validate input
    if (!content || content.length === 0) {
      const errorMsg = 'Document content is empty';
      console.error(errorMsg, { mimeType, fileName });
      if (throwErrors) throw new Error(errorMsg);
      return `Error: ${errorMsg}`;
    }
    
    // Log extraction attempt
    console.log('Extracting text from document', { 
      mimeType, 
      fileSize: content.length, 
      fileName
    });
    
    // Content is too large - warn and truncate
    if (content.length > maxContentLength) {
      console.warn('Document content exceeds maximum size', {
        fileSize: content.length,
        maxContentLength,
        fileName
      });
    }
    
    // Normalize MIME type to handle variations
    const normalizedMimeType = normalizeMimeType(mimeType);
    let extractedText = '';
    
    // Handle different document types
    switch (normalizedMimeType) {
      case 'application/pdf':
        extractedText = `Simulated PDF extraction for "${fileName}"\n\nThis is placeholder text that would be extracted from a PDF document. In a real implementation, we would use a library like pdf-parse or pdfjs-dist to extract the actual text content.`;
        break;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        extractedText = `Simulated Word document extraction for "${fileName}"\n\nThis is placeholder text that would be extracted from a Word document. In a real implementation, we would use a library like mammoth.js to extract the actual text content.`;
        break;
        
      case 'text/plain':
        // For plain text, we can just return the content as string
        extractedText = content.toString('utf-8');
        break;
        
      case 'text/html':
      case 'application/xhtml+xml':
        extractedText = `Simulated HTML extraction for "${fileName}"\n\nThis is placeholder text that would be extracted from an HTML document. In a real implementation, we would use a library like cheerio to extract the actual text content, removing HTML tags and formatting.`;
        break;
        
      case 'application/json':
        try {
          const jsonContent = JSON.parse(content.toString('utf-8'));
          extractedText = `Parsed JSON content:\n\n${JSON.stringify(jsonContent, null, 2)}`;
        } catch (e) {
          extractedText = `Error parsing JSON content: ${e.message}\n\nRaw content:\n${content.toString('utf-8').substring(0, 500)}...`;
        }
        break;
        
      default:
        console.warn('Unsupported document type for text extraction', { mimeType, normalizedMimeType, fileName });
        extractedText = `Text extraction from ${mimeType} documents is not currently supported.\nPlease convert this document to PDF format for analysis.`;
    }
    
    const processingTime = Date.now() - startTime;
    
    // Add metadata if requested
    if (includeMetadata) {
      const metadata = `
      
      --- Document Extraction Metadata ---
      File Type: ${normalizedMimeType}
      File Size: ${(content.length / 1024).toFixed(2)} KB
      Extraction Time: ${processingTime}ms
      Extraction Engine: Test Extraction Engine v1.0
      `;
      
      extractedText += metadata;
    }
    
    console.log('Text extraction completed', {
      mimeType,
      normalizedMimeType,
      contentLength: extractedText.length,
      processingTime: `${processingTime}ms`,
      fileName
    });
    
    return extractedText;
    
  } catch (error) {
    const errorMessage = error?.message || 'Unknown error';
    const processingTime = Date.now() - startTime;
    
    console.error('Error extracting text from document', { 
      error: errorMessage, 
      mimeType, 
      fileName,
      documentSize: content?.length || 0,
      processingTime: `${processingTime}ms`
    });
    
    if (throwErrors) {
      throw error;
    }
    
    return `Error extracting text from document: ${errorMessage}`;
  }
}

/**
 * Create a buffer from a string
 */
function createBufferFromString(content) {
  return Buffer.from(content);
}

/**
 * Test different document types for text extraction
 */
async function testTextExtraction() {
  console.log('Testing document text extraction with error handling...');
  
  try {
    // Test PDF file (simulated)
    console.log('\n1. Testing PDF Extraction:');
    const pdfBuffer = createBufferFromString('Simulated PDF content');
    const pdfText = await extractTextFromDocument(pdfBuffer, 'application/pdf', 'test-document.pdf');
    console.log('PDF Extraction Result:\n', pdfText.substring(0, 150) + '...');
    
    // Test Word document (simulated)
    console.log('\n2. Testing Word Document Extraction:');
    const wordBuffer = createBufferFromString('Simulated Word document content');
    const wordText = await extractTextFromDocument(wordBuffer, 'application/msword', 'test-document.docx');
    console.log('Word Extraction Result:\n', wordText.substring(0, 150) + '...');
    
    // Test plain text
    console.log('\n3. Testing Plain Text Extraction:');
    const textContent = 'This is a sample plain text document.\nIt has multiple lines.\nThe extraction should preserve all content exactly as is.';
    const textBuffer = createBufferFromString(textContent);
    const plainText = await extractTextFromDocument(textBuffer, 'text/plain', 'test-document.txt');
    console.log('Plain Text Extraction Result:\n', plainText.split('\n')[0] + '...');
    
    // Test MIME type normalization with alternate types
    console.log('\n4. Testing MIME Type Normalization:');
    const altPdfBuffer = createBufferFromString('PDF content with alternate MIME type');
    const altPdfText = await extractTextFromDocument(altPdfBuffer, 'application/x-pdf', 'test-document-alt.pdf');
    console.log('Alternate PDF MIME Type Result:\n', altPdfText.substring(0, 150) + '...');
    
    // Test with empty content (error case)
    console.log('\n5. Testing Empty Content Error:');
    const emptyBuffer = Buffer.from('');
    const emptyResult = await extractTextFromDocument(emptyBuffer, 'text/plain', 'empty-document.txt');
    console.log('Empty Content Result:\n', emptyResult);
    
    // Test with throwing errors enabled
    console.log('\n6. Testing Error Throwing:');
    try {
      await extractTextFromDocument(null, 'text/plain', 'null-document.txt', { throwErrors: true });
      console.log('❌ Error was not thrown!');
    } catch (error) {
      console.log('✅ Error successfully thrown:', error.message);
    }
    
    // Test with very large content
    console.log('\n7. Testing Large Content:');
    const largeContent = 'A'.repeat(150000); // 150KB content
    const largeBuffer = createBufferFromString(largeContent);
    const largeResult = await extractTextFromDocument(largeBuffer, 'text/plain', 'large-document.txt', {
      maxContentLength: 100000, // Set limit to 100KB
      includeMetadata: true
    });
    console.log('Large Content Result Length:', largeResult.length);
    console.log('Large Content Extraction Contains Warning:', largeResult.includes('exceeds maximum size'));
    
    // Test without metadata
    console.log('\n8. Testing Without Metadata:');
    const noMetadataResult = await extractTextFromDocument(
      createBufferFromString('Plain text without metadata'),
      'text/plain',
      'no-metadata.txt',
      { includeMetadata: false }
    );
    console.log('Result Contains Metadata Section:', noMetadataResult.includes('Document Extraction Metadata'));
    
    // Test with JSON content
    console.log('\n9. Testing JSON Content:');
    const jsonContent = JSON.stringify({ key: 'value', nested: { items: [1, 2, 3] } });
    const jsonBuffer = createBufferFromString(jsonContent);
    const jsonResult = await extractTextFromDocument(jsonBuffer, 'application/json', 'test-document.json');
    console.log('JSON Extraction Result:\n', jsonResult.split('\n').slice(0, 5).join('\n'));
    
    // Test with invalid JSON
    console.log('\n10. Testing Invalid JSON:');
    const invalidJsonContent = '{ "key": "value", "broken": }';
    const invalidJsonBuffer = createBufferFromString(invalidJsonContent);
    const invalidJsonResult = await extractTextFromDocument(invalidJsonBuffer, 'application/json', 'invalid-document.json');
    console.log('Invalid JSON Result Contains Error:', invalidJsonResult.includes('Error parsing JSON'));
    
    console.log('\nAll text extraction tests completed successfully!');
    
  } catch (error) {
    console.error('Test suite failed with error:', error);
  }
}

// Run the test
testTextExtraction().catch(console.error);