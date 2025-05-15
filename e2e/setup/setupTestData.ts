/**
 * E2E Test Data Setup Script
 * 
 * This script populates the test database with seed data needed for E2E tests.
 * It creates users with different roles, sample documents, and other test data.
 */

import { db } from '../../server/db';
import { 
  documents, 
  employees, 
  users, 
  tenants,
  documentsToEmployees
} from '../../shared/schema';
import { hashPassword } from '../../server/auth';
import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';

// Seed tenant data
const TENANT_ID = 'test-tenant-001';

async function setupTestData() {
  console.log('Setting up test data for E2E tests...');
  
  try {
    // Create test tenant if it doesn't exist
    const existingTenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, TENANT_ID)
    });
    
    if (!existingTenant) {
      console.log('Creating test tenant...');
      await db.insert(tenants).values({
        id: TENANT_ID,
        name: 'Test Tenant',
        domain: 'test.example.com',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Load test users from fixtures file
    const fixturesDir = path.join(process.cwd(), 'e2e', 'fixtures');
    const userSeedFile = path.join(fixturesDir, 'test-users.json');
    
    if (fs.existsSync(userSeedFile)) {
      const userData = JSON.parse(fs.readFileSync(userSeedFile, 'utf8'));
      
      // Create users and employees from seed file
      for (const user of userData.users) {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email)
        });
        
        if (!existingUser) {
          console.log(`Creating test user: ${user.username}`);
          
          // Create user
          const hashedPassword = await hashPassword(user.password);
          const [newUser] = await db.insert(users).values({
            username: user.username,
            email: user.email,
            password: hashedPassword,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            active: true,
            tenantId: TENANT_ID,
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning();
          
          // Create employee profile for user
          await db.insert(employees).values({
            userId: newUser.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            department: user.department,
            title: user.title,
            hireDate: new Date('2025-01-01'),
            phoneNumber: '555-123-4567',
            location: 'Remote',
            tenantId: TENANT_ID,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    // Create test documents
    const testDocPath = path.join(fixturesDir, 'test-document.txt');
    
    if (fs.existsSync(testDocPath)) {
      const docContent = fs.readFileSync(testDocPath, 'utf8');
      
      // Create different types of documents for testing
      const documentTypes = [
        { title: 'Project Plan', status: 'published', visibility: 'public' },
        { title: 'Financial Report', status: 'draft', visibility: 'private' },
        { title: 'Company Policy', status: 'published', visibility: 'internal' },
        { title: 'Product Roadmap', status: 'archived', visibility: 'public' },
        { title: 'Meeting Notes', status: 'draft', visibility: 'private' }
      ];
      
      // Get admin user to use as creator
      const adminUser = await db.query.users.findFirst({
        where: eq(users.role, 'admin')
      });
      
      if (adminUser) {
        for (const docType of documentTypes) {
          // Check if document already exists
          const existingDoc = await db.query.documents.findFirst({
            where: eq(documents.title, docType.title)
          });
          
          if (!existingDoc) {
            console.log(`Creating test document: ${docType.title}`);
            
            // Create document
            const [newDoc] = await db.insert(documents).values({
              title: docType.title,
              content: `${docType.title}\n\n${docContent}`,
              status: docType.status,
              visibility: docType.visibility,
              createdById: adminUser.id,
              updatedById: adminUser.id,
              tenantId: TENANT_ID,
              createdAt: new Date(),
              updatedAt: new Date()
            }).returning();
            
            // Associate document with employees
            const employees = await db.query.employees.findMany({
              limit: 2
            });
            
            for (const employee of employees) {
              await db.insert(documentsToEmployees).values({
                documentId: newDoc.id,
                employeeId: employee.id,
                assignedAt: new Date(),
                tenantId: TENANT_ID
              });
            }
          }
        }
      }
    }
    
    console.log('E2E test data setup completed successfully!');
  } catch (error) {
    console.error('Error setting up test data:', error);
    process.exit(1);
  }
}

// Run the setup
setupTestData().then(() => {
  console.log('Test data setup completed.');
  process.exit(0);
}).catch(error => {
  console.error('Test data setup failed:', error);
  process.exit(1);
});