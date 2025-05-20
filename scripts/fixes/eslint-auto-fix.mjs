#!/usr/bin/env node

/**
 * ESLint & TypeScript Auto-Fix Script
 * 
 * This script automatically fixes common linting and TypeScript errors:
 * 1. JSX escaping issues (quotes, apostrophes)
 * 2. Unused variables (prefixes with underscore)
 * 3. React Hook dependency issues (wraps functions in useCallback/useMemo)
 * 4. Missing display names in React components
 * 5. Unexpected 'any' types
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration
const CONFIG = {
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludeDirs: ['node_modules', 'dist', '.git', 'coverage', 'build'],
  fixers: [
    {
      name: 'JSX Quote Escaping',
      pattern: /(['"])(?=[^<>]*>)/g,
      test: (content, match, index) => {
        // Check if this quote is inside JSX (between < and >)
        const before = content.slice(0, index);
        const after = content.slice(index);
        const lastOpenTag = before.lastIndexOf('<');
        const lastCloseTag = before.lastIndexOf('>');
        const nextCloseTag = after.indexOf('>');
        const nextOpenTag = after.indexOf('<');
        
        // If we're between tags, and not in an attribute value
        return lastOpenTag > lastCloseTag && 
               (nextCloseTag < nextOpenTag || nextOpenTag === -1) &&
               !before.slice(lastOpenTag).includes('=');
      },
      fix: (content) => {
        // Handle single quotes in JSX text content
        let fixed = content.replace(/(?<=<[^>]*[^=]>)([^<]*)'/g, (match, p1) => {
          return p1 + '&apos;';
        });
        
        // Handle double quotes in JSX text content
        fixed = fixed.replace(/(?<=<[^>]*[^=]>)([^<]*)"/g, (match, p1) => {
          return p1 + '&quot;';
        });
        
        return fixed;
      }
    },
    {
      name: 'Unused Variables',
      pattern: /\b(const|let|var|function)\s+([a-zA-Z0-9_]+)(?!\s*:\s*_)/g,
      test: (content, match) => {
        // Check if variable is defined but never used (only works with simple detection)
        const varName = match[2];
        if (varName.startsWith('_')) return false; // Already prefixed
        
        // Count occurrences after declaration (crude but effective for simple cases)
        const afterDeclaration = content.slice(content.indexOf(match[0]) + match[0].length);
        const occurrences = (afterDeclaration.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
        
        // Only apply to variables that appear to be unused (0 or 1 occurrence)
        return occurrences <= 1 && content.includes('// eslint-disable-next-line') === false;
      },
      fix: (content) => {
        // Use regular expression with callback to process each match
        return content.replace(/\b(const|let|var|function)\s+([a-zA-Z0-9_]+)(?!\s*:)/g, (match, declarationType, varName) => {
          // Count occurrences after declaration
          const afterDeclaration = content.slice(content.indexOf(match) + match.length);
          const occurrences = (afterDeclaration.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
          
          // If it looks unused and doesn't start with underscore, prefix it
          if (occurrences <= 1 && !varName.startsWith('_')) {
            return `${declarationType} _${varName}`;
          }
          
          return match;
        });
      }
    },
    {
      name: 'React Hooks Dependencies',
      pattern: /(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?!use[A-Z])[^;]+(useEffect|useMemo|useCallback)\(/g,
      test: (content, match) => {
        // Check if a non-hook variable is used in a hook's dependency array
        const varName = match[2];
        const hookName = match[3];
        
        // Crude check if the variable is referenced in a dependency array
        const hookCall = extractHookCall(content, hookName, content.indexOf(match[0]));
        if (!hookCall) return false;
        
        return hookCall.includes(`[`) && hookCall.includes(varName);
      },
      fix: (content) => {
        // This is a complex fix that needs careful handling
        let fixed = content;
        
        // Fix useEffect dependencies with functions
        fixed = fixed.replace(
          /(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?!use[A-Z])[^=;]+(useEffect\s*\(\s*\(\)\s*=>\s*{[\s\S]+?}\s*,\s*\[([^\]]*)\]\s*\))/g,
          (match, declarationType, funcName, effectCall, dependencies) => {
            // Skip if the function is already wrapped or not in dependencies
            if (match.includes('useCallback') || !dependencies.includes(funcName)) {
              return match;
            }
            
            // Move the function inside useEffect or wrap in useCallback
            const functionDef = extractFunctionDefinition(content, funcName);
            if (!functionDef) return match;
            
            return `${declarationType} ${funcName} = useCallback(${functionDef.body}, [${functionDef.dependencies || ''}])`;
          }
        );
        
        // Fix useMemo with objects
        fixed = fixed.replace(
          /(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*({[^;]+?})\s*;([\s\S]+?useMemo\s*\(\s*\(\)\s*=>\s*{[\s\S]+?}\s*,\s*\[([^\]]*)\]\s*\))/g,
          (match, declarationType, objName, objDef, memoCall, dependencies) => {
            // Skip if the object is already wrapped or not in dependencies
            if (match.includes('useMemo') || !dependencies.includes(objName)) {
              return match;
            }
            
            // Wrap the object in useMemo
            return `${declarationType} ${objName} = useMemo(() => ${objDef}, []);`;
          }
        );
        
        return fixed;
      }
    },
    {
      name: 'Missing Display Names',
      pattern: /(export\s+(?:default\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9_]*)\s*(?:=\s*)?(?:\([^)]*\)|\([^)]*\)\s*:|\<[^>]*\>)\s*(?:=>|{))/g,
      test: (content, match) => {
        const componentName = match[2];
        // Check if display name is already set
        return !content.includes(`${componentName}.displayName`) && 
               !content.includes('@memo') &&
               content.includes('React.') &&
               !componentName.includes('Provider');
      },
      fix: (content) => {
        return content.replace(
          /(export\s+(?:default\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9_]*)\s*(?:=\s*)?(?:\([^)]*\)|\([^)]*\)\s*:|\<[^>]*\>)\s*(?:=>|{))([\s\S]+?)(export\s+default\s+\2|$)/g,
          (match, declaration, componentName, body, exportStmt) => {
            // Only add displayName if it doesn't exist and this seems to be a React component
            if (!match.includes(`${componentName}.displayName`) && 
                (match.includes('React.') || match.includes('<div') || match.includes('<span'))) {
              const hasDefaultExport = match.includes(`export default ${componentName}`) || declaration.includes('export default');
              
              if (hasDefaultExport) {
                return `${declaration}${body}\n\n// Add display name for React DevTools\n${componentName}.displayName = '${componentName}';\n\n${exportStmt}`;
              } else {
                return `${declaration}${body}\n\n// Add display name for React DevTools\n${componentName}.displayName = '${componentName}';\n\n${exportStmt}`;
              }
            }
            return match;
          }
        );
      }
    },
    {
      name: 'Unexpected Any Types',
      pattern: /:\s*any(?![a-zA-Z0-9_])/g,
      test: (content, match) => {
        // Check if there's a comment indicating this 'any' is intentional
        const lineStart = content.lastIndexOf('\n', content.indexOf(match[0])) + 1;
        const lineEnd = content.indexOf('\n', content.indexOf(match[0]));
        const line = content.slice(lineStart, lineEnd);
        
        // Skip if there's an eslint-disable comment for this line
        return !line.includes('eslint-disable');
      },
      fix: (content) => {
        // Replace 'any' with more specific types based on context
        let fixed = content;
        
        // Replace 'any[]' with more specific array types where possible
        fixed = fixed.replace(/:\s*any\[\]/g, (match) => {
          return ': unknown[]'; // safer than 'any'
        });
        
        // Replace 'any' in function parameters with better types
        fixed = fixed.replace(/\(\s*([a-zA-Z0-9_]+)\s*:\s*any\s*\)/g, (match, paramName) => {
          // Try to infer type from usage
          if (paramName === 'event' || paramName === 'e') {
            return `(${paramName}: React.SyntheticEvent)`;
          }
          if (paramName === 'response' || paramName === 'res') {
            return `(${paramName}: unknown)`;
          }
          if (paramName === 'error' || paramName === 'err') {
            return `(${paramName}: Error)`;
          }
          return `(${paramName}: unknown)`;
        });
        
        // Generic replacement for remaining 'any' types
        fixed = fixed.replace(/:\s*any(?![a-zA-Z0-9_])/g, ': unknown');
        
        return fixed;
      }
    }
  ]
};

/**
 * Extract a hook call from the content
 */
function extractHookCall(content, hookName, startIndex) {
  const hookStart = content.indexOf(`${hookName}(`, startIndex);
  if (hookStart === -1) return null;
  
  let depth = 1;
  let endIndex = hookStart + hookName.length + 1;
  
  while (depth > 0 && endIndex < content.length) {
    const char = content[endIndex];
    if (char === '(') depth++;
    if (char === ')') depth--;
    endIndex++;
  }
  
  return content.slice(hookStart, endIndex);
}

/**
 * Extract a function definition from the content
 */
function extractFunctionDefinition(content, funcName) {
  const funcNameIndex = content.indexOf(`${funcName} =`);
  if (funcNameIndex === -1) return null;
  
  // Find the function body
  const funcStart = content.indexOf('=', funcNameIndex) + 1;
  let funcEnd = content.indexOf(';', funcStart);
  
  // Handle multi-line functions
  if (content.slice(funcStart, funcEnd).includes('{')) {
    let depth = 0;
    let i = funcStart;
    while (i < content.length) {
      if (content[i] === '{') depth++;
      if (content[i] === '}') {
        depth--;
        if (depth === 0) {
          funcEnd = content.indexOf(';', i) + 1;
          break;
        }
      }
      i++;
    }
  }
  
  const funcBody = content.slice(funcStart, funcEnd).trim();
  
  // Try to extract dependencies
  const dependencies = [];
  const functionVars = [...funcBody.matchAll(/\b([a-zA-Z0-9_]+)\b/g)].map(m => m[1]);
  
  // Find variables from outer scope
  const outerScope = content.slice(0, funcNameIndex);
  const outerVars = [...outerScope.matchAll(/\b(const|let|var)\s+([a-zA-Z0-9_]+)\b/g)].map(m => m[2]);
  
  // Collect potential dependencies
  for (const v of functionVars) {
    if (outerVars.includes(v) && !dependencies.includes(v)) {
      dependencies.push(v);
    }
  }
  
  return {
    body: funcBody,
    dependencies: dependencies.join(', ')
  };
}

/**
 * Find TypeScript files recursively
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
      // Add TypeScript file to results
      result.push(fullPath);
    }
  }
  
  return result;
}

/**
 * Fix TypeScript syntax errors in a file
 */
function fixFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    // Read file content
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;
    let fixCount = 0;
    
    // Apply each fix pattern
    for (const fixer of CONFIG.fixers) {
      let matches = [...content.matchAll(fixer.pattern)];
      let modified = false;
      
      // Filter matches that pass the test
      matches = matches.filter(match => fixer.test(content, match, match.index));
      
      if (matches.length > 0) {
        console.log(`  Applying ${fixer.name} fixer (${matches.length} issues found)`);
        const beforeFix = content;
        content = fixer.fix(content);
        
        if (content !== beforeFix) {
          modified = true;
          fixCount += matches.length;
        }
      }
    }
    
    // If content changed, write changes
    if (content !== originalContent) {
      // Create backup
      const backupPath = `${filePath}.backup`;
      fs.writeFileSync(backupPath, originalContent);
      
      // Write fixed content
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${fixCount} issues in ${filePath}`);
      return true;
    } else {
      console.log(`  No issues found or fixed in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔎 ESLint & TypeScript Auto-Fix Tool');
  console.log('===================================');
  
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
  
  // Find TypeScript files
  console.log('Scanning for TypeScript files...');
  const files = findFiles('.');
  console.log(`Found ${files.length} TypeScript/JavaScript files.`);
  
  // Fix each file
  let fixedCount = 0;
  for (const file of files) {
    const fixed = fixFile(file);
    if (fixed) fixedCount++;
  }
  
  console.log('\n✨ Summary:');
  console.log(`Fixed issues in ${fixedCount} out of ${files.length} total files.`);
}

// Run the script
main();