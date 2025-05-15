/**
 * Embedding Generator Utility
 * 
 * This utility provides functions to generate vector embeddings for text
 * using OpenAI's text embedding API. These embeddings are used for semantic search.
 */
import OpenAI from 'openai';
import { logger } from './logger';
import { documentRepository } from '../repositories/documentRepository';
import { InsertDocumentEmbedding } from '../../shared/schema/documents/embeddings';

// Configure OpenAI client
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

// Chunk size in tokens (approximately 100 words per chunk, OpenAI recommends ~1000 tokens)
const CHUNK_SIZE = 1000;
// Overlap between chunks to maintain context
const CHUNK_OVERLAP = 100;

/**
 * Split text into overlapping chunks of roughly equal size
 * 
 * @param text - The text to split into chunks
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(text: string): string[] {
  if (!text) return [];
  
  // Simple splitting by paragraphs first, then combining to reach target size
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Estimate tokens (roughly 4 chars per token for English)
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, save current chunk and start a new one
    if (currentChunk && estimateTokens(currentChunk + paragraph) > CHUNK_SIZE) {
      chunks.push(currentChunk.trim());
      // Start new chunk with overlap
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(CHUNK_OVERLAP / 4)).join(' ');
      currentChunk = overlapWords + ' ' + paragraph;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + paragraph;
    }
  }
  
  // Add the last chunk if not empty
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Generate embeddings for a text chunk
 * 
 * @param text - The text to generate embeddings for
 * @returns Vector embedding as an array of numbers
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text || !openai) {
    logger.error('Missing text or OpenAI configuration');
    return null;
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text
    });

    if (response.data[0]?.embedding) {
      return response.data[0].embedding;
    }
    
    logger.error('Failed to get embedding from OpenAI response', { 
      response: response
    });
    return null;
  } catch (error: any) {
    logger.error('Error generating embedding', { 
      error: error.message,
      status: error.status,
      statusText: error.statusText,
      data: error.error
    });
    return null;
  }
}

/**
 * Process a document and store its embeddings
 * 
 * @param documentId - ID of the document to process
 * @param tenantId - Tenant ID for the document
 * @param text - The document text content to embed
 * @returns True if embeddings were generated and stored successfully
 */
export async function processDocumentEmbeddings(documentId: string, tenantId: string, text: string): Promise<boolean> {
  try {
    if (!documentId || !tenantId || !text) {
      logger.warn('Missing required data for embedding generation', { 
        documentId: documentId || 'missing', 
        tenantId: tenantId || 'missing',
        hasText: !!text
      });
      return false;
    }
    
    logger.info('Processing document for embeddings', { documentId, tenantId, textLength: text.length });
    
    // Split the document text into chunks
    const chunks = splitTextIntoChunks(text);
    logger.info('Document split into chunks', { documentId, chunkCount: chunks.length });
    
    let successCount = 0;
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      
      if (embedding) {
        // Create embedding record
        const embeddingData = {
          documentId,
          chunkIndex: i,
          textChunk: chunk,
          embedding,
          embeddingModel: 'text-embedding-ada-002'
        };
        
        // Store in database
        const result = await documentRepository.storeEmbedding(embeddingData);
        if (result) {
          successCount++;
        }
      }
    }
    
    logger.info('Completed embedding generation', {
      documentId,
      totalChunks: chunks.length,
      successfulChunks: successCount
    });
    
    return successCount > 0;
  } catch (error: any) {
    logger.error('Error processing document embeddings', {
      error: error.message,
      documentId,
      tenantId
    });
    return false;
  }
}

/**
 * Generate embedding for a search query
 * 
 * @param query - The search query text
 * @returns Vector embedding as an array of numbers or null if generation failed
 */
export async function generateSearchQueryEmbedding(query: string): Promise<number[] | null> {
  if (!query) {
    logger.warn('Empty search query provided');
    return null;
  }
  
  return generateEmbedding(query);
}