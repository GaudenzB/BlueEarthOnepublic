# ESLint Configuration Guide

## Current Setup

This project uses ESLint 9 with a "soft mode" configuration to prevent linting issues from blocking development. The current approach allows developers to focus on functionality while still maintaining code quality standards through TypeScript's type checking.

## Why Soft Mode?

The soft mode configuration was implemented to:
- Allow rapid development without being blocked by non-critical lint errors
- Maintain development velocity during refactoring phases
- Provide warnings in the editor without failing builds

## Available Commands

We have several commands for linting, each with a different purpose:

```bash
# Standard linting (non-blocking, with warnings)
pnpm run lint

# Strict linting (will fail on warnings, for CI)
pnpm run lint:ci

# Ultra-safe linting (guaranteed to never block)
pnpm run lint:soft
```

## Configuration Details

Our ESLint setup uses:
- ESLint 9's flat configuration format (`eslint.config.js`)
- JavaScript-focused linting with TypeScript files ignored in ESLint
- TypeScript compiler for actual type checking

## Future Improvements

Once the codebase is stabilized, we plan to gradually re-enable stricter rules:
- `no-unused-vars`
- `no-undef`
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-non-null-assertion`
- `react-hooks/exhaustive-deps`

## Using the Correct Command

- For local development: `pnpm run lint` 
- For pre-commit hooks: `pnpm run lint:soft`
- For CI/CD pipelines: `pnpm run type-check` (to ensure type safety)

## Important Notes

1. TypeScript errors will still show in your editor and can be checked with `pnpm run type-check`
2. The wrapper script `lint-soft.cjs` provides a guaranteed non-blocking experience
3. This configuration is a temporary solution to unblock development