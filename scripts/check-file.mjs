#!/usr/bin/env node

/**
 * Quick TypeScript checker for specific files
 * 
 * Usage:
 *   node scripts/check-file.mjs path/to/file.ts [path/to/another/file.ts ...]
 */

import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get file paths from command line arguments
const filePaths = process.argv.slice(2);

if (filePaths.length === 0) {
  console.error('Please provide at least one file path to check');
  process.exit(1);
}

console.log(`Checking TypeScript errors in ${filePaths.length} file(s)...`);

// Run TypeScript compiler in noEmit mode on the specified files
const tsc = spawn('npx', [
  'tsc', 
  '--noEmit',
  '--skipLibCheck',
  ...filePaths
]);

// Output results
tsc.stdout.on('data', (data) => {
  console.log(data.toString());
});

tsc.stderr.on('data', (data) => {
  console.error(data.toString());
});

tsc.on('close', (code) => {
  if (code === 0) {
    console.log('✅ No TypeScript errors found!');
  } else {
    console.error(`❌ TypeScript check failed with exit code ${code}`);
  }
  process.exit(code);
});