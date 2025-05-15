# CI/CD Process Documentation

This document outlines the continuous integration and continuous deployment (CI/CD) pipeline implemented for the BlueEarthOne application.

## Overview

The CI/CD pipeline automates the building, testing, and deployment of the application to ensure consistent, reliable releases. The pipeline consists of several stages:

1. Code Validation (Linting and Type Checking)
2. Unit Testing
3. End-to-End Testing
4. Build and Package
5. Deployment to Staging
6. (Optional) Deployment to Production
7. (Optional) Rollback Mechanism

## Workflows

### Main CI/CD Workflow

The main workflow is defined in `.github/workflows/ci-cd.yml` and is triggered:
- Automatically on push to main/master branches
- Automatically on pull requests to main/master branches
- Manually via workflow_dispatch

### Jobs

#### 1. Lint and Type Check

This job ensures code quality by running:
- ESLint to enforce coding standards
- TypeScript type checking to catch type-related errors

#### 2. Unit Tests

This job runs all unit tests with:
- A dedicated test database
- Test coverage reports

#### 3. End-to-End Tests

This job runs comprehensive end-to-end tests using Playwright:
- Starts a test server
- Runs browser-based automated tests
- Captures test results and screenshots

#### 4. Build

This job builds the application for deployment:
- Creates a versioned deployment package
- Includes all necessary files and assets
- Creates a version information file

#### 5. Deploy to Staging

This job deploys the application to the staging environment:
- Handles the deployment process
- Runs health checks to verify deployment
- Records deployment information for potential rollback

#### 6. Deploy to Production

This job deploys the application to the production environment:
- Only runs when manually triggered for production deployment
- Follows the same process as staging deployment
- Includes additional verification steps

#### 7. Rollback

This job handles rollbacks to previous versions:
- Can be manually triggered
- Reverts to a specified previous version
- Includes health checks to verify successful rollback

## Environment Configuration

The pipeline uses environment-specific configuration:

- **Staging**: Used for testing before production
- **Production**: The live environment

## Health Checks

Health checks are critical to the deployment process:

- Performed after each deployment or rollback
- Check various system components and endpoints
- Automatic retry with configurable threshold
- Can trigger automatic rollback if checks fail

## Rollback Process

The rollback process allows reverting to a previous working version:

1. Manually trigger the rollback workflow
2. Specify the environment and version to roll back to
3. The system retrieves the backup for that version
4. The rollback is performed with a backup of the current version
5. Health checks verify the rollback was successful

## Scripts

Several scripts support the CI/CD process:

- **run-e2e-tests.sh**: Executes end-to-end tests
- **start-test-server.sh**: Starts a server in test mode
- **health-check.sh**: Performs health checks on deployed application
- **rollback.sh**: Handles the rollback process

## Best Practices

- **Version Control**: Always work in feature branches and create pull requests
- **Testing**: Add tests for new features and ensure existing tests pass
- **Deployment**: Use the manual workflow trigger for production deployments
- **Monitoring**: Monitor health checks and application logs after deployment
- **Rollback**: Be prepared to rollback if issues arise after deployment

## Troubleshooting

If you encounter issues with the CI/CD pipeline:

1. Check the GitHub Actions logs for the specific job that failed
2. Verify environment variables and secrets are properly configured
3. Run tests locally to reproduce any issues
4. Check for connectivity issues to external services
5. Review the deployment and rollback scripts for environment-specific issues