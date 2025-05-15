import { Request, Response } from 'express';
import { 
  getDocuments, 
  getDocumentById, 
  uploadDocument,
  searchDocuments,
  deleteDocument
} from '../../controllers/documentController';
import { storage } from '../../storage';
import * as documentRepository from '../../repositories/documentRepository';
import * as permissionService from '../../services/permissionService';
import { mockRequest, mockResponse, mockNext } from '../utils/expressUtils';

// Mock dependencies
jest.mock('../../storage');
jest.mock('../../repositories/documentRepository');
jest.mock('../../services/permissionService');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Document Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDocuments', () => {
    it('should return all documents when user has permission', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      const mockDocuments = [
        { id: '1', title: 'Document 1', status: 'processed' },
        { id: '2', title: 'Document 2', status: 'processing' }
      ];
      
      // Mock the repository response
      (documentRepository.getAllDocuments as jest.Mock).mockResolvedValue(mockDocuments);
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(true);
      
      // Act
      await getDocuments(req as unknown as Request, res as Response);
      
      // Assert
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith(1, 'documents', 'view');
      expect(documentRepository.getAllDocuments).toHaveBeenCalledWith('tenant-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockDocuments
      }));
    });
    
    it('should return 403 when user has no permission', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 3, role: 'user' },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      // Mock the permission check to fail
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(false);
      
      // Act
      await getDocuments(req as unknown as Request, res as Response);
      
      // Assert
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith(3, 'documents', 'view');
      expect(documentRepository.getAllDocuments).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('permission')
      }));
    });
    
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      
      // Act
      await getDocuments(req as Request, res as Response);
      
      // Assert
      expect(permissionService.checkUserPermission).not.toHaveBeenCalled();
      expect(documentRepository.getAllDocuments).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Unauthorized')
      }));
    });
    
    it('should handle repository errors', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      // Mock the repository to throw error
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(true);
      (documentRepository.getAllDocuments as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Act
      await getDocuments(req as unknown as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('error')
      }));
    });
  });
  
  describe('getDocumentById', () => {
    it('should return document by ID when user has permission', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        params: { id: 'doc-123' },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      const mockDocument = {
        id: 'doc-123',
        title: 'Test Document',
        content: 'Test content',
        status: 'processed'
      };
      
      // Mock the repository response
      (documentRepository.getDocumentById as jest.Mock).mockResolvedValue(mockDocument);
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(true);
      
      // Act
      await getDocumentById(req as unknown as Request, res as Response);
      
      // Assert
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith(1, 'documents', 'view');
      expect(documentRepository.getDocumentById).toHaveBeenCalledWith('doc-123', 'tenant-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockDocument
      }));
    });
    
    it('should return 404 when document not found', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        params: { id: 'non-existent-doc' },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      // Mock the repository to return null (document not found)
      (documentRepository.getDocumentById as jest.Mock).mockResolvedValue(null);
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(true);
      
      // Act
      await getDocumentById(req as unknown as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('not found')
      }));
    });
    
    it('should return 403 when user has no permission', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 3, role: 'user' },
        params: { id: 'doc-123' },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      // Mock the permission check to fail
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(false);
      
      // Act
      await getDocumentById(req as unknown as Request, res as Response);
      
      // Assert
      expect(documentRepository.getDocumentById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
  
  describe('uploadDocument', () => {
    it('should upload document when user has permission', async () => {
      // Arrange
      const mockFile = {
        originalname: 'test-doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test content')
      };
      
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        file: mockFile,
        body: {
          title: 'Test Document',
          description: 'A test document',
          documentType: 'invoice'
        },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      const mockUploadedDocument = {
        id: 'new-doc-id',
        title: 'Test Document',
        description: 'A test document',
        documentType: 'invoice',
        status: 'pending'
      };
      
      // Mock the repository response
      (documentRepository.uploadDocument as jest.Mock).mockResolvedValue(mockUploadedDocument);
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(true);
      
      // Act
      await uploadDocument(req as unknown as Request, res as Response);
      
      // Assert
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith(1, 'documents', 'edit');
      expect(documentRepository.uploadDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          file: mockFile,
          metadata: expect.objectContaining({
            title: 'Test Document',
            description: 'A test document',
            documentType: 'invoice'
          }),
          tenantId: 'tenant-123',
          userId: 1
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUploadedDocument
      }));
    });
    
    it('should return 400 when no file provided', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        body: {
          title: 'Test Document',
          description: 'A test document',
          documentType: 'invoice'
        },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(true);
      
      // Act
      await uploadDocument(req as unknown as Request, res as Response);
      
      // Assert
      expect(documentRepository.uploadDocument).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('No file')
      }));
    });
    
    it('should return 403 when user has no permission', async () => {
      // Arrange
      const mockFile = {
        originalname: 'test-doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test content')
      };
      
      const req = mockRequest({
        user: { id: 3, role: 'user' },
        file: mockFile,
        body: {
          title: 'Test Document',
          description: 'A test document',
          documentType: 'invoice'
        },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      // Mock the permission check to fail
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(false);
      
      // Act
      await uploadDocument(req as unknown as Request, res as Response);
      
      // Assert
      expect(documentRepository.uploadDocument).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
  
  describe('searchDocuments', () => {
    it('should search documents when user has permission', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        query: { 
          tenantId: 'tenant-123',
          query: 'invoice',
          documentType: 'finance'
        }
      });
      const res = mockResponse();
      
      const mockSearchResults = [
        { id: '1', title: 'Invoice 2025-001', documentType: 'finance' },
        { id: '2', title: 'Invoice 2025-002', documentType: 'finance' }
      ];
      
      // Mock the repository response
      (documentRepository.searchDocuments as jest.Mock).mockResolvedValue(mockSearchResults);
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(true);
      
      // Act
      await searchDocuments(req as unknown as Request, res as Response);
      
      // Assert
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith(1, 'documents', 'view');
      expect(documentRepository.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          searchQuery: 'invoice',
          filters: expect.objectContaining({
            documentType: 'finance'
          })
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockSearchResults
      }));
    });
    
    it('should return 403 when user has no permission', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 3, role: 'user' },
        query: { 
          tenantId: 'tenant-123',
          query: 'invoice' 
        }
      });
      const res = mockResponse();
      
      // Mock the permission check to fail
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(false);
      
      // Act
      await searchDocuments(req as unknown as Request, res as Response);
      
      // Assert
      expect(documentRepository.searchDocuments).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
  
  describe('deleteDocument', () => {
    it('should delete document when user has permission', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        params: { id: 'doc-123' },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      // Mock the repository response
      (documentRepository.deleteDocument as jest.Mock).mockResolvedValue(true);
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(true);
      
      // Act
      await deleteDocument(req as unknown as Request, res as Response);
      
      // Assert
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith(1, 'documents', 'delete');
      expect(documentRepository.deleteDocument).toHaveBeenCalledWith('doc-123', 'tenant-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('deleted')
      }));
    });
    
    it('should return 404 when document not found', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        params: { id: 'non-existent-doc' },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      // Mock the repository to return false (document not found or not deleted)
      (documentRepository.deleteDocument as jest.Mock).mockResolvedValue(false);
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(true);
      
      // Act
      await deleteDocument(req as unknown as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('not found')
      }));
    });
    
    it('should return 403 when user has no permission', async () => {
      // Arrange
      const req = mockRequest({
        user: { id: 3, role: 'user' },
        params: { id: 'doc-123' },
        query: { tenantId: 'tenant-123' }
      });
      const res = mockResponse();
      
      // Mock the permission check to fail
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue(false);
      
      // Act
      await deleteDocument(req as unknown as Request, res as Response);
      
      // Assert
      expect(documentRepository.deleteDocument).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});