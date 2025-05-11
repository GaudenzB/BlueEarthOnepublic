/**
 * Test script for the enhanced login route
 * 
 * This script tests different login scenarios to verify that the enhanced
 * validation and error handling is working properly.
 */

import fetch from 'node-fetch';

// Configuration
const API_URL = 'http://localhost:5000';
const TEST_CASES = [
  {
    name: 'Valid Login',
    data: { username: 'admin', password: 'admin123' },
    expectedStatus: 200
  },
  {
    name: 'Invalid Username',
    data: { username: 'nonexistent', password: 'password123' },
    expectedStatus: 401
  },
  {
    name: 'Invalid Password',
    data: { username: 'admin', password: 'wrongpassword' },
    expectedStatus: 401
  },
  {
    name: 'Missing Username',
    data: { password: 'password123' },
    expectedStatus: 400
  },
  {
    name: 'Missing Password',
    data: { username: 'admin' },
    expectedStatus: 400
  },
  {
    name: 'Short Password',
    data: { username: 'admin', password: 'short' },
    expectedStatus: 400
  }
];

// Run tests
async function runTests() {
  console.log('Testing login route...');
  console.log('=====================');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of TEST_CASES) {
    try {
      console.log(`\nRunning test: ${test.name}`);
      console.log(`Sending: ${JSON.stringify(test.data)}`);
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.data)
      });
      
      const result = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(result, null, 2)}`);
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ PASS: Got expected status ${test.expectedStatus}`);
        passed++;
      } else {
        console.log(`❌ FAIL: Expected status ${test.expectedStatus}, got ${response.status}`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n=====================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
}

runTests().catch(err => console.error('Error running tests:', err));