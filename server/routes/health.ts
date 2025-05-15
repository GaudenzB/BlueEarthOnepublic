/**
 * Health Check Routes
 * 
 * These routes provide different levels of health checks for the application:
 * - Basic: Simple ping to verify server is running
 * - Detailed: Includes database connectivity check
 * - Deep: Comprehensive check of all system components
 */

import express, { Request, Response } from 'express';
import { db, pool } from '../db';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { sql } from 'drizzle-orm';

const router = express.Router();

// Basic health check - just confirms the server is running
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
    
    return sendSuccess(res, healthData);
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    return sendError(res, 'Health check failed', 500);
  }
});

// Detailed health check - includes database connectivity
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // Basic health info
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      components: {
        server: { status: 'ok' },
        database: { status: 'unknown' },
      }
    };
    
    // Check database connectivity
    try {
      const startTime = Date.now();
      await pool.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      healthData.components.database = { 
        status: 'ok',
        responseTime: `${responseTime}ms`
      };
    } catch (dbError) {
      logger.error({ error: dbError }, 'Database health check failed');
      healthData.components.database = { 
        status: 'error',
        message: 'Failed to connect to database'
      };
      healthData.status = 'degraded';
    }
    
    const httpStatus = healthData.status === 'ok' ? 200 : 
                        healthData.status === 'degraded' ? 200 : 500;
    
    return res.status(httpStatus).json(healthData);
  } catch (error) {
    logger.error({ error }, 'Detailed health check failed');
    return sendError(res, 'Detailed health check failed', 500);
  }
});

// Deep health check - comprehensive check of all system components
router.get('/deep', async (req: Request, res: Response) => {
  try {
    // Basic health info
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      components: {
        server: { 
          status: 'ok',
          memory: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        },
        database: { status: 'unknown' },
        storage: { status: 'unknown' },
      }
    };
    
    // Check database connectivity
    try {
      const startTime = Date.now();
      await db.execute(sql`SELECT 1`);
      const responseTime = Date.now() - startTime;
      
      healthData.components.database = { 
        status: 'ok',
        responseTime: `${responseTime}ms`,
        connection: 'active'
      };
    } catch (dbError) {
      logger.error({ error: dbError }, 'Database health check failed');
      healthData.components.database = { 
        status: 'error',
        message: 'Failed to connect to database'
      };
      healthData.status = 'degraded';
    }
    
    // Check S3 storage connectivity (if configured)
    if (process.env.AWS_S3_BUCKET && 
        process.env.AWS_REGION && 
        process.env.AWS_ACCESS_KEY_ID && 
        process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const startTime = Date.now();
        
        const s3Client = new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
          }
        });
        
        await s3Client.send(new HeadBucketCommand({ 
          Bucket: process.env.AWS_S3_BUCKET 
        }));
        
        const responseTime = Date.now() - startTime;
        
        healthData.components.storage = {
          status: 'ok',
          responseTime: `${responseTime}ms`,
          provider: 'aws-s3',
          bucket: process.env.AWS_S3_BUCKET
        };
      } catch (s3Error) {
        logger.error({ error: s3Error }, 'S3 storage health check failed');
        
        // Don't expose sensitive information in error messages
        healthData.components.storage = {
          status: 'error',
          provider: 'aws-s3',
          message: process.env.NODE_ENV === 'production' ? 
            'Failed to connect to storage service' : 
            `S3 Error: ${(s3Error as Error).message}`
        };
        
        healthData.status = 'degraded';
      }
    } else {
      healthData.components.storage = {
        status: 'not_configured',
        message: 'S3 storage not configured'
      };
      
      if (process.env.NODE_ENV === 'production') {
        healthData.status = 'degraded';
      }
    }
    
    // Additional checks for production environments
    if (process.env.NODE_ENV === 'production') {
      // Here you would add additional production-specific health checks
      // For example: cache servers, message queues, etc.
    }
    
    const httpStatus = healthData.status === 'ok' ? 200 : 
                       healthData.status === 'degraded' ? 200 : 500;
    
    return res.status(httpStatus).json(healthData);
  } catch (error) {
    logger.error({ error }, 'Deep health check failed');
    return sendError(res, 'Deep health check failed', 500);
  }
});

export default router;