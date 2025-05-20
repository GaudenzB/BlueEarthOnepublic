#!/bin/bash

# Create temporary directory for error outputs
mkdir -p ./.ts-error-reports

# Find all TypeScript files
echo "Finding TypeScript files..."
TS_FILES=$(find ./client ./server ./core -type f -name "*.ts" -o -name "*.tsx" | grep -v "node_modules" | grep -v ".d.ts")

# Process errors in smaller batches to prevent timeout
echo "Checking files for TypeScript errors..."
echo $TS_FILES | tr ' ' '\n' > ./.ts-error-reports/all-files.txt

# Split the files list into batches of 10
split -l 10 ./.ts-error-reports/all-files.txt ./.ts-error-reports/batch-

# Process each batch
for batch in ./.ts-error-reports/batch-*; do
  echo "Processing batch: $batch"
  npx tsc --noEmit --pretty false $(cat $batch) 2> $batch.errors.txt
  sleep 1
done

# Aggregate all errors
cat ./.ts-error-reports/batch-*.errors.txt > ./.ts-error-reports/all-errors.txt

# Create a summary of error types
echo "Creating error summary..."
grep -E 'error TS[0-9]+:' ./.ts-error-reports/all-errors.txt | sort | uniq -c | sort -nr > ./.ts-error-reports/error-types.txt

# Create a summary of files with errors
echo "Creating file summary..."
grep -o -E '^[^(]+\(' ./.ts-error-reports/all-errors.txt | sort | uniq -c | sort -nr > ./.ts-error-reports/files-with-errors.txt

echo "TypeScript error analysis complete. Results in ./.ts-error-reports/"
echo "Common error types: "
head -n 10 ./.ts-error-reports/error-types.txt
