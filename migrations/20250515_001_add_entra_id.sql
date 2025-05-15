-- Add Entra ID column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS entra_id TEXT;
-- Add unique constraint to ensure only one user per Entra ID
CREATE UNIQUE INDEX IF NOT EXISTS users_entra_id_unique ON users (entra_id) WHERE entra_id IS NOT NULL;