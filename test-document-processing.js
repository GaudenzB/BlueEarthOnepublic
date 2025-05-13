/**
 * Test script to check document processing and OpenAI integration
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get auth token from command line args
const token = process.argv[2];
if (!token) {
  console.error('Please provide an auth token as first argument');
  console.error('Usage: node test-document-processing.js <auth_token>');
  process.exit(1);
}

const API_URL = 'http://localhost:3000';

async function testDocumentProcessing() {
  try {
    console.log('Testing Document Processing API...');
    console.log('OpenAI API Key configured:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
    
    // Fetch existing documents
    console.log('\n1. Fetching existing documents');
    const response = await fetch(`${API_URL}/api/documents`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Total documents: ${data.data?.length || 0}`);
    
    // Check if there are any pending documents
    const pendingDocuments = data.data?.filter(doc => 
      doc.processingStatus === 'PENDING' || doc.processingStatus === 'QUEUED'
    ) || [];
    
    console.log(`Pending documents: ${pendingDocuments.length}`);
    
    if (pendingDocuments.length > 0) {
      // Process a pending document
      const docToProcess = pendingDocuments[0];
      console.log(`\n2. Processing document: ${docToProcess.title} (ID: ${docToProcess.id})`);
      
      const processResponse = await fetch(`${API_URL}/api/documents/${docToProcess.id}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const processData = await processResponse.json();
      console.log(`Status: ${processResponse.status}`);
      console.log('Response:', JSON.stringify(processData, null, 2));
      
      // Wait for processing to complete
      console.log('\n3. Waiting for processing to complete (checking status every 5 seconds)...');
      let processingComplete = false;
      let attempts = 0;
      
      while (!processingComplete && attempts < 12) { // Max 1 minute (12 x 5 seconds)
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const statusResponse = await fetch(`${API_URL}/api/documents/${docToProcess.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const statusData = await statusResponse.json();
        const status = statusData.data?.processingStatus;
        
        console.log(`Check ${attempts}: Status = ${status}`);
        
        if (status === 'COMPLETED' || status === 'ERROR' || status === 'FAILED') {
          processingComplete = true;
          console.log('\nProcessing complete!');
          console.log('Final document state:', JSON.stringify(statusData.data, null, 2));
          
          // Check AI metadata if available
          if (statusData.data?.aiMetadata) {
            console.log('\nAI Analysis Results:');
            console.log('Summary:', statusData.data.aiMetadata.summary);
            console.log('Key Insights:', JSON.stringify(statusData.data.aiMetadata.keyInsights, null, 2));
            console.log('Confidence Score:', statusData.data.aiMetadata.confidence);
          }
        }
      }
      
      if (!processingComplete) {
        console.log('\nProcessing timed out. Document may still be processing.');
      }
    } else {
      console.log('\nNo pending documents found. Skipping processing test.');
    }
    
    // Test batch processing endpoint
    console.log('\n4. Testing batch document processing endpoint');
    const batchResponse = await fetch(`${API_URL}/api/documents/process-pending`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const batchData = await batchResponse.json();
    console.log(`Status: ${batchResponse.status}`);
    console.log('Response:', JSON.stringify(batchData, null, 2));
    
  } catch (error) {
    console.error('Error testing document processing:', error);
  }
}

// Run the test
testDocumentProcessing();