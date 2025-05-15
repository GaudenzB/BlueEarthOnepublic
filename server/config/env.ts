/**
 * Environment Configuration Module
 * 
 * This module centralizes all environment variable access and validation
 * to ensure consistent handling across the application.
 */

import { z } from 'zod';
import { logger } from '../utils/logger';

// Define environment variable schema with validation
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server configuration
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  
  // Database configuration
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // JWT configuration
  JWT_SECRET: z.string().min(32, 'JWT secret should be at least 32 characters'),
  JWT_EXPIRY: z.string().default('24h'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  
  // Storage configuration
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  
  // AWS configuration (required if STORAGE_TYPE is 's3')
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // OpenAI configuration for document embedding generation
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-ada-002'),

  // Security settings
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

// Parse and validate environment variables
const parseEnvResult = envSchema.safeParse(process.env);

// Handle validation errors
if (!parseEnvResult.success) {
  logger.error('Environment validation failed', {
    errors: parseEnvResult.error.format(),
  });
  
  // Log specific missing critical variables
  parseEnvResult.error.errors.forEach(error => {
    logger.error(`Environment variable issue: ${error.path} - ${error.message}`);
  });
  
  // Only exit in production; allow development to continue with warnings
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment configuration');
  }
}

// Export validated environment variables
export const env = parseEnvResult.success 
  ? parseEnvResult.data 
  : process.env as z.infer<typeof envSchema>;

// Helper functions

/**
 * Check if we're in a production environment
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if we're in a development environment
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if we're in a test environment
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Check if S3 storage is configured
 */
export const isS3Configured = () => {
  return env.STORAGE_TYPE === 's3' && 
    env.AWS_REGION && 
    env.AWS_ACCESS_KEY_ID && 
    env.AWS_SECRET_ACCESS_KEY && 
    env.AWS_S3_BUCKET;
};

/**
 * Check if OpenAI API is configured
 */
export const isOpenAIConfigured = () => {
  return !!env.OPENAI_API_KEY;
};

/**
 * Get redacted config for safe logging
 * Removes sensitive values before logging configuration
 */
export const getRedactedConfig = () => {
  const redacted = { ...env };
  
  // Redact sensitive values
  const sensitiveKeys = [
    'JWT_SECRET', 
    'DATABASE_URL', 
    'AWS_ACCESS_KEY_ID', 
    'AWS_SECRET_ACCESS_KEY',
    'OPENAI_API_KEY'
  ];
  
  sensitiveKeys.forEach(key => {
    if (redacted[key as keyof typeof redacted]) {
      redacted[key as keyof typeof redacted] = '***REDACTED***' as any;
    }
  });
  
  return redacted;
};

// Log configuration on startup (redacted for security)
logger.info('Environment configuration loaded', {
  config: getRedactedConfig(),
  env: {
    current: env.NODE_ENV,
    isProd: isProduction,
    isDev: isDevelopment,
    isTest: isTest,
  }
});