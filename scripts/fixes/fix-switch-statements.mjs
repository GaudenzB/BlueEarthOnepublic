#!/usr/bin/env node

/**
 * Switch Statement Syntax Fixer
 * 
 * This script identifies and fixes common issues with switch statements
 * including properly formatting case blocks, adding missing commas and
 * closing braces, and ensuring proper syntax structure.
 */

import fs from 'fs';
import path from 'path';

// File to fix
const FILE_TO_FIX = 'client/src/components/ui/custom-toast.tsx';

console.log(`🔍 Fixing switch statement syntax in ${FILE_TO_FIX}...`);

try {
  // Read the file content
  const content = fs.readFileSync(FILE_TO_FIX, 'utf8');
  
  // Create a fixed version by properly structuring switch statements
  let fixedContent = content;
  
  // Fix pattern 1: Missing closing brace for case block followed by default case in the middle
  fixedContent = fixedContent.replace(
    /case ['"]([^'"]+)['"]:\s*return\s*{([^}]*)}([\s\n]*)default:/g,
    "case '$1':\n        return {\n          $2\n        };\n      default:"
  );
  
  // Fix pattern 2: Missing closing brace and improper default case placement
  fixedContent = fixedContent.replace(
    /return\s*{([^}]*)}([\s\n]*)default:([\s\n]*)return\s*{[^}]*};\s*};\s*([\s\n]*)case/g,
    "return {\n          $1\n        };\n      default:\n        return {};\n      case"
  );
  
  // Fix pattern 3: Manually fix specific switch statements that match the error patterns
  
  // First broken switch statement (renderIcon)
  const renderIconSwitch = /switch\s*\(variant\)\s*{([\s\S]*?)case\s*['"]success['"]:([\s\S]*?)default:([\s\S]*?)case\s*['"]error['"]:([\s\S]*?)case\s*['"]warning['"]:([\s\S]*?)case\s*['"]info['"]:([\s\S]*?)default:([\s\S]*?)};/g;
  
  fixedContent = fixedContent.replace(renderIconSwitch, (match, beforeSuccess, successCase, defaultCase, errorCase, warningCase, infoCase, finalDefault) => {
    return `switch (variant) {
      case 'success':
        return <CheckCircleOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.success }} />;
      case 'error':
        return <CloseCircleOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.error }} />;
      case 'warning':
        return <WarningOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.warning }} />;
      case 'info':
      default:
        return <InfoCircleOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.info }} />;
    };`;
  });
  
  // Second broken switch statement (getVariantStyles)
  const variantStylesSwitch = /const\s+getVariantStyles\s*=\s*\(\)\s*=>\s*{([\s\S]*?)switch\s*\(variant\)\s*{([\s\S]*?)case\s*['"]success['"]:([\s\S]*?)default:([\s\S]*?)case\s*['"]error['"]:([\s\S]*?)};/g;
  
  fixedContent = fixedContent.replace(variantStylesSwitch, (match) => {
    return `const getVariantStyles = () => {
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
    }
  };`;
  });
  
  // Third broken switch statement (getAriaAttrs)
  const ariaAttrsSwitch = /const\s+getAriaAttrs\s*=\s*\(\)\s*=>\s*{([\s\S]*?)switch\s*\(variant\)\s*{([\s\S]*?)case\s*['"]error['"]:([\s\S]*?)default:([\s\S]*?)case\s*['"]warning['"]:([\s\S]*?)case\s*['"]success['"]:([\s\S]*?)case\s*['"]info['"]:([\s\S]*?)default:([\s\S]*?)};/g;
  
  fixedContent = fixedContent.replace(ariaAttrsSwitch, (match) => {
    return `const getAriaAttrs = () => {
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
    }
  };`;
  });
  
  // Write the fixed content back to the file
  fs.writeFileSync(FILE_TO_FIX, fixedContent, 'utf8');
  
  console.log(`✅ Successfully fixed switch statements in ${FILE_TO_FIX}`);
} catch (error) {
  console.error(`❌ Error fixing ${FILE_TO_FIX}: ${error.message}`);
}