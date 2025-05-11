# BlueEarth Capital Portal

A company portal optimized for employee management and interaction, featuring granular permission-based access control and adaptive user interfaces.

## Project Structure

This project is organized as a monorepo with the following structure:

- `client/`: React 18+ frontend application
- `server/`: Express backend with robust authentication and permissions
- `shared/`: Types and schemas shared between client and server

### Configuration Files

- `tsconfig.json`: TypeScript configuration for the project
- `vite.config.ts`: Vite bundler configuration for the client
- `tailwind.config.ts`: Tailwind CSS configuration with custom theme settings
- `postcss.config.js`: PostCSS configuration for processing CSS
- `drizzle.config.ts`: Drizzle ORM configuration for database schema
- `components.json`: Configuration for shadcn/ui components

## Features

- **Employee Directory**: Browse, search and filter company employees
- **Employee Profiles**: Detailed view of employee information with role-based access
- **Admin Panel**: Manage users and their permissions
- **Permission System**: Granular permission controls based on roles and functional areas
- **Bubble.io Integration**: One-directional employee data sync from Bubble.io

## Code Quality Tools

The project includes a comprehensive set of code quality tools to maintain consistent standards:

### ESLint Configuration

ESLint is configured with strict rules tailored for TypeScript and React development:

- **TypeScript**: Enforces type safety and best practices
- **React**: Ensures proper React and React Hooks usage
- **Prettier Integration**: Works alongside Prettier for consistent formatting

To run the linter:

```bash
npx eslint --ext .js,.jsx,.ts,.tsx .
```

To fix automatically fixable issues:

```bash
npx eslint --ext .js,.jsx,.ts,.tsx . --fix
```

### Prettier Configuration

Prettier is configured with project-specific formatting rules:

- Single quotes
- 2-space indentation
- 100 character print width
- ES5 trailing commas

To format all files:

```bash
npx prettier --write "**/*.{js,jsx,ts,tsx,json,md,css}"
```

To check for formatting issues without fixing:

```bash
npx prettier --check "**/*.{js,jsx,ts,tsx,json,md,css}"
```

### Git Hooks with Husky

The project uses Husky to enforce code quality checks before commits:

- **Pre-commit**: Runs lint-staged to check and fix code style issues
- **lint-staged**: Only processes files that are staged for commit

### Continuous Integration

GitHub Actions workflows are configured to automatically:

1. Run ESLint on all JavaScript/TypeScript files
2. Check TypeScript type correctness
3. Verify the build process works correctly
4. Run these checks on PRs to protected branches and direct pushes

See `.github/workflows/ci.yml` for the complete workflow configuration.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/blueearth_portal

# Authentication Security
JWT_SECRET=your_jwt_secret_key_here             # Required: Secret key for JWT signing (must be strong in production)
JWT_TOKEN_EXPIRY=24h                            # Optional: Token expiration time (default: 24h)
PASSWORD_SALT_ROUNDS=12                         # Optional: bcrypt salt rounds (default: 10, higher is more secure)

# Session Configuration
SESSION_SECRET=your_session_secret_key_here     # Required: Secret for session encryption

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key          # Required for password reset functionality
SENDGRID_FROM_EMAIL=no-reply@example.com        # Optional: Email sender address

# Bubble.io Integration
BUBBLE_API_KEY=your_bubble_api_key              # Required for employee data synchronization
BUBBLE_SYNC_INTERVAL=60                         # Optional: Minutes between sync operations (default: 60)
```

#### Security Recommendations

- In production, use secure randomly generated strings for `JWT_SECRET` and `SESSION_SECRET`
- For `PASSWORD_SALT_ROUNDS`, values between 10-14 offer good security/performance balance
- Use environment-specific settings (lower values in development, higher in production)
- Never expose secret keys in client-side code or public repositories

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Set up the database: `npm run db:push`
5. Start the development server: `npm run dev`

### Development Workflow

#### Running the Application

The project uses a unified development server that runs both the frontend and backend:

```bash
npm run dev
```

This starts:
- Express backend server
- Vite development server for React
- Automatic employee sync from Bubble.io (if configured)

#### Database Migrations

The project uses two complementary approaches to database migrations:

1. **Schema Changes (Drizzle Push)**:
   When updating the database schema in `shared/schema.ts`, apply changes with:

   ```bash
   npm run db:push
   ```

   This uses Drizzle ORM to automatically update the database schema.

2. **Programmatic Migrations**:
   For more complex schema changes that require data transformations or specific logic:

   - Create a new migration file in `server/migrations/` following the naming convention `YYYYMMDD_NNN_descriptiveName.ts`
   - Implement your migration with proper idempotency checks
   - Register the migration in `server/migrations/index.ts`
   - Migrations run automatically when the server starts

**Migration Best Practices:**

- Always include version information in migration files
- Use transactions for atomic updates
- Include robust idempotency checks
- Add comprehensive documentation within migration files

#### Code Organization

- Frontend components: `client/src/components/`
- Frontend pages: `client/src/pages/`
- API routes: `server/routes.ts`
- Database schema: `shared/schema.ts`
- Middleware: `server/middleware/`
- Utilities: `server/utils/`

## API Routing & Error Handling

### Request Lifecycle

1. **Request Logging**: All API requests are logged with contextual information and unique request IDs.
2. **Validation**: Requests are validated using Zod schemas before reaching route handlers.
3. **Authentication & Authorization**: Token verification and permission checks are applied.
4. **Route Handler**: Business logic processes the validated request.
5. **Response Formatting**: Standardized response structure ensures consistency.
6. **Error Handling**: Global error handler captures and formats exceptions.

### Validation System

Input validation uses a dual-layered approach:
- **Schema Definition**: Type-safe models using Zod in `shared/schema.ts`
- **Request Validation**: Middleware in `server/middleware/validation.ts` that:
  - Validates request bodies, query params, and URL params
  - Returns consistent 422 errors for validation failures
  - Adds parsed and typed data to the request object

### Error Handling

The application uses a centralized error handling strategy:
- **Global Error Handler**: Catches and formats all exceptions
- **Error Classification**: Different handling for Zod errors, API errors, and general errors
- **Custom ApiError Class**: For application-specific error types
- **Standardized Responses**: Consistent error object structure
- **Environment-Aware**: Different error details in development vs. production
- **Validation Testing**: Includes test script (`test-login.js`) for verifying validation and errors

### Logging

Structured logging with pino provides:
- **Log Levels**: Different verbosity based on environment
- **Request-Specific Context**: Request IDs and user context in all logs
- **JSON Format**: Machine-parsable logs for better monitoring
- **Sensitive Data Filtering**: Automatic redaction of passwords and tokens

## Database Configuration

### Connection Management

The application uses [Neon Serverless Postgres](https://neon.tech) with [Drizzle ORM](https://orm.drizzle.team/). Database connections are managed through a connection pool with environment-specific optimizations:

- Production: 20 max connections, 30s idle timeout
- Development: 10 max connections, 30s idle timeout

Connection health monitoring is implemented with automatic error logging and a health check function.

### Database Schema

The application uses Drizzle ORM with PostgreSQL. The schema includes:

- `users`: User accounts with authentication
- `user_permissions`: Granular permissions for users
- `employees`: Employee data (synced from Bubble.io)
- `sessions`: For maintaining user sessions

## Authentication & Security

### Authentication System

The application implements a comprehensive JWT-based authentication system with enhanced security features:

1. **Authentication Flow**:
   - User logs in with username/password
   - Server verifies credentials using bcrypt with configurable salt rounds
   - Server generates a JWT token with unique identifier (JTI) and enhanced claims
   - Client stores token and includes it in the Authorization header
   - Server validates token on each request with comprehensive checks

2. **Security Features**:
   - **Password Security**: bcrypt hashing with configurable rounds via `PASSWORD_SALT_ROUNDS` env variable
   - **Token Revocation**: Server-side token blacklisting for secure logout
   - **Token Validation**: Audience and issuer claims verification
   - **Expiration Control**: Configurable via `JWT_TOKEN_EXPIRY` env variable
   - **Environment-Specific Security**: Different settings for development/production

3. **Password Reset**:
   - Secure email-based password reset flow using SendGrid
   - Time-limited reset tokens with cryptographic security
   - Protection against email enumeration attacks

4. **Implementation Details**:
   - Server-side token validation and user context injection
   - Standardized API responses for auth errors with detailed context
   - Protection against common authentication vulnerabilities

### Web Security Protections

The application implements comprehensive security measures to protect against common web vulnerabilities:

1. **HTTP Security Headers**:
   - **Content-Security-Policy (CSP)**: Restricts content sources to prevent XSS attacks
   - **Strict-Transport-Security (HSTS)**: Enforces HTTPS connections
   - **X-Content-Type-Options**: Prevents MIME type sniffing
   - **X-Frame-Options**: Protects against clickjacking
   - **Referrer-Policy**: Controls information in the Referer header

2. **CORS Protection**:
   - Environment-specific origin restrictions
   - Secure methods and headers configuration
   - Preflight request handling

3. **Input Validation and Sanitization**:
   - Robust schema-based validation for all inputs
   - Parameter sanitization to prevent SQL injection
   - File upload validation for content type and size
   - XSS prevention through content sanitization

4. **Environment Security**:
   - Required environment variable validation at startup
   - Production-specific security configurations
   - Security settings via environment variables
   - Prevention of secret leakage in responses and logs

5. **Request Protection**:
   - Request size limits to prevent DoS attacks
   - Rate limiting for sensitive operations
   - Secure session management
   - Protection against parameter pollution

## Authorization & Permissions System

The application implements a dual-layer authorization system combining role-based and attribute-based access control:

### Role-Based Access Control (RBAC)

Users are assigned one of the following roles:
- **Superadmin**: Complete access to all system functions and data
- **Admin**: Administrative access with limitations on certain system functions
- **Manager**: Department-level access with management capabilities
- **User**: Basic access to view employee information with restrictions

Role-based middleware (`authorize()` and `isSuperAdmin()`) enforces these permissions at the API route level.

### Functional Area Permissions (ABAC)

For finer-grained control, the system implements attribute-based permissions across functional areas:
- **Finance**: Financial information and reports
- **HR**: Sensitive employee details and HR functions
- **IT**: System configurations and technical settings
- **Legal**: Legal documents and compliance information
- **Operations**: Operational data and process information

### Permission Actions

For each functional area, users can be granted any combination of:
- **View**: Permission to see data in the area
- **Edit**: Permission to modify data in the area
- **Delete**: Permission to remove data in the area

### Implementation

1. **Database Structure**:
   - `user_permissions` table stores area-specific permissions
   - Each permission record links a user to an area with specific actions

2. **Permission Checking**:
   - Server-side validation via `/api/check-permission/:area/:action` endpoint
   - Client-side caching for performance optimization 
   - Component-level access control with `<PermissionGuard>` component

3. **UI Adaptation**:
   - Interface elements conditionally render based on permissions
   - UI components adapt to show only accessible options
   - Error boundaries handle unauthorized access attempts

## External Integrations

The application integrates with external services for core functionality:

### Bubble.io Integration

Employee data is synchronized from the company's Bubble.io application with robust implementation:

- **Resilient Network Communication**:
  - Exponential backoff with jitter for reliable retries
  - Smart handling of rate limiting with Retry-After header support
  - Classification of errors into retryable vs. non-retryable categories
  - Request timeouts to prevent connection hanging

- **Synchronization Process**:
  - One-directional sync pulls data from Bubble.io to local database
  - Configurable sync interval via `BUBBLE_SYNC_INTERVAL` env variable
  - Differential updates to minimize database operations
  - Detailed logging with operation statistics

- **Implementation Details**:
  - Employee mapping with fallback fields for data consistency
  - Structured logging throughout the sync process
  - Comprehensive error handling with context preservation

### SendGrid Email Integration

Transactional emails are sent through SendGrid with particular focus on the password reset flow:

- **Email Implementation**:
  - Support for both HTML and plain text formats for client compatibility
  - Responsive email templates with mobile-friendly design
  - Dynamic content generation with proper sanitization
  - Configurable sender identity via environment variables

- **Error Handling**:
  - Detailed error classification with proper logging
  - Rate limit detection and handling
  - Graceful fallbacks when SendGrid is unavailable

- **Future Enhancements**:
  - SendGrid Dynamic Templates support (commented reference implementation)
  - Email queueing system for high-volume scenarios

## Performance & Scalability

### Database Optimization

The application uses Neon serverless PostgreSQL with performance optimizations:

1. **Connection Pooling**:
   - Configurable connection pool size based on environment
   - Automatic connection recycling with idle timeout settings
   - Connection health monitoring with automatic recovery

2. **Query Optimization**:
   - Efficient queries with proper indexing on critical fields
   - Selective column retrieval to minimize data transfer
   - Pagination implemented for data-intensive endpoints

3. **Cold Start Mitigation**:
   - Monitoring of cold start latency in production
   - Connection warming strategies for high-traffic scenarios
   - Query result caching for frequently accessed, rarely changing data

### Frontend Performance

Several strategies are implemented to optimize frontend performance:

1. **Bundle Optimization**:
   - Code splitting to reduce initial load size
   - Tree shaking to eliminate unused code
   - Lazy loading for resource-intensive components
   - Minification and compression for production builds

2. **Rendering Optimization**:
   - React Query for efficient data fetching and caching
   - Memoization of expensive calculations with useMemo
   - Component optimizations with React.memo where appropriate
   - Virtualization for long lists to reduce DOM size

3. **Asset Optimization**:
   - Image compression and format optimization (WebP)
   - Local storage for appropriate client-side caching
   - Proper use of Vite's asset handling mechanism
   - CDN integration options for production deployments

### Scaling Considerations

The application architecture supports scaling in several ways:

1. **Horizontal Scaling**:
   - Stateless backend design allows for multiple instances
   - Centralized session storage in database
   - No server-side in-memory state that would block scaling

2. **Caching Strategy**:
   - Strategic use of React Query for frontend caching
   - Redis integration options for high-volume deployments
   - Employee sync results caching to reduce external API calls

3. **Bottleneck Management**:
   - Monitoring for performance bottlenecks
   - Optimized database interactions with proper indexing
   - Rate limiting for external API integrations