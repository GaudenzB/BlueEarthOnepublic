#!/usr/bin/env node

/**
 * Fix Syntax Errors Script
 * 
 * This script fixes syntax errors introduced by our previous auto-fix scripts:
 * 1. Corrects className = undefined errors
 * 2. Removes invalid exhaustive type checks
 * 3. Fixes other common syntax issues
 */

import fs from 'fs';
import { execSync } from 'child_process';

console.log("🛠️ Fixing syntax errors in component files...");

// Find files with syntax errors
try {
  // First, find files with className = undefined errors
  console.log("Finding files with className assignment errors...");
  const classNameErrorFiles = execSync("grep -l 'className.*=.*undefined' client/src/components/ui/*.tsx || echo ''")
    .toString().trim().split('\n')
    .filter(file => file.length > 0);
  
  console.log(`Found ${classNameErrorFiles.length} files with className errors`);
  
  // Fix className = undefined errors
  let fixedCount = 0;
  
  for (const file of classNameErrorFiles) {
    console.log(`Processing ${file}...`);
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Replace className = undefined with className || ''
    const newContent = content.replace(/className={\`([^}]*)\$\{className\s*=\s*undefined\}\`}/g, 
                                    'className={`$1${className || \'\'}`}');
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`✅ Fixed className errors in ${file}`);
      modified = true;
      fixedCount++;
    }
  }
  
  // Fix exhaustive check errors
  console.log("\nFinding files with exhaustive check errors...");
  const exhaustiveCheckFiles = execSync("grep -l 'const _exhaustiveCheck: never' client/src/components/ui/*.tsx || echo ''")
    .toString().trim().split('\n')
    .filter(file => file.length > 0);
  
  console.log(`Found ${exhaustiveCheckFiles.length} files with exhaustive check errors`);
  
  for (const file of exhaustiveCheckFiles) {
    console.log(`Processing ${file}...`);
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Remove problematic exhaustive checks
    const newContent = content.replace(/\s*default:\s*\/\/\s*Exhaustive type check\s*\n\s*const _exhaustiveCheck: never = \d+;\s*\n\s*return _exhaustiveCheck;/g, 
                                     '\n      default:\n        return {}; // Default case');
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`✅ Fixed exhaustive check errors in ${file}`);
      modified = true;
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed syntax errors in ${fixedCount} files`);
} catch (error) {
  console.error(`Error during fix process: ${error.message}`);
}