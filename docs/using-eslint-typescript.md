# Using ESLint with TypeScript

This guide explains how to use our ESLint and TypeScript integration to maintain high code quality standards.

## Quick Start

We've created a convenient script to run ESLint and TypeScript checks without modifying package.json. Use the following commands:

```bash
# Run ESLint on the codebase
node scripts/run-eslint-typecheck.mjs lint

# Run ESLint with auto-fix
node scripts/run-eslint-typecheck.mjs lint:fix

# Run TypeScript type checking
node scripts/run-eslint-typecheck.mjs type-check

# Run both ESLint and TypeScript checks
node scripts/run-eslint-typecheck.mjs lint-type

# Display help information
node scripts/run-eslint-typecheck.mjs help
```

## Setting Up Your Environment

To ensure the linting and type checking tools are properly configured in your development environment:

```bash
# Set up ESLint and TypeScript integration
node scripts/run-eslint-typecheck.mjs setup

# Install Husky git hooks for pre-commit checks
node scripts/run-eslint-typecheck.mjs husky-install
```

## Understanding Our ESLint Configuration

Our ESLint configuration is defined in `.eslintrc.json` and includes:

1. TypeScript Integration
   - Type-aware linting using `@typescript-eslint/recommended-requiring-type-checking`
   - Smart handling of unused variables (allows underscore prefix)

2. React Best Practices
   - React Hooks rules enforcement
   - JSX best practices
   - Modern React syntax support

3. Code Quality Rules
   - Consistent style enforcement
   - Error prevention
   - Security best practices

## Pre-commit Hooks

When you have Husky installed, the following checks run automatically before each commit:

1. **lint-staged**: Runs ESLint and Prettier on staged files
2. **TypeScript check**: Verifies type correctness across the project

These hooks help catch issues early and maintain code quality.

## Handling Unused Variables

To mark variables as intentionally unused, you have two options:

1. **Prefix with underscore**:
   ```typescript
   // This won't trigger a warning
   function calculateTotal(subtotal: number, _taxRate: number): number {
     return subtotal * 1.08;
   }
   ```

2. **Use the markAsUnused utility**:
   ```typescript
   import { markAsUnused } from '@blueearth/core-common';

   const tempVariable = 'for future use';
   markAsUnused(tempVariable);
   ```

## Editor Integration

### VS Code

For VS Code users, we recommend:

1. Install the ESLint extension.
2. Add the following to your settings.json:

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

### Other Editors

Most modern editors have ESLint plugins or extensions available. Look for ones that support:

- TypeScript integration
- React Hooks rules
- Auto-fixing on save

## Customizing Rules

If you need to modify ESLint rules for a specific file or directory, use inline comments:

```typescript
// Disable a specific rule for a line
const anyValue: any = fetchData(); // eslint-disable-line @typescript-eslint/no-explicit-any

// Disable a rule for a section
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const element = document.getElementById('app')!;
const value = complexObject!.deeply!.nested!.property;
/* eslint-enable @typescript-eslint/no-non-null-assertion */
```

## Running Custom ESLint Checks

For advanced use cases, you can run ESLint with custom options:

```bash
# Check a specific file
npx eslint path/to/your/file.ts

# Use a specific rule
npx eslint path/to/your/file.ts --rule '@typescript-eslint/no-explicit-any: error'

# Output to a file
npx eslint path/to/your/file.ts -o eslint-report.txt
```

## Troubleshooting

### Common Issues

1. **"Error: No ESLint configuration found"**:
   Run `node scripts/run-eslint-typecheck.mjs setup` to create the necessary configuration files.

2. **"TypeScript errors but ESLint passes"**:
   This is expected - ESLint and TypeScript checks are complementary but separate. Run both with `node scripts/run-eslint-typecheck.mjs lint-type`.

3. **Pre-commit hooks not running**:
   Ensure you've run `node scripts/run-eslint-typecheck.mjs husky-install` and that the `.git` directory exists.

4. **"Cannot find module..."**:
   Ensure all dependencies are installed with `npm install`.

### Getting Help

If you encounter persistent issues with the ESLint or TypeScript configuration, check:

1. Our ESLint configuration (`.eslintrc.json`)
2. TypeScript configuration (`tsconfig.json` and `tsconfig.strict.json`)
3. The documentation in this folder

## Best Practices

1. **Run lint:fix before committing**: This automatically resolves many common issues.
2. **Use type annotations**: Always specify types for function parameters and return values.
3. **Follow the pattern**: Look at existing code to understand the correct patterns.
4. **Address warnings**: Don't ignore linting warnings—they often indicate potential problems.
5. **Use utility functions**: Our shared utilities can help maintain code quality.

## Further Reading

- [Official ESLint Documentation](https://eslint.org/docs/user-guide/)
- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)
- [React Hooks ESLint Plugin](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- See `docs/eslint-typescript-guide.md` for more details on our ESLint rules