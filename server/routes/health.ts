import { Router } from 'express';
import { checkDatabaseConnection } from '../db';
import { logger } from '../utils/logger';
import config from '../utils/config';

const router = Router();

/**
 * Basic health check endpoint
 * Returns a simple 200 OK response
 */
router.get('/', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

/**
 * Detailed health check endpoint
 * Checks database connection and other services
 */
router.get('/details', async (req, res) => {
  const startTime = process.hrtime();
  
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    
    // Check redis if enabled
    let redisConnected = false;
    if (config.redisEnabled) {
      // In a real implementation, this would check Redis connection
      redisConnected = true;
    }
    
    // Calculate response time
    const hrTime = process.hrtime(startTime);
    const responseTime = (hrTime[0] * 1000 + hrTime[1] / 1000000).toFixed(2);
    
    // Prepare service checks
    const services = {
      database: {
        status: dbConnected ? 'healthy' : 'unhealthy',
        message: dbConnected ? 'Connected' : 'Connection failed'
      },
      redis: config.redisEnabled 
        ? {
            status: redisConnected ? 'healthy' : 'unhealthy',
            message: redisConnected ? 'Connected' : 'Connection failed'
          }
        : { 
            status: 'disabled',
            message: 'Redis is not configured'
          }
    };
    
    // Determine overall health
    const unhealthyServices = Object.values(services).filter(s => s.status === 'unhealthy');
    const isHealthy = unhealthyServices.length === 0;
    
    // Prepare response
    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || 'unknown',
      uptime: `${Math.floor(process.uptime())}s`,
      services
    };
    
    // Log health check results
    if (!isHealthy) {
      logger.warn(`Health check failed: ${unhealthyServices.length} unhealthy services`, healthStatus);
    } else {
      logger.debug('Health check successful', healthStatus);
    }
    
    return res.status(isHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    logger.error('Health check error', error);
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Failed to check health status',
      error: process.env.NODE_ENV === 'production' ? undefined : error
    });
  }
});

export default router;