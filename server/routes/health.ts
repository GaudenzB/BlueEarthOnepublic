/**
 * Health check routes
 * Used to verify the application status during deployment and monitoring
 */

import express from 'express';
import { pool } from '../db';
import os from 'os';
import { version } from '../../package.json';

const router = express.Router();

// Basic health check endpoint
router.get('/', async (req, res) => {
  try {
    // Check database connectivity
    const dbHealthy = await checkDatabaseConnection();
    
    // Get system information
    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuLoad: os.loadavg(),
      nodeVersion: process.version,
      hostname: os.hostname(),
    };
    
    // Get application information
    const appInfo = {
      version,
      env: process.env.NODE_ENV || 'development',
      startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    };
    
    // Check overall health status
    const isHealthy = dbHealthy;
    
    // Respond with appropriate status code based on health
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      status: isHealthy ? 'ok' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealthy,
      },
      system: systemInfo,
      app: appInfo
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed database health check
router.get('/db', async (req, res) => {
  try {
    const dbHealthy = await checkDatabaseConnection();
    const dbStats = await getDatabaseStats();
    
    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? 'ok' : 'unhealthy',
      timestamp: new Date().toISOString(),
      stats: dbStats
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Check database connection
 * @returns Promise<boolean> True if database is connected
 */
async function checkDatabaseConnection(): Promise<boolean> {
  try {
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

/**
 * Get database statistics
 * @returns Promise<object> Database statistics
 */
async function getDatabaseStats(): Promise<any> {
  const client = await pool.connect();
  try {
    // Get database size
    const dbSizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    
    // Get table counts
    const tableCountResult = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    // Get connection information
    const connectionResult = await client.query(`
      SELECT count(*) as connections
      FROM pg_stat_activity
    `);
    
    return {
      size: dbSizeResult.rows[0]?.size || 'unknown',
      tables: parseInt(tableCountResult.rows[0]?.table_count, 10) || 0,
      connections: parseInt(connectionResult.rows[0]?.connections, 10) || 0
    };
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return { error: 'Failed to fetch database statistics' };
  } finally {
    client.release();
  }
}

export default router;