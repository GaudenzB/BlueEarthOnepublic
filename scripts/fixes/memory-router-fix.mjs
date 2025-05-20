#!/usr/bin/env node

/**
 * MemoryRouter Fix Script
 * 
 * This script specifically fixes issues with MemoryRouter in test files:
 * 1. Adds the TestRouter import where needed
 * 2. Replaces all MemoryRouter instances with TestRouter
 */

import fs from 'fs';
import { execSync } from 'child_process';

console.log("🔍 Starting MemoryRouter fix for test files...");

// Get all test files that reference MemoryRouter
const testFiles = execSync("find client/__tests__ -type f -name '*.tsx' | xargs grep -l 'MemoryRouter' || echo ''")
  .toString().trim().split('\n')
  .filter(file => file.length > 0);

console.log(`Found ${testFiles.length} files with MemoryRouter references.`);

// Process each file
let fixedCount = 0;

for (const file of testFiles) {
  console.log(`Processing ${file}...`);
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Step 1: Add TestRouter import if needed
  if (!content.includes('import TestRouter')) {
    // Find the imports section
    let importSection = content.match(/import.*from.*(\r?\n|\r)*/g);
    if (importSection) {
      // Add the TestRouter import
      const newImport = "import TestRouter from '../../utils/TestRouter';\n";
      content = content.replace(
        importSection[importSection.length - 1],
        importSection[importSection.length - 1] + newImport
      );
      modified = true;
      console.log(`  - Added TestRouter import`);
    }
  }
  
  // Step 2: Replace all MemoryRouter instances with TestRouter
  const memoryRouterCount = (content.match(/<MemoryRouter>/g) || []).length;
  if (memoryRouterCount > 0) {
    content = content.replace(/<MemoryRouter>/g, '<TestRouter>');
    content = content.replace(/<\/MemoryRouter>/g, '</TestRouter>');
    modified = true;
    console.log(`  - Replaced ${memoryRouterCount} MemoryRouter instances`);
  }
  
  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated ${file}`);
    fixedCount++;
  } else {
    console.log(`  No changes needed for ${file}`);
  }
}

console.log(`\n✅ Fixed MemoryRouter issues in ${fixedCount} files.`);