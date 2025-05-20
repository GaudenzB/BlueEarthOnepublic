#!/usr/bin/env node

/**
 * React Hooks Auto-Fixer
 * 
 * This script focuses on fixing common React hooks issues:
 * 1. Functions defined outside useEffect that should be in useCallback
 * 2. Objects defined outside useMemo that should be wrapped
 * 3. Dependencies that change on every render
 */

import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  extensions: ['.tsx', '.jsx', '.ts', '.js'],
  excludeDirs: ['node_modules', 'dist', '.git', 'coverage', 'build'],
  
  // List of hooks to analyze
  hooksToFix: ['useEffect', 'useMemo', 'useCallback'],
  
  // ESLint rule names for the bugs we're fixing
  targetLintMessages: [
    'makes the dependencies of useEffect Hook',
    'makes the dependencies of useMemo Hook',
    'makes the dependencies of useCallback Hook',
    'could make the dependencies', 
    'React Hook useEffect has a missing dependency',
    'React Hook useMemo has a missing dependency',
    'The object makes the dependencies of React Hook',
    'The function makes the dependencies'
  ]
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
 * Fix hooks in a file
 */
function fixFile(filePath) {
  console.log(`\nProcessing ${filePath}...`);
  
  try {
    // Read file content
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    // Perform the fixes
    const { content: newContent, fixCount } = fixHookIssues(originalContent);
    
    // If content changed, write changes
    if (newContent !== originalContent) {
      // Create backup
      const backupPath = `${filePath}.backup`;
      fs.writeFileSync(backupPath, originalContent);
      
      // Write fixed content
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Fixed ${fixCount} hooks issues in ${filePath}`);
      return true;
    } else {
      console.log(`  No hooks issues fixed in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

/**
 * Fix hook dependency issues in the content
 */
function fixHookIssues(content) {
  let fixCount = 0;
  let newContent = content;
  
  // Fix functions defined outside hooks but used inside
  newContent = fixFunctionsOutsideHooks(newContent, () => fixCount++);
  
  // Fix objects defined outside hooks but used inside
  newContent = fixObjectsOutsideHooks(newContent, () => fixCount++);
  
  // Fix missing dependencies
  newContent = fixMissingDependencies(newContent, () => fixCount++);
  
  return { content: newContent, fixCount };
}

/**
 * Fix functions defined outside useEffect
 */
function fixFunctionsOutsideHooks(content, incrementFixCount) {
  let newContent = content;
  
  // Find function definitions that are used in hooks
  const functionRegex = /const\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\([^)]*\)\s*=>)\s*{([^}]*)}/g;
  
  // Collect all function definitions
  const functions = [];
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const [fullMatch, funcName, funcBody] = match;
    functions.push({
      name: funcName,
      body: fullMatch,
      start: match.index,
      end: match.index + fullMatch.length
    });
  }
  
  // For each function, check if it's used in a hook's dependency array
  for (const func of functions) {
    for (const hookName of CONFIG.hooksToFix) {
      const hookRegex = new RegExp(`${hookName}\\s*\\([^)]*\\)\\s*,\\s*\\[([^\\]]*)\\]`, 'g');
      
      while ((match = hookRegex.exec(content)) !== null) {
        const [fullMatch, dependencies] = match;
        
        // If the function is in the dependencies, it should be wrapped in useCallback
        if (dependencies.includes(func.name)) {
          // Determine dependencies by analyzing the function body
          const usedVariables = findUsedVariables(func.body, content.substring(0, func.start));
          
          // Generate the useCallback wrapper
          const callbackWrapper = `const ${func.name} = useCallback(${func.body.substring(func.name.length + 7)}, [${usedVariables.join(', ')}])`;
          
          // Replace the function definition with the wrapped version
          newContent = newContent.substring(0, func.start) + callbackWrapper + newContent.substring(func.end);
          
          incrementFixCount();
          break; // We've fixed this function, move on to the next
        }
      }
    }
  }
  
  return newContent;
}

/**
 * Fix objects defined outside hooks but used inside
 */
function fixObjectsOutsideHooks(content, incrementFixCount) {
  let newContent = content;
  
  // Find object definitions that are used in hooks
  const objectRegex = /const\s+([a-zA-Z0-9_]+)\s*=\s*({(?:[^{}]|{[^{}]*})*})\s*;/g;
  
  // Collect all object definitions
  const objects = [];
  let match;
  while ((match = objectRegex.exec(content)) !== null) {
    const [fullMatch, objName, objBody] = match;
    objects.push({
      name: objName,
      body: objBody,
      fullMatch,
      start: match.index,
      end: match.index + fullMatch.length
    });
  }
  
  // For each object, check if it's used in a hook's dependency array
  for (const obj of objects) {
    for (const hookName of CONFIG.hooksToFix) {
      const hookRegex = new RegExp(`${hookName}\\s*\\([^)]*\\)\\s*,\\s*\\[([^\\]]*)\\]`, 'g');
      
      while ((match = hookRegex.exec(content)) !== null) {
        const [fullMatch, dependencies] = match;
        
        // If the object is in the dependencies, it should be wrapped in useMemo
        if (dependencies.includes(obj.name)) {
          // Determine dependencies by analyzing the object
          const usedVariables = findUsedVariables(obj.body, content.substring(0, obj.start));
          
          // Generate the useMemo wrapper
          const memoWrapper = `const ${obj.name} = useMemo(() => ${obj.body}, [${usedVariables.join(', ')}]);`;
          
          // Replace the object definition with the wrapped version
          newContent = newContent.substring(0, obj.start) + memoWrapper + newContent.substring(obj.end);
          
          incrementFixCount();
          break; // We've fixed this object, move on to the next
        }
      }
    }
  }
  
  return newContent;
}

/**
 * Fix missing dependencies in hooks
 */
function fixMissingDependencies(content, incrementFixCount) {
  let newContent = content;
  
  // For each hook, check for missing dependencies
  for (const hookName of CONFIG.hooksToFix) {
    const hookRegex = new RegExp(`${hookName}\\s*\\(([^)]*?)\\s*,\\s*\\[([^\\]]*)\\]\\s*\\)`, 'g');
    
    let match;
    while ((match = hookRegex.exec(content)) !== null) {
      const [fullMatch, hookBody, dependencies] = match;
      
      // Find all variables used in the hook body
      const variablesInHook = findUsedVariables(hookBody, content.substring(0, match.index));
      
      // Get the current dependencies
      const currentDeps = dependencies
        .split(',')
        .map(dep => dep.trim())
        .filter(dep => dep !== '');
      
      // Find missing dependencies
      const missingDeps = variablesInHook.filter(variable => 
        !currentDeps.includes(variable) && 
        !isHookName(variable) &&
        !isPrimitive(variable) &&
        !isReactBuiltin(variable)
      );
      
      // If there are missing dependencies, add them
      if (missingDeps.length > 0) {
        const newDeps = [...currentDeps, ...missingDeps].join(', ');
        const fixedHook = `${hookName}(${hookBody}, [${newDeps}])`;
        
        // Replace the hook with the fixed version
        const startIdx = match.index;
        const endIdx = startIdx + fullMatch.length;
        newContent = newContent.substring(0, startIdx) + fixedHook + newContent.substring(endIdx);
        
        incrementFixCount();
      }
    }
  }
  
  return newContent;
}

/**
 * Find variables used in a code block
 */
function findUsedVariables(codeBlock, contextBefore) {
  // Find all potential variable names in the code
  const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
  const allIdentifiers = [];
  
  let match;
  while ((match = identifierRegex.exec(codeBlock)) !== null) {
    const name = match[1];
    if (!allIdentifiers.includes(name) && 
        !isReservedWord(name) && 
        !isBuiltInFunction(name)) {
      allIdentifiers.push(name);
    }
  }
  
  // Filter only those that are defined in the context before
  return allIdentifiers.filter(name => {
    // Check if it's defined in the context
    const definitionRegex = new RegExp(`\\b(const|let|var)\\s+${name}\\b`, 'g');
    return definitionRegex.test(contextBefore);
  });
}

/**
 * Check if a name is a React hook
 */
function isHookName(name) {
  return name.startsWith('use') && name[3] && name[3] === name[3].toUpperCase();
}

/**
 * Check if a variable represents a primitive value
 */
function isPrimitive(name) {
  const primitives = [
    'true', 'false', 'null', 'undefined', 
    '0', '1', '""', "''", '``', '{}', '[]'
  ];
  return primitives.includes(name);
}

/**
 * Check if a variable is a React builtin
 */
function isReactBuiltin(name) {
  const reactBuiltins = [
    'React', 'useState', 'useEffect', 'useContext', 'useReducer',
    'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
    'useLayoutEffect', 'useDebugValue'
  ];
  return reactBuiltins.includes(name);
}

/**
 * Check if a word is a JavaScript reserved word
 */
function isReservedWord(word) {
  const reservedWords = [
    'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
    'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
    'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
    'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import',
    'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new',
    'null', 'package', 'private', 'protected', 'public', 'return', 'short',
    'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
    'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while',
    'with', 'yield'
  ];
  return reservedWords.includes(word);
}

/**
 * Check if a name is a built-in JavaScript function
 */
function isBuiltInFunction(name) {
  const builtIns = [
    'Object', 'Array', 'String', 'Number', 'Boolean', 'RegExp', 'Math',
    'Date', 'JSON', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet',
    'Symbol', 'Function', 'console', 'setTimeout', 'setInterval',
    'clearTimeout', 'clearInterval', 'parseInt', 'parseFloat'
  ];
  return builtIns.includes(name);
}

/**
 * Main function
 */
function main() {
  console.log('🔧 React Hooks Auto-Fixer');
  console.log('========================');
  
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
  console.log('Scanning for React/TypeScript files...');
  const files = findFiles('.');
  console.log(`Found ${files.length} files to analyze.`);
  
  // Fix each file
  let fixedCount = 0;
  for (const file of files) {
    const fixed = fixFile(file);
    if (fixed) fixedCount++;
  }
  
  console.log('\n✨ Summary:');
  console.log(`Fixed hooks issues in ${fixedCount} out of ${files.length} total files.`);
}

// Run the script
main();