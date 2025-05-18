-- Migration: Contract Data Model Refactoring
-- This migration adds support for:
-- 1. Contracts without documents
-- 2. Multiple document attachments
-- 3. Vendor relationships
-- 4. Document type categorization

-- Create vendors table
CREATE TABLE IF NOT EXISTS "vendors" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "website" TEXT,
  "address" TEXT,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdBy" UUID,
  "updatedBy" UUID
);

-- Add index on tenant
CREATE INDEX IF NOT EXISTS "vendors_tenantId_idx" ON "vendors" ("tenantId");

-- Create contract document type enum
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
END
$$;

-- Create contract_documents join table
CREATE TABLE IF NOT EXISTS "contract_documents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "contractId" UUID NOT NULL REFERENCES "contracts" ("id") ON DELETE CASCADE,
  "documentId" UUID NOT NULL REFERENCES "documents" ("id") ON DELETE CASCADE,
  "docType" contract_doc_type NOT NULL DEFAULT 'MAIN',
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "effectiveDate" DATE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint to ensure each document is only attached once
CREATE UNIQUE INDEX IF NOT EXISTS "contract_documents_contract_document_idx" 
  ON "contract_documents" ("contractId", "documentId");

-- Add constraint to ensure only one primary document per contract
CREATE UNIQUE INDEX IF NOT EXISTS "contract_documents_primary_idx" 
  ON "contract_documents" ("contractId") 
  WHERE "isPrimary" = true;

-- Create indices for performance
CREATE INDEX IF NOT EXISTS "contract_documents_contract_idx" ON "contract_documents" ("contractId");
CREATE INDEX IF NOT EXISTS "contract_documents_document_idx" ON "contract_documents" ("documentId");

-- Modify contracts table to add vendor relationship and description
ALTER TABLE "contracts" 
  ADD COLUMN IF NOT EXISTS "vendorId" UUID REFERENCES "vendors" ("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Create index on vendor relationship
CREATE INDEX IF NOT EXISTS "contracts_vendorId_idx" ON "contracts" ("vendorId");