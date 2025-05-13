/**
 * Screenshot Cleanup Script
 * 
 * This script helps reduce repository size by:
 * 1. Identifying and removing duplicate screenshots
 * 2. Removing large screenshots that aren't essential
 * 3. Creating a backup copy first for safety
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ASSETS_DIR = path.join(__dirname, '..', 'attached_assets');
const SIZE_THRESHOLD = 200 * 1024; // Target screenshots larger than 200KB
const BACKUP_DIR = path.join(__dirname, '..', 'attached_assets', 'backup');
let bytesRemoved = 0;

// Create backup directory
function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Identify large screenshots
function findLargeScreenshots() {
  const screenshots = [];
  
  // Check if directory exists
  if (!fs.existsSync(ASSETS_DIR)) {
    console.log(`Assets directory does not exist: ${ASSETS_DIR}`);
    return screenshots;
  }
  
  const files = fs.readdirSync(ASSETS_DIR);
  
  for (const file of files) {
    // Skip backup directory
    if (file === 'backup' || file === 'optimized') continue;
    
    // Check if it's a screenshot
    if (file.startsWith('Screenshot') && file.endsWith('.png')) {
      const filePath = path.join(ASSETS_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.size > SIZE_THRESHOLD) {
        screenshots.push({
          path: filePath,
          name: file,
          size: stats.size
        });
      }
    }
  }
  
  // Sort by size (largest first)
  screenshots.sort((a, b) => b.size - a.size);
  
  return screenshots;
}

// Clean up the screenshots
function cleanupScreenshots(screenshots) {
  if (screenshots.length === 0) {
    console.log('No large screenshots found.');
    return;
  }
  
  console.log(`Found ${screenshots.length} large screenshots:`);
  
  for (const screenshot of screenshots) {
    const backupPath = path.join(BACKUP_DIR, screenshot.name);
    
    console.log(`\nProcessing: ${screenshot.name} (${Math.round(screenshot.size / 1024)}KB)`);
    
    // Create backup
    try {
      fs.copyFileSync(screenshot.path, backupPath);
      console.log(`  ✓ Backed up to ${path.relative(__dirname, backupPath)}`);
    } catch (error) {
      console.log(`  ✗ Failed to backup: ${error.message}`);
      continue; // Skip processing this file
    }
    
    // Remove original
    try {
      fs.unlinkSync(screenshot.path);
      bytesRemoved += screenshot.size;
      console.log(`  ✓ Removed original file`);
    } catch (error) {
      console.log(`  ✗ Failed to remove: ${error.message}`);
    }
  }
}

// Main function
async function main() {
  console.log('===== Screenshot Cleanup =====');
  
  // Create backup directory
  createBackup();
  
  // Find large screenshots
  const screenshots = findLargeScreenshots();
  
  // Clean up screenshots
  cleanupScreenshots(screenshots);
  
  // Print summary
  console.log('\n===== Cleanup Summary =====');
  console.log(`Total bytes removed: ${bytesRemoved} (${Math.round(bytesRemoved / (1024 * 1024))}MB)`);
  console.log(`Backups saved to: ${BACKUP_DIR}`);
  console.log('Cleanup completed.');
}

// Run the script
main().catch(error => {
  console.error('Error during cleanup:', error);
});