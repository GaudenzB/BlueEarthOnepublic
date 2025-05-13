-- Create document embeddings table with pgvector support
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  text_chunk TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  embedding_model VARCHAR(50) NOT NULL DEFAULT 'text-embedding-ada-002',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for document embeddings
CREATE INDEX IF NOT EXISTS document_embeddings_document_idx ON document_embeddings(document_id);

-- Create an HNSW index for fast approximate nearest neighbor search
-- This index type is optimized for pgvector and performs better than IVFFlat for this use case
CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx ON document_embeddings 
USING hnsw(embedding vector_cosine_ops) WITH (m=16, ef_construction=64);

-- Add a function to search for similar documents based on vector embeddings
CREATE OR REPLACE FUNCTION search_similar_documents(
  query_embedding vector(1536),
  similarity_threshold FLOAT,
  max_results INT
) 
RETURNS TABLE (
  document_id UUID,
  similarity FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.document_id,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM 
    document_embeddings de
  WHERE 
    1 - (de.embedding <=> query_embedding) > similarity_threshold
  ORDER BY 
    similarity DESC
  LIMIT max_results;
END;
$$;