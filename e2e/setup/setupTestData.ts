/**
 * Test Setup Script
 * 
 * This script sets up the test environment with required test data.
 * It is designed to be run before E2E tests to ensure consistent test conditions.
 */

import { pool } from '../../server/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Import test user data
const testUsers = require('../fixtures/test-users.json');

/**
 * Creates test users if they don't already exist
 */
async function setupTestUsers() {
  try {
    console.log('Setting up test users...');
    const client = await pool.connect();
    
    try {
      // Create users with hashed passwords
      for (const [key, userData] of Object.entries(testUsers)) {
        const { username, password, email, firstName, lastName, role } = userData as any;
        
        // Check if user already exists
        const userCheck = await client.query(
          'SELECT * FROM users WHERE username = $1',
          [username]
        );
        
        if (userCheck.rows.length > 0) {
          console.log(`User ${username} already exists, skipping...`);
          continue;
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Insert user
        await client.query(
          `INSERT INTO users (username, password, email, "firstName", "lastName", role)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [username, hashedPassword, email, firstName, lastName, role]
        );
        
        console.log(`Created test user: ${username}`);
      }
      
      console.log('Test users setup complete.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to setup test users:', error);
    throw error;
  }
}

/**
 * Creates test documents for document-related tests
 */
async function setupTestDocuments() {
  try {
    console.log('Setting up test documents...');
    const client = await pool.connect();
    
    try {
      // Get user ID for test user
      const userResult = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [testUsers.user.username]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('Test user not found. Run setupTestUsers first.');
      }
      
      const userId = userResult.rows[0].id;
      
      // Create test document
      const documentId = uuidv4();
      const title = 'Test Document';
      const description = 'This is a test document for E2E testing';
      const filename = 'test-document.txt';
      const contentType = 'text/plain';
      
      // Check if document already exists
      const docCheck = await client.query(
        'SELECT * FROM documents WHERE title = $1 AND "userId" = $2',
        [title, userId]
      );
      
      if (docCheck.rows.length > 0) {
        console.log(`Document "${title}" already exists, skipping...`);
        return;
      }
      
      // Insert document metadata
      await client.query(
        `INSERT INTO documents (
          id, title, description, "userId", "originalFilename", 
          "contentType", "processingStatus", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [documentId, title, description, userId, filename, contentType, 'PROCESSED']
      );
      
      console.log(`Created test document: ${title}`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to setup test documents:', error);
    throw error;
  }
}

/**
 * Creates test employees for employee-related tests
 */
async function setupTestEmployees() {
  try {
    console.log('Setting up test employees...');
    const client = await pool.connect();
    
    try {
      // Create test employees with various departments
      const testEmployees = [
        {
          name: 'Test Employee 1',
          email: 'employee1@blueearth.example.com',
          department: 'ENGINEERING',
          position: 'Software Engineer',
          status: 'ACTIVE',
          hireDate: new Date('2023-01-15')
        },
        {
          name: 'Test Employee 2',
          email: 'employee2@blueearth.example.com',
          department: 'MARKETING',
          position: 'Marketing Specialist',
          status: 'ACTIVE',
          hireDate: new Date('2023-02-20')
        },
        {
          name: 'Test Employee 3',
          email: 'employee3@blueearth.example.com',
          department: 'FINANCE',
          position: 'Financial Analyst',
          status: 'ON_LEAVE',
          hireDate: new Date('2022-11-10')
        }
      ];
      
      for (const employee of testEmployees) {
        // Check if employee already exists
        const empCheck = await client.query(
          'SELECT * FROM employees WHERE email = $1',
          [employee.email]
        );
        
        if (empCheck.rows.length > 0) {
          console.log(`Employee ${employee.name} already exists, skipping...`);
          continue;
        }
        
        // Insert employee
        await client.query(
          `INSERT INTO employees (
            name, email, department, position, status, "hireDate", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            employee.name,
            employee.email,
            employee.department,
            employee.position,
            employee.status,
            employee.hireDate
          ]
        );
        
        console.log(`Created test employee: ${employee.name}`);
      }
      
      console.log('Test employees setup complete.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to setup test employees:', error);
    throw error;
  }
}

/**
 * Main setup function that runs all setup steps
 */
async function setupTestEnvironment() {
  try {
    console.log('Setting up test environment...');
    
    // Setup test data in sequence
    await setupTestUsers();
    await setupTestDocuments();
    await setupTestEmployees();
    
    console.log('Test environment setup complete.');
  } catch (error) {
    console.error('Test environment setup failed:', error);
    process.exit(1);
  } finally {
    // Close the database pool
    await pool.end();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupTestEnvironment();
}

export { setupTestUsers, setupTestDocuments, setupTestEmployees, setupTestEnvironment };