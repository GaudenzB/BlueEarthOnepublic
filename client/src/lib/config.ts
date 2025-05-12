/**
 * Client-side configuration
 * 
 * Provides a centralized configuration for the client side of the application.
 * Includes settings for API, auth, logging, and feature flags.
 */

// Environment specific configuration
const ENV = import.meta.env.MODE || 'development';
const IS_DEV = ENV === 'development';
const IS_PROD = ENV === 'production';

// Base URL for API requests (empty string means same origin)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Configuration object
const config = {
  // Environment
  env: ENV,
  isDev: IS_DEV,
  isProd: IS_PROD,
  
  // API
  api: {
    baseUrl: API_BASE_URL,
    timeout: 30000, // 30 seconds
    retries: IS_DEV ? 0 : 2, // No retries in development
    retryDelay: 1000, // 1 second
  },
  
  // Auth
  auth: {
    tokenKey: 'token',
    refreshThreshold: 5 * 60 * 1000, // 5 minutes
  },
  
  // Logging
  logging: {
    level: IS_DEV ? 'debug' : 'error',
    enableConsole: IS_DEV,
    captureErrors: IS_PROD,
  },
  
  // Feature flags
  features: {
    enableCache: true,
    enableOfflineMode: false,
    enableAnalytics: IS_PROD,
  },
  
  // Debug/development tools
  debug: {
    showDevTools: IS_DEV,
    logApiCalls: IS_DEV,
    mockApiResponses: false,
  },
};

export default config;