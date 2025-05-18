-- Migration: Contract Wizard Update
-- Purpose: Update contract wizard to support multiple document attachments
-- Date: 2025-05-18

-- Create index for contract documents is_primary flag
CREATE INDEX IF NOT EXISTS contract_docs_primary_idx ON contract_documents(contract_id, is_primary);

-- Add constraint to ensure only one primary document per contract
-- This will enforce that only one document can be marked as primary for each contract
ALTER TABLE contract_documents
ADD CONSTRAINT contract_docs_one_primary
CHECK (
  NOT is_primary OR (
    is_primary AND 
    NOT EXISTS (
      SELECT 1 FROM contract_documents cd2 
      WHERE cd2.contract_id = contract_id 
      AND cd2.is_primary = true 
      AND cd2.id != id
    )
  )
);

-- Function to update contract_documents stats on changes
CREATE OR REPLACE FUNCTION update_contract_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps on contract_documents
CREATE TRIGGER update_contract_documents_timestamp
BEFORE UPDATE ON contract_documents
FOR EACH ROW
EXECUTE FUNCTION update_contract_documents_timestamp();

-- Add comment for documentation
COMMENT ON TABLE contract_documents IS 'Links contracts to document versions, supports multiple documents per contract with different roles';
COMMENT ON COLUMN contract_documents.is_primary IS 'Flag for the main contract document (only one per contract)';
COMMENT ON COLUMN contract_documents.doc_type IS 'Document type classification (MAIN, AMENDMENT, SIDE_LETTER, etc.)';