import { apiRequest } from '@/lib/queryClient';

/**
 * Represents search parameters for semantic document search
 */
export interface SearchParams {
  query: string;
  documentType?: string;
  minSimilarity?: number;
  limit?: number;
}

/**
 * Represents a search result from semantic document search
 */
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  documentType?: string;
  score: number;
  createdAt?: string;
  chunkIndex?: number;
}

/**
 * Performs a semantic search of documents 
 * @param params Search parameters
 * @returns Promise with search results
 */
export const semanticSearch = async (params: SearchParams): Promise<{ results: SearchResult[] }> => {
  try {
    // Convert the params to a proper request body
    const requestBody = {
      query: params.query,
      documentType: params.documentType || undefined,
      minSimilarity: params.minSimilarity || 0.7,
      limit: params.limit || 10
    };
    
    // Use our custom apiRequest function from queryClient
    const response = await apiRequest<any>('/api/documents/search/semantic', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data?.results) {
      return { results: [] };
    }

    return { 
      results: response.data.results.map((result: any) => ({
        id: result.documentId || result.id,
        title: result.title || 'Untitled Document',
        content: result.chunkText || result.textChunk || result.excerpt || '',
        documentType: result.documentType,
        score: result.similarity || result.relevanceScore || 0,
        createdAt: result.createdAt,
        chunkIndex: result.chunkIndex
      }))
    };
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return { results: [] };
  }
};