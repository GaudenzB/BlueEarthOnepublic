# BlueEarth Capital Utility Functions Guide

This guide provides examples and use cases for the utility functions available in the BlueEarth Capital project.

## Table of Contents

- [TypeScript Helpers](#typescript-helpers)
- [Form Helpers](#form-helpers)
- [Data Transformation](#data-transformation)
- [Authentication Helpers](#authentication-helpers)

## TypeScript Helpers

### Handling Unused Variables

```typescript
import { markAsUnused, Unused } from '@blueearth/core-common';

// Mark variables as intentionally unused
const _temporaryVar = 'Will use this later';
markAsUnused(_temporaryVar);

// Type annotation for exports
export const schemaForLaterUse: Unused<typeof someSchema> = someSchema;
```

### Safe Data Access

```typescript
import { safeGet, ensureArray, isNonEmpty } from '@blueearth/core-common';

// Safe property access with default value
const userName = safeGet(() => user.profile.name, 'Unknown User');

// Ensure value is always an array
const items = ensureArray(possiblyArrayOrSingleItem);

// Filter out empty values
const validEntries = entries.filter(isNonEmpty);
```

### Record Operations

```typescript
import { getFromRecord } from '@blueearth/core-common';

// Safely get value from an object with default fallback
const userPermissions = getFromRecord(
  permissionsMap, 
  'documents', 
  { read: true, write: false }
);
```

### Type-Safe Events

```typescript
import { createTypedEmitter } from '@blueearth/core-common';

// Define your event types
type AppEvents = {
  'document:created': [documentId: string, userId: string];
  'user:login': [username: string, timestamp: number];
};

// Create a type-safe emitter
const events = createTypedEmitter<AppEvents>();

// Subscribe to events with proper typing
events.on('document:created', (documentId, userId) => {
  console.log(`Document ${documentId} created by ${userId}`);
});

// Emit events with type checking
events.emit('user:login', 'john.doe', Date.now());
```

### Exhaustive Switch Cases

```typescript
import { exhaustiveCheck } from '@blueearth/core-common';

type Status = 'pending' | 'success' | 'error';

function handleStatus(status: Status): string {
  switch (status) {
    case 'pending': return 'Loading...';
    case 'success': return 'Success!';
    case 'error': return 'Error occurred';
    default: return exhaustiveCheck(status); // Type error if not all cases handled
  }
}
```

## Form Helpers

### Search Form Validation

```typescript
import { createSearchSchema } from '@blueearth/core-common';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

function SearchComponent() {
  const searchSchema = createSearchSchema();
  
  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '', page: 1, limit: 10 }
  });
  
  const onSubmit = (data) => {
    // Form data is validated
    fetchResults(data);
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### File Upload Validation

```typescript
import { validateFileUpload, DOCUMENT_FILE_TYPES } from '@blueearth/core-common';

function FileUploadComponent() {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    // Validate file (max 5MB)
    const { isValid, errorMessage } = validateFileUpload(
      file,
      DOCUMENT_FILE_TYPES,
      5 * 1024 * 1024
    );
    
    if (!isValid) {
      setError(errorMessage);
      return;
    }
    
    // Proceed with upload
    uploadFile(file);
  };
  
  return (
    <input type="file" onChange={handleFileChange} />
  );
}
```

## Data Transformation

### Case Conversion

```typescript
import { snakeToCamel, camelToSnake } from '@blueearth/core-common';

// Converting API response
const apiResponse = {
  user_id: 123,
  first_name: 'John',
  last_name: 'Doe',
  department: {
    department_id: 5,
    department_name: 'Finance'
  }
};

// Convert to camelCase for frontend use
const userData = snakeToCamel(apiResponse);
// Result: { userId: 123, firstName: 'John', lastName: 'Doe', department: { departmentId: 5, departmentName: 'Finance' } }

// Convert back to snake_case for API submission
const dataForSubmission = camelToSnake(userData);
```

### Formatting

```typescript
import { 
  formatDate, 
  formatCurrency, 
  truncateText,
  slugify
} from '@blueearth/core-common';

// Format a date
const formattedDate = formatDate('2025-05-20T14:30:00Z');
// Result: "May 20, 2025"

// Format with time
const formattedDateTime = formatDate('2025-05-20T14:30:00Z', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
// Result: "May 20, 2025, 02:30 PM"

// Format currency
const formattedAmount = formatCurrency(1234.56);
// Result: "$1,234.56"

// Format in different currency
const euroAmount = formatCurrency(1234.56, { 
  style: 'currency', 
  currency: 'EUR' 
});
// Result: "€1,234.56"

// Truncate long text
const shortText = truncateText(
  'This is a very long text that needs to be truncated for display purposes.',
  25
);
// Result: "This is a very long text..."

// Create a URL slug
const slug = slugify('BlueEarth Capital Contract #123');
// Result: "blueearth-capital-contract-123"
```

### Data Organization

```typescript
import { groupBy } from '@blueearth/core-common';

const documents = [
  { id: 1, type: 'contract', title: 'Service Agreement' },
  { id: 2, type: 'invoice', title: 'January Invoice' },
  { id: 3, type: 'contract', title: 'NDA' },
  { id: 4, type: 'invoice', title: 'February Invoice' }
];

// Group by document type
const documentsByType = groupBy(documents, 'type');
// Result: 
// {
//   contract: [
//     { id: 1, type: 'contract', title: 'Service Agreement' },
//     { id: 3, type: 'contract', title: 'NDA' }
//   ],
//   invoice: [
//     { id: 2, type: 'invoice', title: 'January Invoice' },
//     { id: 4, type: 'invoice', title: 'February Invoice' }
//   ]
// }
```

## Authentication Helpers

### Permission Checking

```typescript
import { hasPermission, hasRole } from '@blueearth/core-common';

// User object with permissions
const user = {
  id: '123',
  name: 'Jane Smith',
  roles: ['editor'],
  permissions: {
    documents: {
      read: true,
      write: true,
      delete: false
    },
    contracts: {
      read: true,
      write: false,
      delete: false
    }
  }
};

// Check if user can edit documents
if (hasPermission(user.permissions, 'documents', 'write')) {
  // Show edit button
}

// Check if user has admin role
if (hasRole(user.roles, ['admin', 'owner'])) {
  // Show admin panel
}
```

### Token Management

```typescript
import { 
  isTokenExpired, 
  getTokenExpirationTime, 
  redactSensitiveData 
} from '@blueearth/core-common';

// Check if token is expired
if (isTokenExpired(jwt)) {
  // Redirect to login
}

// Display expiration time to user
const expirationTime = getTokenExpirationTime(jwt);
// "15 minutes" or "2 hours"

// Safe logging of sensitive data
console.log(`Processing login for ${redactSensitiveData('john.doe@example.com')}`);
// Logs: "Processing login for j********@example.com"
```

## Best Practices

1. **Import from the Core Package**: Always import utilities from the top-level package:
   ```typescript
   // Good
   import { hasPermission, formatDate } from '@blueearth/core-common';
   
   // Avoid direct imports
   import { hasPermission } from '@blueearth/core-common/utils/auth-helpers';
   ```

2. **Use TypeScript Typing**: Take advantage of TypeScript typing for better IDE support:
   ```typescript
   import { Permission, PermissionArea } from '@blueearth/core-common';
   
   function checkAccess(area: PermissionArea, permission: Permission) {
     // Type-safe implementation
   }
   ```

3. **Combine Utilities**: Combine utilities for powerful operations:
   ```typescript
   import { ensureArray, groupBy, formatDate } from '@blueearth/core-common';
   
   // Ensure we have an array, group by date, and format the date keys
   const data = ensureArray(response.data);
   const groupedByDate = groupBy(data, 'createdAt');
   
   const formattedResult = Object.entries(groupedByDate).reduce((result, [date, items]) => {
     return {
       ...result,
       [formatDate(date)]: items
     };
   }, {});
   ```