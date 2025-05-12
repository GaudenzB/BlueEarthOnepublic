#!/bin/bash

# Script to run ESLint with auto-fix

echo "🔍 Running ESLint with auto-fix..."
npx eslint --ext .js,.jsx,.ts,.tsx . --fix
LINT_EXIT_CODE=$?

if [ $LINT_EXIT_CODE -ne 0 ]; then
  echo "⚠️ ESLint fixed some issues but there are still errors that need manual fixing."
  exit 1
else
  echo "✅ ESLint check passed! All fixable issues have been resolved."
  exit 0
fi