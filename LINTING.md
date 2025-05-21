# ESLint Configuration Guide

## Overview

This project uses a non-blocking "soft mode" ESLint configuration that allows development to proceed smoothly while still maintaining code quality. 

## Why Soft Mode?

- Prevents linting issues from blocking builds or development
- Maintains TypeScript type checking separately
- Enables rapid refactoring and development
- Allows viewing warnings without being blocked by errors

## Available Linting Commands

Run these commands to lint your code:

```bash
# Standard linting - shows warnings but won't fail builds
pnpm exec eslint . --ext .ts,.tsx 

# Ultra-safe linting (guaranteed to never block)
node lint-soft.cjs [files]

# Type checking (run this to ensure type safety)
pnpm exec tsc --noEmit
```

## Configuration Details

Our ESLint configuration uses:
- ESLint 9's flat configuration format (`eslint.config.js`)
- JavaScript-focused linting with TypeScript files ignored in ESLint
- TypeScript compiler for actual type checking

## Implementation Notes

1. The main configuration file is `eslint.config.js` at the root of the project
2. For additional safety, we provide the `lint-soft.cjs` wrapper script
3. TypeScript errors will still show in your editor
4. This setup is ideal for rapidly evolving codebases

## Future Improvements

After the codebase is stabilized, we can gradually re-enable stricter rules:
- `no-unused-vars`
- `no-undef`
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-non-null-assertion`
- `react-hooks/exhaustive-deps`