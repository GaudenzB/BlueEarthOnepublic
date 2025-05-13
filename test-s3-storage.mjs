// Test script to check AWS S3 storage for documents
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We need to dynamically import the storage service
async function runTest() {
  try {
    // Import the storage service
    const storage = await import('./server/services/documentStorage.js');
    const { uploadFile, generateStorageKey } = storage;
    
    // Create a simple test file
    const testContent = 'This is a test file to verify AWS S3 storage in development.';
    const testBuffer = Buffer.from(testContent);
    
    // Generate a test storage key
    const testKey = generateStorageKey('test-tenant', 'TEST', 'test-document.txt');
    
    console.log('Attempting to upload test file to storage...');
    console.log(`Storage key: ${testKey}`);
    
    // Upload the file
    const result = await uploadFile(testBuffer, testKey, 'text/plain');
    
    console.log('Upload successful!');
    console.log('Result:', result);
    console.log('Storage type:', result.storageType);
    
    if (result.storageType === 's3') {
      console.log('✅ AWS S3 storage is working correctly in development environment!');
      console.log('Your test environment is now using the same storage system as production.');
    } else {
      console.log('⚠️ File was saved to local storage instead of AWS S3.');
      console.log('Check your AWS credentials and USE_AWS_IN_DEV setting.');
    }
  } catch (error) {
    console.error('❌ Error testing S3 storage:', error);
  }
}

// Run the test
runTest();