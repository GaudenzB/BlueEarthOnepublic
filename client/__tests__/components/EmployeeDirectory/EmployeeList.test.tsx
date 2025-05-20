import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'wouter';
import EmployeeList from '../../../src/components/EmployeeDirectory/EmployeeList';

// Mock the react-query hooks
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  return {
    ...originalModule,
    useQuery: jest.fn(),
  };
});

// Mock the context menu component
jest.mock('../../../src/components/ui/context-menu', () => ({
  ContextMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="context-menu">{children}</div>,
  ContextMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="context-menu-trigger">{children}</div>,
  ContextMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="context-menu-content">{children}</div>,
  ContextMenuItem: ({ children }: { children: React.ReactNode }) => <div data-testid="context-menu-item">{children}</div>,
}));

// Mock toast
jest.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('EmployeeList Component', () => {
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
  });

  const mockEmployees = [
    {
      id: 1,
      name: 'John Doe',
      position: 'Software Engineer',
      department: 'engineering',
      location: 'New York',
      email: 'john.doe@example.com',
      status: 'active',
      avatarUrl: 'https://example.com/avatar1.jpg',
    },
    {
      id: 2,
      name: 'Jane Smith',
      position: 'Product Manager',
      department: 'product',
      location: 'San Francisco',
      email: 'jane.smith@example.com',
      status: 'active',
      avatarUrl: null,
    },
  ];

  it('renders loading state initially', () => {
    // Mock the query hook to return loading state
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeList 
            filterStatus="all" 
            filterDepartment="all" 
            searchTerm="" 
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify loading state
    expect(screen.getByTestId('employee-list-loading')).toBeInTheDocument();
  });

  it('renders employees when data is loaded', () => {
    // Mock the query hook to return data
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockEmployees,
      isError: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeList 
            filterStatus="all" 
            filterDepartment="all" 
            searchTerm="" 
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify employee cards are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Product Manager')).toBeInTheDocument();
  });

  it('renders error message when fetch fails', () => {
    // Mock the query hook to return error
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: true,
      error: new Error('Failed to fetch employees'),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeList 
            filterStatus="all" 
            filterDepartment="all" 
            searchTerm="" 
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify error message
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to fetch employees/i)).toBeInTheDocument();
  });

  it('filters employees based on search term', () => {
    // Mock the query hook to return data
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockEmployees,
      isError: false,
      error: null,
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeList 
            filterStatus="all" 
            filterDepartment="all" 
            searchTerm="John" 
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Only John should be visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();

    // Update search term to show Jane
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeList 
            filterStatus="all" 
            filterDepartment="all" 
            searchTerm="Jane" 
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Only Jane should be visible
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters employees by department', () => {
    // Mock the query hook to return data
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockEmployees,
      isError: false,
      error: null,
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeList 
            filterStatus="all" 
            filterDepartment="engineering" 
            searchTerm="" 
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Only John should be visible (engineering)
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();

    // Update filter to product department
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeList 
            filterStatus="all" 
            filterDepartment="product" 
            searchTerm="" 
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Only Jane should be visible (product)
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters employees by status', () => {
    const mixedStatusEmployees = [
      ...mockEmployees,
      {
        id: 3,
        name: 'Bob Johnson',
        position: 'Designer',
        department: 'design',
        location: 'Remote',
        email: 'bob.johnson@example.com',
        status: 'inactive',
        avatarUrl: 'https://example.com/avatar3.jpg',
      }
    ];

    // Mock the query hook to return data with mixed statuses
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mixedStatusEmployees,
      isError: false,
      error: null,
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeList 
            filterStatus="active" 
            filterDepartment="all" 
            searchTerm="" 
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Only active employees should be visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();

    // Update filter to inactive status
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeeList 
            filterStatus="inactive" 
            filterDepartment="all" 
            searchTerm="" 
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Only inactive employees should be visible
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });
});