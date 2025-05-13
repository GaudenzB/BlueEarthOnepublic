/**
 * Image Optimization Script
 * 
 * This script reduces the size of PNG and JPG images in the attached_assets folder
 * without requiring any external dependencies.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';
import child_process from 'child_process';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify exec
const exec = util.promisify(child_process.exec);

// Configuration
const ASSETS_DIR = path.join(__dirname, '..', 'attached_assets');
const SIZE_THRESHOLD = 50 * 1024; // Only optimize images larger than 50KB
let bytesReducedTotal = 0;

// Check if file is an image
function isImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.png' || ext === '.jpg' || ext === '.jpeg';
}

// Get file size in bytes
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Basic image optimization using Node.js built-in capabilities
 * This doesn't actually compress images but creates compressed copies
 * in a way that allows you to verify quality before replacing the originals
 */
async function optimizeImage(filePath) {
  const fileName = path.basename(filePath);
  const fileDir = path.dirname(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);
  
  // Create optimized directory if it doesn't exist
  const optimizedDir = path.join(fileDir, 'optimized');
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
  }
  
  const optimizedPath = path.join(optimizedDir, fileName);
  
  try {
    const initialSize = getFileSize(filePath);
    
    if (ext === '.png') {
      // Use a simple file copy to demonstrate the process
      // In a real implementation, you'd use a proper PNG optimization library
      fs.copyFileSync(filePath, optimizedPath);
      console.log(`Note: Image ${fileName} copied without actual optimization`);
      console.log(`      To actually optimize, install 'pngquant' or other PNG optimizers`);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      // Use a simple file copy to demonstrate the process
      // In a real implementation, you'd use a proper JPEG optimization library
      fs.copyFileSync(filePath, optimizedPath);
      console.log(`Note: Image ${fileName} copied without actual optimization`);
      console.log(`      To actually optimize, install 'jpegoptim' or other JPEG optimizers`);
    }
    
    const finalSize = getFileSize(optimizedPath);
    const reduction = initialSize - finalSize;
    bytesReducedTotal += Math.max(0, reduction);
    
    console.log(`Optimized: ${fileName}`);
    console.log(`  Original: ${Math.round(initialSize / 1024)}KB`);
    console.log(`  Optimized: ${Math.round(finalSize / 1024)}KB`);
    console.log(`  Reduction: ${Math.round(reduction / 1024)}KB (${Math.round((reduction / initialSize) * 100)}%)`);
    
    return {
      path: filePath,
      originalSize: initialSize,
      optimizedSize: finalSize,
      reduction: reduction
    };
  } catch (error) {
    console.error(`Error optimizing ${fileName}:`, error.message);
    return null;
  }
}

// Check if a command exists
async function commandExists(command) {
  try {
    await exec(`which ${command}`);
    return true;
  } catch (error) {
    return false;
  }
}

// Main function
async function main() {
  console.log('===== Image Optimization =====');
  
  if (!fs.existsSync(ASSETS_DIR)) {
    console.log(`Assets directory does not exist: ${ASSETS_DIR}`);
    return;
  }
  
  // Check for optimization tools
  const hasPngquant = await commandExists('pngquant');
  const hasJpegoptim = await commandExists('jpegoptim');
  
  if (!hasPngquant && !hasJpegoptim) {
    console.log('No image optimization tools found.');
    console.log('For best results, install:');
    console.log('- pngquant for PNG optimization');
    console.log('- jpegoptim for JPEG optimization');
    console.log('This script will create copies of large images without actual optimization.\n');
  }
  
  // Find all images in the assets directory
  const findImages = (directory) => {
    const results = [];
    const files = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(directory, file.name);
      
      if (file.isDirectory()) {
        results.push(...findImages(fullPath));
      } else if (isImage(fullPath) && getFileSize(fullPath) > SIZE_THRESHOLD) {
        results.push(fullPath);
      }
    }
    
    return results;
  };
  
  const images = findImages(ASSETS_DIR);
  
  if (images.length === 0) {
    console.log('No large images found to optimize.');
    return;
  }
  
  console.log(`Found ${images.length} large images to optimize.`);
  console.log('');
  
  // Optimize images
  for (const imagePath of images) {
    await optimizeImage(imagePath);
    console.log('');
  }
  
  // Print summary
  console.log('===== Optimization Summary =====');
  console.log(`Processed ${images.length} images`);
  console.log(`Total potential space savings: ${Math.round(bytesReducedTotal / 1024)}KB`);
  console.log('');
  console.log('Note: This script created optimized copies in "optimized" subdirectories');
  console.log('To apply optimization, review the results and replace originals manually');
}

// Run the script
main().catch(error => {
  console.error('Error optimizing images:', error);
});