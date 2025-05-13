#!/bin/bash

# Git Optimization Script
# This script helps reduce your git repository size by:
# 1. Cleaning up blobs that are no longer referenced
# 2. Optimizing how objects are stored
# 3. Pruning old, unreachable commits

echo "===== Git Repository Optimization ====="
echo "This script will reduce the size of your git repository"
echo "Current git repository size:"
du -sh .git/

echo -e "\n1. Running git gc (garbage collection)..."
git gc --aggressive --prune=now

echo -e "\n2. Removing unreferenced objects..."
git prune --expire now

echo -e "\n3. Running git repack..."
git repack -Ad

echo -e "\n4. Final cleanup..."
git gc --aggressive --prune=now

echo -e "\nOptimized git repository size:"
du -sh .git/

echo -e "\nGit repository optimization completed!"
echo -e "Note: For even more significant size reduction, consider using BFG Repo Cleaner or git-filter-repo tools."
echo -e "Those tools can remove large files from git history entirely."

# Best practices recommendations
echo -e "\n===== Best Practices for Keeping Git Repository Small ====="
echo "1. Don't commit large binary files to git"
echo "2. Use .gitignore to exclude build artifacts, dependencies, and logs"
echo "3. Consider using Git LFS for large files if needed"
echo "4. Regularly run 'git gc' to keep the repository optimized"
echo "5. Consider shallow clones for CI/CD pipelines"