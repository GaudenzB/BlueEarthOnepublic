-- Contract Management Schema Migration
-- This migration adds tables for contract management with focus on legal document extraction

-- Create enum types
CREATE TYPE contract_status AS ENUM (
  'DRAFT',
  'UNDER_REVIEW',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'RENEWED'
);

CREATE TYPE contract_type AS ENUM (
  'LPA',
  'SUBSCRIPTION_AGREEMENT',
  'SIDE_LETTER',
  'AMENDMENT',
  'NDA',
  'SERVICE_AGREEMENT',
  'OTHER'
);

CREATE TYPE obligation_status AS ENUM (
  'PENDING',
  'COMPLETED',
  'OVERDUE',
  'WAIVED'
);

CREATE TYPE obligation_type AS ENUM (
  'REPORTING',
  'PAYMENT',
  'DISCLOSURE',
  'COMPLIANCE',
  'OPERATIONAL',
  'OTHER'
);

CREATE TYPE confidence_level AS ENUM (
  'HIGH',
  'MEDIUM',
  'LOW',
  'UNVERIFIED'
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Contract metadata
  contract_type contract_type NOT NULL,
  contract_status contract_status NOT NULL DEFAULT 'DRAFT',
  contract_number VARCHAR(100),
  
  -- Parties information
  counterparty_name VARCHAR(255),
  counterparty_address TEXT,
  counterparty_contact_email VARCHAR(255),
  
  -- Key dates
  effective_date DATE,
  expiry_date DATE,
  execution_date DATE,
  renewal_date DATE,
  
  -- Financial terms
  total_value VARCHAR(100),
  currency VARCHAR(20),
  
  -- Extraction confidence
  confidence_level confidence_level DEFAULT 'UNVERIFIED',
  
  -- References
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Auditing
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  
  -- Raw extraction data from AI
  raw_extraction JSONB,
  
  -- Additional metadata
  source_page_references JSONB,
  custom_metadata JSONB
);

-- Create contract clauses table
CREATE TABLE IF NOT EXISTS contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Clause metadata
  title VARCHAR(255),
  section_number VARCHAR(50),
  content TEXT NOT NULL,
  
  -- Page references in source document
  page_number INTEGER,
  page_coordinates JSONB,
  
  -- Extraction confidence
  confidence_level confidence_level DEFAULT 'UNVERIFIED',
  
  -- References
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Auditing
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create contract obligations table
CREATE TABLE IF NOT EXISTS contract_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  clause_id UUID REFERENCES contract_clauses(id),
  
  -- Obligation details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  obligation_type obligation_type NOT NULL,
  
  -- Responsible parties
  responsible_party VARCHAR(255),
  
  -- Due date and status
  due_date DATE,
  recurring_pattern VARCHAR(100),
  obligation_status obligation_status DEFAULT 'PENDING',
  
  -- Completion metadata
  completed_date DATE,
  completed_by UUID REFERENCES users(id),
  completion_notes TEXT,
  
  -- Notification settings
  reminder_days INTEGER[],
  notify_user_ids UUID[],
  
  -- Extraction confidence
  confidence_level confidence_level DEFAULT 'UNVERIFIED',
  
  -- References
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_by UUID REFERENCES users(id),
  
  -- Auditing
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS contract_document_id_idx ON contracts(document_id);
CREATE INDEX IF NOT EXISTS contract_type_idx ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS contract_status_idx ON contracts(contract_status);
CREATE INDEX IF NOT EXISTS contract_tenant_id_idx ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS contract_effective_date_idx ON contracts(effective_date);
CREATE INDEX IF NOT EXISTS contract_expiry_date_idx ON contracts(expiry_date);

CREATE INDEX IF NOT EXISTS clause_contract_id_idx ON contract_clauses(contract_id);
CREATE INDEX IF NOT EXISTS clause_tenant_id_idx ON contract_clauses(tenant_id);

CREATE INDEX IF NOT EXISTS obligation_contract_id_idx ON contract_obligations(contract_id);
CREATE INDEX IF NOT EXISTS obligation_type_idx ON contract_obligations(obligation_type);
CREATE INDEX IF NOT EXISTS obligation_due_date_idx ON contract_obligations(due_date);
CREATE INDEX IF NOT EXISTS obligation_status_idx ON contract_obligations(obligation_status);
CREATE INDEX IF NOT EXISTS obligation_tenant_id_idx ON contract_obligations(tenant_id);