/**
 * Re-export all modules
 */
export * from './employees';

/**
 * Application initialization function 
 * This sets up all modules in the correct order
 */
export function initializeModules(app: any) {
  const modules = [];
  
  // Import and set up employee module
  const { setupEmployeeModule } = require('./employees/server');
  const employeeModule = setupEmployeeModule(app);
  modules.push({ name: 'employees', module: employeeModule });
  
  // Add more modules here as they are developed
  // For example:
  // const { setupDocumentsModule } = require('./documents/server');
  // const documentsModule = setupDocumentsModule(app);
  // modules.push({ name: 'documents', module: documentsModule });
  
  console.log(`Initialized ${modules.length} modules: ${modules.map(m => m.name).join(', ')}`);
  
  return {
    modules,
    getModule: (name: string) => modules.find(m => m.name === name)?.module
  };
}