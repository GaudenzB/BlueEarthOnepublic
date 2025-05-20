#!/usr/bin/env node

/**
 * Combined Linting and Type Checking Script
 * 
 * This script runs both ESLint and TypeScript checks in a single pass,
 * making it easy to verify code quality before commits.
 */

import { execSync } from 'child_process';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get script directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes for formatting console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Command line arguments
const args = process.argv.slice(2);
const fix = args.includes('--fix');
const watch = args.includes('--watch');
const strict = args.includes('--strict');
const quiet = args.includes('--quiet');
const failOnWarnings = args.includes('--fail-on-warnings');
const lintOnly = args.includes('--lint-only');
const typeOnly = args.includes('--type-only');
const paths = args.filter(arg => !arg.startsWith('--'));

// Default patterns to check if none provided
const defaultPathPatterns = ['./client/src/**/*.{ts,tsx}', './server/**/*.ts', './core/**/*.ts'];
const pathPatterns = paths.length > 0 ? paths : defaultPathPatterns;

// Helper functions
function log(message, color = colors.reset) {
  if (!quiet) {
    console.log(`${color}${message}${colors.reset}`);
  }
}

function logHeader(title) {
  log(`\n${colors.bright}${colors.blue}${title}${colors.reset}\n`);
}

function logSuccess(message) {
  log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}✗ ${message}${colors.reset}`);
}

function runCommand(command, args, options = {}) {
  if (!quiet) {
    log(`${colors.dim}$ ${command} ${args.join(' ')}${colors.reset}`);
  }
  
  const result = spawnSync(command, args, {
    stdio: quiet ? 'pipe' : 'inherit',
    cwd: rootDir,
    ...options
  });
  
  return {
    success: result.status === 0,
    output: result.stdout ? result.stdout.toString() : '',
    error: result.stderr ? result.stderr.toString() : '',
    status: result.status
  };
}

// Main functions
async function runLinting() {
  logHeader('Running ESLint');
  
  const eslintArgs = [
    ...pathPatterns,
    '--max-warnings', failOnWarnings ? '0' : '9999',
  ];
  
  if (fix) {
    eslintArgs.push('--fix');
  }
  
  const result = runCommand('npx', ['eslint', ...eslintArgs]);
  
  if (result.success) {
    logSuccess('ESLint check passed');
    return true;
  } else {
    logError('ESLint check failed');
    return false;
  }
}

async function runTypeCheck() {
  logHeader('Running TypeScript check');
  
  const tsconfigPath = path.join(rootDir, strict ? 'tsconfig.strict.json' : 'tsconfig.json');
  
  // Check if the tsconfig file exists
  if (!fs.existsSync(tsconfigPath)) {
    logError(`TypeScript config file not found: ${tsconfigPath}`);
    return false;
  }
  
  const tscArgs = [
    '--noEmit',
    '--skipLibCheck',
    '--project', tsconfigPath
  ];
  
  if (watch) {
    tscArgs.push('--watch');
  }
  
  const result = runCommand('npx', ['tsc', ...tscArgs]);
  
  if (result.success) {
    logSuccess('TypeScript check passed');
    return true;
  } else {
    logError('TypeScript check failed');
    return false;
  }
}

// Main execution
async function main() {
  log(`\n${colors.bright}${colors.magenta}BlueEarth Capital Code Quality Check${colors.reset}\n`);
  
  let lintSuccess = true;
  let typeSuccess = true;
  
  if (!typeOnly) {
    lintSuccess = await runLinting();
  }
  
  if (!lintOnly) {
    typeSuccess = await runTypeCheck();
  }
  
  if (lintSuccess && typeSuccess) {
    log(`\n${colors.bright}${colors.green}All checks passed!${colors.reset}\n`);
    return 0;
  } else {
    log(`\n${colors.bright}${colors.red}Some checks failed.${colors.reset}\n`);
    return 1;
  }
}

// Run the main function
main()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  });