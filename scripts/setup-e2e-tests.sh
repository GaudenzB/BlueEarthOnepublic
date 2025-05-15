#!/bin/bash

# BlueEarthOne E2E Test Setup Script
# Usage: ./setup-e2e-tests.sh [--no-reset] [--env test|dev]

# Default values
RESET_DB=true
TEST_ENV="test"
FIXTURES_DIR="./e2e/fixtures"
SEED_FILE="${FIXTURES_DIR}/test-users.json"
MOCK_DOCUMENT="${FIXTURES_DIR}/test-document.txt"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Process command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-reset)
      RESET_DB=false
      shift
      ;;
    --env)
      TEST_ENV="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [--no-reset] [--env test|dev]"
      echo
      echo "Options:"
      echo "  --no-reset    Skip database reset step"
      echo "  --env ENV     Test environment (test or dev). Default: test"
      echo "  --help        Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run '$0 --help' for usage information."
      exit 1
      ;;
  esac
done

# Validate test environment
if [[ "$TEST_ENV" != "test" && "$TEST_ENV" != "dev" ]]; then
  echo "Error: Invalid test environment. Must be one of: test, dev."
  exit 1
fi

# Create fixtures directory if it doesn't exist
mkdir -p "$FIXTURES_DIR"

# Setup database based on environment
if [[ "$TEST_ENV" == "test" ]]; then
  DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/test_db}"
else
  DB_URL="${DEV_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/dev_db}"
fi

echo "Setting up E2E tests with environment: $TEST_ENV"
echo "Using database URL: $DB_URL"

# Reset database if required
if [[ "$RESET_DB" == "true" ]]; then
  echo "Resetting database..."
  
  if ! command -v psql &> /dev/null; then
    echo "Error: psql command not found. Cannot reset database."
    exit 1
  fi
  
  # Drop and recreate schema
  psql "$DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  
  # Run migrations
  echo "Running database migrations..."
  
  if [ -d "./migrations" ]; then
    for migration_file in $(find ./migrations -name "*.sql" | sort); do
      echo "Applying migration: $migration_file"
      psql "$DB_URL" -f "$migration_file"
      
      if [ $? -ne 0 ]; then
        echo "Error: Failed to apply migration: $migration_file"
        exit 1
      fi
    done
  else
    echo "No migrations directory found. Using Drizzle migrations..."
    npx drizzle-kit push:pg --config=./drizzle.config.ts
  fi
  
  echo "Database reset and migrations completed."
fi

# Check if test users seed file exists
if [[ ! -f "$SEED_FILE" ]]; then
  echo "Creating test users seed file: $SEED_FILE"
  
  # Create basic user data for testing
  cat > "$SEED_FILE" << EOF
{
  "users": [
    {
      "username": "admin",
      "email": "admin@example.com",
      "password": "password123",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "department": "IT",
      "title": "System Administrator"
    },
    {
      "username": "manager",
      "email": "manager@example.com",
      "password": "password123",
      "firstName": "Manager",
      "lastName": "User",
      "role": "manager",
      "department": "Operations",
      "title": "Operations Manager"
    },
    {
      "username": "employee",
      "email": "employee@example.com",
      "password": "password123",
      "firstName": "Regular",
      "lastName": "User",
      "role": "employee",
      "department": "Marketing",
      "title": "Marketing Specialist"
    }
  ]
}
EOF
fi

# Create a test document if it doesn't exist
if [[ ! -f "$MOCK_DOCUMENT" ]]; then
  echo "Creating test document: $MOCK_DOCUMENT"
  
  cat > "$MOCK_DOCUMENT" << EOF
BlueEarthOne Test Document

This is a sample test document used for E2E testing of the document management system.

Contents:
1. Introduction
   - Purpose of the project
   - Key stakeholders

2. Project Scope
   - Key deliverables
   - Timeline
   - Budget constraints

3. Requirements
   - Functional requirements
   - Non-functional requirements
   - Technical constraints

4. Design Specifications
   - Architecture overview
   - Component design
   - Data model

5. Test Plan
   - Test strategy
   - Test cases
   - Acceptance criteria

This document was generated automatically for testing purposes.
EOF
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Set up test data using TypeScript setup script
echo "Setting up test data..."
npx tsx e2e/setup/setupTestData.ts

if [ $? -ne 0 ]; then
  echo "Error: Failed to run setupTestData.ts"
  exit 1
fi

# Create environment configuration file for E2E tests
ENV_CONFIG_FILE="./e2e/.env.test"
echo "Creating E2E test environment config: $ENV_CONFIG_FILE"

cat > "$ENV_CONFIG_FILE" << EOF
# E2E Test Environment Configuration
# Generated on: $(date)

TEST_BASE_URL=http://localhost:3000
AUTH_ADMIN_USER=admin
AUTH_ADMIN_PASSWORD=password123
AUTH_MANAGER_USER=manager
AUTH_MANAGER_PASSWORD=password123
AUTH_EMPLOYEE_USER=employee
AUTH_EMPLOYEE_PASSWORD=password123
TEST_TIMEOUT=30000
SCREENSHOT_PATH=./e2e/results/screenshots
TEST_FILE_PATH=$MOCK_DOCUMENT
EOF

# Ensure E2E test results directory exists
mkdir -p ./e2e/results
mkdir -p ./e2e/results/screenshots

echo "E2E test setup completed successfully!"
echo "You can now run E2E tests with: npm run test:e2e"
exit 0