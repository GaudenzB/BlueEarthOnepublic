# TypeScript Best Practices for BlueEarth Capital

## Handling Unused Variables and Imports

When working on the BlueEarth Capital codebase, you may encounter TypeScript warnings about unused variables or imports. Here are the recommended approaches to handle these situations:

### 1. Temporary Development Configuration

During active development phases, we've temporarily disabled unused variable warnings in the project's `tsconfig.json`:

```json
"noUnusedLocals": false,
"noUnusedParameters": false
```

This configuration will be re-enabled before release to ensure code quality.

### 2. Using the Unused Helper Utilities

For variables or imports that are intentionally kept but not currently used:

```typescript
import { markAsUnused, Unused } from '@blueearth/core-common';

// Method 1: Use the markAsUnused function
import { someUnusedImport } from './module';
markAsUnused(someUnusedImport);

// Method 2: Prefix variables with underscore
const _unusedVariable = 'This is kept for future use';

// Method 3: Type annotation for exports
export const unusedExport: Unused<SomeType> = {...};
```

### 3. Commenting Out Code

For code that's truly not needed but might be useful in the future:

```typescript
// import { unusedImport } from './module';
// export const unusedFunction = () => {...};
```

## TypeScript Checking Tools

The project includes several tools to help manage TypeScript errors:

### Quick File Checking

To check specific files for TypeScript errors:

```bash
node scripts/check-file.mjs path/to/your/file.ts
```

### Full Project Type Checking

For comprehensive type checking before commits:

```bash
node scripts/type-check.mjs --strict
```

### Pre-commit Hooks

The project uses Husky to run TypeScript checks before commits. This prevents committing code with TypeScript errors.

## Common TypeScript Patterns

### Optional Chaining

Use optional chaining to safely access potentially undefined properties:

```typescript
const name = user?.profile?.name;
```

### Null Safety

Always check for null or undefined values before accessing properties:

```typescript
// Good
const isValid = document ? document.isValid : false;

// Better
const isValid = document?.isValid ?? false;
```

### Type Guards

Use type guards to narrow types:

```typescript
if (typeof value === 'string') {
  // TypeScript knows value is a string here
  return value.toUpperCase();
}
```

### Exhaustive Type Checking

Ensure all possible values are handled:

```typescript
function handleStatus(status: 'pending' | 'success' | 'error'): string {
  switch (status) {
    case 'pending': return 'Loading...';
    case 'success': return 'Data loaded successfully';
    case 'error': return 'An error occurred';
    default: {
      // This ensures we handle all possible values
      const exhaustiveCheck: never = status;
      return exhaustiveCheck;
    }
  }
}
```

By following these practices, we can maintain a clean, type-safe codebase while reducing unnecessary warnings during development.