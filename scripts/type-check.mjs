#!/usr/bin/env node

/**
 * TypeScript Type Checking Script
 * 
 * This script runs the TypeScript compiler to check for type errors
 * without emitting any JavaScript files. It can be run with different
 * configurations:
 * 
 * Usage:
 *   node scripts/type-check.mjs             - Run check on all source files
 *   node scripts/type-check.mjs --strict    - Run with strict checks
 *   node scripts/type-check.mjs --watch     - Run in watch mode
 */

import { execSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get current script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Get arguments
const args = process.argv.slice(2);
const isStrict = args.includes('--strict');
const isWatch = args.includes('--watch');
const isFix = args.includes('--fix');
const isVerbose = args.includes('--verbose');

// Determine which tsconfig to use
const tsConfig = isStrict ? 'tsconfig.strict.json' : 'tsconfig.json';

// Print diagnostic information in verbose mode
if (isVerbose) {
  console.log('TypeScript Check Configuration:');
  console.log(`- Working directory: ${rootDir}`);
  console.log(`- Config file: ${tsConfig}`);
  console.log(`- Mode: ${isStrict ? 'Strict' : 'Standard'}${isWatch ? ' (Watch)' : ''}${isFix ? ' (Fix)' : ''}`);
  console.log(`- Node version: ${process.version}`);
  console.log('-----------------------------------');
}

// Build the TypeScript check command
let tscCommand = `tsc --noEmit --project ${tsConfig}`;

if (isWatch) {
  tscCommand += ' --watch';
}

// Build the ESLint check command (if fix flag is set)
const eslintCommand = `eslint ${isFix ? '--fix ' : ''}./client/src ./server ./core --ext .ts,.tsx`;

// Log what we're doing
console.log(`Running TypeScript check with ${tsConfig}${isWatch ? ' in watch mode' : ''}...`);

try {
  // Execute the TypeScript check
  execSync(tscCommand, { stdio: 'inherit' });
  
  if (!isWatch && isFix) {
    console.log('\nRunning ESLint to fix linting issues...');
    try {
      execSync(eslintCommand, { stdio: 'inherit' });
      console.log('\n✅ ESLint fixes applied');
    } catch (eslintError) {
      console.error('\n⚠️ ESLint found issues that could not be automatically fixed.');
      // Continue execution - we don't want the script to fail if only ESLint has issues
    }
  }
  
  if (!isWatch) {
    console.log('\n✅ TypeScript check completed successfully');
  }
} catch (error) {
  if (!isWatch) {
    console.error('\n❌ TypeScript check failed with errors');
    process.exit(1);
  }
}