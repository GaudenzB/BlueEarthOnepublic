/**
 * Health Check Routes
 * 
 * These endpoints are used by monitoring services to verify that the application
 * is running correctly and all dependencies are available.
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db';
import fs from 'fs';
import path from 'path';

// Basic health check that confirms server is running
const basicHealth = async (req: Request, res: Response) => {
  const health = {
    status: 'UP',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    version: getVersion()
  };

  return res.status(200).json(health);
};

// Get the version from package.json
function getVersion(): string {
  try {
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

// Detailed health check that verifies database connection
const detailedHealth = async (req: Request, res: Response) => {
  const health: any = {
    status: 'UP',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    version: getVersion(),
    components: {
      database: {
        status: 'UNKNOWN'
      }
    }
  };

  try {
    // Check database connection
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      if (result.rows.length > 0) {
        health.components.database = {
          status: 'UP',
          responseTime: '0ms', // You could measure this for more detail
          timestamp: result.rows[0].now
        };
      } else {
        health.components.database = {
          status: 'DEGRADED',
          details: 'Database query returned no results'
        };
        health.status = 'DEGRADED';
      }
    } finally {
      client.release();
    }
  } catch (error) {
    health.components.database = {
      status: 'DOWN',
      details: error instanceof Error ? error.message : 'Unknown database error'
    };
    health.status = 'DOWN';
    return res.status(503).json(health);
  }

  return res.status(200).json(health);
};

// Deep health check that verifies all critical components
const deepHealth = async (req: Request, res: Response) => {
  const health: any = {
    status: 'UP',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    version: getVersion(),
    components: {
      database: {
        status: 'UNKNOWN'
      },
      storage: {
        status: 'UNKNOWN'
      }
    }
  };

  // Check database connection
  try {
    const client = await pool.connect();
    try {
      // Verify database schema by checking for critical tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'documents', 'employees')
      `);
      
      const foundTables = tablesResult.rows.map((row: any) => row.table_name);
      const requiredTables = ['users', 'documents', 'employees'];
      const missingTables = requiredTables.filter(table => !foundTables.includes(table));
      
      if (missingTables.length === 0) {
        health.components.database = {
          status: 'UP',
          tables: foundTables,
          details: 'All required tables found'
        };
      } else {
        health.components.database = {
          status: 'DEGRADED',
          tables: foundTables,
          missing: missingTables,
          details: 'Missing required tables'
        };
        health.status = 'DEGRADED';
      }
    } finally {
      client.release();
    }
  } catch (error) {
    health.components.database = {
      status: 'DOWN',
      details: error instanceof Error ? error.message : 'Unknown database error'
    };
    health.status = 'DOWN';
  }

  // Check storage configuration
  try {
    const hasS3Config = process.env.AWS_S3_BUCKET && 
                        process.env.AWS_REGION && 
                        process.env.AWS_ACCESS_KEY_ID && 
                        process.env.AWS_SECRET_ACCESS_KEY;
    
    health.components.storage = {
      status: hasS3Config ? 'UP' : 'DEGRADED',
      type: hasS3Config ? 's3' : 'local',
      details: hasS3Config ? 'S3 configuration found' : 'Using local storage (not recommended for production)'
    };
    
    if (!hasS3Config && process.env.NODE_ENV === 'production') {
      health.status = 'DEGRADED';
    }
  } catch (error) {
    health.components.storage = {
      status: 'DEGRADED',
      details: error instanceof Error ? error.message : 'Unknown storage error'
    };
    
    if (process.env.NODE_ENV === 'production') {
      health.status = 'DEGRADED';
    }
  }

  const httpStatus = health.status === 'UP' ? 200 : 
                    health.status === 'DEGRADED' ? 200 : 503;
  
  return res.status(httpStatus).json(health);
};

// Create router
const router = Router();

// Register health check routes
router.get('/health', basicHealth);
router.get('/health/detailed', detailedHealth);
router.get('/health/deep', deepHealth);

export default router;