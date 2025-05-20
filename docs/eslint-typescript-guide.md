# ESLint and TypeScript Configuration Guide

This guide explains the ESLint configuration we've set up for BlueEarth Capital and how it aligns with our TypeScript practices.

## Overview

Our ESLint configuration works together with TypeScript to ensure code quality and consistency across the codebase. We've configured ESLint to enforce type safety and best practices that complement our TypeScript setup.

## Key Features

### TypeScript Integration

- **Type-Aware Linting**: ESLint performs type-checking during the linting process
- **Unused Variable Handling**: Aligns with our TypeScript configuration for unused variables
- **Promise Handling**: Ensures proper async/await and Promise handling

### React Best Practices

- **Hooks Rules**: Enforces React hooks rules to prevent common mistakes
- **Dependency Tracking**: Monitors useEffect dependencies
- **Modern React**: Configured for the new JSX transform (no React import needed)

### Code Quality

- **Consistent Style**: Ensures consistent code style across the codebase
- **Error Prevention**: Catches common errors before runtime
- **Proper Equality Checks**: Enforces strict equality checks

## Rule Explanations

### TypeScript Rules

| Rule | Description | Severity |
|------|-------------|----------|
| `@typescript-eslint/no-unused-vars` | Warns about unused variables, but allows underscore-prefixed variables | Warning |
| `@typescript-eslint/no-explicit-any` | Discourages the use of the `any` type | Warning |
| `@typescript-eslint/no-non-null-assertion` | Warns about non-null assertions (`!`) which can cause runtime errors | Warning |
| `@typescript-eslint/no-floating-promises` | Prevents unhandled promises | Warning |
| `@typescript-eslint/await-thenable` | Ensures you only await things that can be awaited | Warning |
| `@typescript-eslint/no-misused-promises` | Prevents common mistakes with promises | Error |

### React Rules

| Rule | Description | Severity |
|------|-------------|----------|
| `react-hooks/rules-of-hooks` | Enforces the Rules of Hooks | Error |
| `react-hooks/exhaustive-deps` | Checks effect dependencies | Warning |
| `react/jsx-uses-react` | Turned off as it's not needed with new JSX transform | Off |
| `react/react-in-jsx-scope` | Turned off as it's not needed with new JSX transform | Off |

### General Rules

| Rule | Description | Severity |
|------|-------------|----------|
| `no-console` | Warns about `console.log()` but allows `console.warn/error/info` | Warning |
| `prefer-const` | Encourages using `const` when variables aren't reassigned | Warning |
| `eqeqeq` | Requires using `===` and `!==` instead of `==` and `!=` | Error |
| `no-var` | Disallows using `var` | Error |
| `no-duplicate-imports` | Prevents duplicate imports | Error |

## Special Cases

### Test Files

For test files (ending in `.test.ts/tsx` or `.spec.ts/tsx`), we relax certain rules:

- `@typescript-eslint/no-explicit-any`: Turned off to allow more flexibility in testing
- `no-console`: Turned off to allow logging during tests

### JavaScript Files

For JavaScript files (`.js` and `.jsx`), we adjust TypeScript-specific rules:

- `@typescript-eslint/no-var-requires`: Turned off to allow CommonJS require syntax
- `@typescript-eslint/explicit-module-boundary-types`: Turned off since JS doesn't have type annotations

## Usage with TypeScript Configuration

### How ESLint and TypeScript Work Together

1. **Complementary Checks**: ESLint and TypeScript perform complementary checks
   - TypeScript: Type checking, type safety
   - ESLint: Code style, best practices, additional type safety

2. **Unused Variables**:
   - TypeScript: Configured in `tsconfig.json` with `noUnusedLocals` and `noUnusedParameters`
   - ESLint: Configured to allow underscore-prefixed variables (e.g., `_unusedVar`)

3. **Type Safety**:
   - TypeScript: Provides basic type safety with `strict: true`
   - ESLint: Adds additional checks for Promise handling, non-null assertions, etc.

### Prefixing Unused Variables

To mark a variable as intentionally unused, prefix it with an underscore:

```typescript
// This will NOT trigger a warning
function calculateTotal(subtotal: number, _taxRate: number): number {
  // Using a hardcoded tax rate for now, but keeping the parameter for future use
  return subtotal * 1.08;
}

// Using our utility function
import { markAsUnused } from '@blueearth/core-common';

// These variables won't trigger warnings
const tempVar1 = 'will use later';
const tempVar2 = 'will use later';
markAsUnused(tempVar1, tempVar2);
```

## IDE Integration

### VS Code Setup

For the best development experience with VS Code:

1. Install the ESLint extension
2. Add these settings to your `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Running ESLint

To run ESLint manually:

```bash
# Check files
npx eslint ./client/src

# Fix automatically fixable issues
npx eslint ./client/src --fix
```

## Best Practices

1. **Fix Warnings**: Don't ignore warnings - they often point to potential issues
2. **Use Type Annotations**: Prefer explicit type annotations for function parameters and return types
3. **Avoid `any`**: Use specific types instead of `any` whenever possible
4. **Handle Promises**: Always handle promises with `await` or `.then()/.catch()`
5. **Use Utility Types**: Leverage TypeScript utility types and our custom utilities when appropriate