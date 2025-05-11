import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment-specific configuration
const nodeEnv = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);

// Try to load environment-specific file first, then fall back to .env
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// Configuration defaults
const defaults = {
  // Server settings
  port: 3000,
  host: '0.0.0.0',
  
  // Database settings
  dbConnectionString: process.env.DATABASE_URL,
  dbPoolSize: 10,
  dbIdleTimeout: 10000,
  
  // Security settings
  jwtSecret: process.env.JWT_SECRET || 'development_jwt_secret',
  jwtExpiresIn: '8h',
  bcryptSaltRounds: nodeEnv === 'production' ? 12 : 10,
  csrfEnabled: nodeEnv !== 'development',
  
  // Redis settings
  redisUrl: process.env.REDIS_URL,
  redisEnabled: !!process.env.REDIS_URL,
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs per IP
    standardHeaders: true,
    legacyHeaders: false
  },
  authRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs per IP for auth routes
    standardHeaders: true,
    legacyHeaders: false
  },
  passwordResetRateLimit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per windowMs per IP for password reset
    standardHeaders: true, 
    legacyHeaders: false
  },
  
  // CORS settings
  corsOrigin: nodeEnv === 'production' 
    ? [process.env.FRONTEND_URL || 'https://blueearth.capital']
    : '*',
  
  // Logging settings
  logLevel: nodeEnv === 'production' ? 'info' : 'debug',
  logPrettyPrint: nodeEnv !== 'production',
  
  // Document storage settings
  documentStorage: {
    type: process.env.DOCUMENT_STORAGE_TYPE || 'local',
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
    fromEmail: process.env.EMAIL_FROM || 'no-reply@blueearth.capital',
    fromName: process.env.EMAIL_FROM_NAME || 'BlueEarth Capital',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
  },
  
  // Integration settings
  integrations: {
    bubbleApiKey: process.env.BUBBLE_API_KEY,
    bubbleApiUrl: process.env.BUBBLE_API_URL || 'https://blueearth.bubbleapps.io/api/1.1',
  },
  
  // Request timeouts
  timeouts: {
    default: 30000, // 30 seconds
    upload: 300000, // 5 minutes for uploads
    download: 60000, // 1 minute for downloads
  },
  
  // Performance settings
  queryCache: {
    enabled: true,
    ttl: 60 * 1000, // 1 minute
  },
  
  // Environment
  nodeEnv,
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
};

// Required environment variables in production
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

// Check for required env vars in production
if (nodeEnv === 'production') {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

export default defaults;