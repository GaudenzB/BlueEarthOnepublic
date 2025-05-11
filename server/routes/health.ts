import { Router } from 'express';
import { checkDatabaseConnection } from '../db';
import { logger } from '../utils/logger';
import config from '../utils/config';
import { version } from '../../package.json';
import os from 'os';

const router = Router();

/**
 * Basic health check endpoint - just confirms the API is responding
 */
router.get('/ping', (req, res) => {
  return res.json({ status: 'ok', message: 'pong' });
});

/**
 * Detailed health check endpoint for monitoring systems
 * Checks database connection and provides general service info
 */
router.get('/health', async (req, res) => {
  // Check database connection
  const dbStatus = await checkDatabaseConnection().catch(() => false);
  
  // Check Redis connection if configured
  let redisStatus = 'disabled';
  if (config.redisUrl) {
    try {
      // This is a simplified check that would need to be implemented
      // based on how Redis is initialized in your application
      redisStatus = 'ok';
    } catch (error) {
      logger.error('Health check: Redis connection failed', error);
      redisStatus = 'error';
    }
  }
  
  // Get system info
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();
  
  // Build health response object
  const health = {
    status: dbStatus ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    version,
    environment: config.nodeEnv,
    services: {
      database: dbStatus ? 'ok' : 'error',
      redis: redisStatus,
    },
    system: {
      uptime: Math.floor(uptime),
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      freeMemory: Math.round(freeMemory / 1024 / 1024),
      totalMemory: Math.round(totalMemory / 1024 / 1024),
      memoryUsagePercent: Math.round(((totalMemory - freeMemory) / totalMemory) * 100),
    },
  };
  
  // Return status code based on overall health
  const statusCode = health.status === 'ok' ? 200 : 503;
  return res.status(statusCode).json(health);
});

/**
 * Detailed readiness probe for Kubernetes or similar orchestration
 * This checks if the service is ready to accept traffic
 */
router.get('/ready', async (req, res) => {
  // Check database connection
  const dbConnected = await checkDatabaseConnection().catch(() => false);
  
  if (dbConnected) {
    return res.status(200).json({ status: 'ready' });
  } else {
    return res.status(503).json({ status: 'not ready', reason: 'database connection failed' });
  }
});

export default router;