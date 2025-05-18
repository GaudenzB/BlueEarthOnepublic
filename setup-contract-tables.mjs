/**
 * One-time script to set up contract upload analysis tables
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Setup proper paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Get database configuration from environment
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL must be set");
  process.exit(1);
}

// Configure connection pool
const pool = new Pool({
  connectionString: dbUrl,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function setupTables() {
  const client = await pool.connect();
  
  try {
    console.log('Creating contract_upload_analysis table if it doesn\'t exist...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Check if the table already exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'contract_upload_analysis'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('Table already exists, skipping creation');
    } else {
      // Create the contract_upload_analysis table
      await client.query(`
        CREATE TABLE contract_upload_analysis (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID NOT NULL,
          tenant_id UUID NOT NULL,
          user_id UUID,
          vendor VARCHAR(255),
          contract_title VARCHAR(255),
          doc_type VARCHAR(50),
          effective_date VARCHAR(50),
          termination_date VARCHAR(50),
          confidence JSONB,
          suggested_contract_id UUID,
          status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
          error TEXT,
          raw_analysis_json JSONB,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      console.log('Table contract_upload_analysis created successfully');
    }
    
    // Add index on document_id for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contract_upload_analysis_document_id
      ON contract_upload_analysis(document_id);
    `);
    
    // Add index on tenant_id for multi-tenant queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contract_upload_analysis_tenant_id
      ON contract_upload_analysis(tenant_id);
    `);
    
    // Add index on status for filtering by status
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contract_upload_analysis_status
      ON contract_upload_analysis(status);
    `);
    
    // Commit changes
    await client.query('COMMIT');
    
    console.log('Setup completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupTables().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});