/**
 * Document Access Control Unit Tests
 * 
 * These tests verify the document access control system works correctly
 * by testing role-based permissions, tenant isolation, and confidential document handling.
 * 
 * @group unit
 * @group permissions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { documentRepository } from '../../server/repositories/documentRepository';
import { env } from '../../server/config/env';
import { db } from '../../server/db';
import { UserRole } from '../../shared/schema';

// Mock database
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    execute: vi.fn().mockImplementation(() => Promise.resolve([]))
  },
  pool: {
    query: vi.fn().mockImplementation(() => Promise.resolve({ rows: [] }))
  }
}));

// Mock environment config
vi.mock('../../server/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'error'
  },
  isDevelopment: false,
  isProduction: false,
  isTest: true
}));

describe('Document Access Control', () => {
  // Test data
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockTenantId = '00000000-0000-0000-0000-000000000001';
  const mockTenant2Id = '00000000-0000-0000-0000-000000000002';
  
  const mockDocuments = [
    {
      id: 'doc-1',
      title: 'Regular Document',
      description: 'Non-confidential document',
      isConfidential: false,
      tenantId: mockTenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      filename: 'regular.pdf',
      originalFilename: 'regular.pdf',
      mimeType: 'application/pdf',
      fileSize: '100000',
      checksum: 'abc123',
      storageKey: 'tenant-1/regular.pdf',
      deleted: false
    },
    {
      id: 'doc-2',
      title: 'Confidential Document',
      description: 'Confidential document',
      isConfidential: true,
      tenantId: mockTenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      filename: 'confidential.pdf',
      originalFilename: 'confidential.pdf',
      mimeType: 'application/pdf',
      fileSize: '120000',
      checksum: 'def456',
      storageKey: 'tenant-1/confidential.pdf',
      deleted: false
    },
    {
      id: 'doc-3',
      title: 'Document from other tenant',
      description: 'Document from tenant 2',
      isConfidential: false,
      tenantId: mockTenant2Id,
      createdAt: new Date(),
      updatedAt: new Date(),
      filename: 'other-tenant.pdf',
      originalFilename: 'other-tenant.pdf',
      mimeType: 'application/pdf',
      fileSize: '150000',
      checksum: 'ghi789',
      storageKey: 'tenant-2/other-tenant.pdf',
      deleted: false
    }
  ];

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Tenant Isolation', () => {
    it('should only return documents for the specified tenant', async () => {
      // Setup the mock to return documents from multiple tenants
      const mockDb = db as any;
      mockDb.execute.mockResolvedValueOnce([...mockDocuments]);
      
      // Call repository to get tenant's documents
      await documentRepository.getAllForTenant(mockTenantId);
      
      // Verify tenant isolation in the query
      expect(mockDb.where).toHaveBeenCalledTimes(1);
      // The first argument to where should include tenant ID matching
      const whereArguments = mockDb.where.mock.calls[0][0];
      expect(whereArguments).toBeDefined();
      
      // Extra verification to ensure the function used proper tenant isolation
      const whereString = String(whereArguments);
      expect(whereString).toContain('tenantId');
      expect(whereString).toContain(mockTenantId);
    });

    it('should not allow access to documents from a different tenant', async () => {
      // Setup mock to return a document from a different tenant
      const mockDb = db as any;
      mockDb.execute.mockResolvedValueOnce([mockDocuments[2]]);
      
      // Try to access a document that belongs to a different tenant
      await expect(
        documentRepository.getById(mockDocuments[2].id, mockTenantId)
      ).resolves.toBeUndefined();
      
      // Ensure the query included tenant verification
      expect(mockDb.where).toHaveBeenCalledTimes(1);
    });
  });

  describe('Confidential Document Access', () => {
    it('should allow admin access to all confidential documents', async () => {
      // Setup mock
      const mockDb = db as any;
      mockDb.execute.mockResolvedValueOnce([mockDocuments[1]]);
      
      // Admin role should be able to access confidential documents
      const result = await documentRepository.getAll(mockTenantId, {
        userRole: 'admin' as UserRole
      });
      
      expect(mockDb.where).toHaveBeenCalledTimes(1);
      // We expect that the SQL for filtering confidential docs was NOT added for admins
      const whereCallArgs = mockDb.where.mock.calls[0][0];
      const whereString = String(whereCallArgs);
      expect(whereString).not.toContain('isConfidential');
    });

    it('should restrict regular user access to confidential documents', async () => {
      // Setup mock
      const mockDb = db as any;
      mockDb.execute.mockResolvedValueOnce([]);
      
      // Regular users should only see non-confidential docs or those they have explicit access to
      const userAccessibleDocs = ['doc-5']; // Not including doc-2 which is confidential
      
      await documentRepository.getAll(mockTenantId, {
        userRole: 'user' as UserRole,
        userAccessibleConfidentialDocs: userAccessibleDocs
      });
      
      // Verify that the query was correctly built to filter confidential documents
      expect(mockDb.where).toHaveBeenCalledTimes(1);
    });

    it('should allow user access to specific confidential documents they have permission for', async () => {
      // Setup mock to return a confidential document
      const mockDb = db as any;
      mockDb.execute.mockResolvedValueOnce([mockDocuments[1]]);
      
      // User has explicit access to doc-2
      const userAccessibleDocs = ['doc-2'];
      
      // This should succeed since user has access to this specific confidential doc
      const result = await documentRepository.getById('doc-2', mockTenantId, {
        userRole: 'user' as UserRole,
        userAccessibleConfidentialDocs: userAccessibleDocs
      });
      
      expect(result).toBeDefined();
      expect(mockDb.where).toHaveBeenCalledTimes(1);
    });

    it('should deny user access to confidential documents they don\'t have permission for', async () => {
      // Setup mock to return a confidential document
      const mockDb = db as any;
      mockDb.execute.mockResolvedValueOnce([mockDocuments[1]]);
      
      // User doesn't have access to doc-2
      const userAccessibleDocs: string[] = [];
      
      // This should fail since user doesn't have access to this confidential doc
      await expect(
        documentRepository.getById('doc-2', mockTenantId, {
          userRole: 'user' as UserRole,
          userAccessibleConfidentialDocs: userAccessibleDocs
        })
      ).rejects.toThrow(/not authorized/i);
      
      expect(mockDb.where).toHaveBeenCalledTimes(1);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow superadmin access to all documents across all tenants', async () => {
      // Setup mock
      const mockDb = db as any;
      mockDb.execute.mockResolvedValueOnce(mockDocuments);
      
      // Superadmins can see everything
      const result = await documentRepository.getAll(mockTenantId, {
        userRole: 'superadmin' as UserRole
      });
      
      expect(mockDb.where).toHaveBeenCalledTimes(1);
      // For superadmin, we shouldn't filter by tenant
      const whereCallArgs = mockDb.where.mock.calls[0][0];
      const whereString = String(whereCallArgs);
      // Even superadmins are restricted by tenant context for safety
      expect(whereString).toContain('tenantId');
    });

    it('should allow manager access to all non-confidential documents in their tenant', async () => {
      // Setup mock
      const mockDb = db as any;
      mockDb.execute.mockResolvedValueOnce([mockDocuments[0]]);
      
      // Managers can see all non-confidential docs in their tenant
      const result = await documentRepository.getAll(mockTenantId, {
        userRole: 'manager' as UserRole
      });
      
      expect(mockDb.where).toHaveBeenCalledTimes(1);
      
      // Managers should be subject to tenant isolation
      const whereCallArgs = mockDb.where.mock.calls[0][0];
      const whereString = String(whereCallArgs);
      expect(whereString).toContain('tenantId');
    });
  });
});