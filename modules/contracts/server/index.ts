import { logger } from '../../../server/utils/logger';
import { initializeContractEventHandlers } from './contractEventHandlers';

/**
 * Initialize the contract module server components
 */
export function initializeContractsModule(): void {
  logger.info('Initializing contracts module');
  
  // Initialize event handlers
  initializeContractEventHandlers();
  
  logger.info('Contracts module initialized successfully');
}

// Export contract processing functions
export { postProcessContract } from './contractProcessor';