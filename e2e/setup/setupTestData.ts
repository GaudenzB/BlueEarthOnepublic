/**
 * E2E Test Data Setup
 * 
 * This script is used to set up data for end-to-end testing.
 * It loads test users and documents from fixture files and creates them in the database.
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { db } from '../../server/db';
import { users, documents } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Load test users from fixtures and create them in the database
 */
export async function setupTestUsers() {
  try {
    const usersData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../fixtures/test-users.json'), 'utf-8')
    );

    console.log(`Loaded ${usersData.length} test users from fixtures`);
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const userData of usersData) {
      // Check if user already exists by username
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.username, userData.username));
      
      if (existingUsers.length > 0) {
        console.log(`User ${userData.username} already exists, skipping`);
        existingCount++;
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      await db.insert(users).values({
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        active: userData.active,
        entra_id: userData.entra_id || null
      });
      
      createdCount++;
      console.log(`Created test user: ${userData.username}`);
    }
    
    console.log(`Test users setup complete: ${createdCount} created, ${existingCount} already existed`);
    return { created: createdCount, existing: existingCount };
  } catch (error) {
    console.error('Error setting up test users:', error);
    throw error;
  }
}

/**
 * Load test document from fixture and create it in the database
 */
export async function setupTestDocuments() {
  try {
    // Load test document content
    const documentContent = fs.readFileSync(
      path.join(__dirname, '../fixtures/test-document.txt'), 
      'utf-8'
    );
    
    // Get user IDs for document ownership
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.username, 'test_admin'))
      .limit(1);
    
    const regularUser = await db
      .select()
      .from(users)
      .where(eq(users.username, 'test_user'))
      .limit(1);
    
    if (!adminUser.length || !regularUser.length) {
      throw new Error('Test users not found. Please run setupTestUsers first.');
    }
    
    // Check if test documents already exist
    const existingDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.title, 'Test Document'));
    
    if (existingDocs.length > 0) {
      console.log(`Test documents already exist, skipping creation`);
      return { created: 0, existing: existingDocs.length };
    }
    
    // Create test documents with different permissions
    const testDocuments = [
      {
        title: 'Test Document - Public',
        content: documentContent,
        status: 'published',
        visibility: 'public',
        createdById: adminUser[0].id,
        updatedById: adminUser[0].id,
        tenantId: 'default'
      },
      {
        title: 'Test Document - Internal',
        content: documentContent,
        status: 'published',
        visibility: 'internal',
        createdById: adminUser[0].id,
        updatedById: adminUser[0].id,
        tenantId: 'default'
      },
      {
        title: 'Test Document - Restricted',
        content: documentContent,
        status: 'published',
        visibility: 'restricted',
        createdById: regularUser[0].id,
        updatedById: regularUser[0].id,
        tenantId: 'default'
      },
      {
        title: 'Test Document - Draft',
        content: documentContent,
        status: 'draft',
        visibility: 'private',
        createdById: regularUser[0].id,
        updatedById: regularUser[0].id,
        tenantId: 'default'
      }
    ];
    
    // Insert test documents
    for (const doc of testDocuments) {
      await db.insert(documents).values(doc);
      console.log(`Created test document: ${doc.title}`);
    }
    
    console.log(`Test documents setup complete: ${testDocuments.length} created`);
    return { created: testDocuments.length, existing: 0 };
  } catch (error) {
    console.error('Error setting up test documents:', error);
    throw error;
  }
}

/**
 * Main setup function that runs all data setup
 */
export async function setupAllTestData() {
  try {
    console.log('Starting test data setup...');
    
    const usersResult = await setupTestUsers();
    const documentsResult = await setupTestDocuments();
    
    console.log('Test data setup complete.');
    console.log(`Summary: Created ${usersResult.created} users and ${documentsResult.created} documents.`);
    
    return {
      users: usersResult,
      documents: documentsResult
    };
  } catch (error) {
    console.error('Error in test data setup:', error);
    throw error;
  }
}

// Allow running directly from command line
if (require.main === module) {
  setupAllTestData()
    .then(() => {
      console.log('Setup complete, exiting...');
      process.exit(0);
    })
    .catch(err => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
}