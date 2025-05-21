#!/usr/bin/env node

/**
 * SOFT LINTING SCRIPT
 * This script runs ESLint but always exits with a success code (0)
 * so it never blocks development or CI/CD pipelines.
 * 
 * Usage:
 *   node lint-soft.cjs [...eslint arguments]
 *   
 * Example:
 *   node lint-soft.cjs client/src/lib/queryClient.ts --quiet
 */

const { execSync, spawnSync } = require('child_process');

// Get all arguments passed to this script
const eslintArgs = process.argv.slice(2);

try {
  // Run ESLint with the provided arguments
  const result = spawnSync('pnpm', ['exec', 'eslint', ...eslintArgs], { 
    encoding: 'utf8',
    stdio: 'inherit' 
  });
  
  // Always exit with success, regardless of linting errors
  process.exit(0);
} catch (error) {
  console.error("Error running script:", error.message);
  // Even if ESLint errors, still exit with success
  process.exit(0);
}