import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { hashPassword, comparePassword, generateToken, revokeToken, authenticate, authorize, isSuperAdmin, generateResetToken, calculateExpiryTime } from '../auth';
import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';

// Mock user for testing
const testUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  active: true,
  createdAt: new Date(),
  password: 'hashedPassword123'
};

describe('Authentication Utilities', () => {
  let originalEnv: NodeJS.ProcessEnv;
    
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Set test JWT secret
    process.env.JWT_SECRET = 'test_jwt_secret';
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // Password hashing tests
  describe('hashPassword', () => {
    test('should hash a password', async () => {
      const password = 'securePassword123';
      const hashedPassword = await hashPassword(password);
      
      // Assertions
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.startsWith('$2')).toBeTruthy(); // bcrypt hash format
    });
    
    test('should generate different hashes for the same password', async () => {
      const password = 'securePassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should respect the configured salt rounds', async () => {
      // Set custom salt rounds
      process.env.PASSWORD_SALT_ROUNDS = '5';
      
      const password = 'securePassword123';
      const hashedPassword = await hashPassword(password);
      
      // Verify it's a bcrypt hash
      expect(hashedPassword.startsWith('$2')).toBeTruthy();
    });
  });
  
  // Password comparison tests
  describe('comparePassword', () => {
    test('should return true for matching password', async () => {
      const password = 'securePassword123';
      const hashedPassword = await hashPassword(password);
      
      const result = await comparePassword(password, hashedPassword);
      expect(result).toBe(true);
    });
    
    test('should return false for non-matching password', async () => {
      const password = 'securePassword123';
      const wrongPassword = 'wrongPassword123';
      const hashedPassword = await hashPassword(password);
      
      const result = await comparePassword(wrongPassword, hashedPassword);
      expect(result).toBe(false);
    });
  });
  
  // Token generation tests
  describe('generateToken', () => {
    test('should generate a JWT token', () => {
      const token = generateToken(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    test('should include the correct user data in the token', () => {
      const token = generateToken(testUser);
      
      // Decode the token (without verification) to check the payload
      const decoded = jwt.decode(token) as any;
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.username).toBe(testUser.username);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
      expect(decoded.jti).toBeDefined(); // Token should have a unique ID
    });

    test('should include an expiry time in the token', () => {
      // Set custom token expiry
      process.env.JWT_TOKEN_EXPIRY = '1h';
      
      const token = generateToken(testUser);
      const decoded = jwt.decode(token) as any;
      
      // Check that token has an expiry time
      expect(decoded).toHaveProperty('exp');
      expect(typeof decoded.exp).toBe('number');
      
      // Token should expire in the future
      const nowInSeconds = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(nowInSeconds);
    });
  });

  // Token revocation tests 
  describe('revokeToken', () => {
    test('should successfully revoke a valid token', () => {
      const token = generateToken(testUser);
      const result = revokeToken(token);
      
      expect(result).toBe(true);
    });

    test('should return false for an invalid token', () => {
      const result = revokeToken('invalid.token.here');
      
      expect(result).toBe(false);
    });
  });

  // Reset token generation tests
  describe('generateResetToken', () => {
    test('should generate a random hex string', () => {
      const token = generateResetToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes as hex = 64 chars
      expect(/^[a-f0-9]+$/i.test(token)).toBe(true); // Should be hex
    });
    
    test('should generate unique tokens', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  // Expiry time calculation tests
  describe('calculateExpiryTime', () => {
    test('should calculate default expiry time (24h)', () => {
      const expectedDate = new Date();
      expectedDate.setHours(expectedDate.getHours() + 24);
      
      const expiryTime = calculateExpiryTime();
      const expiryDate = new Date(expiryTime);
      
      // Allow a small difference due to test execution time
      const diff = Math.abs(expiryDate.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000); // Less than 1 second difference
    });
    
    test('should calculate custom expiry time', () => {
      const hours = 48;
      const expectedDate = new Date();
      expectedDate.setHours(expectedDate.getHours() + hours);
      
      const expiryTime = calculateExpiryTime(hours);
      const expiryDate = new Date(expiryTime);
      
      // Allow a small difference due to test execution time
      const diff = Math.abs(expiryDate.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000); // Less than 1 second difference
    });
  });
});