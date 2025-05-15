-- Migration: Add entra_id column to users table
-- Description: Adds support for Microsoft Entra ID (formerly Azure AD) single sign-on
-- Date: 2025-05-15

-- Check if column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'entra_sso_id'
    ) THEN
        -- Add entra_sso_id column to users table
        ALTER TABLE users ADD COLUMN entra_sso_id VARCHAR(255);
        
        -- Add unique constraint to ensure one user per Entra ID
        CREATE UNIQUE INDEX users_entra_sso_id_idx ON users (entra_sso_id) 
        WHERE entra_sso_id IS NOT NULL;
        
        -- Create function to update the updated_at timestamp
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Create trigger to automatically update the updated_at column
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;