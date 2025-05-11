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

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/blueearth_portal

# JWT
JWT_SECRET=your_jwt_secret_key_here

# SendGrid (for email functionality)
SENDGRID_API_KEY=your_sendgrid_api_key

# Bubble.io API (for employee sync)
BUBBLE_API_KEY=your_bubble_api_key
```

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

## Authentication

The system uses JWT-based authentication with:
- Login/logout functionality
- Password reset via email
- Role-based access control (RBAC)
- Permission-based access control (PBAC)

## Permissions System

Permissions are granted based on:
1. **User Role**: superadmin, admin, manager, or user
2. **Functional Area**: finance, HR, IT, legal, operations
3. **Action Type**: view, edit, delete