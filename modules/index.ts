/**
 * Re-export all modules
 */
export * from './employees';

import { Express } from 'express';
import { logger } from '../server/utils/logger';

/**
 * Interface for module definition with name and import path
 */
interface ModuleDefinition {
  name: string;
  path: string;
}

/**
 * Interface for module information with name and module instance
 */
interface ModuleInfo<T = unknown> {
  name: string;
  module: T;
}

/**
 * Interface for the module manager returned by initialization
 */
interface ModuleManager {
  modules: ModuleInfo[];
  getModule: <T = unknown>(name: string) => T | undefined;
}

/**
 * Application initialization function 
 * This sets up all modules in the correct order
 * @param app Express application instance
 * @returns Promise resolving to ModuleManager
 */
export async function initializeModules(app: Express): Promise<ModuleManager> {
  const modules: ModuleInfo[] = [];
  
  // Define a helper function to load and initialize a module
  async function loadModule(definition: ModuleDefinition): Promise<ModuleInfo | null> {
    const { name, path } = definition;
    
    try {
      logger.info(`Loading module: ${name} from ${path}`);
      
      // Dynamically import the module
      const moduleExports = await import(path);
      
      // Get the setup function based on the module name
      const setupFunctionName = `setup${name.charAt(0).toUpperCase() + name.slice(1)}Module`;
      const setupFunction = moduleExports[setupFunctionName];
      
      if (typeof setupFunction !== 'function') {
        logger.error(`Setup function ${setupFunctionName} not found in module ${name}`);
        return null;
      }
      
      // Initialize the module
      logger.info(`Initializing module: ${name}`);
      const moduleInstance = await setupFunction(app);
      logger.info(`Successfully initialized module: ${name}`);
      
      return { 
        name, 
        module: moduleInstance 
      };
    } catch (error) {
      logger.error(`Error initializing module ${name}:`, { error });
      return null;
    }
  }
  
  // Define all modules to be initialized
  const moduleDefinitions: ModuleDefinition[] = [
    { name: 'employee', path: './employees/server' }, // Changed 'employees' to 'employee' to match setupEmployeeModule function
    // Add more modules here as they are developed
    // { name: 'document', path: './documents/server' }, // Same singular naming convention for consistency
    // { name: 'contract', path: './contracts/server' }, // Same singular naming convention for consistency
  ];
  
  try {
    logger.info(`Starting initialization of ${moduleDefinitions.length} modules`);
    
    // Load all modules in parallel
    const loadPromises = moduleDefinitions.map(def => loadModule(def));
    const loadedModules = await Promise.all(loadPromises);
    
    // Filter out any modules that failed to load
    const validModules = loadedModules.filter((mod): mod is ModuleInfo => mod !== null);
    modules.push(...validModules);
    
    // Log success or partial success
    if (validModules.length === moduleDefinitions.length) {
      logger.info(`Successfully initialized all ${modules.length} modules: ${modules.map(m => m.name).join(', ')}`);
    } else {
      logger.warn(`Partially initialized modules: ${validModules.length}/${moduleDefinitions.length} succeeded`);
      logger.info(`Initialized modules: ${modules.map(m => m.name).join(', ')}`);
      
      // List failed modules
      const failedModules = moduleDefinitions
        .filter(def => !validModules.some(m => m.name === def.name))
        .map(def => def.name);
      
      logger.warn(`Failed modules: ${failedModules.join(', ')}`);
    }
    
    // Return the module manager
    return {
      modules,
      getModule: <T = unknown>(name: string): T | undefined => 
        modules.find(m => m.name === name)?.module as T | undefined
    };
  } catch (error) {
    logger.error('Critical error during module initialization:', { error });
    throw new Error('Failed to initialize application modules');
  }
}