/**
 * Document Search Service for client-side
 * 
 * Handles interaction with document search API endpoints
 */

import { apiRequest } from '../lib/queryClient';

export interface SearchParams {
  query: string;
  documentType?: string;
  limit?: number;
  minSimilarity?: number;
}

export interface SearchResult {
  id: string;
  title: string | null;
  description: string | null;
  documentType: string;
  createdAt: string;
  isConfidential: boolean;
  textChunk: string;
  relevanceScore: number;
}

/**
 * Perform a semantic search for documents
 * 
 * @param params Search parameters
 * @returns Promise with search results
 */
export async function semanticSearch(params: SearchParams): Promise<SearchResult[]> {
  try {
    const response = await apiRequest<SearchResult[]>('/api/documents/search/semantic', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    return response.data || [];
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return [];
  }
}

/**
 * Get similar documents to a specific document
 * 
 * @param documentId Document ID to find similar documents for
 * @param limit Maximum number of results to return
 * @returns Promise with similar documents
 */
export async function getSimilarDocuments(
  documentId: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    const response = await apiRequest<SearchResult[]>(
      `/api/documents/${documentId}/similar?limit=${limit}`
    );
    
    return response.data || [];
  } catch (error) {
    console.error('Error getting similar documents:', error);
    return [];
  }
}

/**
 * Parse search query for advanced search options
 * 
 * @param query Raw search query
 * @returns Parsed search parameters
 */
export function parseSearchQuery(query: string): {
  baseQuery: string;
  documentType?: string;
  tags?: string[];
} {
  const result = {
    baseQuery: query,
    documentType: undefined as string | undefined,
    tags: undefined as string[] | undefined,
  };
  
  // Extract document type filter (type:X)
  const typeMatch = query.match(/type:([a-zA-Z_]+)/i);
  if (typeMatch) {
    result.documentType = typeMatch[1].toUpperCase();
    result.baseQuery = result.baseQuery.replace(typeMatch[0], '').trim();
  }
  
  // Extract tag filters (tag:X)
  const tagMatches = [...query.matchAll(/tag:([a-zA-Z0-9_-]+)/gi)];
  if (tagMatches.length > 0) {
    result.tags = tagMatches.map(match => match[1]);
    tagMatches.forEach(match => {
      result.baseQuery = result.baseQuery.replace(match[0], '').trim();
    });
  }
  
  return result;
}