/**
 * Centralized Configuration Management System
 * 
 * This module manages all application configuration with environment-specific settings.
 * It loads configuration from the appropriate .env file based on NODE_ENV and
 * provides sensible defaults for all configuration values.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

/**
 * Environment Type Definition
 */
type Environment = 'development' | 'production' | 'test';

/**
 * Configuration Categories
 */
interface EnvironmentConfig {
  // Server settings
  server: {
    port: number;
    host: string;
    trustProxy: boolean;
    bodyLimit: string;
  };
  
  // Database settings
  database: {
    connectionString: string | undefined;
    poolSize: number;
    idleTimeout: number;
    connectionTimeoutMs: number;
    statementTimeout: number;
  };
  
  // Security settings
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptSaltRounds: number;
    csrfEnabled: boolean;
    sessionSecret: string;
    sessionTtl: number; // in milliseconds
    contentSecurityPolicy: boolean;
    hsts: boolean | {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
  
  // Redis settings
  redis: {
    url: string | undefined;
    enabled: boolean;
    prefix: string;
  };
  
  // Rate limiting
  rateLimit: {
    standard: {
      windowMs: number;
      max: number;
      standardHeaders: boolean;
      legacyHeaders: boolean;
    };
    auth: {
      windowMs: number;
      max: number;
      standardHeaders: boolean;
      legacyHeaders: boolean;
    };
    passwordReset: {
      windowMs: number;
      max: number;
      standardHeaders: boolean;
      legacyHeaders: boolean;
    };
  };
  
  // CORS settings
  cors: {
    origin: string | string[] | RegExp | RegExp[];
    methods: string[];
    allowedHeaders: string[];
    maxAge: number;
  };
  
  // Logging settings
  logging: {
    level: string;
    prettyPrint: boolean;
    destination: string | undefined;
    redact: string[];
    includeIp: boolean;
  };
  
  // Document storage settings
  storage: {
    type: 'local' | 's3';
    s3: {
      bucket: string | undefined;
      region: string;
      accessKey: string | undefined;
      secretKey: string | undefined;
      endpoint: string | undefined;
    };
    local: {
      storagePath: string;
    };
  };
  
  // Email settings
  email: {
    fromEmail: string;
    fromName: string;
    sendgridApiKey: string | undefined;
    sendgridTemplates: {
      passwordReset: string;
      welcome: string;
      notification: string;
    };
  };
  
  // Integration settings
  integrations: {
    bubble: {
      apiKey: string | undefined;
      apiUrl: string;
      syncIntervalMinutes: number;
    };
  };
  
  // Request timeouts
  timeouts: {
    default: number;
    upload: number;
    download: number;
    database: number;
  };
  
  // Performance settings
  performance: {
    queryCache: {
      enabled: boolean;
      ttl: number;
    };
    compression: boolean;
  };
  
  // Environment info
  env: {
    current: Environment;
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
  };
  
  // Required environment variables
  requiredVars: {
    all: string[];
    production: string[];
  };
}

/**
 * Load environment-specific configuration
 */
function loadEnvironmentConfig(): void {
  const nodeEnv = (process.env.NODE_ENV || 'development') as Environment;
  const envPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);

  // Try to load environment-specific file first, then fall back to .env
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
}

// Load environment variables from the appropriate .env file
loadEnvironmentConfig();

// Get the current environment
const nodeEnv = (process.env.NODE_ENV || 'development') as Environment;

/**
 * Environment-specific configuration defaults
 */
const config: EnvironmentConfig = {
  // Server settings
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
    trustProxy: nodeEnv === 'production',
    bodyLimit: process.env.BODY_LIMIT || '1mb',
  },
  
  // Database settings
  database: {
    connectionString: process.env.DATABASE_URL,
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10),
    connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
    statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10),
  },
  
  // Security settings
  security: {
    jwtSecret: process.env.JWT_SECRET || (nodeEnv === 'production' ? '' : 'development_jwt_secret'),
    jwtExpiresIn: process.env.JWT_TOKEN_EXPIRY || '24h',
    bcryptSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS || (nodeEnv === 'production' ? '12' : '10'), 10),
    csrfEnabled: nodeEnv === 'production',
    sessionSecret: process.env.SESSION_SECRET || (nodeEnv === 'production' ? '' : 'development_session_secret'),
    sessionTtl: parseInt(process.env.SESSION_TTL || '604800000', 10), // 7 days in milliseconds
    contentSecurityPolicy: nodeEnv === 'production',
    hsts: nodeEnv === 'production' ? {
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true
    } : false,
  },
  
  // Redis settings
  redis: {
    url: process.env.REDIS_URL,
    enabled: !!process.env.REDIS_URL,
    prefix: 'blueearth-sess:',
  },
  
  // Rate limiting
  rateLimit: {
    standard: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      standardHeaders: true,
      legacyHeaders: false,
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
      standardHeaders: true,
      legacyHeaders: false,
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || '3', 10),
      standardHeaders: true,
      legacyHeaders: false,
    },
  },
  
  // CORS settings
  cors: {
    origin: nodeEnv === 'production' 
      ? [/\.blueearth\.capital$/, /\.replit\.app$/]
      : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug'),
    prettyPrint: nodeEnv !== 'production',
    destination: process.env.LOG_DESTINATION,
    redact: ['password', 'token', 'secret', 'Authorization'],
    includeIp: true,
  },
  
  // Document storage settings
  storage: {
    type: (process.env.DOCUMENT_STORAGE_TYPE as 'local' | 's3') || 'local',
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION || 'us-east-1',
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
      endpoint: process.env.S3_ENDPOINT,
    },
    local: {
      storagePath: process.env.LOCAL_STORAGE_PATH || './storage',
    },
  },
  
  // Email settings
  email: {
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@blueearth.capital',
    fromName: process.env.SENDGRID_FROM_NAME || 'BlueEarth Capital',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    sendgridTemplates: {
      passwordReset: process.env.SENDGRID_TEMPLATE_PASSWORD_RESET || 'd-abcdef123456', // Default template ID
      welcome: process.env.SENDGRID_TEMPLATE_WELCOME || 'd-abcdef123457',
      notification: process.env.SENDGRID_TEMPLATE_NOTIFICATION || 'd-abcdef123458',
    },
  },
  
  // Integration settings
  integrations: {
    bubble: {
      apiKey: process.env.BUBBLE_API_KEY,
      apiUrl: process.env.BUBBLE_API_URL || 'https://blueearth.bubbleapps.io/api/1.1',
      syncIntervalMinutes: parseInt(process.env.BUBBLE_SYNC_INTERVAL || '60', 10),
    },
  },
  
  // Request timeouts
  timeouts: {
    default: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10), // 30 seconds
    upload: parseInt(process.env.UPLOAD_TIMEOUT || '300000', 10), // 5 minutes
    download: parseInt(process.env.DOWNLOAD_TIMEOUT || '60000', 10), // 1 minute
    database: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10), // 30 seconds
  },
  
  // Performance settings
  performance: {
    queryCache: {
      enabled: process.env.QUERY_CACHE_ENABLED !== 'false',
      ttl: parseInt(process.env.QUERY_CACHE_TTL || '60000', 10), // 1 minute
    },
    compression: nodeEnv === 'production',
  },
  
  // Environment
  env: {
    current: nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
  },
  
  // Required environment variables
  requiredVars: {
    all: [
      'DATABASE_URL',
    ],
    production: [
      'DATABASE_URL',
      'JWT_SECRET',
      'SESSION_SECRET',
      'SENDGRID_API_KEY',
      'BUBBLE_API_KEY',
    ],
  },
};

/**
 * Validate required environment variables
 */
function validateRequiredVariables(config: EnvironmentConfig): void {
  // Check for variables required in all environments
  const missingAll = config.requiredVars.all.filter(envVar => !process.env[envVar]);
  
  if (missingAll.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingAll.join(', ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  // Check for variables required in production only
  if (config.env.isProduction) {
    const missingProd = config.requiredVars.production.filter(envVar => !process.env[envVar]);
    
    if (missingProd.length > 0) {
      const errorMessage = `Missing production-required environment variables: ${missingProd.join(', ')}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}

// Only validate variables if not being imported during tests
if (process.env.NODE_ENV !== 'test') {
  try {
    validateRequiredVariables(config);
  } catch (error) {
    if (nodeEnv === 'production') {
      // In production, we exit if required variables are missing
      process.exit(1);
    } else {
      // In development, we just log a warning
      console.warn('WARNING: Missing environment variables, but continuing in development mode');
    }
  }
}

export default config;