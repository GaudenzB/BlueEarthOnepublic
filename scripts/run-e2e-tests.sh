#!/bin/bash
# Run end-to-end tests with Playwright

# Set environment to test
export NODE_ENV=test
export E2E_BASE_URL=${E2E_BASE_URL:-"http://localhost:5000"}

# Install Playwright browsers if they're not installed
if [ ! -d "node_modules/.cache/ms-playwright" ]; then
  echo "Installing Playwright browsers..."
  npx playwright install --with-deps chromium
fi

# Run the tests
echo "Running E2E tests against $E2E_BASE_URL"
npx playwright test "$@"

# Return the exit code from Playwright
exit $?