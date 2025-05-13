// Test script to check AWS S3 storage for documents
import 'dotenv/config';
import * as storage from './server/services/documentStorage';

async function testS3Upload() {
  try {
    // Display storage mode information
    console.log('\n--- TESTING AWS S3 STORAGE IN DEVELOPMENT ---\n');
    
    // Create a simple test file
    const testContent = 'This is a test file to verify AWS S3 storage in development.';
    const testBuffer = Buffer.from(testContent);
    
    // Generate a test storage key
    const testKey = storage.generateStorageKey('test-tenant', 'TEST', 'test-document.txt');
    
    console.log('Attempting to upload test file to storage...');
    console.log(`Storage key: ${testKey}`);
    
    // Upload the file
    const result = await storage.uploadFile(testBuffer, testKey, 'text/plain');
    
    console.log('\nUpload successful!');
    console.log('Storage type:', result.storageType);
    console.log('File checksum:', result.checksum);
    console.log('File size:', result.size, 'bytes');
    
    if (result.storageType === 's3') {
      console.log('\n✅ AWS S3 storage is working correctly in development environment!');
      console.log('✅ Your test environment is now using the same storage system as production.');
      console.log('✅ All files are stored in the S3 bucket:', process.env.S3_BUCKET_NAME || 'blueearthcapital');
    } else {
      console.log('\n⚠️ File was saved to local storage instead of AWS S3.');
      console.log('⚠️ Check your AWS credentials and USE_AWS_IN_DEV setting.');
    }
  } catch (error) {
    console.error('\n❌ Error testing S3 storage:', error);
  }
}

// Run the test
testS3Upload();