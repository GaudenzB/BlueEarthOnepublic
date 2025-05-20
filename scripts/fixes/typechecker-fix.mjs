#!/usr/bin/env node

/**
 * TypeScript Type Check Error Fixer
 * 
 * This utility automatically identifies and fixes common TypeScript
 * syntax errors that cause type checking failures, focusing on:
 * 
 * 1. Missing commas in object literals
 * 2. Missing expressions after assignments/colons
 * 3. Malformed switch statements (especially in return values)
 * 4. Incomplete case statements
 * 5. Misconfigured default cases in switch statements
 * 
 * Usage:
 *   node typechecker-fix.mjs [path/to/specific/file.tsx]
 * 
 * If no file is specified, it will scan all TypeScript files in the project.
 */

import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  fileExtensions: ['.ts', '.tsx'],
  excludeDirs: ['node_modules', 'dist', 'build', '.git'],
  createBackups: true,
  verbose: true
};

// Error patterns and their fixes
const ERROR_PATTERNS = [
  // 1. Missing commas in object properties
  {
    name: 'Missing comma between properties',
    pattern: /({[^}]*?)([a-zA-Z0-9_]+)\s*:\s*([^,{};\n]+)(\s*\n\s*)([a-zA-Z0-9_]+)\s*:/g,
    fix: (match, prefix, prop1, value, whitespace, prop2) => 
      `${prefix}${prop1}: ${value},${whitespace}${prop2}:`
  },
  
  // 2. Case statement without closing semicolon
  {
    name: 'Case statement without semicolon',
    pattern: /(case\s+(['"])[^'"]+\2\s*:\s*return\s*{[^}]*})\s*(?=\s*case|default)/g,
    fix: (match, caseStatement) => `${caseStatement};`
  },
  
  // 3. Malformed switch-case structure - especially for default case
  {
    name: 'Malformed default case',
    pattern: /default:\s*(\n\s*)(case|[}])/g,
    fix: (match, newline, next) => `default:\n  return {};\n${next}`
  },
  
  // 4. Specific pattern for custom-toast.tsx issue
  {
    name: 'Specific toast component syntax error',
    pattern: /(return\s*{[^}]*})(\s*\n\s*)(default:\s*return\s*{[^}]*};?\s*);(\s*\n\s*)(case)/g,
    fix: (match, returnStmt, ws1, defaultCase, ws2, nextCase) => 
      `${returnStmt};\n      default:\n        return {};\n      ${nextCase}`
  },
  
  // 5. Missing expression after colon/equals
  {
    name: 'Missing expression',
    pattern: /([=:]\s*)(\n\s*)(case|default|[})])/g,
    fix: (match, operator, newline, next) => `${operator}{},${newline}${next}`
  },
  
  // 6. Special switch statement fixes
  {
    name: 'Switch statement structure',
    pattern: /(switch\s*\(\w+\)\s*{)([^}]*?)(case\s+['"][^'"]+['"]\s*:[^}]+)(default:[^}]+)(case\s+['"][^'"]+['"]\s*:[^}]+)([^}]*)(})/g,
    fix: (match, switchStart, beforeFirstCase, firstCase, defaultCase, afterDefault, rest, switchEnd) => {
      // Reconstruct the switch statement with proper formatting
      const fixedFirstCase = firstCase.replace(/return\s*{([^}]+)}\s*$/, "return {\n        $1\n      };");
      const fixedDefaultCase = defaultCase.replace(/default:\s*return\s*{([^}]+)}\s*$/, "default:\n        return {\n          $1\n        };");
      const fixedAfterDefault = afterDefault.replace(/return\s*{([^}]+)}\s*$/, "return {\n        $1\n      };");
      
      return `${switchStart}
      ${fixedFirstCase}
      ${fixedDefaultCase}
      ${fixedAfterDefault}
      ${rest}${switchEnd}`;
    }
  }
];

/**
 * Find all TypeScript files in the project
 */
function findTypeScriptFiles(baseDir) {
  const files = [];
  
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!CONFIG.excludeDirs.includes(entry.name)) {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (CONFIG.fileExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scanDirectory(baseDir);
  return files;
}

/**
 * Fix TypeScript errors in a file
 */
function fixFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    // Read the file
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let fixedContent = originalContent;
    let fixCount = 0;
    
    // Apply each error pattern fix
    for (const pattern of ERROR_PATTERNS) {
      const beforeFix = fixedContent;
      fixedContent = fixedContent.replace(pattern.pattern, pattern.fix);
      
      if (beforeFix !== fixedContent) {
        fixCount++;
        if (CONFIG.verbose) {
          console.log(`  ✓ Fixed: ${pattern.name}`);
        }
      }
    }
    
    // Special processing for deeply nested switch statements
    if (filePath.includes('custom-toast.tsx')) {
      // Direct fix for the known issues in custom-toast.tsx
      fixedContent = fixCustomToastComponent(fixedContent);
    }
    
    // If we made changes, write the file
    if (originalContent !== fixedContent) {
      // Create backup if enabled
      if (CONFIG.createBackups) {
        const backupPath = `${filePath}.backup`;
        fs.writeFileSync(backupPath, originalContent);
        console.log(`  Created backup at ${backupPath}`);
      }
      
      // Write the fixed content
      fs.writeFileSync(filePath, fixedContent);
      console.log(`✅ Fixed ${fixCount} issues in ${filePath}`);
      return true;
    } else {
      console.log(`  No issues found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Special function to fix the custom-toast.tsx component
 * This directly addresses the specific errors mentioned
 */
function fixCustomToastComponent(content) {
  // The safest approach for this specific file is to replace the problematic
  // switch statements with corrected versions
  
  // Fix the renderIcon function
  content = content.replace(
    /const\s+renderIcon\s*=\s*\(\)\s*=>\s*{[\s\S]*?switch\s*\(variant\)[\s\S]*?default:[\s\S]*?case\s*['"]info['"][\s\S]*?}/s,
    `const renderIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircleOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.success }} />;
      case 'error':
        return <CloseCircleOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.error }} />;
      case 'warning':
        return <WarningOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.warning }} />;
      case 'info':
      default:
        return <InfoCircleOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.info }} />;
    }`
  );
  
  // Fix the getVariantStyles function
  content = content.replace(
    /const\s+getVariantStyles\s*=\s*\(\)\s*=>\s*{[\s\S]*?switch\s*\(variant\)[\s\S]*?default:[\s\S]*?case\s*['"]info['"][\s\S]*?}/s,
    `const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          background: '#f0fdf4',
          borderColor: '#a3e635'
        };
      case 'error':
        return {
          background: '#fef2f2',
          borderColor: '#f87171'
        };
      case 'warning':
        return {
          background: '#fffbeb',
          borderColor: '#fbbf24'
        };
      case 'info':
      default:
        return {
          background: '#f0f9ff',
          borderColor: '#7dd3fc'
        };
    }`
  );
  
  // Fix the getAriaAttrs function
  content = content.replace(
    /const\s+getAriaAttrs\s*=\s*\(\)\s*=>\s*{[\s\S]*?switch\s*\(variant\)[\s\S]*?default:[\s\S]*?case\s*['"]info['"][\s\S]*?}/s,
    `const getAriaAttrs = () => {
    // Type-safe aria-live values
    const assertive = 'assertive' as const;
    const polite = 'polite' as const;
    
    switch (variant) {
      case 'error':
        return { role: 'alert', 'aria-live': assertive };
      case 'warning':
        return { role: 'status', 'aria-live': polite };
      case 'success':
      case 'info':
      default:
        return { role: 'status', 'aria-live': polite };
    }`
  );
  
  return content;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 TypeScript Type Check Error Fixer');
  console.log('==================================');
  
  // Get command-line arguments
  const args = process.argv.slice(2);
  let fixedFiles = 0;
  
  if (args.length > 0) {
    // Process specific file
    const filePath = args[0];
    if (fs.existsSync(filePath)) {
      const fixed = fixFile(filePath);
      fixedFiles += fixed ? 1 : 0;
    } else {
      console.error(`❌ File not found: ${filePath}`);
    }
  } else {
    // Process all TypeScript files
    console.log('Scanning project for TypeScript files...');
    const files = findTypeScriptFiles('.');
    console.log(`Found ${files.length} TypeScript files to process.`);
    
    for (const file of files) {
      const fixed = fixFile(file);
      fixedFiles += fixed ? 1 : 0;
    }
  }
  
  console.log('\n✨ Summary:');
  console.log(`Fixed ${fixedFiles} file(s).`);
}

// Execute main function
main();