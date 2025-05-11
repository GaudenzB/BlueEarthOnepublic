# Deployment Guide for BlueEarth Capital Portal

This document provides instructions for deploying the BlueEarth Capital Portal on Replit.

## Prerequisites

Before deploying, ensure you have:

1. A Replit account with access to the repository
2. Required secrets/API keys for external services
3. Access to a PostgreSQL database (e.g., Neon)

## Environment Configuration

The application requires the following environment variables to be set in the Replit Secrets tab:

### Database Configuration

- `DATABASE_URL`: PostgreSQL connection string in the format `postgresql://username:password@hostname:port/database`
- `PGUSER`: PostgreSQL username
- `PGPASSWORD`: PostgreSQL password
- `PGDATABASE`: PostgreSQL database name
- `PGHOST`: PostgreSQL host
- `PGPORT`: PostgreSQL port

### Authentication Configuration

- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_TOKEN_EXPIRY`: Token expiration time (e.g., "24h")
- `PASSWORD_SALT_ROUNDS`: bcrypt salt rounds (numeric, e.g., 12)
- `SESSION_SECRET`: Secret for session encryption

### Email Configuration (SendGrid)

- `SENDGRID_API_KEY`: API key for SendGrid email service
- `SENDGRID_FROM_EMAIL`: Email address to send from

### External Integrations

- `BUBBLE_API_KEY`: API key for Bubble.io integration
- `BUBBLE_SYNC_INTERVAL`: Interval in minutes for employee data sync (numeric)

### Server Configuration

- `PORT`: Port number for the server (default: 3000)
- `NODE_ENV`: Environment name (e.g., "production", "development")

## Deployment Steps

1. **Fork the Repository**
   - Fork the repository to your Replit account

2. **Set Environment Variables**
   - Navigate to the Secrets tab in your Replit project
   - Add all required environment variables listed above

3. **Deploy the Application**
   - Replit will automatically build and deploy the application
   - The build process will:
     - Install all dependencies
     - Build the client-side assets
     - Compile the server-side TypeScript
   - The deployment will run using the `npm run start` command

4. **Verify Deployment**
   - Access your application at the Replit domain (e.g., `https://your-repl-name.your-username.repl.co`)
   - Check that all functionality works as expected
   - Verify that API endpoints are accessible

## Troubleshooting

If you encounter issues during deployment:

1. **Database Connectivity Issues**
   - Verify the DATABASE_URL is correct
   - Check that the database is accessible from Replit
   - Ensure the database schema is up to date

2. **Authentication Issues**
   - Check that JWT_SECRET and SESSION_SECRET are set
   - Verify that JWT tokens are being generated correctly

3. **API Integration Issues**
   - Verify that all API keys are correct
   - Check the logs for any API-specific errors

## Monitoring and Maintenance

Once deployed, you can monitor the application:

1. **Logs**
   - View the logs in the Replit console
   - Check for any errors or warnings

2. **Database Management**
   - Use the Replit Database tab to manage the database
   - Run migrations when needed using `npm run db:push`

3. **Updates and Patches**
   - Pull latest changes from the main repository
   - Redeploy the application after updates

## Scaling Considerations

For larger deployments, consider:

1. **Database Scaling**
   - Neon offers serverless PostgreSQL with auto-scaling
   - Monitor database performance and adjust resources as needed

2. **Caching**
   - Implement Redis for caching if needed
   - Use CDN for static assets

3. **Rate Limiting**
   - Implement rate limiting for API endpoints
   - Protect against DoS attacks