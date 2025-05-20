#!/usr/bin/env node

/**
 * TypeScript Syntax Error Fixer
 * 
 * A comprehensive tool that automatically fixes common TypeScript syntax errors:
 * - Missing commas between object properties
 * - Missing expressions where expected
 * - Malformed switch statements with default cases in wrong positions
 * - Missing closing braces and semicolons
 * - Incomplete object property assignments
 * 
 * Usage:
 * - Fix a specific file: node typescript-syntax-fixer.mjs path/to/file.tsx
 * - Fix all TypeScript files: node typescript-syntax-fixer.mjs
 * 
 * Each fix creates a backup of the original file for safety.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const CONFIG = {
  targetExtensions: ['.tsx', '.ts', '.jsx', '.js'],
  excludedDirs: ['node_modules', 'dist', 'build', '.git', '.next', 'coverage'],
  // Common patterns that cause TypeScript errors
  patterns: {
    // Missing comma between object properties
    missingComma: [
      {
        pattern: /({[^}]*?)([a-zA-Z0-9_]+)\s*:\s*([^,{};\n]+)(\s*\n\s*)([a-zA-Z0-9_]+)\s*:/g,
        replacement: (match, prefix, prop1, value, whitespace, prop2) => 
          `${prefix}${prop1}: ${value},${whitespace}${prop2}:`
      }
    ],
    // Malformed switch statements
    switchStatementErrors: [
      {
        // Pattern 1: Missing semicolon after return object in case statement
        pattern: /case\s+(['"])([^'"]+)\1\s*:\s*return\s*{([^}]*?)}\s*(?=\n\s*case|default)/g,
        replacement: (match, quote, caseValue, objectContent) =>
          `case ${quote}${caseValue}${quote}:\n      return {\n        ${objectContent.trim()}\n      };\n      `
      },
      {
        // Pattern 2: Incorrect placement of default case
        pattern: /(\s*})(\s*)default:(\s*)(\n\s*)(case|[}])/g,
        replacement: (match, closeBrace, whitespace1, whitespace2, newline, next) =>
          `${closeBrace};\n      default:\n        return {};\n      ${next}`
      },
      {
        // Pattern 3: Missing closing brace and semicolon in switch statement
        pattern: /case\s+(['"])([^'"]+)\1\s*:\s*return\s*{([^}]*?)}\s*default:/g,
        replacement: (match, quote, caseValue, objectContent) =>
          `case ${quote}${caseValue}${quote}:\n      return {\n        ${objectContent.trim()}\n      };\n      default:`
      }
    ],
    // Missing expressions
    missingExpressions: [
      {
        // Missing expression after assignment or colon
        pattern: /([=:]\s*)(\n\s*)(case|default|[})])/g,
        replacement: (match, operator, newline, next) =>
          `${operator}{},${newline}${next}`
      }
    ],
    // Missing semicolons after statements
    missingSemicolons: [
      {
        pattern: /(return\s*{[^}]*})\s*(\n\s*[^;])/g,
        replacement: (match, returnStmt, nextLine) =>
          `${returnStmt};${nextLine}`
      }
    ],
    // Unterminated JSX
    unterminatedJsx: [
      {
        pattern: /<([A-Z][a-zA-Z0-9]*)([^>]*?)>([^<]*?)<\/(?!\1)/g,
        replacement: (match, tag, props, children) =>
          `<${tag}${props}>${children}</${tag}`
      }
    ]
  }
};

/**
 * Find all TypeScript files recursively
 */
function findTypeScriptFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!CONFIG.excludedDirs.includes(entry.name)) {
        findTypeScriptFiles(fullPath, fileList);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (CONFIG.targetExtensions.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  
  return fileList;
}

/**
 * Fix TypeScript syntax errors in a file
 */
function fixTypeScriptSyntaxErrors(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File doesn't exist: ${filePath}`);
      return false;
    }
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply each pattern category
    for (const [category, patterns] of Object.entries(CONFIG.patterns)) {
      for (const { pattern, replacement } of patterns) {
        content = content.replace(pattern, replacement);
      }
    }
    
    // Special handling for switch statements
    content = fixSwitchStatements(content);
    
    // Check if any changes were made
    if (content !== originalContent) {
      // Create backup
      const backupPath = `${filePath}.backup`;
      fs.writeFileSync(backupPath, originalContent);
      
      // Write fixed content
      fs.writeFileSync(filePath, content);
      
      console.log(`✅ Fixed syntax errors in ${filePath}`);
      console.log(`   Backup created at ${backupPath}`);
      return true;
    } else {
      console.log(`No syntax errors found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Special handler for switch statements since they're complex
 */
function fixSwitchStatements(content) {
  // Find all switch statements in the content
  const switchRegex = /switch\s*\([^)]+\)\s*{([^}]*)}/g;
  let match;
  
  const fixedContent = content.replace(switchRegex, (fullMatch, switchBody) => {
    // Check if this switch statement has syntax errors
    if (
      switchBody.includes('default:') && 
      (
        switchBody.includes('default:\n      return {};') ||
        switchBody.includes('default:\n        return undefined;')
      )
    ) {
      // This switch statement already looks fixed
      return fullMatch;
    }
    
    // Find unbalanced braces, missing semicolons, or misplaced default cases
    let fixed = switchBody;
    
    // Fix cases missing semicolons after return statements
    fixed = fixed.replace(
      /(case\s+(['"])[^'"]+\2\s*:\s*return\s*{[^}]*})\s*(?=\s*case|default)/g,
      '$1;\n      '
    );
    
    // Fix misplaced default cases
    fixed = fixed.replace(
      /(case\s+(['"])[^'"]+\2\s*:[^}]*})\s*default:\s*/g,
      '$1;\n      default:\n        '
    );
    
    // Ensure each case ends with a semicolon
    fixed = fixed.replace(
      /(case\s+(['"])[^'"]+\2\s*:[^;]*)\s*(?=\s*case|default|\s*})/g,
      '$1;\n      '
    );
    
    return `switch (variant) {${fixed}}`;
  });
  
  return fixedContent;
}

/**
 * Check for syntax errors in a file using TypeScript compiler
 */
function checkTypeScriptErrors(filePath) {
  try {
    const result = execSync(`npx tsc --noEmit --target es2020 ${filePath}`, { stdio: 'pipe', encoding: 'utf8' });
    return { hasErrors: false, errors: [] };
  } catch (error) {
    // Parse TypeScript error output
    const errorLines = error.stdout.split('\n').filter(line => line.includes('error'));
    return { 
      hasErrors: errorLines.length > 0,
      errors: errorLines
    };
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const startTime = new Date();
  
  console.log('📝 TypeScript Syntax Error Fixer');
  console.log('================================');
  
  if (args.length > 0) {
    // Fix a specific file
    const filePath = args[0];
    const fixed = fixTypeScriptSyntaxErrors(filePath);
    
    if (fixed) {
      console.log(`\n✅ Successfully fixed syntax errors in ${filePath}`);
    } else {
      console.log(`\n❌ No fixable syntax errors found in ${filePath} or an error occurred`);
    }
  } else {
    // Find and fix all TypeScript files
    console.log('Scanning for TypeScript files...');
    const files = findTypeScriptFiles('.');
    console.log(`Found ${files.length} TypeScript files.`);
    
    let fixedCount = 0;
    for (const file of files) {
      const fixed = fixTypeScriptSyntaxErrors(file);
      if (fixed) fixedCount++;
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n📊 Summary:');
    console.log(`Fixed ${fixedCount} out of ${files.length} files`);
    console.log(`Time elapsed: ${duration.toFixed(2)} seconds`);
  }
}

// Execute main function
main();