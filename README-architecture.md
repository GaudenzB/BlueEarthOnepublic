# BlueEarth Capital Portal - Architecture Guide

## Project Structure

```
/
├── core/                       # Shared utilities, components, hooks, and schemas
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── theme/              # Design tokens and styling
│   │   ├── utils/              # Utility functions
│   │   └── styles/             # Global styles and CSS reset
│   ├── package.json
│   └── tsconfig.json
│
├── modules/                    # Feature modules
│   ├── employees/              # Employee directory feature
│   │   ├── client/             # Frontend code for employees
│   │   ├── server/             # Backend code for employees
│   │   └── shared/             # Shared code for employees 
│   ├── users/                  # User management feature
│   ├── documents/              # Document management feature
│   └── contracts/              # Contract management feature
│
├── client/                     # Main frontend application
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # App-specific components
│   │   ├── hooks/              # App-specific hooks
│   │   ├── lib/                # Utilities and configuration
│   │   ├── assets/             # Static assets
│   │   └── App.tsx             # Main application component
│
├── server/                     # Main backend application
│   ├── controllers/            # Express controllers
│   ├── middleware/             # Express middleware
│   ├── services/               # Backend services
│   └── index.ts                # Server entry point
│
└── shared/                     # Shared code between client and server
    └── validation/             # Validation schemas
```

## Core Package

The core package contains reusable utilities, components, hooks, and schemas that can be used across different parts of the application. It provides a consistent foundation for building features.

### Using Core Components

```tsx
import { Button, Card, Input } from '@blueearth/core/components';

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  );
}
```

### Using Core Hooks

```tsx
import { useMediaQuery, useLocalStorage } from '@blueearth/core/hooks';

function MyComponent() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Is desktop: {isDesktop ? 'Yes' : 'No'}</p>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle theme
      </button>
    </div>
  );
}
```

### Using Core Schema Validation

```tsx
import { EmployeeSchema } from '@blueearth/core/schemas';
import { z } from 'zod';

// Create a form schema extending the base schema
const employeeFormSchema = EmployeeSchema.extend({
  confirmEmail: z.string().email(),
}).refine((data) => data.email === data.confirmEmail, {
  message: "Emails don't match",
  path: ["confirmEmail"],
});

// Use with React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function EmployeeForm() {
  const form = useForm({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: '',
      email: '',
      confirmEmail: '',
    },
  });
  
  // Rest of the form implementation...
}
```

### Using Theme Constants

```tsx
import { theme } from '@blueearth/core/theme';

function MyComponent() {
  return (
    <div style={{ 
      color: theme.colors.primary[500],
      padding: theme.spacing.md,
      fontFamily: theme.typography.fontFamily.sans.join(', '),
    }}>
      Themed component
    </div>
  );
}
```

## Modules

The modules directory contains feature-specific code organized by domain. Each module has its own client, server, and shared code.

### Creating a New Module

1. Create a new directory under `modules/` for your feature
2. Add subdirectories for `client`, `server`, and `shared` code
3. Implement your feature-specific code in these directories
4. Import core utilities, components, and schemas as needed

### Module Example: Documents

```tsx
// modules/documents/client/DocumentList.tsx
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@blueearth/core/utils';
import { Button } from '@blueearth/core/components';

function DocumentList() {
  const { data, isLoading } = useQuery({
    queryKey: [ROUTES.API.DOCUMENTS.BASE],
  });
  
  // Implementation...
}

// modules/documents/server/documentController.ts
import { Request, Response } from 'express';
import { createSuccessResponse } from '@blueearth/core/utils';
import { DocumentSchema } from '@blueearth/core/schemas';

export async function getDocuments(req: Request, res: Response) {
  // Implementation...
  return res.json(createSuccessResponse(documents));
}
```

## Development Workflow

1. **Core Package Changes**:
   - Add or modify code in the core package when creating reusable utilities, components, or schemas
   - Build the core package with `cd core && npm run build`

2. **Module Development**:
   - Implement feature-specific code in the appropriate module directory
   - Use core package utilities, components, and schemas as needed

3. **Application Integration**:
   - Import module components and features in the main application
   - Configure routes and navigation to access module features

## Best Practices

1. **Schema-First Development**:
   - Define data models using Zod schemas in `core/src/schemas`
   - Use these schemas for both frontend and backend validation

2. **Consistent Styling**:
   - Use theme constants from `core/src/theme` for consistent styling
   - Follow the design tokens for colors, spacing, typography, etc.

3. **Component Reusability**:
   - Place reusable components in the core package
   - Keep feature-specific components in their respective modules

4. **API Consistency**:
   - Use the standardized API response format from `core/src/utils/api.ts`
   - Follow RESTful conventions for API endpoints

5. **Route Management**:
   - Use centralized routes from `core/src/utils/routes.ts`
   - Keep frontend routes and API endpoints consistent

## Logging and Debugging

Implement structured logging to track application behavior and issues:

```typescript
import { logger } from '@blueearth/core/utils';

logger.info('User logged in', { userId: 123 });
logger.error('Failed to fetch data', { error: 'Connection failed' });
```

## Testing Strategy

- **Unit Tests**: Test individual components, hooks, and utilities
- **Integration Tests**: Test interactions between modules
- **End-to-End Tests**: Test complete user flows

## Deployment

1. Build the core package: `cd core && npm run build`
2. Build the client application: `cd client && npm run build`
3. Start the server: `cd server && npm start`