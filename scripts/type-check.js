#!/usr/bin/env node

/**
 * TypeScript Type Checking Script
 * 
 * This script runs the TypeScript compiler to check for type errors
 * without emitting any JavaScript files. It can be run with different
 * configurations:
 * 
 * Usage:
 *   npm run type-check             - Run check on all source files
 *   npm run type-check:strict      - Run with strict checks
 *   npm run type-check:watch       - Run in watch mode
 */

const { execSync } = require('child_process');
const path = require('path');

// Get arguments
const args = process.argv.slice(2);
const isStrict = args.includes('--strict');
const isWatch = args.includes('--watch');

// Determine which tsconfig to use
const tsConfig = isStrict ? 'tsconfig.strict.json' : 'tsconfig.json';

// Build the command
let command = `tsc --noEmit --project ${tsConfig}`;

if (isWatch) {
  command += ' --watch';
}

// Log what we're doing
console.log(`Running TypeScript check with ${tsConfig}${isWatch ? ' in watch mode' : ''}...`);

try {
  // Execute the command
  execSync(command, { stdio: 'inherit' });
  
  if (!isWatch) {
    console.log('\n✅ TypeScript check completed successfully');
  }
} catch (error) {
  if (!isWatch) {
    console.error('\n❌ TypeScript check failed with errors');
    process.exit(1);
  }
}