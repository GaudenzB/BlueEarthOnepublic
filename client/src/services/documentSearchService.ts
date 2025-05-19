/**
 * Document search service for semantic search functionality
 */
import { apiRequest } from '../lib/queryClient';

/**
 * Search result interface
 */
export interface SearchResult {
  id: string;
  title: string;
  content: string | null;
  score: number;
  documentType?: string;
  createdAt?: string;
  updatedAt?: string;
  uploadedBy?: string;
}

/**
 * Search filter options
 */
export interface SearchFilters {
  documentType?: string | null;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  } | null;
  sortBy?: 'relevance' | 'date' | 'title';
  limit?: number;
}

/**
 * Perform semantic search on documents
 * 
 * @param query - Search query text
 * @param filters - Optional search filters
 * @returns Promise with search results
 */
export const semanticSearch = async (
  query: string,
  filters?: SearchFilters
): Promise<SearchResult[]> => {
  try {
    if (!query.trim()) {
      return [];
    }

    const response = await apiRequest('/api/documents/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        filters
      })
    });

    return response.data || [];
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw error;
  }
};

/**
 * Get document search suggestions based on partial input
 * 
 * @param partialQuery - Partial query to get suggestions for
 * @returns Promise with suggested search terms
 */
export const getSearchSuggestions = async (
  partialQuery: string
): Promise<string[]> => {
  try {
    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }

    const response = await apiRequest('/api/documents/search/suggestions', {
      method: 'POST',
      body: JSON.stringify({ query: partialQuery })
    });

    return response.data || [];
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
};