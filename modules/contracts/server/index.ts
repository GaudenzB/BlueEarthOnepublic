import { Express } from 'express';
import { logger } from '../../../server/utils/logger';
import { initializeContractEventHandlers } from './contractEventHandlers';
import contractRoutes from './routes';

/**
 * Initialize the contract module server components
 * @param app Express application instance
 * @returns void
 */
export function setupContractModule(app: Express) {
  logger.info('Initializing contracts module');
  
  // Initialize event handlers
  initializeContractEventHandlers();
  
  // Register routes
  app.use('/api/contracts', contractRoutes);
  
  logger.info('Contracts module initialized successfully');
  
  // Return module instance
  return {
    name: 'contracts',
    routes: contractRoutes
  };
}

// Export contract processing functions
export { postProcessContract } from './contractProcessor';