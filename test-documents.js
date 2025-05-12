/**
 * Test script to check document API functionality
 */
const fetch = require('node-fetch');

// Get auth token from command line args
const token = process.argv[2];
if (!token) {
  console.error('Please provide an auth token as first argument');
  console.error('Usage: node test-documents.js <auth_token>');
  process.exit(1);
}

const API_URL = 'http://localhost:3000';

async function testDocumentAPI() {
  try {
    console.log('Testing Document API...');
    
    // Test GET /api/documents
    console.log('\n1. GET /api/documents');
    const response = await fetch(`${API_URL}/api/documents`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log(`Total documents: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        console.log('\nDocument samples:');
        data.data.slice(0, 2).forEach((doc, index) => {
          console.log(`\nDocument ${index + 1}:`);
          console.log(`  ID: ${doc.id}`);
          console.log(`  Title: ${doc.title}`);
          console.log(`  Type: ${doc.documentType}`);
          console.log(`  Status: ${doc.processingStatus}`);
          console.log(`  Created: ${doc.createdAt}`);
        });
      } else {
        console.log('\nNo documents found');
      }
    }
    
    // Check for tenant info in user profile
    console.log('\n2. GET /api/auth/me (to check tenant info)');
    const profileResponse = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const profileData = await profileResponse.json();
    console.log(`Status: ${profileResponse.status}`);
    console.log('User profile:', JSON.stringify(profileData, null, 2));
    
    if (profileData.user) {
      console.log(`Tenant ID: ${profileData.user.tenantId || 'Not specified in user profile'}`);
    }
    
    // Check environment variables related to document storage
    console.log('\n3. Environment Variables Check');
    const envResponse = await fetch(`${API_URL}/api/system/env-check`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (envResponse.ok) {
      const envData = await envResponse.json();
      console.log('Environment variables status:', envData);
    } else {
      console.log('Cannot check environment variables (endpoint not available)');
      
      // If the system endpoint isn't available, check indirectly
      console.log('\nChecking system status indirectly...');
      const healthResponse = await fetch(`${API_URL}/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('Health check:', healthData);
      }
    }
    
  } catch (error) {
    console.error('Error testing document API:', error.message);
  }
}

// Run the test
testDocumentAPI();