import { Express } from 'express';
import { logger } from '../../../server/utils/logger';
import { initializeContractEventHandlers } from './contractEventHandlers';
import contractRoutes from './routes';

/**
 * Check if contracts module is enabled
 * Matches client-side behavior for consistency
 */
const isContractsEnabled = (): boolean => {
  // Feature is always enabled in development mode (for testing purposes)
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Use the same environment variable as the client
  return process.env.ENABLE_CONTRACTS === 'true';
};

/**
 * Initialize the contract module server components
 * @param app Express application instance
 * @returns void
 */
export function setupContractModule(app: Express) {
  logger.info('Initializing contracts module');
  
  // Check if contracts module is enabled
  if (!isContractsEnabled()) {
    logger.info('Contracts module is disabled in this environment');
    return {
      name: 'contracts',
      enabled: false
    };
  }
  
  // Initialize event handlers
  initializeContractEventHandlers();
  
  // Register routes
  app.use('/api/contracts', contractRoutes);
  
  logger.info('Contracts module initialized successfully');
  
  // Return module instance
  return {
    name: 'contracts',
    routes: contractRoutes,
    enabled: true
  };
}

// Export contract processing functions
export { postProcessContract } from './contractProcessor';