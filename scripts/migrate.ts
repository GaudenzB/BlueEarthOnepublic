/**
 * Database Migration Script
 * 
 * This script runs SQL migrations in the migrations/ directory.
 * Files are executed in alphanumeric order, which is why we prefix
 * migration files with dates (YYYYMMDD_NNN).
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { logger } from '../server/utils/logger';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function runMigrations(): Promise<void> {
  logger.info('Starting database migrations');
  
  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Get list of migrations that have already been applied
    const { rows: appliedMigrations } = await pool.query('SELECT name FROM migrations');
    const appliedMigrationNames = appliedMigrations.map(m => m.name);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    let migrationFiles: string[] = [];
    
    try {
      migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort to ensure they run in order
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        logger.warn('Migrations directory not found, creating it');
        fs.mkdirSync(migrationsDir, { recursive: true });
      } else {
        throw err;
      }
    }
    
    // Run migrations that haven't been applied yet
    for (const file of migrationFiles) {
      if (appliedMigrationNames.includes(file)) {
        logger.info(`Migration ${file} already applied, skipping`);
        continue;
      }
      
      // Read and execute the migration file
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      logger.info(`Applying migration: ${file}`);
      
      // Begin transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Run the migration
        await client.query(sql);
        
        // Record that this migration has been applied
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        
        await client.query('COMMIT');
        logger.info(`Successfully applied migration: ${file}`);
      } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error(`Failed to apply migration ${file}: ${error.message}`);
        throw error;
      } finally {
        client.release();
      }
    }
    
    logger.info('Database migrations completed');
  } catch (error: any) {
    logger.error(`Migration error: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations when script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().catch(err => {
    logger.error('Unhandled error in migrations:', err);
    process.exit(1);
  });
}