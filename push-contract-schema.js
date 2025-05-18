require('dotenv').config();
const { drizzle } = require('drizzle-orm/neon-serverless');
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');
const { migrate } = require('drizzle-orm/neon-serverless/migrator');
const path = require('path');

// Configure the WebSocket constructor for Neon
const neonConfig = require('@neondatabase/serverless');
neonConfig.neonConfig.webSocketConstructor = ws;

// Get database URL from environment
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create a connection pool
const pool = new Pool({ connectionString: dbUrl });

// Initialize Drizzle with the pool
const db = drizzle(pool);

async function main() {
  try {
    console.log('Creating contract_upload_analysis table...');
    
    // Execute raw SQL to create the table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contract_upload_analysis (
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
      
      CREATE INDEX IF NOT EXISTS idx_contract_upload_analysis_document_id
      ON contract_upload_analysis(document_id);
      
      CREATE INDEX IF NOT EXISTS idx_contract_upload_analysis_tenant_id
      ON contract_upload_analysis(tenant_id);
      
      CREATE INDEX IF NOT EXISTS idx_contract_upload_analysis_status
      ON contract_upload_analysis(status);
    `);
    
    console.log('Contract upload analysis table created successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await pool.end();
  }
}

main();