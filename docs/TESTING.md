# Testing Guide for BlueEarth Capital Portal

This document provides guidelines and instructions for testing the BlueEarth Capital Portal.

## Testing Setup

The project uses Vitest for both unit and integration testing.

### Testing Configuration

- Configuration file: `vitest.config.ts`
- Setup file: `vitest.setup.ts`
- Test directories:
  - `server/__tests__`: Server-side tests
  - `client/src/__tests__`: Client-side tests

### Test Environment Variables

During tests, the following environment variables are set:

- `NODE_ENV=test`
- `JWT_SECRET=test_jwt_secret`
- `SESSION_SECRET=test_session_secret`

For testing with a database, you can use:

- A SQLite in-memory database for server tests (`sqlite::memory:`)
- A separate test database on Neon with `TEST_DATABASE_URL`

## Running Tests

To run tests, use one of the following commands:

```bash
# Run all tests once
npm run test

# Run tests with watch mode for development
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Writing Tests

### Unit Tests

Unit tests should be isolated and not depend on external services. Use mocks where appropriate.

Example unit test:

```typescript
import { describe, test, expect, vi } from 'vitest';
import { hashPassword, comparePassword } from '../auth';

describe('Auth functions', () => {
  test('should hash a password', async () => {
    const password = 'securePassword123';
    const hashedPassword = await hashPassword(password);
    expect(hashedPassword).not.toBe(password);
  });
});
```

### Integration Tests

Integration tests can test interactions between components but should avoid external dependencies.

Example integration test:

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createRequest, createResponse } from 'node-mocks-http';
import { authenticate } from '../auth';
import jwt from 'jsonwebtoken';

describe('Authentication middleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test_jwt_secret';
  });

  test('should allow authenticated requests', async () => {
    const token = jwt.sign({ id: 1, username: 'test' }, process.env.JWT_SECRET!);
    const req = createRequest({
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const res = createResponse();
    const next = vi.fn();

    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });
});
```

### Component Tests (React)

Use React Testing Library to test React components.

Example component test:

```typescript
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmployeeCard } from '../components/employee/EmployeeCard';

describe('EmployeeCard component', () => {
  test('renders employee information', () => {
    const employee = {
      id: 1,
      name: 'John Doe',
      position: 'Developer',
      department: 'IT',
      email: 'john@example.com',
      location: 'Switzerland',
      status: 'active'
    };

    render(<EmployeeCard employee={employee} />);
    
    expect(screen.getByText(employee.name)).toBeInTheDocument();
    expect(screen.getByText(employee.position)).toBeInTheDocument();
  });
});
```

## Testing Best Practices

1. **Isolation**: Tests should be independent and not rely on each other
2. **Repeatability**: Tests should produce the same results when run multiple times
3. **Coverage**: Aim for high test coverage, especially for critical functionality
4. **Performance**: Tests should run quickly to maintain developer productivity
5. **Clarity**: Tests should clearly express what they're testing

## Mocking

### Mocking API Calls

Use Vitest's mocking capabilities to mock fetch/API calls:

```typescript
// Mock global fetch
global.fetch = vi.fn();

// Mock implementation
vi.mocked(fetch).mockResolvedValue({
  ok: true,
  json: async () => ({ success: true, data: { /* mock data */ } }),
} as Response);
```

### Mocking Dependencies

For tests that rely on external modules, use Vitest's mocking:

```typescript
// Mock a module
vi.mock('../services/emailService', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));
```

## Continuous Integration

Tests are automatically run as part of the CI pipeline. The GitHub Actions workflow will:

1. Check out the code
2. Install dependencies
3. Run all tests
4. Generate test coverage reports

## End-to-End Testing (Future)

For future end-to-end testing, consider using one of the following:

- **Playwright**: For comprehensive browser testing
- **Cypress**: For UI-focused testing

When implementing E2E tests, make sure to:

1. Run them in a separate environment
2. Use test fixtures for consistent data
3. Isolate the database to prevent test pollution