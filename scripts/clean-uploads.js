/**
 * Upload Directory Cleanup Script
 * 
 * This script specifically cleans up the uploads directory:
 * 1. Removes duplicate files by comparing file hashes
 * 2. Creates a directory structure that's more efficient
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File hashes to track duplicates
const fileHashes = new Map();
const duplicates = [];
let bytesRemoved = 0;

// Calculate file hash
function calculateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Find and track duplicate files
function findDuplicates(directory) {
  console.log(`\nScanning directory: ${directory}`);
  
  // Check if directory exists
  if (!fs.existsSync(directory)) {
    console.log(`Directory does not exist: ${directory}`);
    return;
  }
  
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      findDuplicates(fullPath);
    } else {
      try {
        const stats = fs.statSync(fullPath);
        const hash = calculateHash(fullPath);
        
        if (fileHashes.has(hash)) {
          duplicates.push({
            path: fullPath,
            size: stats.size,
            originalPath: fileHashes.get(hash)
          });
        } else {
          fileHashes.set(hash, fullPath);
        }
      } catch (error) {
        console.log(`Error processing ${fullPath}:`, error.message);
      }
    }
  }
}

// Clean up duplicate files
function cleanupDuplicates() {
  console.log('\n===== Duplicate Files =====');
  if (duplicates.length === 0) {
    console.log('No duplicates found.');
    return;
  }
  
  console.log(`Found ${duplicates.length} duplicate files:`);
  duplicates.forEach(dupe => {
    console.log(`- ${dupe.path} (${Math.round(dupe.size / 1024)}KB) - duplicate of ${dupe.originalPath}`);
    try {
      fs.unlinkSync(dupe.path);
      bytesRemoved += dupe.size;
      console.log(`  ✓ Removed`);
    } catch (error) {
      console.log(`  ✗ Failed to remove: ${error.message}`);
    }
  });
}

// Clean empty directories recursively
function removeEmptyDirs(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }
  
  let files = fs.readdirSync(directory);
  
  if (files.length > 0) {
    files.forEach(file => {
      const fullPath = path.join(directory, file);
      if (fs.statSync(fullPath).isDirectory()) {
        removeEmptyDirs(fullPath);
      }
    });
    
    // Check again after possible removal of empty subdirectories
    files = fs.readdirSync(directory);
  }
  
  if (files.length === 0) {
    console.log(`Removing empty directory: ${directory}`);
    try {
      fs.rmdirSync(directory);
    } catch (error) {
      console.log(`Failed to remove directory: ${directory}`, error.message);
    }
  }
}

// Main function
async function main() {
  console.log('Starting uploads cleanup...');
  
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  
  // Skip if uploads directory doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    console.log('Uploads directory does not exist, nothing to clean.');
    return;
  }
  
  // Find duplicates
  findDuplicates(uploadsDir);
  
  // Clean up duplicates
  cleanupDuplicates();
  
  // Remove empty directories
  console.log('\n===== Empty Directories =====');
  removeEmptyDirs(uploadsDir);
  
  // Print summary
  console.log('\n===== Cleanup Summary =====');
  console.log(`Total bytes removed: ${bytesRemoved} (${Math.round(bytesRemoved / (1024 * 1024))}MB)`);
  console.log('Uploads cleanup completed.');
}

// Run the script
main().catch(error => {
  console.error('Error during cleanup:', error);
  process.exit(1);
});