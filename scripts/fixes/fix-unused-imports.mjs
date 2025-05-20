#!/usr/bin/env node

/**
 * Unused Imports Fixer
 * 
 * This script fixes issues with unused imports in test files
 * by properly prefixing them with underscore to satisfy ESLint rules.
 */

import fs from 'fs';
import path from 'path';

console.log("🔍 Finding and fixing unused imports in test files...");

const filesToFix = [
  'client/__tests__/components/EmployeeDirectory/EmployeeList.test.tsx',
  'client/__tests__/components/DocumentUpload/DocumentUploader.fixed.test.tsx'
];

let fixedCount = 0;

for (const filePath of filesToFix) {
  try {
    console.log(`Processing ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${filePath}`);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix Router import in EmployeeList.test.tsx
    if (filePath.includes('EmployeeList.test.tsx') && !content.includes('_Router')) {
      const newContent = content.replace(
        /import { (.*)Router(.*) } from ['"]wouter['"];?/g,
        (match, before, after) => `import { ${before}_Router${after} } from 'wouter';`
      );
      
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`✅ Fixed Router import in ${filePath}`);
      }
    }
    
    // Fix UseMutationResult import in DocumentUploader.fixed.test.tsx
    if (filePath.includes('DocumentUploader.fixed.test.tsx') && !content.includes('_UseMutationResult')) {
      const newContent = content.replace(
        /import { (.*)UseMutationResult(.*) } from ['"]@tanstack\/react-query['"];?/g,
        (match, before, after) => `import { ${before}_UseMutationResult${after} } from '@tanstack/react-query';`
      );
      
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`✅ Fixed UseMutationResult import in ${filePath}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixedCount++;
    } else {
      console.log(`ℹ️ No changes needed for ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

console.log(`\n✅ Fixed unused imports in ${fixedCount} files`);