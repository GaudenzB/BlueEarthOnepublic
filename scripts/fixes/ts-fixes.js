/**
 * TypeScript Error Fixer
 * 
 * This script fixes common TypeScript errors across the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common fixes to apply
const fixes = [
  {
    // Fix 1: Add import for MemoryRouter in test files
    pattern: /import.*Router.*from 'wouter';\s/,
    test: (content) => content.includes('MemoryRouter') && !content.includes('import') && !content.includes('MemoryRouter'),
    replacement: (match) => match.includes('MemoryRouter') ? match : match.replace('Router', 'Router, MemoryRouter')
  },
  {
    // Fix 2: Proper NODE_ENV access
    pattern: /process\.env\.NODE_ENV/g,
    replacement: "process.env['NODE_ENV']"
  },
  {
    // Fix 3: Add null checks for optional parameters
    pattern: /(const\s+\w+\s*:\s*\w+Response<.*>\s*=\s*\{\s*success:.*,\s*data.*,\s*message,\s*meta\s*\})/,
    replacement: (match) => match.replace('message,', 'message: message || undefined,').replace('meta', 'meta: meta || undefined')
  }
];

// Apply fixes to a single file
function applyFixesToFile(filePath) {
  try {
    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      if (fix.test && !fix.test(content)) {
        return;
      }
      
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`- Applied fix to ${filePath}`);
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Process test files with MemoryRouter issues
function fixMemoryRouterInTests() {
  try {
    const testFiles = execSync("find client -name '*.test.tsx' | xargs grep -l 'MemoryRouter'").toString().trim().split('\n');
    testFiles.forEach(file => {
      if (file) applyFixesToFile(file);
    });
  } catch (error) {
    console.error("Error finding test files:", error.message);
  }
}

// Process api response files for null checks
function fixApiResponseFiles() {
  try {
    const apiFiles = execSync("find core -path '*/utils/apiResponse.ts'").toString().trim().split('\n');
    apiFiles.forEach(file => {
      if (file) applyFixesToFile(file);
    });
  } catch (error) {
    console.error("Error finding API response files:", error.message);
  }
}

// Process files with NODE_ENV usage
function fixNodeEnvUsage() {
  try {
    const envFiles = execSync("find . -type f -name '*.ts' -o -name '*.tsx' | xargs grep -l 'process.env.NODE_ENV'").toString().trim().split('\n');
    envFiles.forEach(file => {
      if (file) applyFixesToFile(file);
    });
  } catch (error) {
    console.error("Error finding NODE_ENV files:", error.message);
  }
}

// Main execution
console.log("Starting TypeScript error fixes...");
fixMemoryRouterInTests();
fixApiResponseFiles();
fixNodeEnvUsage();
console.log("TypeScript error fixes completed.");
