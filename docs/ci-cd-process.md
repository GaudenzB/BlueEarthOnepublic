# BlueEarthOne CI/CD Process

This document outlines the CI/CD process for the BlueEarthOne platform, explaining how code changes move from development to production.

## Overview

Our CI/CD pipeline automates the software delivery process, ensuring that code changes pass through standardized testing and deployment stages before reaching production. The pipeline is designed with the following principles:

- **Quality First**: All code changes must pass linting, unit tests, and integration tests
- **Progressive Validation**: Tests increase in complexity and scope as changes progress toward production
- **Environmental Isolation**: Each environment (development, staging, production) is isolated with its own resources
- **Rollback Capability**: Deployments can be rolled back if issues are detected
- **Transparency**: The status of the pipeline is visible to all team members

## Pipeline Stages

### 1. Commit Validation

**Trigger**: Push to any branch or PR creation/update

**Steps**:
- Code linting (ESLint, TypeScript)
- Type checking
- Unit tests
- Coverage collection
- Static code analysis

**Requirements to Pass**:
- No linting errors
- No type errors
- All unit tests pass
- Test coverage must not decrease
- No critical code quality issues

### 2. Build & Integration Testing

**Trigger**: Successful commit validation on `main` branch or PR targeting `main`

**Steps**:
- Build application artifacts
- Create test database with migrations
- Execute integration tests
- API contract tests
- Basic security scanning

**Requirements to Pass**:
- Build succeeds
- All integration tests pass
- API contracts validated
- No critical security issues

### 3. Staging Deployment

**Trigger**: Successful integration testing on `main` branch

**Steps**:
- Create release tag
- Deploy to staging environment
- Run database migrations
- Execute post-deployment health checks
- Trigger E2E tests

**Requirements to Pass**:
- Successful deployment
- All health checks pass
- All E2E tests pass in staging

### 4. Production Deployment

**Trigger**: Manual approval after successful staging deployment

**Steps**:
- Create backup of production database
- Deploy to production environment
- Run database migrations
- Execute post-deployment health checks
- Verify critical business flows

**Requirements to Pass**:
- Successful deployment
- All health checks pass
- All critical business flows verified

## Environments

### Development

- **Purpose**: Development and testing
- **Database**: Separate development database
- **URL**: https://dev.blueearth.one
- **Special Considerations**: 
  - Mock third-party services where possible
  - Reduced data validation rules
  - Debug logs enabled

### Staging

- **Purpose**: Pre-production verification
- **Database**: Restored from production on a weekly basis
- **URL**: https://staging.blueearth.one
- **Special Considerations**:
  - Identical to production configuration
  - Test accounts for partners
  - Sandbox APIs for third-party services

### Production

- **Purpose**: Live application for real users
- **Database**: Production database with real data
- **URL**: https://blueearth.one
- **Special Considerations**:
  - Enhanced security rules
  - Full backup procedures
  - Real third-party service integrations

## Rollback Procedures

### Automated Rollbacks

The CI/CD system automatically rolls back deployments in these scenarios:

1. Health checks fail after deployment
2. Critical errors reported in monitoring system
3. Performance degradation beyond thresholds

### Manual Rollbacks

For issues not caught by automated checks, manual rollbacks can be initiated:

1. Log into the deployment console
2. Select the deployment to roll back
3. Click "Rollback" and confirm
4. Verify system returns to previous state

For database issues, use the database rollback script:

```bash
./scripts/rollback.sh production
```

## Monitoring and Alerts

The CI/CD pipeline is monitored and will send alerts in these scenarios:

- Pipeline stage failure
- Deployment failure
- Rollback initiated
- Manual approval pending for more than 24 hours

Alerts are sent via:
- Slack (#deployments channel)
- Email to devops and the code author
- SMS for critical production issues

## Adding New Tests and Checks

To enhance the CI/CD pipeline with new tests or checks:

1. Add test code to appropriate test directory
2. Update the GitHub Actions workflow files
3. Test changes in a feature branch
4. Get approval from DevOps team
5. Merge changes to `main`

## Health Check System

The health check system verifies application components after deployment:

- **Basic Health**: Simple API endpoint check
- **Detailed Health**: Verifies database, cache, and storage connections
- **Deep Health**: Validates critical business operations

Execute health checks manually:

```bash
./scripts/health-check.sh [basic|detailed|deep]
```

## API Testing Framework

The API testing framework validates API functionality:

- **Basic Tests**: Verify endpoint availability
- **Detailed Tests**: Validate request/response formats
- **End-to-End Tests**: Test complete workflows

Execute API tests manually:

```bash
./scripts/api-test.sh [basic|detailed|end-to-end]
```

## Best Practices

1. **Small, Frequent Deployments**: Prefer smaller, more frequent deployments over large changes
2. **Feature Flags**: Use feature flags for changes that need to be toggled on/off
3. **Blue/Green Deployments**: Critical changes should use blue/green deployment strategy
4. **Monitoring After Deploy**: Always monitor system after deployments
5. **Document Changes**: All significant changes should include updated documentation