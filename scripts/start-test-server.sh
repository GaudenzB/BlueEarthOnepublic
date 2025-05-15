#!/bin/bash
# Start server in test mode

# Set environment variables for testing
export NODE_ENV=test

# Create a test database if needed
# This would typically use in-memory SQLite or a test-specific DB
# For now, we'll just use the existing database

# Start the server in test mode
echo "Starting server in test mode..."
NODE_ENV=test npm run build && NODE_ENV=test NODE_OPTIONS="--experimental-vm-modules" node dist/index.js