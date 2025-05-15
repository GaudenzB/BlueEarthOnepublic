# CI/CD Process Documentation

## Overview
This document outlines the Continuous Integration and Continuous Deployment (CI/CD) process for the BlueEarthOne platform. The CI/CD pipeline automates building, testing, and deploying the application, ensuring consistent and reliable deployments while minimizing downtime.

## Pipeline Architecture

The CI/CD pipeline consists of the following stages:

1. **Build & Test**: Compiles the application and runs automated tests
2. **Deployment**: Deploys the application to the target environment (staging or production)
3. **Health Checks**: Verifies that the deployment was successful
4. **Rollback**: Automatically reverts to the previous version if deployment fails

```
┌────────────┐     ┌────────────┐     ┌──────────────┐     ┌─────────────┐
│ Build &    │────►│ Deployment │────►│ Health Check │────►│ Notification │
│ Test       │     │            │     │              │     │             │
└────────────┘     └─────┬──────┘     └───────┬──────┘     └─────────────┘
                         │                     │
                         │                     │ (failure)
                         │                     ▼
                         │             ┌──────────────┐
                         └─────────────► Rollback     │
                                       └──────────────┘
```

## Environments

The pipeline supports two deployment environments:

1. **Staging**: Used for testing new features and changes before they go to production
   - URL: https://staging.blueearth.example.com
   - Automatically deployed when changes are pushed to the main branch

2. **Production**: The live environment used by customers
   - URL: https://blueearth.example.com
   - Deployed manually via workflow dispatch

## GitHub Actions Workflow

The CI/CD pipeline is implemented using GitHub Actions and defined in `.github/workflows/ci-cd.yml`. The workflow is triggered in the following scenarios:

- **Push to main branch**: Automatically deploys to staging
- **Pull request to main branch**: Runs build and tests only (no deployment)
- **Manual trigger**: Deploys to staging or production based on user selection

## Build and Test Process

The build and test process includes:

1. **Dependency Installation**: Install NPM dependencies
2. **Linting**: Check code style
3. **Type Checking**: Verify TypeScript types
4. **Unit Tests**: Run Jest unit tests
5. **E2E Tests**: Run Playwright end-to-end tests
6. **Build**: Compile the application

A PostgreSQL database is provisioned as part of the test environment to enable database tests.

## Deployment Process

The deployment process includes:

1. **Environment Setup**: Configure AWS credentials and SSH access
2. **Artifact Packaging**: Create a deployment package
3. **Deployment**: Transfer and extract the package on the target server
4. **Service Restart**: Restart the application services
5. **Health Check**: Verify the application is running correctly
6. **Rollback**: Automatically revert to the previous version if health checks fail

## Rollback Strategy

The rollback strategy ensures that if a deployment fails, the system automatically reverts to the previous working version:

1. **Backup Creation**: Before each deployment, a backup of the current version is created
2. **Health Verification**: After deployment, health checks verify the application is functioning
3. **Automated Rollback**: If health checks fail, the rollback script automatically restores the previous version
4. **Database Rollback**: For production deployments, database backups are created and can be restored if needed

## Required Secrets

The following secrets must be configured in the GitHub repository settings:

### Common Secrets
- `AWS_ACCESS_KEY_ID`: AWS access key for S3 access
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3 access
- `AWS_REGION`: AWS region for S3 buckets
- `SSH_PRIVATE_KEY`: SSH key for deployment server access
- `SSH_USER`: SSH username for server access

### Staging Environment Secrets
- `STAGING_SERVER_IP`: IP address of the staging server
- `STAGING_DOMAIN`: Domain name for the staging environment

### Production Environment Secrets
- `PRODUCTION_SERVER_IP`: IP address of the production server
- `PRODUCTION_DOMAIN`: Domain name for the production environment
- `SLACK_WEBHOOK_URL`: Webhook URL for deployment notifications

## Health Checks

Health checks verify that the application is functioning correctly after deployment. The checks include:

1. **Basic Health Check**: Verifies the server is running
2. **Database Health Check**: Verifies database connectivity
3. **Storage Health Check**: Verifies S3 storage configuration

Health checks are implemented as API endpoints:
- `/api/health`: Basic health check
- `/api/health/detailed`: Detailed health check with database connection
- `/api/health/deep`: Comprehensive health check of all system components

## Deployment Verification Tools

The following scripts are available for manual deployment verification:

- `scripts/health-check.sh`: Checks the health of a deployed instance
- `scripts/api-test.sh`: Tests critical API endpoints
- `scripts/rollback.sh`: Manually triggers a rollback if needed

## Notification System

Deployment status notifications are sent via Slack:

- **Successful Deployments**: Notification with deployment details
- **Failed Deployments**: Alert with failure information and rollback status

## Disaster Recovery

In case of catastrophic failure where automated rollback is insufficient:

1. Use the manual rollback script: `scripts/rollback.sh`
2. Restore the database from the latest backup
3. Verify the system health using `scripts/health-check.sh`
4. If issues persist, contact the development team

## Maintenance Windows

Recommended maintenance windows for deployments:

- **Staging**: Any time
- **Production**: Tuesday-Thursday, 1:00 AM - 3:00 AM ET

## Troubleshooting

Common deployment issues and solutions:

1. **Health Check Failures**:
   - Check application logs: `/var/log/blueearth/application.log`
   - Verify database connectivity
   - Check environment variables

2. **Rollback Failures**:
   - Check rollback logs: `/var/log/deployment/rollback.log`
   - Manually restore from backup if needed

3. **Database Migration Issues**:
   - Review migration logs
   - Restore database from backup if needed

## Contacts

For assistance with deployment issues, contact:

- DevOps Team: devops@blueearth.example.com
- On-call Engineer: +1 (555) 123-4567