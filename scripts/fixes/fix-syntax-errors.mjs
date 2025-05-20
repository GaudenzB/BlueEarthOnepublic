#!/usr/bin/env node

/**
 * Syntax Error Fixer
 * 
 * This script automatically detects and fixes common syntax errors in TypeScript/React files,
 * particularly focusing on structural issues like:
 * 
 * 1. Missing closing braces/parentheses
 * 2. Improperly formatted switch statements
 * 3. Missing commas between object properties
 * 4. Incorrect JSX closing tags
 * 5. Missing semicolons where needed
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Constants
const TARGET_EXTENSIONS = ['.tsx', '.ts'];
const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.git'];

// Helper function to check if a file should be processed
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return TARGET_EXTENSIONS.includes(ext);
}

// Helper function to find files recursively
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !EXCLUDED_DIRS.includes(file)) {
      findFiles(filePath, fileList);
    } else if (stat.isFile() && shouldProcessFile(filePath)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix switch statement syntax errors
function fixSwitchStatements(content) {
  // Pattern 1: Fix missing closing braces in switch case blocks
  let fixed = content.replace(
    /case\s+['"]([^'"]+)['"]\s*:\s*return\s*{([^}]*)}(\s*)(\n\s*)(default|case)/g,
    (match, caseValue, objContent, spaces, newline, nextCase) => {
      return `case '${caseValue}':\n      return {\n        ${objContent.trim()}\n      };${newline}${nextCase}`;
    }
  );
  
  // Pattern 2: Fix incorrectly placed default case
  fixed = fixed.replace(
    /(\s*})(\s*)default:(\s*)return(\s*){([^}]*)};(\s*)case/g,
    (match, closeBrace, s1, s2, s3, defaultContent, s4) => {
      return `${closeBrace};\n      default:\n        return {\n          ${defaultContent.trim()}\n        };\n      case`;
    }
  );
  
  // Pattern 3: Fix missing semicolons after return statements
  fixed = fixed.replace(
    /return\s*{([^}]+)}\s*(\n\s*)(case|default|[})])/g,
    (match, objContent, newline, next) => {
      return `return {\n        ${objContent.trim()}\n      };${newline}${next}`;
    }
  );
  
  return fixed;
}

// Function to fix missing commas in object literals
function fixObjectLiterals(content) {
  // Find object literals and ensure properties are separated by commas
  let fixed = content.replace(
    /{\s*([a-zA-Z0-9_]+)\s*:\s*([^,{}\n]+)(\s*\n\s*)([a-zA-Z0-9_]+)\s*:/g,
    (match, prop1, value1, whitespace, prop2) => {
      return `{ ${prop1}: ${value1},${whitespace}${prop2}:`;
    }
  );
  
  return fixed;
}

// Function to fix JSX syntax errors
function fixJsxSyntax(content) {
  // Fix unclosed JSX tags
  let fixed = content.replace(
    /<([A-Z][a-zA-Z0-9]*)([^>]*?)>([^<]*?)<\/(?!\\1)/g,
    (match, tag, props, children, closingTag) => {
      return `<${tag}${props}>${children}</${tag}`;
    }
  );
  
  return fixed;
}

// Function to fix missing expression syntax
function fixExpressionSyntax(content) {
  // Find pattern where expression is expected but missing
  let fixed = content.replace(
    /([=:]\s*)(\n\s*)(case|default|[})])/g,
    (match, operator, newline, next) => {
      // If assignment or property definition is followed immediately by case/default/closing brace
      return `${operator}undefined;${newline}${next}`;
    }
  );
  
  return fixed;
}

// Main fix function
function fixSyntaxErrors(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    // Read file content
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    // Apply fixes in sequence
    let fixedContent = originalContent;
    fixedContent = fixSwitchStatements(fixedContent);
    fixedContent = fixObjectLiterals(fixedContent);
    fixedContent = fixJsxSyntax(fixedContent);
    fixedContent = fixExpressionSyntax(fixedContent);
    
    // Check if any changes were made
    if (originalContent !== fixedContent) {
      // Create backup
      const backupPath = `${filePath}.backup`;
      fs.writeFileSync(backupPath, originalContent, 'utf8');
      
      // Write fixed content
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      
      console.log(`✅ Fixed syntax errors in ${filePath} (backup created at ${backupPath})`);
      return true;
    } else {
      console.log(`ℹ️ No syntax errors detected in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// Process a specific file if provided as an argument
function processSpecificFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }
  
  return fixSyntaxErrors(filePath);
}

// Process all files in the project
function processAllFiles() {
  const startTime = new Date();
  console.log('🔍 Scanning project for files to process...');
  
  // Find all TypeScript/React files
  const files = findFiles('.');
  
  console.log(`Found ${files.length} files to process.`);
  
  // Process each file
  let fixCount = 0;
  files.forEach(file => {
    const fixed = fixSyntaxErrors(file);
    if (fixed) fixCount++;
  });
  
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\n✅ Completed syntax error fixing`);
  console.log(`Fixed ${fixCount} out of ${files.length} files`);
  console.log(`Time taken: ${duration.toFixed(2)} seconds`);
}

// Main function
function main() {
  // Check if a specific file was provided
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const filePath = args[0];
    console.log(`🔧 Fixing syntax errors in specified file: ${filePath}`);
    processSpecificFile(filePath);
  } else {
    console.log('🔧 Fixing syntax errors in all TypeScript/React files...');
    processAllFiles();
  }
}

// Run the script
main();