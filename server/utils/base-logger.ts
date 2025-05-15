/**
 * Base Logger Utility
 * 
 * A simple logger used during initialization before the full logger is set up.
 * Helps avoid circular dependencies.
 */

import pino from 'pino';

// Create basic logger with sensible defaults
const baseLogger = pino({
  level: process.env['LOG_LEVEL'] || 'info',
  name: 'blueearth-portal',
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

export { baseLogger };