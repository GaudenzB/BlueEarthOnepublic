import OpenAI from "openai";
import { logger } from "./logger";

// Initialize OpenAI client - same client used for chat completions
const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

// Default embedding model - ada-002 is the current recommended model for embeddings
const DEFAULT_EMBEDDING_MODEL = "text-embedding-ada-002";

/**
 * Split text into chunks of approximately the specified size
 * This uses a simple character-based approach, but more sophisticated
 * methods could be used (sentence/paragraph boundaries, etc.)
 * 
 * @param text The text to split
 * @param maxChunkSize Maximum size of each chunk in characters
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(text: string, maxChunkSize: number = 4000): string[] {
  if (!text || text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    // If we're at the end of the text, just add the remaining text
    if (currentIndex + maxChunkSize >= text.length) {
      chunks.push(text.substring(currentIndex));
      break;
    }
    
    // Try to find a sensible place to split (paragraph or sentence)
    let splitIndex = text.lastIndexOf("\n\n", currentIndex + maxChunkSize);
    
    if (splitIndex <= currentIndex) {
      // If no paragraph break, try sentence
      splitIndex = text.lastIndexOf(". ", currentIndex + maxChunkSize);
    }
    
    if (splitIndex <= currentIndex) {
      // If no sentence break, try any space
      splitIndex = text.lastIndexOf(" ", currentIndex + maxChunkSize);
    }
    
    if (splitIndex <= currentIndex) {
      // If no space, just split at the max size
      splitIndex = currentIndex + maxChunkSize;
    }
    
    chunks.push(text.substring(currentIndex, splitIndex + 1).trim());
    currentIndex = splitIndex + 1;
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}

/**
 * Generate embeddings for text using OpenAI's embedding model
 * 
 * @param text Text to generate embeddings for
 * @param model OpenAI embedding model to use
 * @returns Float32Array of embeddings, or null if generation failed
 */
export async function generateEmbedding(
  text: string, 
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<number[] | null> {
  const startTime = Date.now();
  
  try {
    if (!process.env['OPENAI_API_KEY']) {
      logger.error('OPENAI_API_KEY is not configured');
      return null;
    }
    
    // Log basic info about the request
    logger.debug('Generating embedding', { 
      model, 
      textLength: text.length,
      textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    });
    
    // Generate embedding
    const response = await openai.embeddings.create({
      model: model,
      input: text,
      encoding_format: "float"
    });
    
    const processingTime = Date.now() - startTime;
    
    // Check if we have a result
    if (response.data && response.data.length > 0) {
      const embedding = response.data[0].embedding;
      
      logger.debug('Successfully generated embedding', { 
        model, 
        dimensions: embedding.length,
        processingTime: `${processingTime}ms`
      });
      
      return embedding;
    } else {
      logger.error('No embedding data in response', { model, response });
      return null;
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    const processingTime = Date.now() - startTime;
    
    logger.error('Error generating embedding with OpenAI', { 
      error: errorMessage,
      model,
      processingTime: `${processingTime}ms`,
      apiKey: process.env['OPENAI_API_KEY'] ? 'configured' : 'missing'
    });
    
    return null;
  }
}

/**
 * Process text and generate embeddings for chunks
 * 
 * @param text The document text to process
 * @param maxChunkSize Maximum size of each text chunk
 * @param model OpenAI embedding model to use
 * @returns Array of chunks with their embeddings, or empty array if processing failed
 */
export async function generateEmbeddingsForText(
  text: string,
  maxChunkSize: number = 4000,
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<Array<{
  textChunk: string;
  embedding: number[] | null;
  chunkIndex: number;
}>> {
  try {
    // Split text into chunks
    const textChunks = splitTextIntoChunks(text, maxChunkSize);
    
    logger.info('Text split into chunks', { 
      chunkCount: textChunks.length,
      totalTextLength: text.length,
      averageChunkSize: Math.round(text.length / textChunks.length)
    });
    
    // Generate embeddings for each chunk
    const results = await Promise.all(
      textChunks.map(async (chunk, index) => {
        const embedding = await generateEmbedding(chunk, model);
        return {
          textChunk: chunk,
          embedding,
          chunkIndex: index
        };
      })
    );
    
    // Filter out any failed embeddings
    const successfulResults = results.filter(result => result.embedding !== null);
    
    logger.info('Generated embeddings for text chunks', { 
      totalChunks: textChunks.length,
      successfulChunks: successfulResults.length,
      failedChunks: textChunks.length - successfulResults.length,
      model
    });
    
    return successfulResults;
  } catch (error: any) {
    logger.error('Error in generateEmbeddingsForText', { 
      error: error?.message || 'Unknown error', 
      textLength: text?.length || 0
    });
    return [];
  }
}