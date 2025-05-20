#!/usr/bin/env node

/**
 * Auto-Fixer Master Script
 * 
 * This script runs all the auto-fixers in the appropriate sequence to fix
 * common linting and TypeScript errors throughout the codebase.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const FIXERS = [
  {
    name: 'TypeScript Syntax Fixer',
    script: 'scripts/fixes/ts-syntax-fixer.mjs',
    description: 'Fixes switch statement syntax issues and fallthrough comments',
  },
  {
    name: 'JSX String Escape Fixer',
    script: 'scripts/fixes/jsx-escape-fixer.mjs',
    description: 'Escapes quotes and apostrophes in JSX content',
  },
  {
    name: 'React Hooks Fixer',
    script: 'scripts/fixes/react-hooks-fixer.mjs',
    description: 'Fixes useEffect, useMemo, and useCallback dependency issues',
  },
  {
    name: 'Unused Variables Fixer',
    script: 'scripts/fixes/unused-vars-fixer.mjs',
    description: 'Prefixes unused variables with underscore',
  },
  {
    name: 'ESLint Auto-Fix',
    script: 'scripts/fixes/eslint-auto-fix.mjs',
    description: 'Fixes all remaining linting issues',
  }
];

// Directories to scan for problems
const TARGET_DIRS = [
  'client',
  'server',
  'shared',
  'modules',
  'core'
];

// Optional: Target specific files instead of directories
const TARGET_FILES = process.argv.slice(2);

/**
 * Run a fixer script with the given arguments
 */
async function runFixer(fixer, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n\n📋 Running ${fixer.name}...`);
    console.log(`Description: ${fixer.description}`);
    console.log('='.repeat(50));
    
    const scriptPath = path.resolve(process.cwd(), fixer.script);
    
    // Skip if script doesn't exist
    if (!fs.existsSync(scriptPath)) {
      console.log(`⚠️ Script ${fixer.script} not found. Skipping.`);
      resolve({ success: false, reason: 'script-not-found' });
      return;
    }
    
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Successfully ran ${fixer.name}`);
        resolve({ success: true });
      } else {
        console.error(`❌ ${fixer.name} failed with code ${code}`);
        resolve({ success: false, code });
      }
    });
    
    child.on('error', (err) => {
      console.error(`❌ Error running ${fixer.name}: ${err.message}`);
      reject(err);
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('🛠️  Auto-Fixer Suite');
  console.log('===================');
  console.log('This script will run all auto-fixers to correct linting and TypeScript errors.');
  console.log(`Found ${FIXERS.length} fixers to run.\n`);
  
  // Check for environment
  try {
    // Determine targets
    const targets = TARGET_FILES.length > 0 ? TARGET_FILES : TARGET_DIRS;
    
    // Run each fixer in sequence
    for (const fixer of FIXERS) {
      try {
        const result = await runFixer(fixer, targets);
        if (!result.success) {
          console.log(`⚠️ ${fixer.name} did not complete successfully.`);
        }
      } catch (err) {
        console.error(`❌ Error with ${fixer.name}: ${err.message}`);
      }
    }
    
    console.log('\n\n✨ Auto-fixing complete!');
    console.log('Run your linter/type checker to verify the remaining issues.');
    
  } catch (error) {
    console.error('❌ Error running auto-fixers:', error.message);
    process.exit(1);
  }
}

// Run the script
main();