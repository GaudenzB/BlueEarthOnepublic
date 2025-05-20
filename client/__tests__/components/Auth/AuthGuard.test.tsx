import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AuthGuard from '../../../src/components/Auth/AuthGuard';
import { useAuth } from '../../../src/hooks/useAuth';

// Mock the react-query hooks
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  return {
    ...originalModule,
    useQuery: jest.fn()
  };
});

// Mock the wouter hooks
jest.mock('wouter', () => {
  const originalModule = jest.requireActual('wouter');
  return {
    ...originalModule,
    useLocation: jest.fn(),
    useRoute: jest.fn()
  };
});

// Mock the auth hook
jest.mock('../../../src/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

describe('AuthGuard Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock useLocation to return '/' by default
    (useLocation as jest.Mock).mockReturnValue(['/', jest.fn()]);
  });

  it('renders children when user is authenticated', () => {
    // Mock the auth hook to return an authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'testuser', role: 'user' },
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      </QueryClientProvider>
    );

    // Verify protected content is rendered
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    // Mock the auth hook to return no user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    // Create a mock navigate function
    const mockNavigate = jest.fn() as jest.Mock;
    (useLocation as jest.Mock).mockReturnValue(['/', mockNavigate]);

    render(
      <QueryClientProvider client={queryClient}>
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      </QueryClientProvider>
    );

    // Verify redirect to login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
    
    // Protected content should not be rendered
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('shows loading state when authentication is being checked', () => {
    // Mock the auth hook to return loading state
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      </QueryClientProvider>
    );

    // Verify loading indicator is shown
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    
    // Protected content should not be rendered yet
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('enforces role-based access control', async () => {
    // Mock the auth hook to return a user with insufficient role
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'testuser', role: 'user' },
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    // Create a mock navigate function
    const mockNavigate = jest.fn() as jest.Mock;
    (useLocation as jest.Mock).mockReturnValue(['/', mockNavigate]);

    render(
      <QueryClientProvider client={queryClient}>
        <AuthGuard requiredRole="admin">
          <div data-testid="admin-content">Admin Content</div>
        </AuthGuard>
      </QueryClientProvider>
    );

    // Verify redirect to unauthorized page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/unauthorized');
    });
    
    // Admin content should not be rendered
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('allows access when user has required role', () => {
    // Mock the auth hook to return a user with sufficient role
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'adminuser', role: 'admin' },
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthGuard requiredRole="admin">
          <div data-testid="admin-content">Admin Content</div>
        </AuthGuard>
      </QueryClientProvider>
    );

    // Verify admin content is rendered
    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('allows access to superadmin regardless of required role', () => {
    // Mock the auth hook to return a superadmin user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'superadmin', role: 'superadmin' },
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthGuard requiredRole="admin">
          <div data-testid="admin-content">Admin Content</div>
        </AuthGuard>
      </QueryClientProvider>
    );

    // Verify admin content is rendered for superadmin
    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('saves the current location when redirecting to login', async () => {
    // Mock the auth hook to return no user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    // Create a mock navigate function and set current location to a protected page
    const mockNavigate = jest.fn() as jest.Mock;
    (useLocation as jest.Mock).mockReturnValue(['/documents', mockNavigate]);

    // Mock sessionStorage
    const mockSessionStorage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      </QueryClientProvider>
    );

    // Verify redirect to login and saved location
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', '/documents');
    });
  });
});