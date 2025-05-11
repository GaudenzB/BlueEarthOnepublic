import { describe, test, expect, vi, beforeEach } from 'vitest';
import { hashPassword, comparePassword, generateToken } from '../auth';

// Mock user for testing
const testUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
};

describe('Authentication Utilities', () => {
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
    });
    
    test('should generate a JWT token', () => {
      const token = generateToken(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });
  });
});