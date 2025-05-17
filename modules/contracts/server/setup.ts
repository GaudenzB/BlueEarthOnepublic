import { Express } from 'express';
import { logger } from '../../../server/utils/logger';
import { setupContractModule as initializeContractModule } from './index';
import contractRoutes from './routes';

/**
 * Setup function for the contracts module
 * 
 * @param app Express application instance
 * @returns Module instance
 */
export async function setupContractModule(app: Express): Promise<object> {
  logger.info('Setting up contract module');
  
  try {
    // Initialize the contracts module
    initializeContractModule(app);
    
    // Register API routes
    app.use('/api/contracts', contractRoutes);
    logger.info('Contract API routes registered');
    
    // Return the module instance
    return {
      name: 'contract',
      version: '1.0.0',
      description: 'Contract management module with AI extraction capabilities'
    };
  } catch (error) {
    logger.error('Error setting up contract module', { error });
    throw error;
  }
}