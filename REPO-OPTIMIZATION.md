# Repository Optimization Guide

This guide explains how to keep this repository optimized and maintain a reasonable size.

## Production Best Practices

When deploying this application to production, follow these guidelines for better repository management:

### Upload Management

For document and file uploads in production:

1. **Use an Object Storage Service**:
   - AWS S3 or similar service for storing uploaded files
   - Update the file upload middlewares to use S3 client
   - This completely removes large files from the repository

2. **Configure Environment-Specific Storage**:
   - Development: Local file storage for easier debugging
   - Production: Object storage service (S3, etc.)
   - Testing: In-memory or temporary file systems

3. **Database Asset References**:
   - Store only file metadata and URLs in the database
   - Use presigned URLs for secure access to private files
   - Implement proper cleanup for orphaned files

## Current Optimization Scripts

The following scripts are available in the `scripts/` directory to help maintain the repository size:

### 1. `scripts/cleanup.js`
- Removes duplicate files across the repository
- Cleans up test files that aren't needed
- Optimizes storage by removing empty directories

Usage:
```bash
node scripts/cleanup.js
```

### 2. `scripts/clean-uploads.js`
- Focused script to clean only the uploads directory
- Removes duplicate files based on content hash
- Cleans up empty directories in the uploads folder

Usage:
```bash
node scripts/clean-uploads.js
```

### 3. `scripts/optimize-git.sh`
- Reduces git repository size using git's built-in optimization tools
- Runs garbage collection and prunes unreferenced objects
- Repacks git objects for better storage efficiency

Usage:
```bash
chmod +x scripts/optimize-git.sh
./scripts/optimize-git.sh
```

### 4. `scripts/optimize-images.js`
- Creates optimized copies of large images in the attached_assets directory
- Helps identify which images are taking up the most space
- Allows review of optimized images before replacing originals

Usage:
```bash
node scripts/optimize-images.js
```

## Best Practices for Repository Size Management

### 1. Follow the .gitignore rules
The `.gitignore` file has been updated to exclude:
- Uploaded files in the uploads directory
- Temporary files and caches
- Test files and debug logs

### 2. Avoid committing large binary files
- Don't commit PDFs, large images, or other binary files to git
- Store these files in a proper object storage system (like S3)
- For reference images needed in the repository, compress them first

### 3. Regular maintenance
- Run `scripts/cleanup.js` periodically to remove duplicates
- Run `scripts/optimize-git.sh` when the git repository size grows
- Consider a more thorough git history cleanup with tools like BFG Repo Cleaner for major size issues

### 4. Use proper upload handling
- Store uploaded files outside the git repository
- Use UUIDs for filenames to prevent collisions
- Implement proper cleanup mechanisms for temporary files

## Advanced Git Repository Cleanup

For more aggressive git repository size reduction, consider:

1. **BFG Repo Cleaner**: https://rtyley.github.io/bfg-repo-cleaner/
   - Efficiently removes large files from git history
   - Faster and simpler than git-filter-branch

2. **git-filter-repo**: https://github.com/newren/git-filter-repo
   - More powerful than BFG but with more complex usage
   - Can perform very specific history rewrites

Note: These tools rewrite git history, so coordination with all team members is essential before use.