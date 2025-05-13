#!/usr/bin/env node
/**
 * Pre-commit Check for Large Files
 * 
 * This script is designed to be used as a pre-commit hook to prevent
 * large files from being committed to the git repository.
 * 
 * Usage:
 * 1. Make this script executable: chmod +x scripts/pre-commit-check.js
 * 2. Link it as a pre-commit hook:
 *    ln -s ../../scripts/pre-commit-check.js .git/hooks/pre-commit
 * 
 * Or use Husky to set it up automatically.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAX_FILE_SIZE = 500 * 1024; // 500KB
const IGNORED_EXTENSIONS = ['.md', '.txt', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.scss', '.html', '.svg'];
const IGNORED_DIRECTORIES = ['node_modules', '.git'];

// Colorized output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Get list of staged files
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR').toString().trim();
    return output ? output.split('\n') : [];
  } catch (error) {
    console.error(`${colors.red}Failed to get staged files:${colors.reset}`, error.message);
    return [];
  }
}

// Check if file should be ignored based on extension or directory
function shouldIgnoreFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  // Ignore by extension
  if (IGNORED_EXTENSIONS.includes(ext)) {
    return true;
  }
  
  // Ignore by directory
  for (const dir of IGNORED_DIRECTORIES) {
    if (filePath.startsWith(dir + '/') || filePath === dir) {
      return true;
    }
  }
  
  return false;
}

// Check file size
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`${colors.yellow}Warning: Could not check size of ${filePath}:${colors.reset}`, error.message);
    return 0;
  }
}

// Format file size for display
function formatSize(size) {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Main function
function main() {
  console.log(`${colors.blue}${colors.bold}Checking for large files in commit...${colors.reset}`);
  
  const stagedFiles = getStagedFiles();
  const largeFiles = [];
  
  for (const file of stagedFiles) {
    if (shouldIgnoreFile(file)) {
      continue;
    }
    
    const filePath = path.join(process.cwd(), file);
    const fileSize = getFileSize(filePath);
    
    if (fileSize > MAX_FILE_SIZE) {
      largeFiles.push({
        path: file,
        size: fileSize
      });
    }
  }
  
  if (largeFiles.length > 0) {
    console.log(`\n${colors.red}${colors.bold}ERROR: Large files detected in commit!${colors.reset}`);
    console.log(`\nThe following files exceed the maximum size limit of ${formatSize(MAX_FILE_SIZE)}:`);
    
    largeFiles.forEach(file => {
      console.log(`${colors.red}• ${file.path} (${formatSize(file.size)})${colors.reset}`);
    });
    
    console.log(`\n${colors.yellow}${colors.bold}Recommendations:${colors.reset}`);
    console.log(`1. Remove these files using git reset HEAD <file>`);
    console.log(`2. Consider using proper storage solutions for large files`);
    console.log(`3. If these files are essential, optimize them before committing`);
    console.log(`4. For binary assets, consider using Git LFS\n`);
    
    console.log(`${colors.yellow}To bypass this check (not recommended), use:${colors.reset}`);
    console.log(`git commit --no-verify\n`);
    
    process.exit(1);
  } else {
    console.log(`${colors.green}No large files detected in commit.${colors.reset}`);
  }
}

// Run the main function
main();