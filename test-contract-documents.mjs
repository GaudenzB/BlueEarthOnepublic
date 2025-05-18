import axios from 'axios';

// Test script for exercising the contract document attachment API
async function testContractDocumentAPI() {
  console.log('Testing contract document attachment API...');
  
  try {
    // 1. Create a new contract
    console.log('\n--- Creating a test contract ---');
    const contractResponse = await axios.post('http://localhost:3000/api/contracts', {
      contractType: 'SERVICE',
      contractNumber: 'DOC-TEST-' + Date.now().toString().slice(-6),
      counterpartyName: 'Test Vendor LLC',
      contractStatus: 'DRAFT',
      description: 'Contract created to test document attachments'
    });
    
    if (!contractResponse.data.success) {
      throw new Error('Failed to create contract: ' + contractResponse.data.message);
    }
    
    const contractId = contractResponse.data.data.id;
    console.log(`Created contract with ID: ${contractId}`);
    
    // 2. Fetch available documents
    console.log('\n--- Fetching available documents ---');
    const docsResponse = await axios.get('http://localhost:3000/api/documents');
    
    if (!docsResponse.data.success || !docsResponse.data.data || !docsResponse.data.data.length) {
      console.log('No documents available for testing. Please upload some documents first.');
      return;
    }
    
    const documentId = docsResponse.data.data[0].id;
    console.log(`Found document to attach: ${documentId} (${docsResponse.data.data[0].title || docsResponse.data.data[0].originalFilename})`);
    
    // 3. Attach document as MAIN type
    console.log('\n--- Attaching document as MAIN type ---');
    const attachResponse = await axios.post(`http://localhost:3000/api/contracts/${contractId}/documents`, {
      documentId,
      docType: 'MAIN',
      isPrimary: true,
      notes: 'Test primary document attachment'
    });
    
    if (!attachResponse.data.success) {
      throw new Error('Failed to attach document: ' + attachResponse.data.message);
    }
    
    console.log('Successfully attached document as MAIN type');
    const attachmentId = attachResponse.data.data.id;
    
    // 4. Fetch contract documents to verify attachment
    console.log('\n--- Fetching contract documents ---');
    const contractDocsResponse = await axios.get(`http://localhost:3000/api/contracts/${contractId}/documents`);
    
    if (!contractDocsResponse.data.success) {
      throw new Error('Failed to fetch contract documents: ' + contractDocsResponse.data.message);
    }
    
    console.log(`Contract has ${contractDocsResponse.data.data.length} document(s) attached:`);
    contractDocsResponse.data.data.forEach((doc, index) => {
      console.log(` ${index + 1}. Type: ${doc.docType}, Primary: ${doc.isPrimary}, ID: ${doc.id}`);
    });
    
    // 5. Attach a second document as AMENDMENT type
    if (docsResponse.data.data.length > 1) {
      console.log('\n--- Attaching second document as AMENDMENT type ---');
      const documentId2 = docsResponse.data.data[1].id;
      
      const attachResponse2 = await axios.post(`http://localhost:3000/api/contracts/${contractId}/documents`, {
        documentId: documentId2,
        docType: 'AMENDMENT',
        isPrimary: false,
        notes: 'Test amendment document attachment',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
      
      if (!attachResponse2.data.success) {
        throw new Error('Failed to attach second document: ' + attachResponse2.data.message);
      }
      
      console.log('Successfully attached second document as AMENDMENT type');
      
      // Fetch contract documents again to verify both attachments
      console.log('\n--- Fetching contract documents again ---');
      const contractDocsResponse2 = await axios.get(`http://localhost:3000/api/contracts/${contractId}/documents`);
      
      console.log(`Contract now has ${contractDocsResponse2.data.data.length} document(s) attached:`);
      contractDocsResponse2.data.data.forEach((doc, index) => {
        console.log(` ${index + 1}. Type: ${doc.docType}, Primary: ${doc.isPrimary}, ID: ${doc.id}`);
      });
    }
    
    // 6. Try to remove a document
    console.log('\n--- Removing a document attachment ---');
    const removeResponse = await axios.delete(`http://localhost:3000/api/contracts/${contractId}/documents/${attachmentId}`);
    
    if (!removeResponse.data.success) {
      throw new Error('Failed to remove document: ' + removeResponse.data.message);
    }
    
    console.log('Successfully removed document attachment');
    
    // Final verification
    console.log('\n--- Final verification ---');
    const finalDocsResponse = await axios.get(`http://localhost:3000/api/contracts/${contractId}/documents`);
    
    console.log(`Contract finally has ${finalDocsResponse.data.data.length} document(s) attached`);
    finalDocsResponse.data.data.forEach((doc, index) => {
      console.log(` ${index + 1}. Type: ${doc.docType}, Primary: ${doc.isPrimary}, ID: ${doc.id}`);
    });
    
    console.log('\nTest completed successfully!');
    console.log(`To view the contract in the UI, navigate to: http://localhost:3000/contracts/${contractId}`);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
  }
}

// Run the test
testContractDocumentAPI();