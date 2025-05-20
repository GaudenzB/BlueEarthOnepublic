#!/usr/bin/env node

/**
 * JSX String Escape Fixer
 * 
 * This script focuses specifically on fixing JSX string escaping issues:
 * - Escaping single quotes (') to &apos;
 * - Escaping double quotes (") to &quot;
 * - Works only on text content, not attribute values
 */

import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  extensions: ['.tsx', '.jsx'],
  excludeDirs: ['node_modules', 'dist', '.git', 'coverage', 'build'],
};

/**
 * Find React files recursively
 */
function findFiles(dir) {
  const result = [];
  
  // Read items in current directory
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  // Process each item
  for (const item of items) {
    // Skip excluded directories
    if (item.isDirectory() && CONFIG.excludeDirs.includes(item.name)) {
      continue;
    }
    
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Recurse into subdirectory
      result.push(...findFiles(fullPath));
    } else if (CONFIG.extensions.includes(path.extname(item.name))) {
      // Add React file to results
      result.push(fullPath);
    }
  }
  
  return result;
}

/**
 * Fix JSX string escaping in a file
 */
function fixFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    // Read file content
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    // Find JSX string literal issues
    const singleQuoteIssues = findJsxTextWithUnescapedChars(originalContent, "'");
    const doubleQuoteIssues = findJsxTextWithUnescapedChars(originalContent, '"');
    
    const totalIssues = singleQuoteIssues.length + doubleQuoteIssues.length;
    
    if (totalIssues === 0) {
      console.log(`  No issues found in ${filePath}`);
      return false;
    }
    
    console.log(`  Found ${totalIssues} JSX string escaping issues`);
    
    // Create fixed content
    let content = originalContent;
    
    // Fix single quotes
    for (const issue of singleQuoteIssues) {
      const { start, end, text } = issue;
      const fixedText = text.replace(/'/g, '&apos;');
      content = content.substring(0, start) + fixedText + content.substring(end);
    }
    
    // Fix double quotes
    for (const issue of doubleQuoteIssues) {
      const { start, end, text } = issue;
      const fixedText = text.replace(/"/g, '&quot;');
      content = content.substring(0, start) + fixedText + content.substring(end);
    }
    
    // If content changed, write changes
    if (content !== originalContent) {
      // Create backup
      const backupPath = `${filePath}.backup`;
      fs.writeFileSync(backupPath, originalContent);
      
      // Write fixed content
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${totalIssues} issues in ${filePath}`);
      return true;
    } else {
      console.log(`  No fixes applied to ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Find JSX text content with unescaped characters
 */
function findJsxTextWithUnescapedChars(content, char) {
  const issues = [];
  const jsxTagRegex = /<[^>]+>/g;
  let match;
  let lastEnd = 0;
  
  // Find all JSX tags
  while ((match = jsxTagRegex.exec(content)) !== null) {
    const tagEnd = match.index + match[0].length;
    
    // Check if next content before another tag has unescaped characters
    const nextTagStart = content.indexOf('<', tagEnd);
    if (nextTagStart > tagEnd) {
      const textBetweenTags = content.substring(tagEnd, nextTagStart);
      if (textBetweenTags.includes(char)) {
        issues.push({
          start: tagEnd,
          end: nextTagStart,
          text: textBetweenTags
        });
      }
    }
    
    lastEnd = tagEnd;
  }
  
  return issues;
}

/**
 * Main function
 */
function main() {
  console.log('🔎 JSX String Escape Fixer');
  console.log('==========================');
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Fix a specific file
    const filePath = args[0];
    if (fs.existsSync(filePath)) {
      fixFile(filePath);
    } else {
      console.error(`❌ File not found: ${filePath}`);
    }
    return;
  }
  
  // Find React files
  console.log('Scanning for React files...');
  const files = findFiles('.');
  console.log(`Found ${files.length} React files.`);
  
  // Fix each file
  let fixedCount = 0;
  for (const file of files) {
    const fixed = fixFile(file);
    if (fixed) fixedCount++;
  }
  
  console.log('\n✨ Summary:');
  console.log(`Fixed JSX string escaping issues in ${fixedCount} out of ${files.length} total files.`);
}

// Run the script
main();