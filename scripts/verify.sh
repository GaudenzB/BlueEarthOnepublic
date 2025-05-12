#!/bin/bash

# Script to run all code verification tasks
# This includes TypeScript checks and ESLint

echo "🔍 Running TypeScript type checks..."
npx tsc --noEmit
TS_EXIT_CODE=$?

if [ $TS_EXIT_CODE -ne 0 ]; then
  echo "❌ TypeScript check failed. Please fix the errors above."
else
  echo "✅ TypeScript check passed!"
fi

echo ""
echo "🔍 Running ESLint..."
npx eslint --ext .js,.jsx,.ts,.tsx .
LINT_EXIT_CODE=$?

if [ $LINT_EXIT_CODE -ne 0 ]; then
  echo "❌ ESLint check failed. Please fix the errors above."
else
  echo "✅ ESLint check passed!"
fi

echo ""
if [ $TS_EXIT_CODE -eq 0 ] && [ $LINT_EXIT_CODE -eq 0 ]; then
  echo "✅ All checks passed! Your code looks good."
  exit 0
else
  echo "❌ Some checks failed. Please fix the issues before committing."
  exit 1
fi