#!/bin/bash

# Script to format all code using Prettier

echo "💅 Formatting code with Prettier..."
npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}"
FORMAT_EXIT_CODE=$?

if [ $FORMAT_EXIT_CODE -ne 0 ]; then
  echo "❌ Formatting failed. See the errors above."
  exit 1
else
  echo "✅ Code formatted successfully!"
  exit 0
fi