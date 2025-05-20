#!/usr/bin/env node

/**
 * Fix Exhaustive Type Check Script
 * 
 * This script finds and fixes all remaining exhaustive type check issues
 * in the codebase that were introduced by our automated fixes.
 */

import fs from 'fs';
import { execSync } from 'child_process';

console.log("🔍 Finding and fixing exhaustive type check issues...");

try {
  // Find all files with _exhaustiveCheck
  const exhaustiveCheckFiles = execSync("find client/src -type f -name '*.tsx' | xargs grep -l '_exhaustiveCheck' || echo ''")
    .toString().trim().split('\n')
    .filter(file => file.length > 0);
  
  console.log(`Found ${exhaustiveCheckFiles.length} files with exhaustive type check issues`);
  
  let fixedCount = 0;
  
  for (const file of exhaustiveCheckFiles) {
    console.log(`Processing ${file}...`);
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Replace the exhaustive type check pattern with a safer default case
    const newContent = content.replace(
      /default:\s*\/\/\s*Exhaustive type check\s*\n\s*const _exhaustiveCheck: never = \d+;\s*\n\s*return _exhaustiveCheck;/g, 
      'default:\n      return undefined; // Default fallback case'
    );
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`✅ Fixed exhaustive type check in ${file}`);
      modified = true;
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed exhaustive type check issues in ${fixedCount} files`);
} catch (error) {
  console.error(`Error during fix process: ${error.message}`);
}