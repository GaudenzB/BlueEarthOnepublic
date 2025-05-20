#!/usr/bin/env node

/**
 * ESLint and TypeScript Integration Runner
 * 
 * This script provides a convenient way to run ESLint and TypeScript checks
 * without modifying package.json. It serves as an alternative to npm scripts.
 * 
 * Usage:
 *   node scripts/run-eslint-typecheck.mjs [command] [options]
 * 
 * Commands:
 *   lint            - Run ESLint on the codebase
 *   lint:fix        - Run ESLint with auto-fix
 *   type-check      - Run TypeScript type checking
 *   lint-type       - Run both ESLint and TypeScript checks
 *   setup           - Set up ESLint and TypeScript integration
 *   husky-install   - Install Husky git hooks
 * 
 * Examples:
 *   node scripts/run-eslint-typecheck.mjs lint
 *   node scripts/run-eslint-typecheck.mjs lint:fix
 *   node scripts/run-eslint-typecheck.mjs type-check --strict
 */

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
const command = args[0] || 'help';
const commandArgs = args.slice(1);

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(title) {
  log(`\n${colors.bright}${colors.blue}${title}${colors.reset}\n`);
}

function logSuccess(message) {
  log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}✗ ${message}${colors.reset}`);
}

function runCommand(command, args, options = {}) {
  log(`${colors.dim}$ ${command} ${args.join(' ')}${colors.reset}`);
  
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: rootDir,
    ...options
  });
  
  return result.status === 0;
}

// Command implementations
function showHelp() {
  log(`\n${colors.bright}${colors.magenta}BlueEarth Capital ESLint & TypeScript Integration${colors.reset}\n`);
  log(`Usage: node scripts/run-eslint-typecheck.mjs [command] [options]\n`);
  
  log(`${colors.bright}Available Commands:${colors.reset}`);
  log(`  ${colors.cyan}lint${colors.reset}             Run ESLint on the codebase`);
  log(`  ${colors.cyan}lint:fix${colors.reset}         Run ESLint with auto-fix`);
  log(`  ${colors.cyan}type-check${colors.reset}       Run TypeScript type checking`);
  log(`  ${colors.cyan}lint-type${colors.reset}        Run both ESLint and TypeScript checks`);
  log(`  ${colors.cyan}setup${colors.reset}            Set up ESLint and TypeScript integration`);
  log(`  ${colors.cyan}husky-install${colors.reset}    Install Husky git hooks`);
  log(`  ${colors.cyan}help${colors.reset}             Show this help message`);
  
  log(`\n${colors.bright}Examples:${colors.reset}`);
  log(`  node scripts/run-eslint-typecheck.mjs lint`);
  log(`  node scripts/run-eslint-typecheck.mjs lint:fix`);
  log(`  node scripts/run-eslint-typecheck.mjs type-check --strict`);
  
  log(`\n${colors.bright}Options:${colors.reset}`);
  log(`  ${colors.cyan}--strict${colors.reset}         Use strict TypeScript checking`);
  log(`  ${colors.cyan}--fix${colors.reset}            Fix issues automatically when possible`);
  log(`  ${colors.cyan}--quiet${colors.reset}          Reduce output verbosity`);
  
  log(`\n${colors.bright}${colors.blue}Tip:${colors.reset} You can create a shell alias for easier access:`);
  log(`  ${colors.dim}alias eslint-check="node $(pwd)/scripts/run-eslint-typecheck.mjs"${colors.reset}`);
  log(`  Then simply use ${colors.cyan}eslint-check lint${colors.reset}\n`);
}

function runLint(fix = false) {
  logHeader(`Running ESLint${fix ? ' with auto-fix' : ''}`);
  
  const eslintArgs = [
    'eslint',
    './client/src/**/*.{ts,tsx}',
    './server/**/*.ts',
    './core/**/*.ts'
  ];
  
  if (fix || commandArgs.includes('--fix')) {
    eslintArgs.push('--fix');
  }
  
  return runCommand('npx', eslintArgs);
}

function runTypeCheck(strict = false) {
  logHeader('Running TypeScript check');
  
  const useStrict = strict || commandArgs.includes('--strict');
  
  const tscArgs = [
    '--noEmit',
    '--skipLibCheck'
  ];
  
  if (useStrict) {
    tscArgs.push('--project', 'tsconfig.strict.json');
    log(`${colors.yellow}Using strict TypeScript configuration${colors.reset}`);
  }
  
  return runCommand('npx', ['tsc', ...tscArgs]);
}

function runLintAndTypeCheck() {
  logHeader('Running ESLint and TypeScript checks');
  return runCommand('node', ['scripts/lint-and-type-check.mjs', ...commandArgs]);
}

function runSetup() {
  logHeader('Setting up ESLint and TypeScript integration');
  return runCommand('node', ['scripts/setup-eslint.mjs']);
}

function installHusky() {
  logHeader('Installing Husky git hooks');
  
  // Check if .git directory exists
  const gitDir = path.join(rootDir, '.git');
  if (!fs.existsSync(gitDir)) {
    logError('.git directory not found. Is this a git repository?');
    return false;
  }
  
  // Create husky directory if it doesn't exist
  const huskyDir = path.join(rootDir, '.husky');
  if (!fs.existsSync(huskyDir)) {
    fs.mkdirSync(huskyDir, { recursive: true });
    logSuccess('Created .husky directory');
  }
  
  // Add pre-commit hook if it doesn't exist or commandArgs contains --force
  const preCommitPath = path.join(huskyDir, 'pre-commit');
  if (!fs.existsSync(preCommitPath) || commandArgs.includes('--force')) {
    const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged to handle staged files
npx lint-staged

# Run TypeScript check on the entire project
node scripts/lint-and-type-check.mjs --type-only --quiet
`;
    
    fs.writeFileSync(preCommitPath, preCommitContent);
    fs.chmodSync(preCommitPath, 0o755); // Make executable
    logSuccess('Created pre-commit hook');
  } else {
    log(`${colors.yellow}pre-commit hook already exists. Use --force to overwrite.${colors.reset}`);
  }
  
  // Create _/husky.sh if it doesn't exist
  const huskyShDir = path.join(huskyDir, '_');
  if (!fs.existsSync(huskyShDir)) {
    fs.mkdirSync(huskyShDir, { recursive: true });
  }
  
  const huskyShPath = path.join(huskyShDir, 'husky.sh');
  if (!fs.existsSync(huskyShPath) || commandArgs.includes('--force')) {
    const huskyShContent = `#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - $1"
    fi
  }

  readonly hook_name="$(basename -- "$0")"
  debug "starting $hook_name..."

  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY env variable is set to 0, skipping hook"
    exit 0
  fi

  if [ -f ~/.huskyrc ]; then
    debug "sourcing ~/.huskyrc"
    . ~/.huskyrc
  fi

  readonly husky_skip_init=1
  export husky_skip_init
  sh -e "$0" "$@"
  exitCode="$?"

  if [ $exitCode != 0 ]; then
    echo "husky - $hook_name hook exited with code $exitCode (error)"
  fi

  exit $exitCode
fi`;
    
    fs.writeFileSync(huskyShPath, huskyShContent);
    fs.chmodSync(huskyShPath, 0o755); // Make executable
    logSuccess('Created husky.sh');
  }
  
  // Create .lintstagedrc.json if it doesn't exist
  const lintstagedPath = path.join(rootDir, '.lintstagedrc.json');
  if (!fs.existsSync(lintstagedPath) || commandArgs.includes('--force')) {
    const lintstagedContent = `{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}`;
    
    fs.writeFileSync(lintstagedPath, lintstagedContent);
    logSuccess('Created .lintstagedrc.json');
  }
  
  logSuccess('Husky git hooks installation complete');
  log(`\n${colors.yellow}Note:${colors.reset} Husky hooks will run on git commit, not when manually running scripts.`);
  
  return true;
}

// Main execution
function main() {
  switch (command) {
    case 'lint':
      return runLint();
    
    case 'lint:fix':
      return runLint(true);
    
    case 'type-check':
      return runTypeCheck(commandArgs.includes('--strict'));
    
    case 'lint-type':
      return runLintAndTypeCheck();
    
    case 'setup':
      return runSetup();
    
    case 'husky-install':
      return installHusky();
    
    case 'help':
    default:
      showHelp();
      return true;
  }
}

// Run the main function
const success = main();
process.exit(success ? 0 : 1);