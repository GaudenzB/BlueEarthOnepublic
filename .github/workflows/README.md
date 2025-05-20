# GitHub Actions Workflows

This directory contains GitHub Actions workflow configurations for the BlueEarth Capital Portal.

## TypeScript Check Workflow

The TypeScript check workflow (`typescript-check.yml`) automatically runs on:
- Push to main branches (main, master, dev)
- Pull requests against main branches
- When TypeScript files or TypeScript config files change

### What it does:

1. Sets up a Node.js environment
2. Installs project dependencies
3. Runs TypeScript type checking with strict mode
4. Runs ESLint to verify code quality

### Benefits:

- Catches type errors before they reach production
- Ensures consistent code style across the codebase
- Prevents merging of code with type-related bugs
- Improves code quality and reduces runtime errors

## How to run locally

You can run the same checks locally using:

```bash
# Run TypeScript check with strict mode
node scripts/type-check.mjs --strict

# Run ESLint
npx eslint ./client/src ./server ./core --ext .ts,.tsx
```

For a complete setup of the TypeScript checking system:

```bash
node scripts/setup-type-checking.mjs
```