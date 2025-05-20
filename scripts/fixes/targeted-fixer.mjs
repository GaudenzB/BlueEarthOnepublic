#!/usr/bin/env node

/**
 * Targeted Error Fixer
 * 
 * This script specifically targets and fixes the exact errors
 * seen in the BlueEarth Capital codebase:
 * 
 * 1. JSX quote escaping (', ")
 * 2. Unused variables not prefixed with _
 * 3. React Hook dependency issues
 * 4. Missing component display names
 * 5. Unexpected 'any' types
 */

import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludeDirs: ['node_modules', 'dist', '.git', 'coverage', 'build'],
  fixers: [
    {
      name: 'JSX Quote Escaping',
      pattern: /\b(lint-and-typecheck:[^#]+#L\d+\s+[`'"])[`'"] can be escaped with/,
      fix: (content, filePath, lineNumber) => {
        const lines = content.split('\n');
        const line = lines[lineNumber - 1];
        
        // Fix single quotes - handle both text content and attribute values
        let fixedLine = line.replace(/(?<=>)([^<]*)'([^>]*)/g, '$1&apos;$2');
        
        // Fix double quotes
        fixedLine = fixedLine.replace(/(?<=>)([^<]*)"([^>]*)/g, '$1&quot;$2');
        
        // Replace the line
        lines[lineNumber - 1] = fixedLine;
        return lines.join('\n');
      }
    },
    {
      name: 'Unused Variables',
      pattern: /\b(lint-and-typecheck:[^#]+#L\d+\s+'([^']+)' is defined but never used\. Allowed unused args must match \/\^_\/u)/,
      fix: (content, filePath, lineNumber, match) => {
        const varName = match[2];
        const lines = content.split('\n');
        const line = lines[lineNumber - 1];
        
        // Check if the variable is a function parameter
        if (line.includes('(') && line.includes(')')) {
          // For parameters: find the specific parameter and prefix it
          const paramPattern = new RegExp(`\\b${varName}\\b(?=\\s*[:,)])`);
          lines[lineNumber - 1] = line.replace(paramPattern, `_${varName}`);
        } else {
          // For variable declarations
          const varPattern = new RegExp(`\\b(const|let|var|function)\\s+${varName}\\b`);
          lines[lineNumber - 1] = line.replace(varPattern, `$1 _${varName}`);
        }
        
        return lines.join('\n');
      }
    },
    {
      name: 'React Hook Dependencies',
      pattern: /\b(lint-and-typecheck:[^#]+#L\d+\s+The '([^']+)'[^(]+\(([^)]+)\) makes the dependencies of (use[A-Z][a-zA-Z]*) Hook)/,
      fix: (content, filePath, lineNumber, match) => {
        const itemName = match[2];
        const hookName = match[4];
        
        // Check if we're dealing with a function (most common case)
        if (match[3].includes('function')) {
          // Add useCallback wrapper
          const funcRegex = new RegExp(`\\bconst\\s+${itemName}\\s*=\\s*(?:function\\s*)?\\([^)]*\\)\\s*=>\\s*{([\\s\\S]+?)}`);
          const funcMatch = content.match(funcRegex);
          
          if (funcMatch) {
            const funcBody = funcMatch[1];
            // Find dependencies by analyzing the function body
            const dependencies = findDependenciesForHook(funcBody, content);
            const callbackWrapper = `const ${itemName} = useCallback(${funcMatch[0].substring(funcMatch[0].indexOf('=') + 1)}, [${dependencies}]);`;
            
            return content.replace(funcMatch[0], callbackWrapper);
          }
        } 
        // Check if we're dealing with an object
        else if (match[3].includes('object')) {
          // Add useMemo wrapper
          const objRegex = new RegExp(`\\bconst\\s+${itemName}\\s*=\\s*({[\\s\\S]+?}\\s*;)`);
          const objMatch = content.match(objRegex);
          
          if (objMatch) {
            const objLiteral = objMatch[1];
            // Find dependencies for the object
            const dependencies = findDependenciesForHook(objLiteral, content);
            const memoWrapper = `const ${itemName} = useMemo(() => ${objLiteral.trim()}, [${dependencies}]);`;
            
            return content.replace(objMatch[0], memoWrapper);
          }
        }
        
        // If we couldn't apply an automatic fix, just return the original content
        return content;
      }
    },
    {
      name: 'Add Display Names',
      pattern: /\b(lint-and-typecheck:[^#]+#L\d+\s+Component definition is missing display name)/,
      fix: (content, filePath, lineNumber) => {
        const lines = content.split('\n');
        
        // Find the component name from the file
        // This is usually the named export or default export
        const exportRegex = /export\s+(?:default\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9_]*)/g;
        let componentName;
        let match;
        
        while ((match = exportRegex.exec(content)) !== null) {
          if (match[1]) {
            componentName = match[1];
            break;
          }
        }
        
        if (!componentName) return content;
        
        // Find the end of the component
        let componentEnd = content.lastIndexOf(`export default ${componentName}`);
        if (componentEnd === -1) {
          // Look for named export
          componentEnd = content.lastIndexOf('}') + 1;
        }
        
        // Insert display name before the export
        const displayNameLine = `\n// Add display name for React DevTools\n${componentName}.displayName = '${componentName}';\n`;
        const contentBefore = content.substring(0, componentEnd);
        const contentAfter = content.substring(componentEnd);
        
        return contentBefore + displayNameLine + contentAfter;
      }
    },
    {
      name: 'Replace Any Types',
      pattern: /\b(lint-and-typecheck:[^#]+#L\d+\s+Unexpected any\. Specify a different type)/,
      fix: (content, filePath, lineNumber) => {
        const lines = content.split('\n');
        const line = lines[lineNumber - 1];
        
        // Replace 'any' with 'unknown' for better type safety
        const anyRegex = /:\s*any\b/g;
        lines[lineNumber - 1] = line.replace(anyRegex, ': unknown');
        
        return lines.join('\n');
      }
    }
  ]
};

/**
 * Find dependencies for React hooks by analyzing code
 */
function findDependenciesForHook(code, context) {
  // Find all identifiers that might be dependencies
  const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
  const possibleDeps = new Set();
  let match;
  
  while ((match = identifierRegex.exec(code)) !== null) {
    const identifier = match[1];
    
    // Skip common keywords and built-ins
    if (isKeywordOrBuiltin(identifier)) continue;
    
    // Add as a possible dependency
    possibleDeps.add(identifier);
  }
  
  // Check which identifiers are actually defined in the outer scope
  const outerScope = identifiersInOuterScope(context);
  const dependencies = [...possibleDeps].filter(id => outerScope.includes(id));
  
  return dependencies.join(', ');
}

/**
 * Find identifiers defined in the outer scope
 */
function identifiersInOuterScope(code) {
  const declarationRegex = /\b(const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
  const identifiers = [];
  let match;
  
  while ((match = declarationRegex.exec(code)) !== null) {
    identifiers.push(match[2]);
  }
  
  return identifiers;
}

/**
 * Check if an identifier is a JavaScript keyword or built-in
 */
function isKeywordOrBuiltin(id) {
  const keywords = [
    // JavaScript keywords
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 
    'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 
    'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 
    'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 
    'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    
    // Common built-ins
    'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math', 
    'Number', 'Object', 'Promise', 'RegExp', 'String', 'Symbol',
    'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
    
    // React hooks
    'useState', 'useEffect', 'useContext', 'useReducer', 'useCallback',
    'useMemo', 'useRef', 'useLayoutEffect', 'useDebugValue', 'useId'
  ];
  
  return keywords.includes(id);
}

/**
 * Parse an error log to extract file paths and line numbers
 */
function parseErrorLog(logContent) {
  const errors = [];
  const lines = logContent.split('\n');
  
  for (const line of lines) {
    for (const fixer of CONFIG.fixers) {
      const match = line.match(fixer.pattern);
      if (match) {
        // Extract file path and line number
        const pathMatch = match[1].match(/([^:]+)#L(\d+)/);
        if (pathMatch) {
          const [_, filePath, lineNum] = pathMatch;
          errors.push({
            filePath: filePath.trim(),
            lineNumber: parseInt(lineNum),
            fixerName: fixer.name,
            fix: fixer.fix,
            match
          });
        }
        break;
      }
    }
  }
  
  return errors;
}

/**
 * Fix a specific file based on the errors found
 */
function fixFile(filePath, errors) {
  console.log(`\nProcessing ${filePath}...`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`  File not found: ${filePath}`);
      return false;
    }
    
    // Read file content
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;
    let fixCount = 0;
    
    // Group errors by file
    const fileErrors = errors.filter(error => error.filePath === filePath);
    
    // Sort errors by line number (descending) to avoid offset issues
    fileErrors.sort((a, b) => b.lineNumber - a.lineNumber);
    
    // Apply fixes
    for (const error of fileErrors) {
      const before = content;
      content = error.fix(content, filePath, error.lineNumber, error.match);
      
      if (content !== before) {
        console.log(`  ✓ Fixed ${error.fixerName} at line ${error.lineNumber}`);
        fixCount++;
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
      console.log(`  No issues fixed in ${filePath}`);
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
  console.log('🎯 Targeted Error Fixer');
  console.log('=====================');
  
  // Get error log file from command line or use default
  const args = process.argv.slice(2);
  const errorLogPath = args[0] || 'error-log.txt';
  
  try {
    // If provided a file, read it
    if (fs.existsSync(errorLogPath)) {
      const logContent = fs.readFileSync(errorLogPath, 'utf8');
      const errors = parseErrorLog(logContent);
      
      if (errors.length === 0) {
        console.log('No errors found in the log file.');
        return;
      }
      
      console.log(`Found ${errors.length} errors to fix.`);
      
      // Group errors by file
      const filePathsSet = new Set(errors.map(e => e.filePath));
      const filePaths = [...filePathsSet];
      
      // Fix each file
      let fixedCount = 0;
      for (const filePath of filePaths) {
        const fixed = fixFile(filePath, errors);
        if (fixed) fixedCount++;
      }
      
      console.log('\n✨ Summary:');
      console.log(`Fixed issues in ${fixedCount} out of ${filePaths.length} total files.`);
    } else {
      console.log(`Error log file "${errorLogPath}" not found. Please provide a valid error log file.`);
      console.log('\nUsage: node targeted-fixer.mjs [error-log-file]');
    }
  } catch (error) {
    console.error(`❌ Error running targeted fixer: ${error.message}`);
  }
}

// Run the script
main();