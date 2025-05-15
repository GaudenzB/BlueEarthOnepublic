import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { env } from './config/env';
import { logger } from './utils/logger';

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Get database configuration from centralized env
const dbUrl = env.DATABASE_URL;

// The env validation in env.ts already ensures DATABASE_URL is set
// But we'll keep a check here for safety
if (!dbUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool with optimized settings
export const pool = new Pool({
  connectionString: dbUrl,
  max: 10,                       // Maximum number of clients the pool should contain
  idleTimeoutMillis: 30000,      // How long a client is allowed to remain idle before being closed (30s)
  connectionTimeoutMillis: env.DATABASE_TIMEOUT, // Use configured timeout from environment
  maxUses: 7500,                 // Close and replace a connection after it has been used this many times
});

// Add event listeners for connection issues
pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', { error: err.message });
  // In production, this could trigger monitoring or restart mechanisms
});

// Initialize Drizzle ORM with the connection pool
export const db = drizzle({ client: pool, schema });

// Function to healthcheck the database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Attempt a simple query to verify database connection
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      logger.info('Database connection check successful');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    // Enhanced error reporting with database connection details (sanitized)
    logger.error('Database connection check failed', { 
      error: error instanceof Error ? error.message : String(error),
      database: {
        host: new URL(dbUrl).hostname,
        port: new URL(dbUrl).port || 'default',
        database: new URL(dbUrl).pathname.replace('/', ''),
        // No credentials logged
      }
    });
    return false;
  }
}