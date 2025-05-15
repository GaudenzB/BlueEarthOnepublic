import { Request, Response } from 'express';
import { login, me, logout, refreshToken } from '../../controllers/authController';
import { storage } from '../../storage';
import { generateToken, verifyToken } from '../../auth';
import { mockRequest, mockResponse } from '../utils/expressUtils';

// Mock dependencies
jest.mock('../../storage');
jest.mock('../../auth');

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return 401 for invalid credentials', async () => {
      // Arrange
      const req = mockRequest({
        body: { username: 'testuser', password: 'wrongpassword' }
      });
      const res = mockResponse();
      
      // Mock the storage
      (storage.getUserByUsername as jest.Mock).mockResolvedValue(undefined);
      
      // Act
      await login(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Invalid')
      }));
    });
    
    it('should return 200 and token for valid credentials', async () => {
      // Arrange
      const req = mockRequest({
        body: { username: 'testuser', password: 'password123' }
      });
      const res = mockResponse();
      
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: '$2a$10$abcdefghijklmnopqrstuv', // Mocked hashed password
        role: 'user'
      };
      
      // Mock the storage
      (storage.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock bcrypt compare (handled in auth module)
      (verifyToken as jest.Mock).mockReturnValue(true);
      
      // Mock token generation
      (generateToken as jest.Mock).mockReturnValue('mock-jwt-token');
      
      // Act
      await login(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: 1,
            username: 'testuser'
          })
        })
      }));
    });
    
    it('should handle errors appropriately', async () => {
      // Arrange
      const req = mockRequest({
        body: { username: 'testuser', password: 'password123' }
      });
      const res = mockResponse();
      
      // Mock the storage to throw error
      (storage.getUserByUsername as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Act
      await login(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('error')
      }));
    });
  });
  
  describe('me', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      
      // Act
      await me(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Unauthorized')
      }));
    });
    
    it('should return 200 and user data if authenticated', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
      
      const req = mockRequest({
        user: mockUser
      });
      const res = mockResponse();
      
      // Act
      await me(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: mockUser
        })
      }));
    });
  });
  
  describe('logout', () => {
    it('should return 200 and success message', async () => {
      // Arrange
      const req = mockRequest({
        cookies: {
          accessToken: 'some-token'
        }
      });
      const res = mockResponse();
      
      // Act
      await logout(req as Request, res as Response);
      
      // Assert
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('Logged out')
      }));
    });
  });
  
  describe('refreshToken', () => {
    it('should return 401 if no refresh token provided', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      
      // Act
      await refreshToken(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('No refresh token')
      }));
    });
    
    it('should return 401 if refresh token is invalid', async () => {
      // Arrange
      const req = mockRequest({
        cookies: {
          refreshToken: 'invalid-token'
        }
      });
      const res = mockResponse();
      
      // Mock token verification to fail
      (verifyToken as jest.Mock).mockReturnValue(false);
      
      // Act
      await refreshToken(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Invalid refresh token')
      }));
    });
    
    it('should return 200 and new tokens for valid refresh token', async () => {
      // Arrange
      const req = mockRequest({
        cookies: {
          refreshToken: 'valid-refresh-token'
        }
      });
      const res = mockResponse();
      
      const decodedToken = { 
        userId: 1
      };
      
      // Mock token verification
      (verifyToken as jest.Mock).mockReturnValue(decodedToken);
      
      // Mock storage
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
      (storage.getUser as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock token generation
      (generateToken as jest.Mock).mockReturnValue('new-access-token');
      
      // Act
      await refreshToken(req as Request, res as Response);
      
      // Assert
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'new-access-token',
        expect.anything()
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          token: 'new-access-token'
        })
      }));
    });
  });
});