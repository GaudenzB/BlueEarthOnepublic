#!/usr/bin/env node

/**
 * Fix useEffect Dependency Arrays
 * 
 * This script addresses issues with useEffect dependency arrays:
 * 1. Warns about missing dependencies in useEffect hooks
 * 2. Adds proper dependencies where they're missing
 * 3. Documents intentional empty dependency arrays
 */

import fs from 'fs';
import { execSync } from 'child_process';

console.log("🔍 Starting useEffect dependency fixes...");

// Fix patterns for useEffect dependency issues
const useEffectFixes = [
  // Mark intentional empty dependency arrays with explanatory comment
  {
    name: "Document empty dependency array",
    find: /useEffect\(\(\)\s*=>\s*\{[^}]*\},\s*\[\]\)/g,
    test: (content, match) => {
      // Don't add comment if there's already one nearby
      return !content.includes("// Only runs once on mount") && 
             !content.includes("// Empty dependencies") &&
             !content.includes("// Run once");
    },
    replace: (match) => {
      return match.replace(/\[\]\)$/, "[] /* Only runs once on mount */)");
    }
  },
  
  // Fix conditional useEffect execution pattern
  {
    name: "Fix conditional useEffect execution",
    find: /useEffect\(\(\)\s*=>\s*\{\s*if\s*\(([^)]+)\)\s*\{[^}]*\}\s*\},\s*\[\]\)/g,
    test: (content, match) => {
      // Extract the condition variable
      const conditionMatch = match.match(/if\s*\(([^)]+)\)/);
      if (!conditionMatch) return false;
      
      const condition = conditionMatch[1];
      // Check if the condition variable is missing from dependencies
      return !match.includes(`[${condition}]`);
    },
    replace: (match) => {
      // Extract the condition variable
      const conditionMatch = match.match(/if\s*\(([^)]+)\)/);
      if (!conditionMatch) return match;
      
      const condition = conditionMatch[1].trim();
      // Add the condition variable to the dependency array
      return match.replace(/\[\]\)$/, `[${condition}])`);
    }
  }
];

// Process a single file to fix useEffect dependencies
function fixUseEffectDeps(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply fixes that match this file
    for (const fix of useEffectFixes) {
      // Find all matches in the file
      const matches = content.match(fix.find);
      
      if (matches) {
        for (const match of matches) {
          // Skip if test function exists and returns false
          if (fix.test && !fix.test(content, match)) {
            continue;
          }
          
          // Apply the replacement
          const fixedMatch = match.replace(fix.find, fix.replace);
          if (fixedMatch !== match) {
            content = content.replace(match, fixedMatch);
            modified = true;
            console.log(`  - Applied "${fix.name}" fix`);
          }
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
    console.error(`Error processing ${filePath}: ${error.message}`);
  }
  
  return false;
}

// Find all files with useEffect hooks
try {
  console.log("Finding files with useEffect hooks...");
  const useEffectFiles = execSync("find client/src -type f -name '*.tsx' -o -name '*.ts' | xargs grep -l 'useEffect' || echo ''")
    .toString().trim().split('\n')
    .filter(file => file.length > 0);
  
  console.log(`Found ${useEffectFiles.length} files with useEffect hooks`);
  
  let fixedCount = 0;
  
  // Process each file
  for (const file of useEffectFiles) {
    if (fixUseEffectDeps(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed useEffect dependency issues in ${fixedCount} files`);
} catch (error) {
  console.error(`Error during fix process: ${error.message}`);
}