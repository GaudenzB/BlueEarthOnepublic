/**
 * Re-export all modules
 */
export * from './employees';

interface ModuleInfo {
  name: string;
  module: any;
}

interface ModuleManager {
  modules: ModuleInfo[];
  getModule: (name: string) => any;
}

/**
 * Application initialization function 
 * This sets up all modules in the correct order
 * @param app Express application instance
 * @returns Promise resolving to ModuleManager
 */
export async function initializeModules(app: any): Promise<ModuleManager> {
  const modules: ModuleInfo[] = [];
  
  // Define a helper function to load and initialize a module
  async function loadModule(moduleName: string, importPath: string): Promise<ModuleInfo | null> {
    try {
      // Dynamically import the module
      const moduleExports = await import(importPath);
      
      // Get the setup function based on the module name
      const setupFunctionName = `setup${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module`;
      const setupFunction = moduleExports[setupFunctionName];
      
      if (typeof setupFunction !== 'function') {
        console.error(`Setup function ${setupFunctionName} not found in module ${moduleName}`);
        return null;
      }
      
      // Initialize the module
      const moduleInstance = await setupFunction(app);
      console.log(`Initialized module: ${moduleName}`);
      
      return { 
        name: moduleName, 
        module: moduleInstance 
      };
    } catch (error) {
      console.error(`Error initializing module ${moduleName}:`, error);
      return null;
    }
  }
  
  // Define all modules to be initialized
  const moduleDefinitions = [
    { name: 'employees', path: './employees/server' },
    // Add more modules here as they are developed
    // { name: 'documents', path: './documents/server' },
  ];
  
  // Load all modules in parallel
  const loadedModules = await Promise.all(
    moduleDefinitions.map(def => loadModule(def.name, def.path))
  );
  
  // Filter out any modules that failed to load
  const validModules = loadedModules.filter((mod): mod is ModuleInfo => mod !== null);
  modules.push(...validModules);
  
  console.log(`Initialized ${modules.length} modules: ${modules.map(m => m.name).join(', ')}`);
  
  return {
    modules,
    getModule: (name: string) => modules.find(m => m.name === name)?.module
  };
}