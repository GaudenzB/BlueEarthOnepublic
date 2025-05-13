#!/usr/bin/env tsx
/**
 * Storage Configuration Checker
 * 
 * This utility checks the current document storage configuration
 * and displays information about the active storage mode.
 */

import 'dotenv/config';
import { getStorageInfo } from './server/services/documentStorage';
import chalk from 'chalk';

// ANSI color functions if chalk is not available
const colors = {
  green: (text: string) => chalk?.green(text) || `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => chalk?.yellow(text) || `\x1b[33m${text}\x1b[0m`,
  red: (text: string) => chalk?.red(text) || `\x1b[31m${text}\x1b[0m`,
  blue: (text: string) => chalk?.blue(text) || `\x1b[34m${text}\x1b[0m`,
  bold: (text: string) => chalk?.bold(text) || `\x1b[1m${text}\x1b[0m`,
};

/**
 * Check if all required AWS environment variables are set
 */
function checkAwsEnvironment(): boolean {
  const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(colors.red('\n❌ Missing required AWS environment variables:'));
    missingVars.forEach(varName => {
      console.log(colors.red(`   - ${varName}`));
    });
    return false;
  }
  
  return true;
}

/**
 * Main function
 */
function main() {
  console.log(colors.bold('\n=== Document Storage Configuration Checker ===\n'));
  
  // Get the current storage info
  const storageInfo = getStorageInfo();
  
  // Display environment information
  console.log(`${colors.bold('Environment:')} ${storageInfo.isDevEnvironment ? colors.yellow('Development') : colors.green('Production')}`);
  
  // Display storage mode
  console.log(`${colors.bold('Storage Mode:')} ${storageInfo.mode === 's3' ? colors.green('AWS S3') : colors.yellow('Local Storage')}`);
  
  // If using S3, display additional information
  if (storageInfo.mode === 's3') {
    console.log(`${colors.bold('S3 Bucket:')} ${colors.blue(storageInfo.bucketName || 'undefined')}`);
    console.log(`${colors.bold('AWS Region:')} ${colors.blue(storageInfo.region || 'undefined')}`);
    
    // Data residency check
    if (storageInfo.region === 'eu-central-1') {
      console.log(`${colors.bold('Data Residency:')} ${colors.green('✓ Compliant (EU Region)')}`);
    } else {
      console.log(`${colors.bold('Data Residency:')} ${colors.red('⚠ Non-Compliant (Not EU Region)')}`);
    }
  } else {
    console.log(`${colors.bold('Local Storage Path:')} ${colors.blue('./uploads')}`);
    
    // Check if AWS environment variables are available but not being used
    const hasAwsEnv = checkAwsEnvironment();
    
    if (hasAwsEnv) {
      console.log(colors.yellow('\n⚠ AWS credentials are available but not being used.'));
      console.log(colors.yellow('   To use AWS S3 in development, set USE_AWS_IN_DEV=true in your .env file.'));
    } else {
      console.log(colors.yellow('\n⚠ Using local storage because AWS credentials are not configured.'));
      console.log(colors.yellow('   See README.md for instructions on setting up AWS S3 storage.'));
    }
  }
  
  console.log('\n');
}

// Run the main function
main();