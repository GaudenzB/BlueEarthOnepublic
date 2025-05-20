#!/usr/bin/env node

/**
 * Auto TypeScript Fix Script
 * 
 * This script identifies and fixes common TypeScript errors in the codebase.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("🔎 Scanning for TypeScript issues...");

// Common patterns to fix
const fixPatterns = [
  {
    name: "Color string type annotations",
    find: /color: ['"]#[0-9a-fA-F]+['"]/g,
    replace: (match) => match.replace(/(['"])#([0-9a-fA-F]+)(['"])/, "$1#$2$3 as string")
  },
  {
    name: "Font weight number type annotations",
    find: /fontWeight: ([0-9]+)/g,
    replace: (match) => match.replace(/([0-9]+)/, "$1 as number")
  },
  {
    name: "Proper environment variable access",
    find: /process\.env\.([A-Z_0-9]+)/g,
    replace: "process.env['$1']"
  },
  {
    name: "Optional parameters with default values",
    find: /(const response:[^{]+= \{[^}]*data.*,\s*message,\s*meta)/g,
    replace: "$1: message || undefined, meta: meta || undefined"
  }
];

// Apply fixes to a file
function fixFile(filePath) {
  console.log(`Processing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const pattern of fixPatterns) {
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

// Get UI component files
try {
  // Get a list of UI component files with potential TS errors
  const uiComponentFiles = execSync("find client/src/components/ui -type f -name '*.tsx'")
    .toString().trim().split('\n');
  
  let fixCount = 0;
  
  // Apply fixes to each file
  for (const file of uiComponentFiles) {
    if (file && fixFile(file)) {
      fixCount++;
    }
  }
  
  console.log(`\n✅ Fixed TypeScript issues in ${fixCount} files`);
} catch (error) {
  console.error(`❌ Error running script: ${error.message}`);
}
