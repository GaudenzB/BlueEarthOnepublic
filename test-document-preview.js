/**
 * Test script for document preview functionality
 * 
 * This script verifies the document preview token generation and access
 */

import fetch from 'node-fetch';

// Use the Replit webview URL for our API requests
const API_BASE_URL = 'https://workspace.gaudenzbiveroni.repl.co';

async function testDocumentPreview() {
  try {
    console.log('🧪 Testing document preview functionality...');
    
    // Step 1: Login to get auth token
    console.log('\n📝 Step 1: Logging in to get auth token');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.message || 'Unknown error'}`);
    }
    
    const authToken = loginData.token;
    console.log('✅ Successfully logged in and got auth token');
    
    // Step 2: Get a document to test with
    console.log('\n📝 Step 2: Fetching documents to find one for testing');
    const documentsResponse = await fetch(`${API_BASE_URL}/api/documents`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const documentsData = await documentsResponse.json();
    if (!documentsResponse.ok || !documentsData.success) {
      throw new Error(`Failed to fetch documents: ${documentsData.message || 'Unknown error'}`);
    }
    
    if (!documentsData.data || documentsData.data.length === 0) {
      throw new Error('No documents found for testing');
    }
    
    // Find a document that has been processed
    const testDocument = documentsData.data.find(doc => 
      doc.processingStatus === 'COMPLETED' || doc.processingStatus === 'ERROR'
    ) || documentsData.data[0];
    
    console.log(`✅ Found document for testing: ${testDocument.title} (ID: ${testDocument.id})`);
    
    // Step 3: Get document details with preview token
    console.log('\n📝 Step 3: Fetching document details to get preview token');
    const documentDetailResponse = await fetch(`${API_BASE_URL}/api/documents/${testDocument.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const documentDetailData = await documentDetailResponse.json();
    if (!documentDetailResponse.ok || !documentDetailData.success) {
      throw new Error(`Failed to fetch document details: ${documentDetailData.message || 'Unknown error'}`);
    }
    
    const previewToken = documentDetailData.data.previewToken;
    if (!previewToken) {
      throw new Error('No preview token found in document details');
    }
    
    console.log(`✅ Successfully got preview token: ${previewToken.substring(0, 15)}...`);
    
    // Step 4: Test document preview access with the token
    console.log('\n📝 Step 4: Testing document preview access with preview token');
    const previewUrl = `${API_BASE_URL}/api/documents/${testDocument.id}/preview?token=${encodeURIComponent(previewToken)}`;
    console.log(`   Preview URL: ${previewUrl.substring(0, 60)}...`);
    
    const previewResponse = await fetch(previewUrl);
    
    // Preview should return HTML content
    const previewContent = await previewResponse.text();
    const isHtml = previewContent.trim().toLowerCase().startsWith('<!doctype html') || 
                  previewContent.trim().toLowerCase().startsWith('<html');
    
    if (!previewResponse.ok) {
      throw new Error(`Failed to access preview: ${previewResponse.status} ${previewResponse.statusText}`);
    }
    
    if (!isHtml) {
      console.warn('⚠️ Warning: Preview response doesn\'t appear to be HTML');
      console.log('Preview content (first 100 chars):', previewContent.substring(0, 100));
    } else {
      console.log('✅ Successfully accessed document preview with token');
      console.log(`   Preview content length: ${previewContent.length} characters`);
    }
    
    // Step 5: Test preview without token (should fail)
    console.log('\n📝 Step 5: Testing preview access WITHOUT token (should fail)');
    const noTokenPreviewUrl = `${API_BASE_URL}/api/documents/${testDocument.id}/preview`;
    const noTokenResponse = await fetch(noTokenPreviewUrl);
    const noTokenContent = await noTokenResponse.text();
    
    if (noTokenResponse.ok && noTokenResponse.status !== 401 && noTokenResponse.status !== 403) {
      console.warn('⚠️ Warning: Preview without token succeeded when it should have failed');
      console.log(`   Status: ${noTokenResponse.status} ${noTokenResponse.statusText}`);
    } else {
      console.log('✅ Preview without token correctly failed with status:', noTokenResponse.status);
    }
    
    console.log('\n🎉 Document preview testing complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDocumentPreview();

// Make this file a proper module
export { testDocumentPreview };