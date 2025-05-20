#!/usr/bin/env node

/**
 * React Hooks Dependency Fixer
 * 
 * This script systematically fixes common React Hook dependency issues:
 * 1. Wraps function declarations in useCallback
 * 2. Wraps object literals in useMemo
 * 3. Adds missing dependencies to dependency arrays
 * 4. Ensures proper imports for useCallback and useMemo
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("🔍 Starting React Hook dependency fixes...");

// Files with hook dependency issues
const FILES_TO_FIX = [
  'modules/employees/client/EmployeeDirectory.tsx',
  'core/src/hooks/useMediaQuery.ts',
  'core/src/hooks/useLocalStorage.ts',
  'client/src/pages/employee-detail-new.tsx',
  'client/src/hooks/useWindowSize.ts'
];

// Process each file
for (const filePath of FILES_TO_FIX) {
  try {
    console.log(`Processing ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${filePath}`);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix 1: The 'employees' conditional in useMemo dependencies
    if (filePath.includes('EmployeeDirectory.tsx')) {
      const result = fixEmployeesConditional(content);
      if (result !== content) {
        content = result;
        modified = true;
        console.log(`✅ Fixed 'employees' conditional in useMemo for ${filePath}`);
      }
    }
    
    // Fix 2: Wrap function declarations in useCallback
    if (content.includes('useEffect') || content.includes('useMemo')) {
      const result = wrapFunctionsInUseCallback(content);
      if (result !== content) {
        content = result;
        modified = true;
        console.log(`✅ Wrapped functions in useCallback for ${filePath}`);
      }
    }
    
    // Fix 3: Wrap object literals in useMemo
    if (content.includes('useEffect')) {
      const result = wrapObjectsInUseMemo(content);
      if (result !== content) {
        content = result;
        modified = true;
        console.log(`✅ Wrapped objects in useMemo for ${filePath}`);
      }
    }
    
    // Fix 4: Ensure proper imports
    if (modified) {
      content = ensureProperImports(content);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Successfully fixed ${filePath}`);
    } else {
      console.log(`ℹ️ No changes needed for ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

// Fix for 'employees' conditional in useMemo
function fixEmployeesConditional(content) {
  // Specific fix for EmployeeDirectory.tsx
  return content.replace(
    /(const\s+employees\s*=\s*data\s*\?\s*data\.employees\s*:\s*\[\];)\s*(.*useMemo\(\s*\(\)\s*=>\s*{)/s,
    (match, employeesDecl, memoStart) => {
      return `${memoStart}\n      // Move employees inside useMemo to prevent unnecessary rerenders\n      const employees = data ? data.employees : [];\n`;
    }
  );
}

// Wrap function declarations in useCallback
function wrapFunctionsInUseCallback(content) {
  // Find functions defined before useEffect/useMemo
  return content.replace(
    /(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(\([^)]*\))\s*=>\s*{([\s\S]*?)};?\s*(useEffect|useMemo)/g,
    (match, declType, funcName, params, funcBody, hookType) => {
      // Skip if already wrapped in useCallback
      if (match.includes('useCallback(')) {
        return match;
      }
      
      // Extract dependencies from function body
      const dependencies = extractDependencies(funcBody, content);
      
      return `${declType} ${funcName} = useCallback(${params} => {${funcBody}
}, [${dependencies}]); // Wrap in useCallback to stabilize function reference

${hookType}`;
    }
  );
}

// Wrap object literals in useMemo
function wrapObjectsInUseMemo(content) {
  return content.replace(
    /(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*({[\s\S]*?});?\s*(useEffect|useMemo)/g,
    (match, declType, objName, objLiteral, hookType) => {
      // Skip if already wrapped in useMemo or useCallback
      if (match.includes('useMemo(') || match.includes('useCallback(')) {
        return match;
      }
      
      // Extract dependencies from object literal
      const dependencies = extractDependencies(objLiteral, content);
      
      return `${declType} ${objName} = useMemo(() => ${objLiteral}, [${dependencies}]); // Wrap in useMemo to prevent unnecessary rerenders

${hookType}`;
    }
  );
}

// Ensure proper imports for React hooks
function ensureProperImports(content) {
  let needsUseCallback = content.includes('useCallback') && !content.includes('import') && !content.includes('useCallback');
  let needsUseMemo = content.includes('useMemo') && !content.includes('import') && !content.includes('useMemo');
  
  if (!needsUseCallback && !needsUseMemo) {
    return content;
  }
  
  // If there's already a React import with destructuring
  if (content.match(/import React,\s*{[^}]*}\s*from\s*['"]react['"]/)) {
    return content.replace(
      /import React,\s*{([^}]*)}\s*from\s*['"]react['"]/,
      (match, imports) => {
        let newImports = imports;
        if (needsUseCallback && !imports.includes('useCallback')) {
          newImports += ', useCallback';
        }
        if (needsUseMemo && !imports.includes('useMemo')) {
          newImports += ', useMemo';
        }
        return `import React, { ${newImports} } from 'react'`;
      }
    );
  }
  
  // If there's a React import without destructuring
  if (content.match(/import React from ['"]react['"]/)) {
    return content.replace(
      /import React from ['"]react['"];?/,
      (match) => {
        let hooks = [];
        if (needsUseCallback) hooks.push('useCallback');
        if (needsUseMemo) hooks.push('useMemo');
        return `import React, { ${hooks.join(', ')} } from 'react';`;
      }
    );
  }
  
  // If there's no React import at all
  let importStatement = 'import {';
  if (needsUseCallback) importStatement += ' useCallback';
  if (needsUseMemo) {
    if (needsUseCallback) importStatement += ',';
    importStatement += ' useMemo';
  }
  importStatement += ' } from \'react\';\n';
  
  return importStatement + content;
}

// Extract dependencies from code
function extractDependencies(code, fullContent) {
  // Simple extraction of variables used in the code
  const varRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
  const allVars = new Set();
  let match;
  
  while ((match = varRegex.exec(code)) !== null) {
    const varName = match[1];
    // Skip common keywords, local vars and built-ins
    if (!['const', 'let', 'var', 'function', 'if', 'else', 'return', 'true', 'false', 'null', 'undefined', 'this', 'window', 'document'].includes(varName)) {
      allVars.add(varName);
    }
  }
  
  // Filter out local variables
  const localVarRegex = /const|let|var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
  const localVars = new Set();
  
  while ((match = localVarRegex.exec(fullContent)) !== null) {
    if (match[1]) localVars.add(match[1]);
  }
  
  // Return external dependencies
  return Array.from(allVars)
    .filter(v => !localVars.has(v) && v !== 'props' && !v.startsWith('_'))
    .join(', ');
}

console.log("✅ React Hook dependency fixes completed!");