import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { logger } from './logger';

// Define configuration interface
export interface AppConfig {
  // Server
  nodeEnv: string;
  port: number;
  logLevel: string;
  corsOrigin: string;
  
  // Database
  databaseUrl: string;
  
  // Redis
  redisUrl?: string;
  
  // Security
  sessionSecret: string;
  jwtSecret: string;
  bcryptSaltRounds: number;
  
  // Rate limiting
  rateLimitWindowMs: number;
  rateLimitMax: number;
  authRateLimitWindowMs: number;
  authRateLimitMax: number;
  resetRateLimitWindowMs: number;
  resetRateLimitMax: number;
  
  // SendGrid
  sendgridApiKey?: string;
  sendgridFromEmail: string;
  
  // Bubble.io
  bubbleApiKey?: string;
  bubbleApiUrl: string;
  
  // Document Storage
  documentStorageType: 'local' | 's3';
  localStoragePath?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  s3BucketName?: string;
}

/**
 * Load environment-specific configuration
 */
export function loadConfig(): AppConfig {
  const env = process.env.NODE_ENV || 'development';
  const configPath = path.resolve(process.cwd(), `config/${env}.env`);
  
  // Check if config file exists
  if (fs.existsSync(configPath)) {
    logger.info(`Loading configuration from ${configPath}`);
    dotenv.config({ path: configPath });
  } else {
    logger.warn(`Configuration file not found at ${configPath}, using environment variables only`);
  }
  
  // Always load the .env file as well (for local development)
  const dotenvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(dotenvPath)) {
    logger.info('Loading additional configuration from .env file');
    dotenv.config({ path: dotenvPath });
  }
  
  // Required environment variables
  const requiredEnvVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'SESSION_SECRET',
    'JWT_SECRET'
  ];
  
  // Check for required environment variables
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    if (env === 'production') {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    } else {
      logger.warn(`Missing recommended environment variables: ${missingEnvVars.join(', ')}`);
    }
  }
  
  // Return configuration object
  return {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    
    // Database
    databaseUrl: process.env.DATABASE_URL || '',
    
    // Redis
    redisUrl: process.env.REDIS_URL,
    
    // Security
    sessionSecret: process.env.SESSION_SECRET || 'dev_session_secret',
    jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    
    // Rate limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authRateLimitWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '3600000', 10),
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
    resetRateLimitWindowMs: parseInt(process.env.RESET_RATE_LIMIT_WINDOW_MS || '3600000', 10),
    resetRateLimitMax: parseInt(process.env.RESET_RATE_LIMIT_MAX || '3', 10),
    
    // SendGrid
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@blueearthcapital.com',
    
    // Bubble.io
    bubbleApiKey: process.env.BUBBLE_API_KEY,
    bubbleApiUrl: process.env.BUBBLE_API_URL || 'https://api.bubble.io/v1/',
    
    // Document Storage
    documentStorageType: (process.env.DOCUMENT_STORAGE_TYPE || 'local') as 'local' | 's3',
    localStoragePath: process.env.LOCAL_STORAGE_PATH,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_REGION,
    s3BucketName: process.env.S3_BUCKET_NAME
  };
}

// Create config singleton
export const config = loadConfig();

// Export default
export default config;