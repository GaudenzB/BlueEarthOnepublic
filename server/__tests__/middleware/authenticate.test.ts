import { Request, Response } from 'express';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { verifyToken } from '../../auth';
import { storage } from '../../storage';
import { mockRequest, mockResponse, mockNext } from '../utils/expressUtils';

// Mock dependencies
jest.mock('../../auth');
jest.mock('../../storage');

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should return 401 if no token provided', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();
      
      // Act
      await authenticate(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('No token provided')
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should authenticate with token from cookies', async () => {
      // Arrange
      const req = mockRequest({
        cookies: {
          accessToken: 'valid-token-from-cookie'
        }
      });
      const res = mockResponse();
      const next = mockNext();
      
      const decodedToken = { 
        userId: 1
      };
      
      // Mock token verification
      (verifyToken as jest.Mock).mockReturnValue(decodedToken);
      
      // Mock user retrieval
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
      (storage.getUser as jest.Mock).mockResolvedValue(mockUser);
      
      // Act
      await authenticate(req as Request, res as Response, next);
      
      // Assert
      expect(verifyToken).toHaveBeenCalledWith('valid-token-from-cookie');
      expect(storage.getUser).toHaveBeenCalledWith(1);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should authenticate with token from Authorization header', async () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: 'Bearer valid-token-from-header'
        }
      });
      const res = mockResponse();
      const next = mockNext();
      
      const decodedToken = { 
        userId: 1
      };
      
      // Mock token verification
      (verifyToken as jest.Mock).mockReturnValue(decodedToken);
      
      // Mock user retrieval
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
      (storage.getUser as jest.Mock).mockResolvedValue(mockUser);
      
      // Act
      await authenticate(req as Request, res as Response, next);
      
      // Assert
      expect(verifyToken).toHaveBeenCalledWith('valid-token-from-header');
      expect(storage.getUser).toHaveBeenCalledWith(1);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should return 401 if token is invalid', async () => {
      // Arrange
      const req = mockRequest({
        cookies: {
          accessToken: 'invalid-token'
        }
      });
      const res = mockResponse();
      const next = mockNext();
      
      // Mock token verification to fail
      (verifyToken as jest.Mock).mockReturnValue(false);
      
      // Act
      await authenticate(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Invalid token')
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 401 if user not found', async () => {
      // Arrange
      const req = mockRequest({
        cookies: {
          accessToken: 'valid-token'
        }
      });
      const res = mockResponse();
      const next = mockNext();
      
      const decodedToken = { 
        userId: 999 // Non-existent user ID
      };
      
      // Mock token verification
      (verifyToken as jest.Mock).mockReturnValue(decodedToken);
      
      // Mock user retrieval to return undefined (user not found)
      (storage.getUser as jest.Mock).mockResolvedValue(undefined);
      
      // Act
      await authenticate(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('User not found')
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle errors properly', async () => {
      // Arrange
      const req = mockRequest({
        cookies: {
          accessToken: 'valid-token'
        }
      });
      const res = mockResponse();
      const next = mockNext();
      
      // Mock token verification to throw error
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token verification error');
      });
      
      // Act
      await authenticate(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Authentication error')
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('requireRole', () => {
    it('should allow access to users with specified role', async () => {
      // Arrange
      const mockUserWithRole = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };
      
      const req = mockRequest({
        user: mockUserWithRole
      });
      const res = mockResponse();
      const next = mockNext();
      
      const roleMiddleware = requireRole('admin');
      
      // Act
      await roleMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should allow access to superadmin regardless of required role', async () => {
      // Arrange
      const mockSuperAdmin = {
        id: 1,
        username: 'superadmin',
        email: 'superadmin@example.com',
        role: 'superadmin'
      };
      
      const req = mockRequest({
        user: mockSuperAdmin
      });
      const res = mockResponse();
      const next = mockNext();
      
      const roleMiddleware = requireRole('admin');
      
      // Act
      await roleMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should deny access to users with insufficient role', async () => {
      // Arrange
      const mockRegularUser = {
        id: 2,
        username: 'user',
        email: 'user@example.com',
        role: 'user'
      };
      
      const req = mockRequest({
        user: mockRegularUser
      });
      const res = mockResponse();
      const next = mockNext();
      
      const roleMiddleware = requireRole('admin');
      
      // Act
      await roleMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Insufficient permissions')
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 401 if user not authenticated', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();
      
      const roleMiddleware = requireRole('admin');
      
      // Act
      await roleMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Unauthorized')
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });
});