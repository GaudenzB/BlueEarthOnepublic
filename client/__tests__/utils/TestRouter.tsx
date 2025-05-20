/**
 * Test Router Component
 * 
 * A helper component to provide routing capabilities in tests.
 * This component uses the wouter Router with an empty base path
 * to simulate a memory router behavior for tests.
 */
import React from 'react';
import { Router } from 'wouter';

interface TestRouterProps {
  children: React.ReactNode;
}

/**
 * TestRouter component for use in test environment
 * Provides a routing context with an empty base path
 */
export const TestRouter: React.FC<TestRouterProps> = ({ children }) => {
  return (
    <Router base="">
      {children}
    </Router>
  );
};

export default TestRouter;