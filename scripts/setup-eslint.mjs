#!/usr/bin/env node

/**
 * ESLint Setup Script
 * 
 * This script helps configure and set up ESLint for the project,
 * ensuring it works correctly with TypeScript and aligns with 
 * project coding standards.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}${colors.blue}Step ${step}:${colors.reset} ${message}\n`);
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

function executeCommand(command, errorMessage) {
  try {
    execSync(command, { stdio: 'inherit', cwd: rootDir });
    return true;
  } catch (error) {
    logError(errorMessage || `Failed to execute: ${command}`);
    return false;
  }
}

// Main function
async function main() {
  log(`\n${colors.bright}${colors.magenta}BlueEarth Capital ESLint Setup${colors.reset}\n`);
  log('This script will configure ESLint to work with TypeScript in your project.');

  // Step 1: Check ESLint configuration
  logStep(1, 'Checking ESLint configuration');
  
  const eslintConfigPath = path.join(rootDir, '.eslintrc.json');
  if (fs.existsSync(eslintConfigPath)) {
    logSuccess('ESLint configuration found');
    
    // Check ESLint configuration content (simplified check)
    const eslintConfig = JSON.parse(fs.readFileSync(eslintConfigPath, 'utf8'));
    if (!eslintConfig.extends?.includes('plugin:@typescript-eslint/recommended-requiring-type-checking')) {
      logWarning('ESLint configuration is missing TypeScript type-checking integration');
      log('Recommended: Update .eslintrc.json to include "plugin:@typescript-eslint/recommended-requiring-type-checking"');
    } else {
      logSuccess('ESLint is configured with TypeScript type-checking');
    }
  } else {
    logWarning('ESLint configuration not found');
    log('Creating default ESLint configuration...');
    
    const defaultConfig = {
      "root": true,
      "env": {
        "browser": true,
        "es2021": true,
        "node": true
      },
      "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
      ],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
        "ecmaFeatures": {
          "jsx": true
        },
        "ecmaVersion": "latest",
        "sourceType": "module",
        "project": "./tsconfig.json"
      },
      "plugins": [
        "react",
        "react-hooks",
        "@typescript-eslint"
      ],
      "settings": {
        "react": {
          "version": "detect"
        }
      },
      "rules": {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
        "@typescript-eslint/no-unused-vars": ["warn", {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }],
        "@typescript-eslint/no-explicit-any": "warn",
        "no-console": ["warn", { "allow": ["warn", "error", "info"] }]
      }
    };
    
    fs.writeFileSync(eslintConfigPath, JSON.stringify(defaultConfig, null, 2));
    logSuccess('Created default ESLint configuration');
  }

  // Step 2: Create VS Code settings for ESLint (if .vscode directory exists)
  logStep(2, 'Setting up VS Code integration');
  
  const vscodeDir = path.join(rootDir, '.vscode');
  if (fs.existsSync(vscodeDir)) {
    const vscodeSettingsPath = path.join(vscodeDir, 'settings.json');
    let vscodeSettings = {};
    
    if (fs.existsSync(vscodeSettingsPath)) {
      try {
        vscodeSettings = JSON.parse(fs.readFileSync(vscodeSettingsPath, 'utf8'));
      } catch (error) {
        logWarning('Could not parse existing VS Code settings');
        vscodeSettings = {};
      }
    }
    
    // Add ESLint settings
    vscodeSettings["editor.codeActionsOnSave"] = {
      ...(vscodeSettings["editor.codeActionsOnSave"] || {}),
      "source.fixAll.eslint": true
    };
    
    vscodeSettings["eslint.validate"] = [
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact"
    ];
    
    vscodeSettings["typescript.tsdk"] = "node_modules/typescript/lib";
    
    fs.writeFileSync(vscodeSettingsPath, JSON.stringify(vscodeSettings, null, 2));
    logSuccess('Updated VS Code settings for ESLint integration');
  } else {
    logWarning('.vscode directory not found. Skipping VS Code integration');
    log('You can manually set up VS Code integration following the guide in docs/eslint-typescript-guide.md');
  }

  // Step 3: Run initial ESLint check
  logStep(3, 'Running initial ESLint check');
  log('This may take a moment...');
  
  if (executeCommand('npx eslint ./client/src --max-warnings=0 --quiet', 'ESLint check found issues')) {
    logSuccess('ESLint check passed with no errors or warnings!');
  } else {
    logWarning('ESLint check found issues. Review and fix them following our guidelines');
    log('For more information, see docs/eslint-typescript-guide.md');
  }

  // Step 4: Add npm scripts for ESLint
  logStep(4, 'Adding npm scripts for ESLint');
  
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Add ESLint scripts
      packageJson.scripts = {
        ...(packageJson.scripts || {}),
        "lint": "eslint './client/src/**/*.{ts,tsx}' './server/**/*.ts'",
        "lint:fix": "eslint './client/src/**/*.{ts,tsx}' './server/**/*.ts' --fix"
      };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      logSuccess('Added npm scripts for ESLint');
      log('You can now run "npm run lint" or "npm run lint:fix"');
    } catch (error) {
      logError('Failed to update package.json');
      log('You can manually add the following scripts to your package.json:');
      log('"lint": "eslint \'./client/src/**/*.{ts,tsx}\' \'./server/**/*.ts\'"');
      log('"lint:fix": "eslint \'./client/src/**/*.{ts,tsx}\' \'./server/**/*.ts\' --fix"');
    }
  } else {
    logWarning('package.json not found. Skipping npm script setup');
  }

  // Done
  log(`\n${colors.bright}${colors.green}Setup Complete!${colors.reset}\n`);
  log(`Read ${colors.cyan}docs/eslint-typescript-guide.md${colors.reset} for more information on our ESLint configuration.`);
}

// Run the main function
main().catch(error => {
  logError(`An unexpected error occurred: ${error.message}`);
  process.exit(1);
});