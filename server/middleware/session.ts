import session from 'express-session';
import { createClient } from 'redis';
import * as connectRedis from 'connect-redis';
import connectPg from 'connect-pg-simple';
import { Express } from 'express';
import { pool } from '../db';
import { logger } from '../utils/logger';
import { env, isProduction } from '../config/env';

/**
 * Session Configuration
 * 
 * Provides two session store implementations:
 * 1. Redis for primary production use (faster, better performance)
 * 2. PostgreSQL for fallback (more persistent, but slower)
 * 
 * The implementation is selected based on the centralized configuration.
 */

/**
 * Configure and initialize session middleware
 */
export function setupSession(app: Express): void {
  // Load session configuration from centralized env
  const sessionSecret = env.SESSION_SECRET;
  const sessionTtl = env.SESSION_TTL;
  const redisUrl = env.REDIS_URL;
  const redisEnabled = !!redisUrl;
  const redisPrefix = 'blueearth:';
  
  // Validate session secret
  if (!sessionSecret) {
    if (isProduction) {
      throw new Error('SESSION_SECRET environment variable is required for secure session management in production');
    } else {
      logger.warn('No SESSION_SECRET provided, using an insecure default for development only');
    }
  }

  // Create session options
  const sessionOptions: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: sessionTtl,
    },
    name: 'blueearth.sid',
  };

  // Set up Redis session store if Redis is enabled and URL is provided
  if (redisEnabled && redisUrl) {
    try {
      logger.info('Setting up Redis session store');
      // Connect-redis v7+ exports a class instead of a factory function
      const { RedisStore } = connectRedis;
      const redisClient = createClient({ url: redisUrl });
      
      // Event handlers for Redis client
      redisClient.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
      });
      
      redisClient.on('connect', () => {
        logger.info('Connected to Redis for session storage');
      });
      
      // Connect to Redis
      redisClient.connect().catch((err) => {
        logger.error('Redis connection failed, falling back to PostgreSQL session store', { error: err.message });
        setupPgSessionStore(app, sessionOptions, sessionTtl);
      });
      
      // Setup Redis session store
      sessionOptions.store = new RedisStore({ 
        client: redisClient,
        prefix: redisPrefix
      });
      app.use(session(sessionOptions));
      
    } catch (error: any) {
      logger.error('Failed to initialize Redis session store, falling back to PostgreSQL', { error: error.message });
      setupPgSessionStore(app, sessionOptions, sessionTtl);
    }
  } else {
    // If Redis is not enabled or URL is not provided, use PostgreSQL session store
    logger.info('Redis not configured, using PostgreSQL session store');
    setupPgSessionStore(app, sessionOptions, sessionTtl);
  }
}

/**
 * Set up PostgreSQL session store
 */
function setupPgSessionStore(app: Express, sessionOptions: session.SessionOptions, sessionTtl: number): void {
  try {
    const PgStore = connectPg(session);
    const pgStoreOptions = {
      pool,
      tableName: 'sessions',
      createTableIfMissing: true,
      ttl: sessionTtl / 1000, // Convert ms to seconds
    };
    
    sessionOptions.store = new PgStore(pgStoreOptions);
    app.use(session(sessionOptions));
    logger.info('PostgreSQL session store configured successfully');
    
  } catch (error: any) {
    logger.error('Failed to initialize PostgreSQL session store', { error: error.message });
    
    if (isProduction) {
      logger.error('Cannot run in production without a working session store');
      process.exit(1);
    } else {
      logger.warn('Falling back to in-memory session storage (not suitable for production)');
      // Fallback to memory store (not suitable for production)
      app.use(session(sessionOptions));
    }
  }
}