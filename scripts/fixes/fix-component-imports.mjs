#!/usr/bin/env node

/**
 * Fix Component Import Script
 * 
 * This script specifically addresses the issue of duplicate React imports
 * in UI component files that were introduced by our auto-fix scripts.
 */

import fs from 'fs';
import { execSync } from 'child_process';

console.log("🔧 Fixing duplicate React imports in UI components...");

// Process a single file to fix duplicate React imports
function fixDuplicateImports(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Case 1: Regular React import followed by namespace import
    if (content.includes('import React from \'react\';') && 
        content.includes('import * as React from "react"')) {
      content = content.replace('import React from \'react\';\n', '');
      modified = true;
    }
    
    // Case 2: Double regular imports
    if (content.match(/import React from ['"]react['"];.*\s+import React from ['"]react['"];/s)) {
      content = content.replace(/import React from ['"]react['"];.*\s+import React from ['"]react['"];/s, 
                              'import React from "react";');
      modified = true;
    }
    
    // Save changes if needed
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed duplicate imports in ${filePath}`);
      return true;
    } else {
      console.log(`No duplicate imports found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// Find all UI component files
try {
  const uiFiles = execSync("find client/src/components/ui -type f -name '*.tsx'")
    .toString().trim().split('\n')
    .filter(file => file.length > 0);
  
  console.log(`Found ${uiFiles.length} UI component files to check`);
  
  let fixedCount = 0;
  
  // Process each file
  for (const file of uiFiles) {
    if (fixDuplicateImports(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed duplicate React imports in ${fixedCount} files`);
} catch (error) {
  console.error(`Error during fix process: ${error.message}`);
}