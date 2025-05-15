-- Migration: Add entra_id column to users table
-- This column is used to store the Microsoft Entra ID (formerly Azure AD) user identifier
-- for single sign-on (SSO) authentication

-- Check if the column already exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'entra_id'
    ) THEN
        -- Add the column to store Microsoft Entra ID claims
        ALTER TABLE users ADD COLUMN entra_id VARCHAR(255);
        
        -- Create an index for faster lookups
        CREATE INDEX idx_users_entra_id ON users(entra_id);
        
        -- Add a unique constraint to ensure one user per Entra ID
        ALTER TABLE users ADD CONSTRAINT unique_entra_id UNIQUE (entra_id);
    END IF;
END
$$;