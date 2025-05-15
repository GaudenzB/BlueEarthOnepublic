import { z } from 'zod';
import { pgTable, text, uuid, integer, timestamp } from 'drizzle-orm/pg-core';
import { customVector } from '@useverk/drizzle-pgvector';
import { createInsertSchema } from 'drizzle-zod';
import { documents } from './documents';

// Define vector type using customVector
const vector = customVector;

/**
 * Document embeddings table schema
 * 
 * This stores vector embeddings for document chunks, enabling semantic search
 */
export const documentEmbeddings = pgTable('document_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  chunkIndex: integer('chunk_index').notNull(),
  textChunk: text('text_chunk').notNull(),
  embedding: customVector('embedding', { dimensions: 1536 }).notNull(),
  embeddingModel: text('embedding_model').notNull().default('text-embedding-ada-002'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * Document embedding migration SQL
 * 
 * This creates the document_embeddings table and adds vector support
 */
export const documentEmbeddingsMigrationSQL = `
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document embeddings table
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  text_chunk TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient search
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_chunk_index ON document_embeddings(chunk_index);

-- Create HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS document_embeddings_hnsw_idx ON document_embeddings 
USING hnsw (embedding vector_l2_ops) WITH (ef_construction = 128, m = 16);
`;



// Schema for document embedding data
export const documentEmbeddingSchema = z.object({
  id: z.string().uuid().optional(),
  documentId: z.string().uuid(),
  chunkIndex: z.number().int().nonnegative(),
  textChunk: z.string().min(1),
  embedding: z.array(z.number()),
  embeddingModel: z.string().default('text-embedding-ada-002'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Schema for inserting document embeddings
export const insertDocumentEmbeddingSchema = createInsertSchema(documentEmbeddings, {
  embedding: z.array(z.number())
}).omit({ id: true, createdAt: true, updatedAt: true });

// Create types from schemas
export type DocumentEmbedding = z.infer<typeof documentEmbeddingSchema>;
export type InsertDocumentEmbedding = z.infer<typeof insertDocumentEmbeddingSchema>;

// Semantic search schema for API requests
export const semanticSearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  documentType: z.enum([
    'CONTRACT',
    'AGREEMENT',
    'POLICY',
    'REPORT',
    'PRESENTATION',
    'CORRESPONDENCE',
    'INVOICE',
    'OTHER'
  ]).optional(),
  limit: z.number().int().positive().optional().default(10),
  minSimilarity: z.number().min(0).max(1).optional().default(0.7)
});

export type SemanticSearchParams = z.infer<typeof semanticSearchSchema>;