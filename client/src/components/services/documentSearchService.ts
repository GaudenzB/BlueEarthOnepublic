/**
 * Document Search Service
 * 
 * Handles semantic search for documents
 */

export interface SearchParams {
  query: string;
  documentType?: string;
  minSimilarity?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  documentType: string;
  createdAt: string;
  score: number;
  highlights?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

/**
 * Perform a semantic search against documents
 */
export async function semanticSearch(params: SearchParams): Promise<SearchResponse> {
  const { query, documentType, minSimilarity = 0.6, limit = 10 } = params;
  
  // API endpoint for semantic search
  const url = new URL('/api/documents/search/semantic', window.location.origin);
  
  // Add query parameters
  url.searchParams.append('query', query);
  if (documentType) url.searchParams.append('documentType', documentType);
  url.searchParams.append('minSimilarity', minSimilarity.toString());
  url.searchParams.append('limit', limit.toString());
  
  // Perform the request
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  
  return await response.json();
}