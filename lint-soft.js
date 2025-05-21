#!/usr/bin/env node

/**
 * SOFT LINTING SCRIPT
 * This script runs ESLint but always exits with a success code (0)
 * so it never blocks development or CI/CD pipelines.
 * 
 * Usage:
 *   node lint-soft.js [...eslint arguments]
 *   
 * Example:
 *   node lint-soft.js client/src/lib/queryClient.ts --quiet
 */

const { execSync } = require('child_process');

// Get all arguments passed to this script
const eslintArgs = process.argv.slice(2).join(' ');

try {
  // Run ESLint with the provided arguments
  const result = execSync(`pnpm exec eslint ${eslintArgs}`, { 
    encoding: 'utf8',
    stdio: 'inherit' 
  });
  
  // Output to console
  if (result) console.log(result);
  
  // Always exit with success, regardless of linting errors
  process.exit(0);
} catch (error) {
  // Even if ESLint errors, still exit with success
  process.exit(0);
}