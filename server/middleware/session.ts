import session from 'express-session';
import { createClient } from 'redis';
import connectRedis from 'connect-redis';
import connectPg from 'connect-pg-simple';
import { Express } from 'express';
import { pool } from '../db';
import { logger } from '../utils/logger';

/**
 * Session Configuration
 * 
 * Provides two session store implementations:
 * 1. Redis for primary production use (faster, better performance)
 * 2. PostgreSQL for fallback (more persistent, but slower)
 * 
 * The implementation is selected based on environment variables.
 */

// Session expiry time (7 days by default)
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Session secret from environment variable (required)
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required for secure session management');
}

// Redis URL (optional)
const REDIS_URL = process.env.REDIS_URL;

/**
 * Configure and initialize session middleware
 */
export function setupSession(app: Express): void {
  const sessionOptions: session.SessionOptions = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_TTL,
    },
    name: 'blueearth.sid',
  };

  // Set up Redis session store if REDIS_URL is provided
  if (REDIS_URL) {
    try {
      logger.info('Setting up Redis session store');
      const RedisStore = connectRedis(session);
      const redisClient = createClient({ url: REDIS_URL });
      
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
        setupPgSessionStore(app, sessionOptions);
      });
      
      // Setup Redis session store
      sessionOptions.store = new RedisStore({ client: redisClient });
      app.use(session(sessionOptions));
      
    } catch (error: any) {
      logger.error('Failed to initialize Redis session store, falling back to PostgreSQL', { error: error.message });
      setupPgSessionStore(app, sessionOptions);
    }
  } else {
    // If no REDIS_URL, use PostgreSQL session store
    logger.info('REDIS_URL not provided, using PostgreSQL session store');
    setupPgSessionStore(app, sessionOptions);
  }
}

/**
 * Set up PostgreSQL session store
 */
function setupPgSessionStore(app: Express, sessionOptions: session.SessionOptions): void {
  try {
    const PgStore = connectPg(session);
    const pgStoreOptions = {
      pool,
      tableName: 'sessions',
      createTableIfMissing: true,
      ttl: SESSION_TTL / 1000, // Convert ms to seconds
    };
    
    sessionOptions.store = new PgStore(pgStoreOptions);
    app.use(session(sessionOptions));
    logger.info('PostgreSQL session store configured successfully');
    
  } catch (error: any) {
    logger.error('Failed to initialize PostgreSQL session store', { error: error.message });
    logger.warn('Falling back to in-memory session storage (not suitable for production)');
    
    // Fallback to memory store (not suitable for production)
    app.use(session(sessionOptions));
  }
}