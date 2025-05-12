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
  const modulePromises: Promise<void>[] = [];
  
  // Import and set up employee module dynamically
  const employeeModulePromise = import('./employees/server')
    .then(({ setupEmployeeModule }) => {
      try {
        const employeeModule = setupEmployeeModule(app);
        modules.push({ name: 'employees', module: employeeModule });
        console.log(`Initialized module: employees`);
      } catch (error) {
        console.error('Error setting up employee module:', error);
      }
    })
    .catch(error => {
      console.error('Error importing employee module:', error);
    });
  
  modulePromises.push(employeeModulePromise);
  
  // Add more modules here as they are developed
  // For example:
  // const documentsModulePromise = import('./documents/server')
  //   .then(({ setupDocumentsModule }) => {
  //     try {
  //       const documentsModule = setupDocumentsModule(app);
  //       modules.push({ name: 'documents', module: documentsModule });
  //       console.log(`Initialized module: documents`);
  //     } catch (error) {
  //       console.error('Error setting up documents module:', error);
  //     }
  //   })
  //   .catch(error => {
  //     console.error('Error importing documents module:', error);
  //   });
  // modulePromises.push(documentsModulePromise);
  
  // Wait for all modules to initialize
  await Promise.all(modulePromises);
  
  console.log(`Initialized ${modules.length} modules: ${modules.map(m => m.name).join(', ')}`);
  
  return {
    modules,
    getModule: (name: string) => modules.find(m => m.name === name)?.module
  };
}