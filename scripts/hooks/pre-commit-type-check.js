#!/usr/bin/env node

/**
 * Pre-Commit TypeScript Syntax Check & Fix
 * 
 * This script:
 * 1. Identifies staged TypeScript files
 * 2. Runs a syntax checker against them
 * 3. Automatically fixes common syntax errors
 * 4. Stages the fixed files
 * 
 * Add to your Git hooks by running:
 * `cp scripts/hooks/pre-commit-type-check.js .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit`
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  fixerScript: 'scripts/fixes/typechecker-fix.mjs',
}

/**
 * Get a list of staged files that match our target extensions
 */
function getStagedFiles() {
  try {
    const gitOutput = execSync('git diff --cached --name-only').toString();
    return gitOutput
      .split('\n')
      .filter(file => 
        file.trim() !== '' && 
        CONFIG.fileExtensions.includes(path.extname(file))
      );
  } catch (error) {
    console.error('❌ Failed to get staged files:', error.message);
    return [];
  }
}

/**
 * Run TypeScript compiler to check for errors
 */
function checkTypeScriptErrors(files) {
  if (files.length === 0) return [];
  
  try {
    // Only check .ts and .tsx files
    const tsFiles = files.filter(file => 
      ['.ts', '.tsx'].includes(path.extname(file))
    );
    
    if (tsFiles.length === 0) return [];
    
    try {
      // Try to compile the files without emitting output
      execSync(`npx tsc --noEmit ${tsFiles.join(' ')}`, {
        stdio: 'pipe'
      });
      return []; // No errors
    } catch (error) {
      // Parse the error output to find problematic files
      const errorOutput = error.stdout?.toString() || '';
      const errorFiles = [];
      
      // Extract unique filenames from error messages
      const errorRegex = /([\w/.]+\.tsx?)(\(\d+,\d+\))?: error TS\d+:/g;
      let match;
      while ((match = errorRegex.exec(errorOutput)) !== null) {
        if (!errorFiles.includes(match[1])) {
          errorFiles.push(match[1]);
        }
      }
      
      return errorFiles;
    }
  } catch (error) {
    console.error('❌ Error running TypeScript check:', error.message);
    return [];
  }
}

/**
 * Run the syntax fixer on problematic files
 */
function fixSyntaxErrors(files) {
  if (files.length === 0) return [];
  
  const fixedFiles = [];
  
  for (const file of files) {
    try {
      console.log(`📝 Fixing syntax in ${file}...`);
      execSync(`node ${CONFIG.fixerScript} ${file}`, {
        stdio: 'inherit'
      });
      fixedFiles.push(file);
    } catch (error) {
      console.error(`❌ Failed to fix ${file}:`, error.message);
    }
  }
  
  return fixedFiles;
}

/**
 * Stage the fixed files
 */
function stageFixedFiles(files) {
  if (files.length === 0) return;
  
  try {
    execSync(`git add ${files.join(' ')}`);
    console.log(`✅ Re-staged ${files.length} fixed files`);
  } catch (error) {
    console.error('❌ Failed to stage fixed files:', error.message);
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Running TypeScript Syntax Check...');
  
  // Get staged files
  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log('No TypeScript files staged for commit.');
    process.exit(0);
  }
  
  console.log(`Found ${stagedFiles.length} staged TypeScript files.`);
  
  // Check for TypeScript errors
  const filesWithErrors = checkTypeScriptErrors(stagedFiles);
  
  if (filesWithErrors.length === 0) {
    console.log('✅ No TypeScript syntax errors found.');
    process.exit(0);
  }
  
  console.log(`🔧 Found errors in ${filesWithErrors.length} files. Attempting to fix...`);
  
  // Fix errors
  const fixedFiles = fixSyntaxErrors(filesWithErrors);
  
  // Re-stage fixed files
  stageFixedFiles(fixedFiles);
  
  if (filesWithErrors.length !== fixedFiles.length) {
    console.error(`⚠️ Could not fix all errors. Fixed ${fixedFiles.length} out of ${filesWithErrors.length} files.`);
    process.exit(1);
  }
  
  console.log('✅ All TypeScript syntax errors were fixed!');
  process.exit(0);
}

main();