#!/bin/bash

# Migration runner script
# This script runs the migrations using the TypeScript migration script

echo "Running database migrations..."
npx tsx scripts/migrate.ts

# Check if migration was successful
if [ $? -eq 0 ]; then
  echo "Migrations completed successfully!"
else
  echo "Migration failed with error code $?. Check the logs for details."
  exit 1
fi