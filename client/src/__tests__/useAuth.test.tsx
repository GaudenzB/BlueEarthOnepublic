import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

// Mock React Query client for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0, // Updated from cacheTime to gcTime for newer React Query versions
      staleTime: 0,
    },
  },
});

// Wrapper component for testing hooks with React Query
const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock fetch
global.fetch = vi.fn();

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: { 
          id: 1, 
          username: 'testuser',
          email: 'test@example.com',
          role: 'user' 
        }
      }),
    } as Response);
  });

  test('should return user data when authenticated', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual({ 
      id: 1, 
      username: 'testuser',
      email: 'test@example.com',
      role: 'user' 
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('should return isAuthenticated=false when API returns error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Unauthorized' }),
    } as Response);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });
});