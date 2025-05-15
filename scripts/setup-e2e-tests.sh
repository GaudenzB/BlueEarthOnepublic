#!/bin/bash
# Setup for E2E testing

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Set environment to test
export NODE_ENV=test
export DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/test_db"}

# Compile the setup script
echo "Compiling test setup scripts..."
npx tsc --skipLibCheck e2e/setup/setupTestData.ts --outDir e2e/setup/dist --esModuleInterop true

# Run the setup script
echo "Setting up test environment..."
node --experimental-modules e2e/setup/dist/setupTestData.js

# Verify setup was successful
if [ $? -eq 0 ]; then
  echo "Test environment setup complete!"
  exit 0
else
  echo "Test environment setup failed!"
  exit 1
fi