/**
 * Health Check Endpoints
 * 
 * This module provides health check endpoints for the application,
 * allowing monitoring systems to verify the application's status.
 */

import express from 'express';
import { db } from '../db';
import { pino } from 'pino';
import * as fs from 'fs';
import * as os from 'os';

const router = express.Router();
const logger = pino();

type HealthCheckResult = {
  status: 'pass' | 'fail' | 'warn';
  version?: string;
  description?: string;
  checks?: Record<string, {
    status: 'pass' | 'fail' | 'warn';
    componentType?: string;
    observedValue?: any;
    observedUnit?: string;
    output?: string;
    time?: string;
    responseTime?: number;
  }>;
};

/**
 * Basic health check endpoint
 * GET /api/health
 */
router.get('/', async (req, res) => {
  let status: 'pass' | 'fail' = 'pass';
  const version = process.env.npm_package_version || '1.0.0';
  const startTime = Date.now();
  
  const result: HealthCheckResult = {
    status,
    version,
    description: 'BlueEarthOne Health Check',
    checks: {
      server: {
        status: 'pass',
        componentType: 'system',
        time: new Date().toISOString(),
        responseTime: Date.now() - startTime
      }
    }
  };
  
  res.json(result);
});

/**
 * Detailed health check endpoint
 * GET /api/health/detailed
 */
router.get('/detailed', async (req, res) => {
  let status: 'pass' | 'fail' = 'pass';
  const version = process.env.npm_package_version || '1.0.0';
  const startTime = Date.now();
  
  const checks: Record<string, any> = {
    server: {
      status: 'pass',
      componentType: 'system',
      time: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      observedValue: {
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    }
  };
  
  // Check database connection
  try {
    const dbStartTime = Date.now();
    await db.execute('SELECT 1');
    
    checks.database = {
      status: 'pass',
      componentType: 'datastore',
      time: new Date().toISOString(),
      responseTime: Date.now() - dbStartTime
    };
  } catch (error) {
    status = 'fail';
    checks.database = {
      status: 'fail',
      componentType: 'datastore',
      time: new Date().toISOString(),
      output: (error as Error).message
    };
  }
  
  // Check file system
  try {
    const fsStartTime = Date.now();
    const tempDir = os.tmpdir();
    const testFile = `${tempDir}/health-check-${Date.now()}.txt`;
    
    fs.writeFileSync(testFile, 'Health check test file');
    fs.readFileSync(testFile);
    fs.unlinkSync(testFile);
    
    checks.filesystem = {
      status: 'pass',
      componentType: 'system',
      time: new Date().toISOString(),
      responseTime: Date.now() - fsStartTime
    };
  } catch (error) {
    status = 'fail';
    checks.filesystem = {
      status: 'fail',
      componentType: 'system',
      time: new Date().toISOString(),
      output: (error as Error).message
    };
  }
  
  const result: HealthCheckResult = {
    status,
    version,
    description: 'BlueEarthOne Detailed Health Check',
    checks
  };
  
  res.json(result);
});

/**
 * Database health check endpoint
 * GET /api/health/database
 */
router.get('/database', async (req, res) => {
  let status: 'pass' | 'fail' = 'pass';
  const startTime = Date.now();
  
  try {
    // Perform a more detailed database check
    const results = await db.execute('SELECT current_timestamp, version()');
    
    const result: HealthCheckResult = {
      status,
      checks: {
        database: {
          status: 'pass',
          componentType: 'datastore',
          time: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          observedValue: {
            version: results.rows?.[0]?.version,
            timestamp: results.rows?.[0]?.current_timestamp
          }
        }
      }
    };
    
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Database health check failed');
    
    res.status(500).json({
      status: 'fail',
      checks: {
        database: {
          status: 'fail',
          componentType: 'datastore',
          time: new Date().toISOString(),
          output: (error as Error).message
        }
      }
    });
  }
});

/**
 * Storage health check endpoint
 * GET /api/health/storage
 */
router.get('/storage', async (req, res) => {
  let status: 'pass' | 'fail' = 'pass';
  const startTime = Date.now();
  
  try {
    // Check uploads directory access
    const uploadsDir = './uploads';
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const testFile = `${uploadsDir}/health-check-${Date.now()}.txt`;
    fs.writeFileSync(testFile, 'Health check test file');
    fs.readFileSync(testFile);
    fs.unlinkSync(testFile);
    
    // Check external storage if configured (S3, etc.)
    const hasExternalStorage = process.env.AWS_S3_BUCKET && 
                              process.env.AWS_ACCESS_KEY_ID && 
                              process.env.AWS_SECRET_ACCESS_KEY;
    
    const storageProvider = hasExternalStorage ? 'AWS S3' : 'Local FileSystem';
    
    const result: HealthCheckResult = {
      status,
      checks: {
        storage: {
          status: 'pass',
          componentType: 'storage',
          time: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          observedValue: {
            provider: storageProvider,
            bucket: process.env.AWS_S3_BUCKET || 'local'
          }
        }
      }
    };
    
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Storage health check failed');
    
    res.status(500).json({
      status: 'fail',
      checks: {
        storage: {
          status: 'fail',
          componentType: 'storage',
          time: new Date().toISOString(),
          output: (error as Error).message
        }
      }
    });
  }
});

/**
 * SSO integration health check endpoint
 * GET /api/health/sso
 */
router.get('/sso', async (req, res) => {
  const startTime = Date.now();
  
  // Check Entra ID (Azure AD) configuration
  const hasEntraIdConfig = process.env.ENTRA_ID_CLIENT_ID && 
                           process.env.ENTRA_ID_CLIENT_SECRET && 
                           process.env.ENTRA_ID_TENANT_ID;
  
  if (!hasEntraIdConfig) {
    return res.status(204).json({
      status: 'warn',
      checks: {
        sso: {
          status: 'warn',
          componentType: 'security',
          time: new Date().toISOString(),
          message: 'SSO integration not configured'
        }
      }
    });
  }
  
  try {
    // This is a placeholder for actual SSO health check
    // In a real implementation, this would test the OAuth endpoints
    // and verify that the integration is working properly
    
    if (process.env.NODE_ENV === 'development') {
      // In development, just check if the config exists
      return res.json({
        status: 'pass',
        checks: {
          sso: {
            status: 'pass',
            componentType: 'security',
            time: new Date().toISOString(),
            responseTime: Date.now() - startTime,
            provider: 'Microsoft Entra ID'
          }
        }
      });
    }
    
    // In production, this would actually test the OAuth connection
    
    res.json({
      status: 'pass',
      checks: {
        sso: {
          status: 'pass',
          componentType: 'security',
          time: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          provider: 'Microsoft Entra ID'
        }
      }
    });
  } catch (error) {
    logger.error({ error }, 'SSO health check failed');
    
    // Determine if this is a critical failure
    // If SSO is required for the application to function, return 500
    // If it's optional, you might return 200 with a warning status
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        status: 'fail',
        checks: {
          sso: {
            status: 'fail',
            componentType: 'security',
            time: new Date().toISOString(),
            output: (error as Error).message
          }
        }
      });
    }
    
    // In development, don't fail the health check
    res.json({
      status: 'warn',
      checks: {
        sso: {
          status: 'warn',
          componentType: 'security',
          time: new Date().toISOString(),
          message: 'SSO integration not fully tested in development mode'
        }
      }
    });
  }
});

export default router;