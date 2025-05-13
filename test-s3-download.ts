// Test script to check AWS S3 storage download functionality
import 'dotenv/config';
import * as storage from './server/services/documentStorage';

async function testS3Download() {
  try {
    console.log('\n--- TESTING AWS S3 DOWNLOAD IN DEVELOPMENT ---\n');
    
    // Use the storage key from the last upload test
    // This is an example - you might need to replace with the actual key from your last test
    const testKey = 'tenants/test-tenant/TEST/2025-05-13/00ccdf80-5724-4b40-9d00-b1d8dbc11d61/test-document.txt';
    
    console.log('Attempting to download file from storage...');
    console.log(`Storage key: ${testKey}`);
    
    // Download the file
    const fileBuffer = await storage.downloadFile(testKey);
    
    console.log('\nDownload successful!');
    console.log('File content:', fileBuffer.toString('utf8'));
    console.log('File size:', fileBuffer.length, 'bytes');
    
    // Get a download URL
    const downloadUrl = await storage.getDownloadUrl(testKey, 3600);
    console.log('\nGenerated pre-signed download URL (valid for 1 hour):');
    console.log(downloadUrl);
    
    console.log('\n✅ AWS S3 download functionality is working correctly!');
    console.log('✅ The complete S3 storage solution is operational in development environment.');
  } catch (error) {
    console.error('\n❌ Error testing S3 download:', error);
  }
}

// Run the test
testS3Download();