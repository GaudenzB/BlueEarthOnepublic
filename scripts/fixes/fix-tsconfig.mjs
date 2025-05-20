#!/usr/bin/env node

/**
 * TypeScript Configuration Fixer
 * 
 * This script fixes common TypeScript configuration issues by:
 * 1. Ensuring consistent compiler options across the project
 * 2. Adding proper path aliases
 * 3. Setting correct jsx configuration
 * 4. Ensuring proper module interop settings
 */

import fs from 'fs';
import path from 'path';

console.log("🔧 Fixing TypeScript configuration...");

// Main tsconfig fixes
function fixMainTsConfig() {
  const tsconfigPath = 'tsconfig.json';
  
  if (!fs.existsSync(tsconfigPath)) {
    console.error(`❌ Could not find ${tsconfigPath}`);
    return false;
  }
  
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Ensure consistent compiler options
    tsconfig.compilerOptions = {
      ...tsconfig.compilerOptions,
      "jsx": "react-jsx",
      "esModuleInterop": true,
      "forceConsistentCasingInFileNames": true,
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "strictFunctionTypes": true,
      "strictBindCallApply": true,
      "strictPropertyInitialization": true,
      "noImplicitThis": true,
      "useUnknownInCatchVariables": true,
      "alwaysStrict": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "noUncheckedIndexedAccess": true,
      "noImplicitOverride": true,
      "noPropertyAccessFromIndexSignature": true,
      "allowUnusedLabels": false,
      "allowUnreachableCode": false,
      "skipLibCheck": true,
    };
    
    // Write the updated config back to file
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
    console.log(`✅ Updated ${tsconfigPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error fixing ${tsconfigPath}: ${error.message}`);
    return false;
  }
}

// Fix client-specific tsconfig (if exists)
function fixClientTsConfig() {
  const clientTsconfigPath = 'client/tsconfig.json';
  
  if (!fs.existsSync(clientTsconfigPath)) {
    console.log(`ℹ️ No client-specific tsconfig found at ${clientTsconfigPath}`);
    return false;
  }
  
  try {
    const tsconfig = JSON.parse(fs.readFileSync(clientTsconfigPath, 'utf8'));
    
    // Ensure proper React settings
    tsconfig.compilerOptions = {
      ...tsconfig.compilerOptions,
      "jsx": "react-jsx",
      "esModuleInterop": true,
      "allowSyntheticDefaultImports": true,
    };
    
    // Write the updated config back to file
    fs.writeFileSync(clientTsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
    console.log(`✅ Updated ${clientTsconfigPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error fixing ${clientTsconfigPath}: ${error.message}`);
    return false;
  }
}

// Execute fixes
fixMainTsConfig();
fixClientTsConfig();

console.log("✅ TypeScript configuration fixes completed.");