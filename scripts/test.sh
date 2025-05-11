#!/bin/bash
# Run tests with Vitest

# Set environment to test
export NODE_ENV=test

# Configure other test-specific environment variables
export JWT_SECRET=test_jwt_secret
export SESSION_SECRET=test_session_secret

# Run tests
npx vitest run "$@"