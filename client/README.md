# BlueEarth Capital Portal - Client

This is the frontend client for the BlueEarth Capital employee portal.

## Getting Started

The client is built with React, TypeScript, Vite, and TailwindCSS with shadcn/ui components.

### Prerequisites

- Node.js 18+ 
- npm 8+
- Access to required environment variables

### Environment Configuration

For local development, the client needs the following environment variables:

```
VITE_API_URL=http://localhost:3000/api
```

In Replit deployment, these are automatically handled through the server proxy.

### Running the Client

The client can be run in several ways:

```bash
# Start the development server (with hot reloading)
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

## Project Structure

- `src/` - Source code
  - `components/` - Reusable UI components
    - `ui/` - Base UI components from shadcn/ui
    - `employee/` - Employee-specific components
    - `layouts/` - Layout components
    - `permissions/` - Permission-related components
  - `pages/` - Page components for each route
  - `hooks/` - Custom React hooks
  - `contexts/` - React context providers
  - `lib/` - Utility libraries and configuration
  - `assets/` - Static assets like images
  - `styles/` - Global CSS and styling utilities

## Key Features

### Authentication

The client uses JWT authentication with tokens stored in local storage. All authenticated requests are handled through the `useAuth` hook and `queryClient` configuration.

### React Query

Data fetching is managed with TanStack Query (React Query) for efficient caching, refetching, and state management:

```tsx
// Example query
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/employees'],
})
```

### Permission-Based UI

UI elements adapt based on user permissions:

```tsx
// Using PermissionGuard to conditionally render components
<PermissionGuard area="hr" action="view">
  <EmployeeSensitiveData />
</PermissionGuard>
```

## Testing

Run the test suite with:

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Building for Production

To build the client for production:

```bash
npm run build
```

The build output will be in the `dist/` directory, which is served by the Express server in production.

## Deployment Configuration

When deploying on Replit:

1. Ensure the Replit Deployment settings are configured
2. The client bundle is automatically served by the Express server
3. No additional configuration is needed as the `.replit` file is already set up

## Troubleshooting

Common issues:

1. **Network Errors**: Check the server is running and accessible
2. **Authentication Issues**: Clear local storage and log in again
3. **Rendering Problems**: Check the browser console for errors