-- Migration: Migrate existing contract data to new schema
-- This migration:
-- 1. Preserves existing contract-document relationships
-- 2. Sets existing documents as primary

-- Migrate existing contracts to use the contract_documents join table
-- First, insert entries for each existing contract-document relationship
INSERT INTO contract_documents (
  "contractId", 
  "documentId", 
  "docType", 
  "isPrimary",
  "effectiveDate"
)
SELECT 
  c.id,
  c."documentId",
  'MAIN'::contract_doc_type,
  TRUE,
  c."effectiveDate"
FROM 
  contracts c
WHERE 
  c."documentId" IS NOT NULL
  AND NOT EXISTS (
    -- Skip if relationship already exists
    SELECT 1 FROM contract_documents cd 
    WHERE cd."contractId" = c.id AND cd."documentId" = c."documentId"
  );

-- Create temp logs of what we're doing
CREATE TEMP TABLE migration_log AS
SELECT c.id as contract_id, c."documentId", 'Migrated to contract_documents' as action
FROM contracts c
WHERE c."documentId" IS NOT NULL;

-- Now make documentId optional in contracts table by removing the NOT NULL constraint
-- First check if constraint exists
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contracts_documentId_fkey'
    AND table_name = 'contracts'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    -- Drop existing constraint
    ALTER TABLE contracts DROP CONSTRAINT "contracts_documentId_fkey";
    
    -- Re-add constraint but without NOT NULL
    ALTER TABLE contracts 
      ADD CONSTRAINT "contracts_documentId_fkey" 
      FOREIGN KEY ("documentId") 
      REFERENCES documents(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- Log status for reference
SELECT * FROM migration_log;
DROP TABLE migration_log;