/**
 * Environment Configuration Module
 * 
 * This module centralizes all environment variable access and validation
 * to ensure consistent handling across the application.
 */

import { z } from 'zod';
import { baseLogger } from '../utils/base-logger';

// Define environment variable schema with validation
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server configuration
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  API_URL: z.string().optional(),
  
  // Database configuration
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  DATABASE_TIMEOUT: z.coerce.number().int().positive().default(5000), // 5 seconds
  
  // JWT configuration
  JWT_SECRET: z.string().min(32, 'JWT secret should be at least 32 characters').default('default_jwt_secret_with_minimum_required_length_security'),
  JWT_EXPIRY: z.string().default('24h'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  JWT_ACCESS_TOKEN_EXPIRY_SECONDS: z.coerce.number().default(3600),
  JWT_REFRESH_TOKEN_EXPIRY_SECONDS: z.coerce.number().default(604800),
  
  // Session configuration
  SESSION_SECRET: z.string().default('development-session-secret'),
  SESSION_TTL: z.coerce.number().default(7 * 24 * 60 * 60 * 1000), // 1 week in ms
  
  // Redis configuration
  REDIS_URL: z.string().optional(),
  
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
  
  // Microsoft Entra ID SSO Configuration
  ENTRA_ID_ENABLED: z.boolean().default(false),
  ENTRA_ID_TENANT_ID: z.string().optional(),
  ENTRA_ID_CLIENT_ID: z.string().optional(),
  ENTRA_ID_CLIENT_SECRET: z.string().optional(),
  ENTRA_ID_REDIRECT_URI: z.string().optional(),
  ENTRA_ID_SCOPES: z.string().default('openid profile email'),

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
  baseLogger.error('Environment validation failed', {
    errors: parseEnvResult.error.format(),
  });
  
  // Log specific missing critical variables
  parseEnvResult.error.errors.forEach(error => {
    baseLogger.error(`Environment variable issue: ${error.path} - ${error.message}`);
  });
  
  // Only exit in production; allow development to continue with warnings
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Invalid environment configuration');
  }
}

// Export validated environment variables
export const env = parseEnvResult.success 
  ? parseEnvResult.data 
  : process.env as unknown as z.infer<typeof envSchema>;

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
 * Check if Microsoft Entra ID SSO is configured
 */
export const isEntraIdConfigured = () => {
  // In development mode, always return true for demonstration purposes
  if (isDevelopment) {
    return true;
  }
  
  // In production, validate all required settings
  return env.ENTRA_ID_ENABLED && 
    !!env.ENTRA_ID_TENANT_ID && 
    !!env.ENTRA_ID_CLIENT_ID && 
    !!env.ENTRA_ID_CLIENT_SECRET && 
    !!env.ENTRA_ID_REDIRECT_URI;
};

/**
 * Get redacted config for safe logging
 * Removes sensitive values before logging configuration
 */
export const getRedactedConfig = (): Record<string, string | number | boolean | undefined> => {
  const redacted = { ...env } as Record<string, string | number | boolean | undefined>;
  
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
      redacted[key as keyof typeof redacted] = '***REDACTED***' as string;
    }
  });
  
  return redacted;
};

// Log configuration on startup (redacted for security)
baseLogger.info('Environment configuration loaded', {
  config: getRedactedConfig(),
  env: {
    current: env.NODE_ENV,
    isProd: isProduction,
    isDev: isDevelopment,
    isTest: isTest,
  }
});