#!/usr/bin/env node

// Simple direct approach to run SQL migration
// Save as run-migration.cjs and run with node run-migration.cjs

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function runMigration() {
  console.log('Running SQL migration directly...');
  
  // Ensure we have DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not found, getting from .env file...');
    try {
      require('dotenv').config();
    } catch (err) {
      console.log('dotenv not available, using psql environment variables');
    }
  }
  
  // If we still don't have DATABASE_URL, construct it from individual variables
  if (!process.env.DATABASE_URL && process.env.PGHOST) {
    const pgUser = process.env.PGUSER || 'postgres';
    const pgPass = process.env.PGPASSWORD ? encodeURIComponent(process.env.PGPASSWORD) : '';
    const pgHost = process.env.PGHOST || 'localhost';
    const pgPort = process.env.PGPORT || '5432';
    const pgDb = process.env.PGDATABASE || 'postgres';
    
    const passwordPart = pgPass ? `:${pgPass}` : '';
    process.env.DATABASE_URL = `postgres://${pgUser}${passwordPart}@${pgHost}:${pgPort}/${pgDb}`;
    console.log(`Constructed DATABASE_URL from environment variables (password hidden)`);
  }
  
  if (!process.env.DATABASE_URL) {
    console.error('Error: No database connection information available');
    process.exit(1);
  }

  // Read the migration SQL
  const migrationPath = path.join(__dirname, 'migrations', '20250515_001_add_entra_id.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('Migration SQL content:');
  console.log(sql);
  
  // Connect to DB
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Execute migration
    console.log('Executing SQL migration...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
    
    // Record migration in migrations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await pool.query(
      'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      ['20250515_001_add_entra_id.sql']
    );
    
    console.log('Migration recorded in migrations table');
    
    // Verify column was added
    const { rows } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'entra_id'
    `);
    
    if (rows.length > 0) {
      console.log('Success! entra_id column exists in users table:');
      console.log(rows[0]);
    } else {
      console.error('Error: entra_id column was not created');
    }
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await pool.end();
  }
}

runMigration();