/**
 * Server Configuration Module
 * 
 * This module provides a centralized, type-safe configuration system for the server.
 * It loads configuration from environment variables with sensible defaults and validation.
 */

import 'dotenv/config';
import { z } from 'zod';

// Environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const IS_DEV = NODE_ENV === 'development';
const IS_TEST = NODE_ENV === 'test';

// Environment variable validation schemas
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  
  // Database
  DATABASE_URL: z.string().nonempty(),
  
  // Authentication
  JWT_SECRET: z.string().default('development-jwt-secret'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  
  // Session
  SESSION_SECRET: z.string().default('development-session-secret'),
  SESSION_TTL: z.coerce.number().default(7 * 24 * 60 * 60 * 1000), // 1 week in ms
  
  // Email (SendGrid)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().default('noreply@bluearthcapital.com'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW: z.coerce.number().default(15 * 60 * 1000), // 15 minutes in ms
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_WINDOW: z.coerce.number().default(15 * 60 * 1000), // 15 minutes in ms 
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(5),
  
  // CORS
  CORS_ORIGIN: z.string().default(IS_PROD ? 'https://portal.bluearthcapital.com' : '*'),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default(IS_PROD ? 'info' : 'debug'),
  
  // External APIs
  BUBBLE_API_KEY: z.string().optional(),
  BUBBLE_API_URL: z.string().default('https://app.bubble.io/api/1.1/obj/'),
  
  // Caching
  REDIS_URL: z.string().optional(),
  CACHE_TTL: z.coerce.number().default(300), // 5 minutes in seconds
  
  // File uploads
  FILE_UPLOAD_MAX_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  
  // Request limits
  REQUEST_BODY_LIMIT: z.coerce.number().default(5 * 1024 * 1024), // 5MB
  
  // Timeouts
  DEFAULT_TIMEOUT: z.coerce.number().default(30000), // 30 seconds
  DATABASE_TIMEOUT: z.coerce.number().default(5000), // 5 seconds
  EXTERNAL_API_TIMEOUT: z.coerce.number().default(10000), // 10 seconds
  
  // Features
  ENABLE_SWAGGER: z.coerce.boolean().default(true),
  ENABLE_METRICS: z.coerce.boolean().default(IS_PROD),
  ENABLE_REPORTING: z.coerce.boolean().default(IS_PROD),
});

// Environment variable validation results
const env = envSchema.parse(process.env);

// Configuration object with sections
const config = {
  // Environment
  env: {
    current: env.NODE_ENV,
    isProd: IS_PROD,
    isDev: IS_DEV,
    isTest: IS_TEST,
    isDevelopment: IS_DEV,
    isProduction: IS_PROD,
  },
  
  // Server
  server: {
    port: env.PORT,
    host: env.HOST,
    trustProxy: IS_PROD,
    bodyLimit: '1mb',
  },
  
  // Database
  database: {
    url: env.DATABASE_URL,
    timeout: env.DATABASE_TIMEOUT,
  },
  
  // Authentication
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
  },
  
  // Session
  session: {
    secret: env.SESSION_SECRET,
    ttl: env.SESSION_TTL,
    useRedis: !!env.REDIS_URL,
  },
  
  // Email (SendGrid)
  email: {
    sendgrid: {
      apiKey: env.SENDGRID_API_KEY,
      fromEmail: env.SENDGRID_FROM_EMAIL,
    },
  },
  
  // Rate limiting
  rateLimit: {
    window: env.RATE_LIMIT_WINDOW,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    auth: {
      window: env.AUTH_RATE_LIMIT_WINDOW,
      maxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
    },
    passwordReset: {
      window: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // Limit password reset attempts
    },
  },
  
  // CORS
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours in seconds
  },
  
  // Security settings
  security: {
    contentSecurityPolicy: IS_PROD,
    hsts: IS_PROD,
    sessionSecret: env.SESSION_SECRET,
    sessionTtl: env.SESSION_TTL,
  },
  
  // Redis configuration
  redis: {
    url: env.REDIS_URL,
    enabled: !!env.REDIS_URL,
    prefix: 'blueearth:',
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
    prettyPrint: IS_DEV,
  },
  
  // External integrations
  integrations: {
    bubble: {
      apiKey: env.BUBBLE_API_KEY,
      apiUrl: env.BUBBLE_API_URL,
      syncIntervalMinutes: 60, // Sync employee data every 60 minutes
    },
  },
  
  // Caching
  cache: {
    redis: {
      url: env.REDIS_URL,
    },
    ttl: env.CACHE_TTL,
  },
  
  // File uploads
  uploads: {
    maxSize: env.FILE_UPLOAD_MAX_SIZE,
  },
  
  // Request limits
  requestLimits: {
    bodyLimit: env.REQUEST_BODY_LIMIT,
  },
  
  // Timeouts
  timeouts: {
    default: env.DEFAULT_TIMEOUT,
    database: env.DATABASE_TIMEOUT,
    externalApi: env.EXTERNAL_API_TIMEOUT,
  },
  
  // Features
  features: {
    enableSwagger: env.ENABLE_SWAGGER,
    enableMetrics: env.ENABLE_METRICS,
    enableReporting: env.ENABLE_REPORTING,
  },
};

export default config;