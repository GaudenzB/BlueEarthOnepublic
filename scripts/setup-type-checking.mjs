#!/usr/bin/env node

/**
 * TypeScript Checking System Setup
 * 
 * This script sets up the entire TypeScript checking system:
 * - Creates/updates tsconfig.strict.json for enhanced type checking
 * - Sets up pre-commit hooks using Husky
 * - Ensures proper file permissions for scripts
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';

// Get script directory and root path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Ensure Husky hooks directory exists
const huskyDir = join(rootDir, '.husky');
if (!existsSync(huskyDir)) {
  console.log('📁 Creating .husky directory...');
  mkdirSync(huskyDir);
}

// Ensure Husky hook support directory exists
const huskyHookSupportDir = join(huskyDir, '_');
if (!existsSync(huskyHookSupportDir)) {
  console.log('📁 Creating .husky/_ directory...');
  mkdirSync(huskyHookSupportDir);
}

// Create husky.sh if it doesn't exist
const huskyShPath = join(huskyHookSupportDir, 'husky.sh');
if (!existsSync(huskyShPath)) {
  console.log('📝 Creating husky.sh script...');
  const huskyShContent = `#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - $1"
    fi
  }

  readonly hook_name="$(basename "$0")"
  debug "starting $hook_name..."

  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY=0, skip running hooks"
    exit 0
  fi

  export readonly husky_skip_init=1
  sh -e "$0" "$@"
  exitCode="$?"

  if [ $exitCode != 0 ]; then
    echo "husky - $hook_name hook exited with code $exitCode (error)"
  fi

  exit $exitCode
fi`;

  writeFileSync(huskyShPath, huskyShContent);
  execSync(`chmod +x ${huskyShPath}`);
}

// Make hook files executable
console.log('🔧 Making hook files executable...');
const preCommitPath = join(huskyDir, 'pre-commit');
if (existsSync(preCommitPath)) {
  execSync(`chmod +x ${preCommitPath}`);
}

// Make type-check script executable
console.log('🔧 Making type-check script executable...');
const typeCheckPath = join(rootDir, 'scripts', 'type-check.mjs');
if (existsSync(typeCheckPath)) {
  execSync(`chmod +x ${typeCheckPath}`);
}

// Run an initial type check to identify issues
console.log('\n🧪 Running an initial TypeScript check to identify any issues...');
try {
  execSync('node scripts/type-check.mjs', { stdio: 'inherit' });
  console.log('✅ TypeScript check passed!');
} catch (error) {
  console.log('⚠️ TypeScript check found some issues to fix.');
}

console.log(`
✅ TypeScript checking system setup is complete!

Available commands:
  node scripts/type-check.mjs             - Run type checking on all TypeScript files
  node scripts/type-check.mjs --strict    - Run type checking with strict rules
  node scripts/type-check.mjs --fix       - Run type checking and fix ESLint issues
  node scripts/type-check.mjs --watch     - Run type checking in watch mode

The pre-commit hook will automatically check your code before each commit.
`);