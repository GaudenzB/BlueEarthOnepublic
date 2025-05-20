#!/usr/bin/env node

/**
 * Unused Variables Fixer
 * 
 * This script specifically looks for unused variables in TypeScript/JavaScript files
 * and prefixes them with an underscore to satisfy ESLint rules.
 * 
 * It focuses on fixing: 'is defined but never used. Allowed unused args must match /^_/u'
 */

import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludeDirs: ['node_modules', 'dist', '.git', 'coverage', 'build'],
  errorPattern: /is defined but never used/
};

/**
 * Find code files recursively
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
      // Add file to results
      result.push(fullPath);
    }
  }
  
  return result;
}

/**
 * Fix unused variables in a file
 */
function fixFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    // Read file content
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;
    let fixCount = 0;
    
    // Find variable declarations
    const variableRegex = /\b(const|let|var|function|class)\s+([a-zA-Z0-9_]+)(?!\s*:\s*_)/g;
    let match;
    
    // Collect all variable declarations
    const variables = [];
    while ((match = variableRegex.exec(content)) !== null) {
      const varName = match[2];
      if (varName.startsWith('_')) continue; // Already prefixed
      
      variables.push({
        name: varName,
        declarationType: match[1],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    // Check which variables are unused
    for (const variable of variables) {
      // Only consider non-component names (components start with uppercase)
      if (variable.name[0] === variable.name[0].toUpperCase()) {
        continue;
      }
      
      // Count occurrences after declaration
      const afterDeclaration = content.slice(variable.end);
      const regex = new RegExp(`\\b${variable.name}\\b`, 'g');
      const occurrences = (afterDeclaration.match(regex) || []).length;
      
      // If the variable appears to be unused, prefix it
      if (occurrences === 0) {
        // Replace the variable name with prefixed version
        const before = content.slice(0, variable.start);
        const prefixedDecl = `${variable.declarationType} _${variable.name}`;
        const after = content.slice(variable.end);
        
        content = before + prefixedDecl + after;
        
        // Adjust offsets for subsequent variables
        const offset = 1; // Added a single character (_)
        variables.forEach(v => {
          if (v.start > variable.start) {
            v.start += offset;
            v.end += offset;
          }
        });
        
        fixCount++;
      }
    }
    
    // Fix function parameters (much more common issue)
    content = fixFunctionParameters(content, (count) => {
      fixCount += count;
    });
    
    // If content changed, write changes
    if (content !== originalContent) {
      // Create backup
      const backupPath = `${filePath}.backup`;
      fs.writeFileSync(backupPath, originalContent);
      
      // Write fixed content
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${fixCount} unused variables in ${filePath}`);
      return true;
    } else {
      console.log(`  No unused variables to fix in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Fix unused function parameters
 */
function fixFunctionParameters(content, onFixesApplied) {
  let newContent = content;
  let fixCount = 0;
  
  // Find function declarations with parameters
  const funcRegex = /\bfunction\s+([a-zA-Z0-9_]+)?\s*\(\s*([^)]*)\s*\)/g;
  let match;
  
  while ((match = funcRegex.exec(content)) !== null) {
    const [fullMatch, funcName, params] = match;
    if (!params || params.trim() === '') continue;
    
    // Parse parameters
    const parameters = params.split(',').map(param => param.trim());
    const updatedParams = [];
    let paramChanged = false;
    
    // Check if each parameter is used in the function body
    for (let param of parameters) {
      // Skip already prefixed params
      if (param.startsWith('_')) {
        updatedParams.push(param);
        continue;
      }
      
      // Handle destructured parameters or params with default values
      let paramName = param;
      if (param.includes('=')) {
        paramName = param.split('=')[0].trim();
      }
      if (param.includes(':')) {
        paramName = param.split(':')[0].trim();
      }
      
      // Find the function body
      const funcBodyStart = content.indexOf('{', match.index);
      if (funcBodyStart === -1) continue;
      
      let braceCount = 1;
      let funcBodyEnd = funcBodyStart + 1;
      
      // Find the end of the function body by matching braces
      while (braceCount > 0 && funcBodyEnd < content.length) {
        const char = content[funcBodyEnd];
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        funcBodyEnd++;
      }
      
      const funcBody = content.substring(funcBodyStart, funcBodyEnd);
      
      // Count occurrences of the param in the function body 
      // (excluding the parameter list itself)
      const paramRegex = new RegExp(`\\b${paramName}\\b`, 'g');
      const occurrences = (funcBody.match(paramRegex) || []).length;
      
      // If param appears to be unused, prefix it
      if (occurrences <= 1) { // 1 occurrence might be in a comment
        if (param.includes(':')) {
          // For typed parameters: param: Type => _param: Type
          param = `_${paramName}${param.substring(paramName.length)}`;
        } else if (param.includes('=')) {
          // For default parameters: param = value => _param = value
          param = `_${paramName}${param.substring(paramName.length)}`;
        } else {
          // Simple parameters
          param = `_${param}`;
        }
        paramChanged = true;
        fixCount++;
      }
      
      updatedParams.push(param);
    }
    
    // If any parameter was prefixed, update the function declaration
    if (paramChanged) {
      const updatedFuncDecl = `function ${funcName || ''}(${updatedParams.join(', ')})`;
      newContent = newContent.replace(fullMatch, updatedFuncDecl);
    }
  }
  
  // Also fix arrow function parameters 
  const arrowFuncRegex = /\bconst\s+([a-zA-Z0-9_]+)\s*=\s*\(\s*([^)]*)\s*\)\s*=>/g;
  
  while ((match = arrowFuncRegex.exec(content)) !== null) {
    const [fullMatch, funcName, params] = match;
    if (!params || params.trim() === '') continue;
    
    // Parse parameters
    const parameters = params.split(',').map(param => param.trim());
    const updatedParams = [];
    let paramChanged = false;
    
    // Check if each parameter is used in the function body
    for (let param of parameters) {
      // Skip already prefixed params
      if (param.startsWith('_')) {
        updatedParams.push(param);
        continue;
      }
      
      // Handle destructured parameters or params with default values
      let paramName = param;
      if (param.includes('=')) {
        paramName = param.split('=')[0].trim();
      }
      if (param.includes(':')) {
        paramName = param.split(':')[0].trim();
      }
      
      // Find the function body
      let funcBodyStart;
      if (content.substring(match.index + fullMatch.length).trim().startsWith('{')) {
        // Block body
        funcBodyStart = content.indexOf('{', match.index + fullMatch.length);
      } else {
        // Expression body
        funcBodyStart = match.index + fullMatch.length;
      }
      
      if (funcBodyStart === -1) continue;
      
      // Determine function body end for block bodies
      let funcBodyEnd = content.length;
      if (content.substring(match.index + fullMatch.length).trim().startsWith('{')) {
        let braceCount = 1;
        funcBodyEnd = funcBodyStart + 1;
        
        // Find the end of the function body by matching braces
        while (braceCount > 0 && funcBodyEnd < content.length) {
          const char = content[funcBodyEnd];
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          funcBodyEnd++;
        }
      } else {
        // For expression bodies, find the end of the statement
        funcBodyEnd = content.indexOf(';', funcBodyStart);
        if (funcBodyEnd === -1) funcBodyEnd = content.length;
      }
      
      const funcBody = content.substring(funcBodyStart, funcBodyEnd);
      
      // Count occurrences of the param in the function body 
      // (excluding the parameter list itself)
      const paramRegex = new RegExp(`\\b${paramName}\\b`, 'g');
      const occurrences = (funcBody.match(paramRegex) || []).length;
      
      // If param appears to be unused, prefix it
      if (occurrences === 0) {
        if (param.includes(':')) {
          // For typed parameters: param: Type => _param: Type
          param = `_${paramName}${param.substring(paramName.length)}`;
        } else if (param.includes('=')) {
          // For default parameters: param = value => _param = value
          param = `_${paramName}${param.substring(paramName.length)}`;
        } else {
          // Simple parameters
          param = `_${param}`;
        }
        paramChanged = true;
        fixCount++;
      }
      
      updatedParams.push(param);
    }
    
    // If any parameter was prefixed, update the function declaration
    if (paramChanged) {
      const updatedFuncDecl = `const ${funcName} = (${updatedParams.join(', ')}) =>`;
      newContent = newContent.replace(fullMatch, updatedFuncDecl);
    }
  }
  
  // Also fix method parameters (in classes)
  const methodRegex = /\b([a-zA-Z0-9_]+)\s*\(\s*([^)]*)\s*\)\s*{/g;
  
  while ((match = methodRegex.exec(content)) !== null) {
    // Skip if this isn't a class method (crude check)
    const beforeMatch = content.substring(0, match.index);
    const lastLine = beforeMatch.substring(beforeMatch.lastIndexOf('\n')).trim();
    if (!lastLine.startsWith('class') && !lastLine.includes('extends') && !lastLine.includes('{')) {
      continue;
    }
    
    const [fullMatch, methodName, params] = match;
    if (!params || params.trim() === '') continue;
    
    // Parse parameters
    const parameters = params.split(',').map(param => param.trim());
    const updatedParams = [];
    let paramChanged = false;
    
    // Check if each parameter is used in the method body
    for (let param of parameters) {
      // Skip already prefixed params
      if (param.startsWith('_')) {
        updatedParams.push(param);
        continue;
      }
      
      // Handle destructured parameters or params with default values
      let paramName = param;
      if (param.includes('=')) {
        paramName = param.split('=')[0].trim();
      }
      if (param.includes(':')) {
        paramName = param.split(':')[0].trim();
      }
      
      // Find the method body
      const methodBodyStart = content.indexOf('{', match.index);
      if (methodBodyStart === -1) continue;
      
      let braceCount = 1;
      let methodBodyEnd = methodBodyStart + 1;
      
      // Find the end of the method body by matching braces
      while (braceCount > 0 && methodBodyEnd < content.length) {
        const char = content[methodBodyEnd];
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        methodBodyEnd++;
      }
      
      const methodBody = content.substring(methodBodyStart, methodBodyEnd);
      
      // Count occurrences of the param in the method body 
      // (excluding the parameter list itself)
      const paramRegex = new RegExp(`\\b${paramName}\\b`, 'g');
      const occurrences = (methodBody.match(paramRegex) || []).length;
      
      // If param appears to be unused, prefix it
      if (occurrences <= 1) {
        if (param.includes(':')) {
          // For typed parameters: param: Type => _param: Type
          param = `_${paramName}${param.substring(paramName.length)}`;
        } else if (param.includes('=')) {
          // For default parameters: param = value => _param = value
          param = `_${paramName}${param.substring(paramName.length)}`;
        } else {
          // Simple parameters
          param = `_${param}`;
        }
        paramChanged = true;
        fixCount++;
      }
      
      updatedParams.push(param);
    }
    
    // If any parameter was prefixed, update the method declaration
    if (paramChanged) {
      const updatedMethodDecl = `${methodName}(${updatedParams.join(', ')}) {`;
      newContent = newContent.replace(fullMatch, updatedMethodDecl);
    }
  }
  
  if (fixCount > 0) {
    onFixesApplied(fixCount);
  }
  
  return newContent;
}

/**
 * Main function
 */
function main() {
  console.log('🔎 Unused Variables Fixer');
  console.log('=======================');
  
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
  
  // Find code files
  console.log('Scanning for code files...');
  const files = findFiles('.');
  console.log(`Found ${files.length} code files.`);
  
  // Fix each file
  let fixedCount = 0;
  for (const file of files) {
    const fixed = fixFile(file);
    if (fixed) fixedCount++;
  }
  
  console.log('\n✨ Summary:');
  console.log(`Fixed unused variables in ${fixedCount} out of ${files.length} total files.`);
}

// Run the script
main();