/**
 * Quick test script for the contract upload and analysis flow
 * This tests the upload endpoint and checks if it correctly initiates AI analysis
 */
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testContractUpload() {
  try {
    // Path to a sample PDF to upload (this is just for testing)
    // You can replace this with any PDF file path
    const testFilePath = './test-doc-sample.txt';
    
    if (!fs.existsSync(testFilePath)) {
      // Create a simple test file if it doesn't exist
      fs.writeFileSync(testFilePath, 'Sample Contract Agreement with Acme Inc.\n\nThis agreement is made on May 15, 2025.');
      console.log(`Created test file at ${testFilePath}`);
    }
    
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('title', 'Contract with Acme Inc - Test Upload');
    form.append('description', 'This is a test contract document upload');
    form.append('metadata', JSON.stringify({
      testUpload: true,
      timestamp: new Date().toISOString()
    }));
    form.append('tenantId', '00000000-0000-0000-0000-000000000001'); // Default tenant
    
    // First upload the document
    console.log('Uploading test document...');
    // Use the current hostname to work on Replit
    const hostUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` 
      : 'http://localhost:3000';
    console.log(`Using API URL: ${hostUrl}/api/contracts/upload/analyze`);
    
    const uploadResponse = await fetch(`${hostUrl}/api/contracts/upload/analyze`, {
      method: 'POST',
      body: form,
    });
    
    if (!uploadResponse.ok) {
      let errorText;
      try {
        // Try to get JSON error message
        const errorData = await uploadResponse.json();
        errorText = JSON.stringify(errorData, null, 2);
      } catch (e) {
        // Fallback to text
        errorText = await uploadResponse.text();
      }
      
      throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('Upload successful:', uploadResult);
    
    // The response should include an analysis ID that we can use to check status
    if (!uploadResult.analysisId) {
      throw new Error('Analysis ID not returned in upload response');
    }
    
    // Poll analysis status
    console.log('Checking analysis status...');
    let analysisComplete = false;
    let attempts = 0;
    
    while (!analysisComplete && attempts < 5) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`${hostUrl}/api/contracts/analysis/${uploadResult.analysisId}`);
      
      if (!statusResponse.ok) {
        let errorText;
        try {
          const errorData = await statusResponse.json();
          errorText = JSON.stringify(errorData, null, 2);
        } catch (e) {
          errorText = await statusResponse.text();
        }
        
        throw new Error(`Status check failed with status ${statusResponse.status}: ${errorText}`);
      }
      
      const statusResult = await statusResponse.json();
      console.log(`Analysis status (attempt ${attempts + 1}):`, statusResult.status);
      
      if (statusResult.status === 'COMPLETED' || statusResult.status === 'FAILED') {
        analysisComplete = true;
        console.log('Final analysis result:', statusResult);
      }
      
      attempts++;
    }
    
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testContractUpload();