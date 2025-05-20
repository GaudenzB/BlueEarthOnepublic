#!/usr/bin/env node

/**
 * Import Path Fix Script
 * 
 * This script fixes common import path issues in the codebase:
 * 1. Missing @/lib/utils imports in UI components
 * 2. Inconsistent path aliases
 * 3. Missing type imports
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("🔍 Starting import path fixes...");

// Define common import path issues and their fixes
const importFixes = [
  {
    name: "Missing @/lib/utils in UI components",
    filePattern: /client\/src\/components\/ui\/.*\.tsx$/,
    test: (content) => content.includes("cn(") && !content.includes("import { cn }"),
    find: /import React from ['"]react['"];(\r?\n|\r)/,
    replace: "import React from 'react';\nimport { cn } from '@/lib/utils';\n"
  },
  {
    name: "Missing React import",
    filePattern: /\.tsx$/,
    test: (content) => content.includes("React.") && !content.includes("import React"),
    find: /^/,
    replace: "import React from 'react';\n"
  },
  {
    name: "Convert require to import",
    filePattern: /\.(tsx|ts)$/,
    test: (content) => content.includes("require(") && !content.includes("// Keep require"),
    find: /const\s+(\w+)\s*=\s*require\(['"](.*)['"]\);/g,
    replace: "import $1 from '$2';"
  }
];

// Process a single file
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply fixes that match this file's pattern
    for (const fix of importFixes) {
      if (filePath.match(fix.filePattern)) {
        // Skip if test function exists and returns false
        if (fix.test && !fix.test(content)) {
          continue;
        }
        
        // Apply the fix
        const newContent = content.replace(fix.find, fix.replace);
        if (newContent !== content) {
          content = newContent;
          modified = true;
          console.log(`  - Applied "${fix.name}" fix`);
        }
      }
    }
    
    // Save changes if modifications were made
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}: ${error.message}`);
  }
  
  return false;
}

// Main function to process all relevant files
async function main() {
  // Find UI component files
  console.log("Finding UI component files...");
  const uiFiles = execSync("find client/src/components/ui -type f -name '*.tsx'")
    .toString().trim().split('\n')
    .filter(file => file.length > 0);
  
  // Find other component files
  console.log("Finding other component files...");
  const componentFiles = execSync("find client/src/components -type f -name '*.tsx' | grep -v '/ui/'")
    .toString().trim().split('\n')
    .filter(file => file.length > 0);
  
  // Find utility files
  console.log("Finding utility files...");
  const utilityFiles = execSync("find client/src/lib client/src/hooks -type f -name '*.ts' -o -name '*.tsx'")
    .toString().trim().split('\n')
    .filter(file => file.length > 0);
  
  // Process all files
  const allFiles = [...uiFiles, ...componentFiles, ...utilityFiles];
  let fixedCount = 0;
  
  console.log(`Processing ${allFiles.length} files...`);
  
  for (const file of allFiles) {
    if (processFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed import issues in ${fixedCount} files`);
}

// Run the script
main();