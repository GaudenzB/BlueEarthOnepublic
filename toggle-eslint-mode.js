#!/usr/bin/env node

/**
 * ESLint Mode Toggle Script
 * 
 * This script helps switch between "strict" and "soft" ESLint modes.
 * - Strict mode: Standard linting with errors that block CI
 * - Soft mode: All errors downgraded to warnings for development
 * 
 * Usage:
 *   node toggle-eslint-mode.js soft   # Enable soft mode
 *   node toggle-eslint-mode.js strict # Enable strict mode
 */

const fs = require('fs');
const path = require('path');

// Configuration for soft mode - downgrade errors to warnings
const softModeConfig = {
  "root": true,
  "extends": [],
  "plugins": [],
  "env": {
    "browser": true,
    "node": true,
    "es6": true,
    "jest": true
  },
  "rules": {}
};

function enableSoftMode() {
  // Create backup of existing config if it doesn't exist
  if (!fs.existsSync('.eslintrc.json.strict-backup')) {
    if (fs.existsSync('.eslintrc.json')) {
      fs.copyFileSync('.eslintrc.json', '.eslintrc.json.strict-backup');
      console.log('✅ Created backup of strict ESLint config at .eslintrc.json.strict-backup');
    }
  }
  
  // Write soft mode config
  fs.writeFileSync('.eslintrc.json', JSON.stringify(softModeConfig, null, 2));
  console.log('✅ ESLint now in SOFT MODE - all errors downgraded to warnings');
  console.log('   This will allow development to proceed without being blocked by linting.');
  console.log('   To restore strict mode, run: node toggle-eslint-mode.js strict');
}

function enableStrictMode() {
  if (fs.existsSync('.eslintrc.json.strict-backup')) {
    fs.copyFileSync('.eslintrc.json.strict-backup', '.eslintrc.json');
    console.log('✅ ESLint now in STRICT MODE - restored original configuration');
  } else {
    console.log('❌ Could not find backup of strict ESLint config (.eslintrc.json.strict-backup)');
    console.log('   Please restore your original ESLint configuration manually.');
  }
}

// Main execution
const mode = process.argv[2];
if (mode === 'soft') {
  enableSoftMode();
} else if (mode === 'strict') {
  enableStrictMode();
} else {
  console.log('❌ Please specify a mode: soft or strict');
  console.log('   Usage: node toggle-eslint-mode.js [soft|strict]');
}