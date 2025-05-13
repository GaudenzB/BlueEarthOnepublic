import { pgTable, uuid, text, timestamp, varchar, integer, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { documents } from './documents';

/**
 * Document Embeddings Interface
 * This is a simplified schema that mirrors what we define in the SQL migration
 * The vector column is handled directly via SQL due to pgvector integration
 */
export const documentEmbeddings = pgTable('document_embeddings', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  
  // Reference to parent document
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  
  // Document content chunk (the text that was vectorized)
  chunkIndex: integer('chunk_index').notNull(), // Sequential index of the chunk within the document
  textChunk: text('text_chunk').notNull(), // The actual text content
  
  // Vector embedding is defined in SQL migrations
  // embedding: vector(1536), // Handled via migrations instead
  
  // Metadata
  embeddingModel: varchar('embedding_model', { length: 50 }).notNull().default('text-embedding-ada-002'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    documentIdx: index('document_embeddings_document_idx').on(table.documentId),
  };
});

/**
 * Schema for inserting document embeddings
 * Note: This doesn't include the actual vector embedding which is handled separately
 */
export const insertDocumentEmbeddingSchema = createInsertSchema(documentEmbeddings)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

/**
 * Schema for selecting document embeddings
 */
export const selectDocumentEmbeddingSchema = createSelectSchema(documentEmbeddings);

/**
 * Schema for semantic search
 */
export const semanticSearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().int().positive().optional().default(10),
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
  minSimilarity: z.number().min(0).max(1).optional().default(0.7),
});

export type DocumentEmbedding = typeof documentEmbeddings.$inferSelect;
export type InsertDocumentEmbedding = z.infer<typeof insertDocumentEmbeddingSchema>;
export type SemanticSearch = z.infer<typeof semanticSearchSchema>;