#!/usr/bin/env node

/**
 * TypeScript Syntax Error Fix Script
 * 
 * This script focuses on fixing common TypeScript syntax errors found
 * in the BlueEarth Capital Portal codebase:
 * 
 * 1. Empty object literal cases in switch statements ({})
 * 2. Missing break/return statements in switch cases
 * 3. Improper fallthrough cases
 * 4. Malformatted switch statements
 * 5. Missing commas in object literals
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const CONFIG = {
  extensions: ['.ts', '.tsx'],
  excludeDirs: ['node_modules', 'dist', '.git', 'coverage'],
  patterns: [
    // Fix empty object literal cases in switch statements
    {
      name: 'Empty object literal in case',
      regex: /case\s+(['"])([^'"]+)\1\s*:\s*{}\s*,?/g,
      replacement: 'case $1$2$1: // Fall through'
    },
    // Fix trailing commas in case statements
    {
      name: 'Empty block with comma in case',
      regex: /case\s+(['"])([^'"]+)\1\s*:\s*{[^}]*}\s*,/g,
      replacement: 'case $1$2$1: // Fall through'
    },
    // Add statement for fallthrough case labels
    {
      name: 'Missing statement in fallthrough case',
      regex: /case\s+(['"])([^'"]+)\1\s*:\s*(?!(\/\/|break|return|throw|continue|{))/g,
      replacement: 'case $1$2$1: // Fall through\n      '
    }
  ]
};

/**
 * Find TypeScript files recursively
 */
function findFiles(dir) {
  const result = [];
  
  // Read items in current directory
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  // Process each item
  for (const item of items) {
    // Skip excluded directories
    if (item.isDirectory() && CONFIG.excludeDirs.includes(item.name)) {
      continue;
    }
    
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Recurse into subdirectory
      result.push(...findFiles(fullPath));
    } else if (CONFIG.extensions.includes(path.extname(item.name))) {
      // Add TypeScript file to results
      result.push(fullPath);
    }
  }
  
  return result;
}

/**
 * Fix TypeScript syntax errors in a file
 */
function fixFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    // Read file content
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;
    let fixCount = 0;
    
    // Apply each fix pattern
    for (const pattern of CONFIG.patterns) {
      const beforeFix = content;
      content = content.replace(pattern.regex, pattern.replacement);
      
      if (content !== beforeFix) {
        console.log(`  ✓ Fixed: ${pattern.name}`);
        fixCount++;
      }
    }
    
    // Apply specific fix for adjacent case statements fallthrough
    content = fixAdjacentCases(content);
    
    // Look for unclosed switch blocks with missing cases
    content = fixMalformedSwitchStatements(content);
    
    // If content changed, write changes
    if (content !== originalContent) {
      // Create backup
      const backupPath = `${filePath}.backup`;
      fs.writeFileSync(backupPath, originalContent);
      
      // Write fixed content
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${fixCount} issues in ${filePath}`);
      return true;
    } else {
      console.log(`  No issues found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Fix adjacent case statements without breaks
 */
function fixAdjacentCases(content) {
  // Find case statements that don't have any code between them
  const adjacentCasePattern = /case\s+(['"])([^'"]+)\1\s*:\s*\n\s*case/g;
  return content.replace(adjacentCasePattern, 'case $1$2$1: // Fall through\n      case');
}

/**
 * Fix malformed switch statements
 */
function fixMalformedSwitchStatements(content) {
  // Find dangling switch statements missing cases
  const switchPattern = /switch\s*\([^)]+\)\s*{\s*}/g;
  let fixed = content.replace(switchPattern, (match) => {
    return match.replace(/{\s*}/, '{\n    default:\n      // No action needed\n      break;\n  }');
  });
  
  // Find case statements with an empty object literal as the action
  fixed = fixed.replace(
    /case\s+(['"])([^'"]+)\1\s*:\s*{\s*}\s*(?=(case|default|\s*}))/g,
    'case $1$2$1: // Fall through\n      '
  );
  
  // Find default cases with nothing after them before the closing brace
  fixed = fixed.replace(
    /default\s*:\s*(?=\s*})/g,
    'default:\n      // No action needed\n      break;'
  );
  
  return fixed;
}

/**
 * Main function
 */
function main() {
  console.log('🔎 TypeScript Syntax Fixer');
  console.log('=========================');
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Fix a specific file
    const filePath = args[0];
    if (fs.existsSync(filePath)) {
      fixFile(filePath);
    } else {
      console.error(`❌ File not found: ${filePath}`);
    }
    return;
  }
  
  // Find TypeScript files
  console.log('Scanning for TypeScript files...');
  const files = findFiles('.');
  console.log(`Found ${files.length} TypeScript files.`);
  
  // Fix each file
  let fixedCount = 0;
  for (const file of files) {
    const fixed = fixFile(file);
    if (fixed) fixedCount++;
  }
  
  console.log('\n✨ Summary:');
  console.log(`Fixed ${fixedCount} files out of ${files.length} total.`);
}

// Run the script
main();