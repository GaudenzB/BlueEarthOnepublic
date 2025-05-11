import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { logger } from '../utils/logger';
import { authenticate, authorize } from '../auth';
import config from '../utils/config';
import { UserRole } from '@shared/schema';

const router = Router();

/**
 * Get application metrics
 * Restricted to admin and superadmin roles
 */
router.get('/metrics', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    // Get basic system metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Create metrics response
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: Math.floor(uptime),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        platform: process.platform,
        nodeVersion: process.version,
        cpuUsage: process.cpuUsage(),
      },
      application: {
        environment: config.nodeEnv,
        version: process.env.npm_package_version || 'unknown',
      }
    };
    
    return res.json(metrics);
  } catch (error) {
    logger.error('Error retrieving metrics', error);
    return res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

/**
 * Get application logs
 * Restricted to superadmin role
 */
router.get('/logs', authenticate, authorize(['superadmin']), async (req, res) => {
  try {
    const logDir = process.env.LOG_DIR || './logs';
    const logLevel = req.query.level as string || 'info';
    const limit = parseInt(req.query.limit as string || '100', 10);
    const logFile = process.env.LOG_FILE || path.join(logDir, 'app.log');
    
    // Check if log file exists
    if (!fs.existsSync(logFile)) {
      return res.status(404).json({ error: 'Log file not found' });
    }
    
    // Create log filter and processor
    const logs: any[] = [];
    
    // Create a read stream for the log file
    const readStream = createReadStream(logFile, { encoding: 'utf8' });
    
    // Process the log file line by line
    let buffer = '';
    
    readStream.on('data', (chunk) => {
      buffer += chunk;
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Save the incomplete line for the next chunk
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const logEntry = JSON.parse(line);
          
          // Filter by log level
          if (logLevel === 'all' || 
              (logLevel === 'error' && logEntry.level === 'error') ||
              (logLevel === 'warn' && ['warn', 'error'].includes(logEntry.level)) ||
              (logLevel === 'info' && ['info', 'warn', 'error'].includes(logEntry.level)) ||
              (logLevel === 'debug' && ['debug', 'info', 'warn', 'error'].includes(logEntry.level))) {
            logs.push(logEntry);
          }
          
          // Stop if we've reached the limit
          if (logs.length >= limit) {
            readStream.destroy();
            break;
          }
        } catch (err) {
          // Skip invalid JSON lines
        }
      }
    });
    
    readStream.on('end', () => {
      // Process any remaining data in the buffer
      if (buffer.trim()) {
        try {
          const logEntry = JSON.parse(buffer);
          
          // Apply the same filtering as above
          if (logLevel === 'all' || 
              (logLevel === 'error' && logEntry.level === 'error') ||
              (logLevel === 'warn' && ['warn', 'error'].includes(logEntry.level)) ||
              (logLevel === 'info' && ['info', 'warn', 'error'].includes(logEntry.level)) ||
              (logLevel === 'debug' && ['debug', 'info', 'warn', 'error'].includes(logEntry.level))) {
            logs.push(logEntry);
          }
        } catch (err) {
          // Skip invalid JSON
        }
      }
      
      // Send the logs
      return res.json({
        logs,
        count: logs.length,
        limit,
        level: logLevel
      });
    });
    
    readStream.on('error', (error) => {
      logger.error('Error reading log file', error);
      return res.status(500).json({ error: 'Failed to read log file' });
    });
  } catch (error) {
    logger.error('Error retrieving logs', error);
    return res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

export default router;