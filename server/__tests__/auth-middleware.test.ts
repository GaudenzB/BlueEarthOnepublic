import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticate, authorize, isSuperAdmin } from '../auth';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Mock response functions
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

// Mock request
const mockRequest = (token?: string, user?: any): Partial<Request> => {
  const req: Partial<Request> = {};
  req.header = vi.fn((name) => {
    if (name === 'Authorization' && token) {
      return `Bearer ${token}`;
    }
    return undefined;
  });
  
  if (user) {
    req.user = user;
  }
  
  return req as Request;
};

// Mock next function
const mockNext: NextFunction = vi.fn();

describe('Authentication Middleware', () => {
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Set test JWT secret
    process.env.JWT_SECRET = 'test_jwt_secret';
    
    // Clear mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.restoreAllMocks();
  });
  
  describe('authenticate', () => {
    test('should call next() when token is valid', () => {
      // Create a valid token
      const user = { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' };
      const payload = { ...user, jti: 'test-jti' };
      const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET!, 
        { 
          expiresIn: '1h',
          audience: 'blueearth-portal',
          issuer: 'blueearth-api'
        }
      );
      
      // Mock request
      const req = mockRequest(token);
      const res = mockResponse();
      
      // Call middleware
      authenticate(req as Request, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe(user.id);
      expect(req.user?.username).toBe(user.username);
      expect(req.user?.jti).toBe(payload.jti);
    });
    
    test('should return 401 when no token is provided', () => {
      // Mock request without token
      const req = mockRequest();
      const res = mockResponse();
      
      // Call middleware
      authenticate(req as Request, res, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String)
      }));
      
      // Check if either the errors or error property exists with the expected code
      const responseArg = (res.json as any).mock.calls[0][0];
      expect(
        (responseArg.errors && responseArg.errors.errorCode === 'TOKEN_MISSING') ||
        (responseArg.error && responseArg.error.code === 'TOKEN_MISSING')
      ).toBeTruthy();
    });
    
    test('should return 401 when token is expired', () => {
      // Create an expired token
      const user = { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' };
      const payload = { ...user, jti: 'test-jti' };
      const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET!, 
        { 
          expiresIn: '-1s', // Expired token
          audience: 'blueearth-portal',
          issuer: 'blueearth-api'
        }
      );
      
      // Mock request
      const req = mockRequest(token);
      const res = mockResponse();
      
      // Call middleware
      authenticate(req as Request, res, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String)
      }));
      
      // Check if either the errors or error property exists with the expected code
      const responseArg = (res.json as any).mock.calls[0][0];
      expect(
        (responseArg.errors && responseArg.errors.errorCode === 'TOKEN_EXPIRED') ||
        (responseArg.error && responseArg.error.code === 'TOKEN_EXPIRED')
      ).toBeTruthy();
    });
    
    test('should return 401 when token is invalid', () => {
      // Mock request with invalid token
      const req = mockRequest('invalid.token.here');
      const res = mockResponse();
      
      // Call middleware
      authenticate(req as Request, res, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String)
      }));
      
      // Check if either the errors or error property exists with the expected code
      const responseArg = (res.json as any).mock.calls[0][0];
      expect(
        (responseArg.errors && responseArg.errors.errorCode === 'TOKEN_INVALID') ||
        (responseArg.error && responseArg.error.code === 'TOKEN_INVALID')
      ).toBeTruthy();
    });
  });
  
  describe('authorize', () => {
    test('should call next() when user has required role', () => {
      // Create authorize middleware with required roles
      const authorizeMiddleware = authorize(['admin', 'manager']);
      
      // Mock request with user having required role
      const req = mockRequest(undefined, {
        id: 1,
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin'
      });
      const res = mockResponse();
      
      // Call middleware
      authorizeMiddleware(req as Request, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
    
    test('should return 401 when user is not authenticated', () => {
      // Create authorize middleware with required roles
      const authorizeMiddleware = authorize(['admin']);
      
      // Mock request without user
      const req = mockRequest();
      const res = mockResponse();
      
      // Call middleware
      authorizeMiddleware(req as Request, res, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
        error: expect.objectContaining({
          code: 'AUTH_REQUIRED'
        })
      }));
    });
    
    test('should return 403 when user does not have required role', () => {
      // Create authorize middleware with required roles
      const authorizeMiddleware = authorize(['admin']);
      
      // Mock request with user having different role
      const req = mockRequest(undefined, {
        id: 1,
        username: 'regularuser',
        email: 'user@example.com',
        role: 'user'
      });
      const res = mockResponse();
      
      // Call middleware
      authorizeMiddleware(req as Request, res, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
        error: expect.objectContaining({
          code: 'ROLE_INSUFFICIENT'
        })
      }));
    });
    
    test('should call next() for any authenticated user when no roles specified', () => {
      // Create authorize middleware with no required roles
      const authorizeMiddleware = authorize();
      
      // Mock request with any user
      const req = mockRequest(undefined, {
        id: 1,
        username: 'regularuser',
        email: 'user@example.com',
        role: 'user'
      });
      const res = mockResponse();
      
      // Call middleware
      authorizeMiddleware(req as Request, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });
  
  describe('isSuperAdmin', () => {
    test('should call next() when user is superadmin', () => {
      // Mock request with superadmin user
      const req = mockRequest(undefined, {
        id: 1,
        username: 'superadmin',
        email: 'admin@example.com',
        role: 'superadmin'
      });
      const res = mockResponse();
      
      // Call middleware
      isSuperAdmin(req as Request, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
    
    test('should return 401 when user is not authenticated', () => {
      // Mock request without user
      const req = mockRequest();
      const res = mockResponse();
      
      // Call middleware
      isSuperAdmin(req as Request, res, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
        error: expect.objectContaining({
          code: 'AUTH_REQUIRED'
        })
      }));
    });
    
    test('should return 403 when user is not superadmin', () => {
      // Mock request with non-superadmin user
      const req = mockRequest(undefined, {
        id: 1,
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin'
      });
      const res = mockResponse();
      
      // Call middleware
      isSuperAdmin(req as Request, res, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
        error: expect.objectContaining({
          code: 'SUPERADMIN_REQUIRED'
        })
      }));
    });
  });
});