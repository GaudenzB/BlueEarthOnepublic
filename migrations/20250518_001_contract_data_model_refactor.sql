-- Migration: Contract Data Model Refactor
-- Purpose: Allow contracts without documents, support multiple attachments, and add vendor relationships
-- Date: 2025-05-18

-- Create contract_doc_type enum type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_doc_type') THEN
    CREATE TYPE contract_doc_type AS ENUM (
      'MAIN',
      'AMENDMENT',
      'SIDE_LETTER',
      'EXHIBIT',
      'TERMINATION',
      'RENEWAL',
      'OTHER'
    );
  END IF;
END $$;

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- References
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Auditing
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create indexes on vendors table
CREATE INDEX IF NOT EXISTS vendor_name_idx ON vendors(name);
CREATE INDEX IF NOT EXISTS vendor_tenant_id_idx ON vendors(tenant_id);

-- Create contract_documents table
CREATE TABLE IF NOT EXISTS contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  
  -- Document classification
  doc_type contract_doc_type NOT NULL DEFAULT 'MAIN',
  is_primary BOOLEAN DEFAULT false,
  
  -- Document metadata
  effective_date DATE,
  notes TEXT,
  
  -- References
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  added_by UUID REFERENCES users(id),
  
  -- Auditing
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create indexes on contract_documents table
CREATE INDEX IF NOT EXISTS contract_doc_contract_id_idx ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS contract_doc_document_id_idx ON contract_documents(document_id);
CREATE INDEX IF NOT EXISTS contract_doc_type_idx ON contract_documents(doc_type);
CREATE INDEX IF NOT EXISTS contract_doc_tenant_id_idx ON contract_documents(tenant_id);
CREATE INDEX IF NOT EXISTS contract_doc_is_primary_idx ON contract_documents(is_primary);

-- Migrate existing contract documents to the new table
INSERT INTO contract_documents (
  contract_id,
  document_id,
  doc_type,
  is_primary,
  tenant_id,
  created_at,
  updated_at
)
SELECT 
  id, -- contract_id
  document_id,
  'MAIN', -- doc_type
  true, -- is_primary
  tenant_id,
  created_at,
  updated_at
FROM contracts
WHERE document_id IS NOT NULL;

-- Add vendor_id and description columns to contracts table
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for vendor_id
CREATE INDEX IF NOT EXISTS contract_vendor_id_idx ON contracts(vendor_id);

-- Add temporary nullable flag to document_id column
ALTER TABLE contracts 
  ALTER COLUMN document_id DROP NOT NULL;

-- Update any code that relies on document_id to use the contract_documents table
-- (This is handled in application code)

-- Drop the document_id column after a safe transition period
-- This will be handled in a future migration after confirming the new structure works well
-- ALTER TABLE contracts DROP COLUMN document_id;