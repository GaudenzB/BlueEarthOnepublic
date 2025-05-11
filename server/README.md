# BlueEarth Capital Portal - Server

This is the backend server for the BlueEarth Capital employee portal.

## Getting Started

The server is built with Express, TypeScript, Drizzle ORM, and PostgreSQL.

### Prerequisites

- Node.js 18+
- npm 8+
- PostgreSQL database
- Access to required environment variables

### Environment Configuration

The server requires the following environment variables:

```
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/blueearth_portal

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_TOKEN_EXPIRY=24h
PASSWORD_SALT_ROUNDS=12
SESSION_SECRET=your_session_secret_key_here

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=no-reply@example.com

# Bubble.io Integration
BUBBLE_API_KEY=your_bubble_api_key
BUBBLE_SYNC_INTERVAL=60

# Server Configuration
PORT=3000
NODE_ENV=development
```

To configure these in Replit:

1. Go to the Secrets tab in your Replit project
2. Add each environment variable as a secret
3. The server will automatically pick them up on restart

### Running the Server

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Start the production server
npm run start
```

## API Documentation

The API is documented using OpenAPI/Swagger. You can access the API documentation at:

- Development: http://localhost:3000/docs
- Production: https://your-replit-domain.replit.app/docs

The API documentation is automatically generated from the Zod schemas defined in `shared/schema.ts`.

## Project Structure

- `middleware/` - Express middleware functions
  - `errorHandler.ts` - Global error handling
  - `requestLogger.ts` - Request logging
  - `security.ts` - Security middleware
  - `validation.ts` - Request validation
- `migrations/` - Database migration scripts
- `utils/` - Utility functions
- `email/` - Email templates and sending logic
- `services/` - Service modules (Bubble.io integration, etc.)
- `routes.ts` - API route definitions
- `auth.ts` - Authentication logic
- `db.ts` - Database connection and configuration
- `storage.ts` - Data access layer
- `index.ts` - Entry point
- `vite.ts` - Vite integration for development

## Key Features

### Authentication

The server uses JWT-based authentication with bcrypt for password hashing:

```javascript
// To authenticate a route
app.get("/api/protected", authenticate, async (req, res) => {
  // Route implementation
});

// To authorize based on role
app.get("/api/admin-only", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  // Route implementation
});
```

### Database Migrations

Schema changes can be applied using Drizzle's push mechanism:

```bash
npm run db:push
```

For complex migrations, add a new migration file in `server/migrations/` and register it in `server/migrations/index.ts`.

### Error Handling

The server uses a centralized error handling strategy:

```javascript
try {
  // Operation that might fail
} catch (error) {
  logger.error({ context: 'operation', error }, "Operation failed");
  return sendError(res, "Failed to complete operation");
}
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

The server uses a separate test database for integration tests. Configure this with:

```
TEST_DATABASE_URL=postgresql://username:password@localhost:5432/blueearth_portal_test
```

## Deployment Configuration

When deploying on Replit:

1. Ensure all required secrets are configured in the Secrets tab
2. The included `.replit` file configures the run command
3. Set the `PORT` environment variable to `3000` if not already set
4. Ensure the PostgreSQL database is properly configured

## Troubleshooting

Common issues:

1. **Database Connection Errors**: Verify DATABASE_URL is correct and database is accessible
2. **Authentication Issues**: Check JWT_SECRET is properly set
3. **Email Sending Failures**: Verify SENDGRID_API_KEY is valid
4. **Bubble.io Sync Problems**: Confirm BUBBLE_API_KEY is correct and accessible