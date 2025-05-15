#!/usr/bin/env node

/**
 * Script to standardize role checks in documentRepository.ts
 * 
 * This script finds and replaces hardcoded role checks with roleHelpers utility calls.
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target file
const targetFile = path.join(__dirname, '..', 'server', 'repositories', 'documentRepository.ts');

// Main function
async function updateRoleChecks() {
  try {
    console.log('Reading file:', targetFile);
    const content = fs.readFileSync(targetFile, 'utf8');
    
    // First pattern: getAll function role check (around line 498-502)
    let updated = content.replace(
      /\/\/ Apply permissions filters based on user role\s+if \(userRole\) \{\s+\/\/ Handle both uppercase and lowercase role formats for compatibility\s+const isSuperAdmin = userRole === 'SUPER_ADMIN' \|\| userRole === 'superadmin';\s+const isAdmin = userRole === 'ADMIN' \|\| userRole === 'admin' \|\| isSuperAdmin;/g,
      `// Apply permissions filters based on user role
      if (userRole) {
        // Use roleHelpers for consistent role checking
        const isAdmin = roleHelpers.isAdmin(userRole);`
    );
    
    // Second pattern: semanticSearch function role check (around line 943-947)
    updated = updated.replace(
      /\/\/ Apply permissions filters based on user role\s+if \(userRole\) \{\s+\/\/ Handle both uppercase and lowercase role formats for compatibility\s+const isSuperAdmin = userRole === 'SUPER_ADMIN' \|\| userRole === 'superadmin';\s+const isAdmin = userRole === 'ADMIN' \|\| userRole === 'admin' \|\| isSuperAdmin;/g,
      `// Apply permissions filters based on user role
      if (userRole) {
        // Use roleHelpers for consistent role checking
        const isAdmin = roleHelpers.isAdmin(userRole);`
    );
    
    if (content === updated) {
      console.log('No changes were made. Patterns not found in the file.');
      return;
    }
    
    console.log('Writing updated file');
    fs.writeFileSync(targetFile, updated, 'utf8');
    console.log('Role checks successfully standardized!');
    
  } catch (error) {
    console.error('Error updating role checks:', error);
  }
}

// Run the script
updateRoleChecks();