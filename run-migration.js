/**
 * Simple SQL migration runner - ESM version
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables if needed
if (!process.env.DATABASE_URL) {
  dotenv.config();
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrate = async () => {
  try {
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir).sort();

    console.log(`Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(file => console.log(`- ${file}`));

    // Run each migration in sequence
    for (const migrationFile of migrationFiles) {
      console.log(`\nRunning migration: ${migrationFile}`);
      
      const filePath = path.join(migrationsDir, migrationFile);
      const sql = fs.readFileSync(filePath, 'utf8');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Execute the SQL commands
        await client.query(sql);
        
        // Create migrations table if it doesn't exist
        await client.query(`
          CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMP DEFAULT NOW()
          )
        `);
        
        // Record this migration
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [migrationFile]
        );
        
        await client.query('COMMIT');
        console.log(`Migration ${migrationFile} applied successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error applying migration ${migrationFile}:`, error.message);
        throw error;
      } finally {
        client.release();
      }
    }

    console.log('\nAll migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
};

// Run the migrations
migrate();