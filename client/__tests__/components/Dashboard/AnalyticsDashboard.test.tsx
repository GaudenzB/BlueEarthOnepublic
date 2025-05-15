import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnalyticsDashboard from '../../../src/components/Dashboard/AnalyticsDashboard';

// Mock the react-query hooks
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  return {
    ...originalModule,
    useQuery: jest.fn(),
  };
});

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Area: () => <div data-testid="area" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
}));

// Mock Card component
jest.mock('../../../src/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="card-description">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="card-footer">{children}</div>,
}));

// Mock toast
jest.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('AnalyticsDashboard Component', () => {
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

  const mockAnalyticsData = {
    documentStats: {
      totalDocuments: 150,
      documentsThisMonth: 42,
      processingQueue: 5,
      documentsByType: [
        { type: 'pdf', count: 80 },
        { type: 'docx', count: 40 },
        { type: 'txt', count: 20 },
        { type: 'other', count: 10 },
      ],
      documentsByStatus: [
        { status: 'processed', count: 120 },
        { status: 'pending', count: 15 },
        { status: 'failed', count: 10 },
        { status: 'processing', count: 5 },
      ],
    },
    userActivity: {
      activeUsers: 25,
      newUsers: 8,
      totalUsers: 75,
      usersByRole: [
        { role: 'admin', count: 5 },
        { role: 'manager', count: 15 },
        { role: 'user', count: 55 },
      ],
      activityTimeline: [
        { date: '2025-05-01', uploads: 10, downloads: 20 },
        { date: '2025-05-02', uploads: 15, downloads: 25 },
        { date: '2025-05-03', uploads: 8, downloads: 18 },
        { date: '2025-05-04', uploads: 12, downloads: 22 },
        { date: '2025-05-05', uploads: 20, downloads: 30 },
      ],
    },
    systemHealth: {
      uptime: 99.98,
      responseTime: 250,
      errorRate: 0.02,
      storageUsed: 75,
      cpuUsage: 45,
      memoryUsage: 60,
    },
  };

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
        <AnalyticsDashboard />
      </QueryClientProvider>
    );

    // Verify loading state
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('renders analytics dashboard when data is loaded', () => {
    // Mock the query hook to return data
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockAnalyticsData,
      isError: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsDashboard />
      </QueryClientProvider>
    );

    // Verify dashboard cards are rendered
    expect(screen.getByText(/Document Statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/User Activity/i)).toBeInTheDocument();
    expect(screen.getByText(/System Health/i)).toBeInTheDocument();
    
    // Verify data is displayed
    expect(screen.getByText('150')).toBeInTheDocument(); // Total documents
    expect(screen.getByText('42')).toBeInTheDocument(); // Documents this month
    expect(screen.getByText('25')).toBeInTheDocument(); // Active users
    expect(screen.getByText('99.98%')).toBeInTheDocument(); // Uptime
  });

  it('renders error message when fetch fails', () => {
    // Mock the query hook to return error
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: true,
      error: new Error('Failed to fetch analytics data'),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsDashboard />
      </QueryClientProvider>
    );

    // Verify error message
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to fetch analytics data/i)).toBeInTheDocument();
  });

  it('renders charts for document types and statuses', () => {
    // Mock the query hook to return data
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockAnalyticsData,
      isError: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsDashboard />
      </QueryClientProvider>
    );

    // Verify charts are rendered
    expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
  });

  it('renders system health metrics with appropriate indicators', () => {
    // Mock the query hook to return data
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockAnalyticsData,
      isError: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsDashboard />
      </QueryClientProvider>
    );

    // Verify health indicators
    expect(screen.getByText(/Uptime/i)).toBeInTheDocument();
    expect(screen.getByText(/Response Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Error Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Storage Used/i)).toBeInTheDocument();
    
    // Verify values
    expect(screen.getByText('99.98%')).toBeInTheDocument();
    expect(screen.getByText('250ms')).toBeInTheDocument();
    expect(screen.getByText('0.02%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('allows user to filter data by time period', async () => {
    // Mock the query hook to return data
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockAnalyticsData,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsDashboard />
      </QueryClientProvider>
    );

    // Find and click time period filter
    const filterButton = screen.getByText(/Last 30 Days/i);
    fireEvent.click(filterButton);
    
    // Select a different time period
    const weekOption = screen.getByText(/Last 7 Days/i);
    fireEvent.click(weekOption);
    
    // Verify refetch was called
    await waitFor(() => {
      expect(mockAnalyticsData.useQuery.refetch).toHaveBeenCalled();
    });
  });
});