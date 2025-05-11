/**
 * Vitest setup file
 * 
 * This file runs before tests to configure the testing environment.
 */

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.SESSION_SECRET = 'test_session_secret';

// Mock environment variables that would normally be provided in production
if (!process.env.DATABASE_URL) {
  // For tests, we can use a SQLite database or mock the database entirely
  // The actual implementation will depend on how you want to handle test data
  process.env.DATABASE_URL = 'sqlite::memory:';
}

// Global test setup 
beforeAll(() => {
  // Any setup that should run once before all tests
});

afterAll(() => {
  // Any cleanup that should run once after all tests
});

// Per-test setup
beforeEach(() => {
  // Setup to run before each test
});

afterEach(() => {
  // Cleanup to run after each test
});