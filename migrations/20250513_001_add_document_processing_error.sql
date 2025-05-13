-- Add processing_error field to documents table

-- Check if the column already exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'processing_error'
    ) THEN
        ALTER TABLE documents ADD COLUMN processing_error TEXT;
    END IF;
END $$;

-- Add an index on processing_status for quicker filtering of documents by status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'documents' AND indexname = 'idx_documents_processing_status'
    ) THEN
        CREATE INDEX idx_documents_processing_status ON documents (processing_status);
    END IF;
END $$;

-- Add a comment to explain the purpose of the processing_error field
COMMENT ON COLUMN documents.processing_error IS 'Stores error messages when document processing fails or has issues';