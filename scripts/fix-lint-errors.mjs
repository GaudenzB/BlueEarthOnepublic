#!/usr/bin/env node

/**
 * Lint & TypeScript Error Auto-Fix Script
 * 
 * This script:
 * 1. Runs the linter and TypeScript checker to find errors
 * 2. Saves error output to a temporary file
 * 3. Runs the targeted fixer script on the saved errors
 * 
 * Usage: node fix-lint-errors.mjs [optional specific file path]
 */

import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEMP_ERROR_LOG = 'temp-errors.log';

/**
 * Run a command and capture its output
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        // Still resolve - we want the error output for analysis
        resolve(stderr || stdout);
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Run the targeted fixer script with the error log
 */
function runTargetedFixer(errorLogPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Running targeted fixer on errors from ${errorLogPath}...`);
    
    const fixerProcess = spawn('node', ['scripts/fixes/targeted-fixer.mjs', errorLogPath], {
      stdio: 'inherit'
    });
    
    fixerProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Successfully ran targeted fixer');
        resolve();
      } else {
        console.error(`❌ Targeted fixer failed with code ${code}`);
        reject(new Error(`Fixer exited with code ${code}`));
      }
    });
    
    fixerProcess.on('error', (err) => {
      console.error(`❌ Error running targeted fixer: ${err.message}`);
      reject(err);
    });
  });
}

/**
 * Run the broader auto-fixer script after the targeted fixes
 */
function runBroadFixer() {
  return new Promise((resolve, reject) => {
    console.log('\n🔧 Running broad auto-fixers for remaining issues...');
    
    const fixerProcess = spawn('node', ['scripts/run-auto-fixers.mjs'], {
      stdio: 'inherit'
    });
    
    fixerProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Successfully ran broad auto-fixers');
        resolve();
      } else {
        console.error(`❌ Broad auto-fixers failed with code ${code}`);
        reject(new Error(`Fixer exited with code ${code}`));
      }
    });
    
    fixerProcess.on('error', (err) => {
      console.error(`❌ Error running broad auto-fixers: ${err.message}`);
      reject(err);
    });
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🔍 Lint & TypeScript Error Auto-Fix');
    console.log('=================================');
    
    const args = process.argv.slice(2);
    const targetPath = args[0] || '';
    
    // Optional configuration
    const config = {
      includeFormatting: true,
      includeTypeChecking: true,
      includeTests: true,
    };
    
    // Build the lint command
    let lintCommand = 'npm run lint';
    if (!config.includeFormatting) {
      lintCommand += ' -- --no-fix';
    }
    if (!config.includeTests) {
      lintCommand += ' -- --ignore-pattern "**/tests/**"';
    }
    
    // Add specific file target if provided
    if (targetPath) {
      lintCommand += ` -- "${targetPath}"`;
    }
    
    console.log(`Running: ${lintCommand}`);
    
    // Run the linter and capture errors
    const lintOutput = await runCommand(lintCommand);
    
    // Run TypeScript checker if configured
    let typeCheckOutput = '';
    if (config.includeTypeChecking) {
      const typeCheckCommand = targetPath ? 
        `npx tsc --noEmit --pretty "${targetPath}"` : 
        'npx tsc --noEmit --pretty';
      
      console.log(`Running: ${typeCheckCommand}`);
      typeCheckOutput = await runCommand(typeCheckCommand);
    }
    
    // Combine outputs
    const combinedOutput = `${lintOutput}\n${typeCheckOutput}`;
    
    // Save to temp file
    fs.writeFileSync(TEMP_ERROR_LOG, combinedOutput);
    console.log(`\nSaved errors to ${TEMP_ERROR_LOG}`);
    
    // Count errors
    const errorCount = (combinedOutput.match(/error/gi) || []).length;
    const warningCount = (combinedOutput.match(/warning/gi) || []).length;
    
    console.log(`Found approximately ${errorCount} errors and ${warningCount} warnings`);
    
    if (errorCount === 0 && warningCount === 0) {
      console.log('✅ No linting or type errors found! Your code is clean.');
      try {
        fs.unlinkSync(TEMP_ERROR_LOG);
      } catch (err) {
        // Ignore deletion errors
      }
      return;
    }
    
    // Run the fixers
    await runTargetedFixer(TEMP_ERROR_LOG);
    
    // Run broader fixers if there are still errors
    const needsBroadFixes = errorCount > 5 || warningCount > 10;
    if (needsBroadFixes) {
      await runBroadFixer();
    }
    
    // Clean up temp file
    try {
      fs.unlinkSync(TEMP_ERROR_LOG);
    } catch (err) {
      // Ignore deletion errors
    }
    
    console.log('\n✨ All fixes complete! Run the linter again to check for remaining issues.');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();