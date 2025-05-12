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
 */
export function initializeModules(app: any): ModuleManager {
  const modules: ModuleInfo[] = [];
  
  try {
    // Import and set up employee module dynamically
    import('./employees/server').then(({ setupEmployeeModule }) => {
      const employeeModule = setupEmployeeModule(app);
      modules.push({ name: 'employees', module: employeeModule });
      console.log(`Initialized module: employees`);
    }).catch(error => {
      console.error('Error initializing employee module:', error);
    });
  } catch (error) {
    console.error('Error in employee module initialization process:', error);
  }
  
  // Add more modules here as they are developed
  // For example:
  // try {
  //   const { setupDocumentsModule } = require('./documents/server');
  //   const documentsModule = setupDocumentsModule(app);
  //   modules.push({ name: 'documents', module: documentsModule });
  // } catch (error) {
  //   console.error('Error initializing documents module:', error);
  // }
  
  console.log(`Initialized ${modules.length} modules: ${modules.map(m => m.name).join(', ')}`);
  
  return {
    modules,
    getModule: (name: string) => modules.find(m => m.name === name)?.module
  };
}