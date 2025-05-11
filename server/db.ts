import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimize pool configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';

// Configure connection pool with optimized settings
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 20 : 10,     // Maximum number of clients the pool should contain
  idleTimeoutMillis: 30000,        // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000,   // How long to wait before timing out when connecting a new client
  maxUses: 7500,                   // Close and replace a connection after it has been used this many times
});

// Add event listeners for connection issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
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
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}