-- Migration: Add entra_id to users table
-- Date: 2025-05-15

-- Add entra_id column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'entra_id'
    ) THEN
        ALTER TABLE users ADD COLUMN entra_id UUID DEFAULT NULL;
        
        -- Add a unique constraint to ensure only one user per Entra ID
        -- But only for non-null values (allowing multiple users without an Entra ID)
        ALTER TABLE users ADD CONSTRAINT users_entra_id_unique UNIQUE (entra_id);
        
        -- Create an index for faster lookups by entra_id
        CREATE INDEX idx_users_entra_id ON users (entra_id);
        
        RAISE NOTICE 'Added entra_id column to users table';
    ELSE
        RAISE NOTICE 'entra_id column already exists in users table, skipping';
    END IF;
END $$;