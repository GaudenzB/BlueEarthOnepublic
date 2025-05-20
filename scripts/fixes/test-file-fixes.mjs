#!/usr/bin/env node

/**
 * Test File TypeScript Error Fixer
 * 
 * This script focuses on fixing common TypeScript errors in test files:
 * 1. MemoryRouter issues
 * 2. Import statements
 * 3. Mock function typing
 * 4. Component prop typing
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("🔍 Starting test file TypeScript error fixes...");

// Fix patterns specific to test files
const testFixPatterns = [
  // Add TestRouter import where needed
  {
    name: "Add TestRouter import",
    find: /import React from ['"]react['"];\s*\nimport \{ render, screen[^}]*\} from ['"]@testing-library\/react['"];\s*\nimport \{ (QueryClient|Router)[^}]*\} from [^;]*;/g,
    test: (content) => content.includes('<MemoryRouter>') && !content.includes('TestRouter'),
    replace: (match) => {
      // Add TestRouter import if it's missing
      if (match.includes('TestRouter')) return match;
      
      // Check if we need to add it
      if (match.includes('from \'../../utils/TestRouter\'')) return match;
      
      return match + '\nimport TestRouter from \'../../utils/TestRouter\';';
    }
  },
  
  // Replace MemoryRouter with TestRouter
  {
    name: "Replace MemoryRouter",
    find: /<MemoryRouter>/g,
    replace: "<TestRouter>"
  },
  {
    name: "Replace MemoryRouter closing tag",
    find: /<\/MemoryRouter>/g,
    replace: "</TestRouter>"
  },
  
  // Fix mock function typing
  {
    name: "Fix mock function typing",
    find: /const\s+(\w+)\s*=\s*jest\.fn\(\)/g,
    replace: "const $1 = jest.fn() as jest.Mock"
  },
  
  // Fix require to import for Jest.mock calls
  {
    name: "Fix require in jest.mock calls",
    find: /jest\.mock\(['"]([^'"]+)['"]\s*,\s*\(\)\s*=>\s*\(\{\s*.*\s*\}\)\);/g,
    test: (content) => content.includes('require('),
    replace: (match) => {
      return match.replace(/require\(['"](.*)['"]\)/g, "jest.requireMock('$1')");
    }
  }
];

// Apply fixes to a file
function fixTestFile(filePath) {
  console.log(`Processing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const pattern of testFixPatterns) {
    // Skip if test function exists and returns false
    if (pattern.test && !pattern.test(content)) {
      continue;
    }
    
    // Apply the replacement
    const newContent = content.replace(pattern.find, pattern.replace);
    if (newContent !== content) {
      content = newContent;
      modified = true;
      console.log(`  - Applied "${pattern.name}" fix`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${filePath}`);
    return true;
  }
  
  return false;
}

// Process all test files
async function processTestFiles() {
  try {
    // Get test files with MemoryRouter references
    console.log("Finding test files with MemoryRouter...");
    const memoryRouterTestFiles = execSync("find client/__tests__ -type f -name '*.tsx' | xargs grep -l 'MemoryRouter' || echo \"\"")
      .toString().trim().split('\n')
      .filter(file => file.length > 0);
    
    // Get all other test files
    console.log("Finding all test files...");
    const allTestFiles = execSync("find client/__tests__ -type f -name '*.test.tsx' -o -name '*.test.ts'")
      .toString().trim().split('\n')
      .filter(file => file.length > 0);
    
    // Create a set of all unique test files
    const testFiles = new Set([...memoryRouterTestFiles, ...allTestFiles]);
    
    // Fix each file
    let fixedCount = 0;
    for (const file of testFiles) {
      if (file && fixTestFile(file)) {
        fixedCount++;
      }
    }
    
    console.log(`\n✅ Fixed TypeScript issues in ${fixedCount} test files`);
  } catch (error) {
    console.error(`❌ Error processing test files: ${error.message}`);
  }
}

// Execute the script
processTestFiles();