import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import config from './utils/config';
import { logger } from './utils/logger';

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Get database configuration from centralized config
const { connectionString, poolSize, idleTimeout, connectionTimeoutMs } = config.database;

// Validate required environment variables
if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool with optimized settings
export const pool = new Pool({
  connectionString,
  max: poolSize,                     // Maximum number of clients the pool should contain
  idleTimeoutMillis: idleTimeout,    // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: connectionTimeoutMs, // How long to wait before timing out when connecting a new client
  maxUses: 7500,                     // Close and replace a connection after it has been used this many times
  statement_timeout: config.database.statementTimeout, // Timeout for individual queries
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
    logger.error('Database connection check failed', { 
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}