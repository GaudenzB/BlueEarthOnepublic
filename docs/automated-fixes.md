# Automated Error Fixing Tools

This document explains how to use the automated error fixing tools in the BlueEarth Capital codebase.

## Overview of Available Tools

We've created several automated tools to help fix common TypeScript and linting errors:

1. **Master Fix Script** - `scripts/fix-lint-errors.mjs`
   - Runs linter and TypeScript checker
   - Saves errors to a temporary file
   - Automatically fixes detected errors

2. **Individual Fixers**
   - `scripts/fixes/ts-syntax-fixer.mjs` - Fixes switch statement syntax issues
   - `scripts/fixes/jsx-escape-fixer.mjs` - Properly escapes quotes in JSX
   - `scripts/fixes/react-hooks-fixer.mjs` - Fixes React Hook dependency issues
   - `scripts/fixes/unused-vars-fixer.mjs` - Prefixes unused variables with underscore
   - `scripts/fixes/targeted-fixer.mjs` - Fixes specific errors from an error log
   - `scripts/fixes/eslint-auto-fix.mjs` - General-purpose linting error fixer

## How to Use

### Quick Fix All Errors

To automatically detect and fix all errors in the codebase:

```bash
node scripts/fix-lint-errors.mjs
```

### Fix Errors in a Specific File

To fix errors in just one file:

```bash
node scripts/fix-lint-errors.mjs path/to/file.tsx
```

### Fix From Existing Error Log

If you have saved error output to a file:

```bash
node scripts/fixes/targeted-fixer.mjs path/to/error-log.txt
```

### Run Specific Fixers

You can also run individual fixers directly:

```bash
node scripts/fixes/jsx-escape-fixer.mjs
node scripts/fixes/unused-vars-fixer.mjs
node scripts/fixes/react-hooks-fixer.mjs
```

## Common Error Types Fixed

1. **JSX String Escaping**
   - Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`
   - Fix: Automatically converts quotes to their proper HTML entities in JSX content

2. **Unused Variables**
   - Error: `'icon' is defined but never used. Allowed unused args must match /^_/u`
   - Fix: Adds underscore prefix to unused variables (e.g., `icon` → `_icon`)

3. **React Hook Dependencies**
   - Error: `The function makes the dependencies of useEffect Hook change on every render`
   - Fix: Wraps functions in useCallback, objects in useMemo with correct dependencies

4. **Component Display Names**
   - Error: `Component definition is missing display name`
   - Fix: Adds displayName property to React components for better debugging

5. **Unexpected Any Types**
   - Error: `Unexpected any. Specify a different type`
   - Fix: Replaces `any` with more specific types where possible

## Extending the Tools

To add support for fixing additional error types:

1. Identify the error pattern in your linting/TypeScript output
2. Add a new pattern and fix function to the appropriate fixer script
3. Test on a single file before running across the entire codebase

## Pre-commit Hook Integration

You can integrate these fixers into your git pre-commit hooks to automatically fix errors before committing:

```bash
# In .git/hooks/pre-commit
#!/bin/sh
node scripts/fix-lint-errors.mjs
```

## Troubleshooting

If a fixer doesn't work as expected:

1. Check the console output for specific error messages
2. Original files are backed up with a `.backup` extension before changes
3. Try running the specific fixer directly on the problem file
4. The fixers are designed to be idempotent - running them multiple times won't cause issues