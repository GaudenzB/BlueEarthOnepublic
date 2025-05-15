import { apiRequest } from '@/lib/api';
import type { Document } from '@/types/document';

export interface SearchResult {
  id: string;
  title: string | null;
  description: string | null;
  documentType: string;
  textChunk: string;
  updatedAt: Date;
  createdAt: Date;
  similarity: number;
}

export interface SemanticSearchParams {
  query: string;
  documentType?: string;
  limit?: number;
  minSimilarity?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
}

const defaultLimit = 10;
const defaultMinSimilarity = 0.7;

/**
 * Perform a semantic search on document content
 * This uses vector embeddings to find documents with similar meaning
 */
export async function semanticSearch(params: SemanticSearchParams): Promise<SearchResponse> {
  try {
    const { query, documentType, limit = defaultLimit, minSimilarity = defaultMinSimilarity } = params;
    
    const searchParams: Record<string, any> = {
      query: query.trim(),
      limit,
      minSimilarity
    };
    
    if (documentType) {
      searchParams.documentType = documentType;
    }
    
    const response = await apiRequest<SearchResponse>({
      url: '/api/documents/search/semantic',
      method: 'POST',
      data: searchParams
    });
    
    return response;
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return { results: [], totalCount: 0 };
  }
}

/**
 * Perform a basic text search on document content
 * This uses regular SQL LIKE queries for simpler matching
 */
export async function basicTextSearch(query: string, limit = defaultLimit): Promise<Document[]> {
  try {
    const response = await apiRequest<{ documents: Document[] }>({
      url: '/api/documents/search',
      method: 'POST',
      data: {
        query: query.trim(),
        limit
      }
    });
    
    return response.documents || [];
  } catch (error) {
    console.error('Error performing basic text search:', error);
    return [];
  }
}