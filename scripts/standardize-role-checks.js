/**
 * Standardizes role checks throughout the codebase
 * 
 * This script finds hardcoded role checking patterns and replaces them
 * with consistent roleHelpers utility function calls.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDirectories = [
  './server',
  './client/src'
];

// Patterns to replace
const patterns = [
  {
    search: /\/\/ Handle both uppercase and lowercase role formats for compatibility[\s\n]+const isSuperAdmin = userRole === ['"]SUPER_ADMIN['"] \|\| userRole === ['"]superadmin['"];[\s\n]+const isAdmin = userRole === ['"]ADMIN['"] \|\| userRole === ['"]admin['"] \|\| isSuperAdmin;/g,
    replace: '// Use roleHelpers for consistent role checking\n        const isAdmin = roleHelpers.isAdmin(userRole);'
  },
  {
    search: /userRole === ['"]superadmin['"] \|\| userRole === ['"]SUPER_ADMIN['"]/g,
    replace: 'roleHelpers.isSuperAdmin(userRole)'
  },
  {
    search: /userRole === ['"]admin['"] \|\| userRole === ['"]ADMIN['"] \|\| .*(superadmin).*/g,
    replace: 'roleHelpers.isAdmin(userRole)'
  }
];

// Files to exclude
const excludeFiles = [
  'roleHelpers.ts'
];

// Process a single file
function processFile(filePath) {
  // Skip excluded files
  if (excludeFiles.some(exclude => filePath.includes(exclude))) {
    return;
  }

  // Only process ts/tsx/js files
  if (!['.ts', '.tsx', '.js'].includes(path.extname(filePath))) {
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let modified = false;

    patterns.forEach(pattern => {
      if (pattern.search.test(content)) {
        content = content.replace(pattern.search, pattern.replace);
        modified = true;
      }
    });

    if (modified) {
      console.log(`Updating: ${filePath}`);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
}

// Process a directory recursively
function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

// Add roleHelpers import if needed
function addRoleHelpersImport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has the roleHelpers import
    if (content.includes("import { roleHelpers")) {
      return;
    }
    
    // Check if we need to add the import
    if (content.includes("roleHelpers.isAdmin") || content.includes("roleHelpers.isSuperAdmin")) {
      // Add the import
      if (content.includes("import {")) {
        // Add to existing imports
        content = content.replace(/import {([^}]+)} from ['"]([^'"]+)['"]/g, (match, imports, source) => {
          if (source === '../utils/roleHelpers' || source === './utils/roleHelpers') {
            // Already has import from this source, add roleHelpers
            if (!imports.includes('roleHelpers')) {
              return `import {${imports}, roleHelpers} from '${source}'`;
            }
            return match;
          }
          return match;
        });
        
        // If no matching import found, add a new one at the top
        if (!content.includes("import { roleHelpers")) {
          const serverImport = "import { roleHelpers } from '../utils/roleHelpers';";
          const clientImport = "import { roleHelpers } from '@/utils/roleHelpers';";
          
          const importToAdd = filePath.includes('/server/') ? serverImport : clientImport;
          
          // Add after the last import
          const lastImportIndex = content.lastIndexOf('import');
          if (lastImportIndex >= 0) {
            const endOfImportIndex = content.indexOf(';', lastImportIndex) + 1;
            content = content.slice(0, endOfImportIndex) + '\n' + importToAdd + content.slice(endOfImportIndex);
          } else {
            // No imports found, add at the beginning
            content = importToAdd + '\n' + content;
          }
        }
      } else {
        // No imports found at all, add at the beginning
        const serverImport = "import { roleHelpers } from '../utils/roleHelpers';";
        const clientImport = "import { roleHelpers } from '@/utils/roleHelpers';";
        
        const importToAdd = filePath.includes('/server/') ? serverImport : clientImport;
        content = importToAdd + '\n' + content;
      }
      
      console.log(`Adding roleHelpers import to: ${filePath}`);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (err) {
    console.error(`Error adding import to ${filePath}: ${err.message}`);
  }
}

// Main execution
console.log('Standardizing role checks...');
targetDirectories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Processing directory: ${dir}`);
    processDirectory(dir);
  } else {
    console.warn(`Directory not found: ${dir}`);
  }
});

// Add imports where needed
targetDirectories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Adding imports to directory: ${dir}`);
    processDirectory(dir);
  }
});

console.log('Role standardization complete!');