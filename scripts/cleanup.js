/**
 * Repository Cleanup Script
 * 
 * This script helps reduce repository size by:
 * 1. Removing duplicate files in the uploads directory
 * 2. Removing unnecessary test files
 * 3. Cleaning up temp files and caches
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

// Configuration
const PATHS_TO_CLEAN = [
  path.join(__dirname, '..', 'uploads'),
  path.join(__dirname, '..', '.cache')
];

const TEST_FILES_TO_KEEP = [
  'test-utils.js'
];

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
      // Skip node_modules and .git
      if (file.name !== 'node_modules' && file.name !== '.git') {
        findDuplicates(fullPath);
      }
    } else {
      // Skip small files to improve performance (files < 100KB)
      const stats = fs.statSync(fullPath);
      if (stats.size < 100 * 1024) continue;
      
      try {
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

// Clean test files
function cleanupTestFiles() {
  console.log('\n===== Test Files =====');
  const rootDir = path.join(__dirname, '..');
  const files = fs.readdirSync(rootDir);
  
  let testFilesRemoved = 0;
  let testFilesBytes = 0;
  
  for (const file of files) {
    if (file.startsWith('test-') && file.endsWith('.js') && !TEST_FILES_TO_KEEP.includes(file)) {
      const filePath = path.join(rootDir, file);
      try {
        const stats = fs.statSync(filePath);
        fs.unlinkSync(filePath);
        testFilesRemoved++;
        testFilesBytes += stats.size;
        console.log(`✓ Removed test file: ${file} (${Math.round(stats.size / 1024)}KB)`);
      } catch (error) {
        console.log(`✗ Failed to remove test file ${file}: ${error.message}`);
      }
    }
  }
  
  if (testFilesRemoved === 0) {
    console.log('No test files were removed.');
  } else {
    console.log(`Removed ${testFilesRemoved} test files (${Math.round(testFilesBytes / 1024)}KB)`);
    bytesRemoved += testFilesBytes;
  }
}

// Clean cache directories
function cleanupCache() {
  console.log('\n===== Cache Cleanup =====');
  const cacheDir = path.join(__dirname, '..', '.cache');
  
  if (fs.existsSync(cacheDir)) {
    try {
      let cacheSizeRemoved = 0;
      
      function getDirSize(directory) {
        let size = 0;
        const files = fs.readdirSync(directory, { withFileTypes: true });
        
        for (const file of files) {
          const fullPath = path.join(directory, file.name);
          if (file.isDirectory()) {
            size += getDirSize(fullPath);
          } else {
            const stats = fs.statSync(fullPath);
            size += stats.size;
          }
        }
        
        return size;
      }
      
      cacheSizeRemoved = getDirSize(cacheDir);
      
      // Use recursive removal
      fs.rmSync(cacheDir, { recursive: true, force: true });
      
      console.log(`✓ Removed .cache directory (${Math.round(cacheSizeRemoved / 1024)}KB)`);
      bytesRemoved += cacheSizeRemoved;
    } catch (error) {
      console.log(`✗ Failed to remove .cache directory: ${error.message}`);
    }
  } else {
    console.log('No .cache directory found');
  }
}

// Clean local state files
function cleanupLocalState() {
  console.log('\n===== Local State Cleanup =====');
  const localDir = path.join(__dirname, '..', '.local', 'state', 'replit', 'agent');
  
  if (fs.existsSync(localDir)) {
    try {
      let stateFilesRemoved = 0;
      let stateFilesBytes = 0;
      
      const files = fs.readdirSync(localDir);
      for (const file of files) {
        if (file.startsWith('.agent_state_')) {
          const filePath = path.join(localDir, file);
          const stats = fs.statSync(filePath);
          
          fs.unlinkSync(filePath);
          stateFilesRemoved++;
          stateFilesBytes += stats.size;
          console.log(`✓ Removed state file: ${file} (${Math.round(stats.size / 1024)}KB)`);
        }
      }
      
      if (stateFilesRemoved === 0) {
        console.log('No state files were removed.');
      } else {
        console.log(`Removed ${stateFilesRemoved} state files (${Math.round(stateFilesBytes / 1024)}KB)`);
        bytesRemoved += stateFilesBytes;
      }
    } catch (error) {
      console.log(`✗ Failed to clean local state: ${error.message}`);
    }
  } else {
    console.log('No local state directory found');
  }
}

// Main function
async function main() {
  console.log('Starting repository cleanup...');
  
  // Process each directory
  for (const dir of PATHS_TO_CLEAN) {
    if (fs.existsSync(dir)) {
      findDuplicates(dir);
    }
  }
  
  // Clean up duplicates
  cleanupDuplicates();
  
  // Clean up test files
  cleanupTestFiles();
  
  // Skip cache cleanup on Replit
  console.log('\n===== Cache Cleanup =====');
  console.log('Skipping cache cleanup on Replit to avoid removing protected files');
  
  // Clean up local state
  cleanupLocalState();
  
  // Print summary
  console.log('\n===== Cleanup Summary =====');
  console.log(`Total bytes removed: ${bytesRemoved} (${Math.round(bytesRemoved / (1024 * 1024))}MB)`);
  console.log('Cleanup completed.');
}

// Run the script
main().catch(error => {
  console.error('Error during cleanup:', error);
  process.exit(1);
});