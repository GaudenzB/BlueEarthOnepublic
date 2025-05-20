#!/usr/bin/env node

/**
 * Fix Duplicate Import Script
 * 
 * This script removes duplicate React imports that were 
 * introduced by our previous import fix script.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("🔍 Starting duplicate import fix...");

// Find files with duplicate React imports
try {
  const duplicateImportFiles = execSync("find client/src -type f -name '*.tsx' | xargs grep -l 'import React.*\\nimport React' || echo ''")
    .toString().trim().split('\n')
    .filter(file => file.length > 0);
  
  console.log(`Found ${duplicateImportFiles.length} files with duplicate React imports`);
  
  let fixedCount = 0;
  
  // Process each file
  for (const file of duplicateImportFiles) {
    console.log(`Processing ${file}...`);
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove duplicate React imports
    const newContent = content.replace(/import React from ['"]react['"];\s*\nimport React from ['"]react['"];/g, "import React from 'react';");
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`✅ Fixed duplicate React imports in ${file}`);
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed duplicate React imports in ${fixedCount} files`);
} catch (error) {
  console.error(`❌ Error fixing duplicate imports: ${error.message}`);
}