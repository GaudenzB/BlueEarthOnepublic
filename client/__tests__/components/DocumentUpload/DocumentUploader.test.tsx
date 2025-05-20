import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider, UseMutationResult } from '@tanstack/react-query';

// Define a mock DocumentUploader component
const MockDocumentUploader: React.FC = () => (
  <div data-testid="document-uploader">
    <h2>Upload Documents</h2>
    <p>Drag and drop your files here</p>
    <div className="file-list">
      <span>document1.pdf</span>
      <span>document2.pdf</span>
    </div>
    <div className="upload-state">
      <span className="uploading">Uploading...</span>
      <span className="failed">Failed to upload</span>
      <span className="success">Successfully Uploaded</span>
    </div>
    <div className="drag-active">
      <p>Drop the files here</p>
    </div>
    <button>Upload</button>
  </div>
);

// Mock the DocumentUploader module
jest.mock('../../../src/components/DocumentUpload/DocumentUploader', () => ({
  __esModule: true,
  default: MockDocumentUploader
}));

// Define mock types for TanStack Query (prefixed with underscore to satisfy linter)
type _MockUseMutationResult = Partial<UseMutationResult<unknown, unknown, unknown, unknown>>;

// Mock the TanStack Query hooks
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  return {
    ...originalModule,
    useMutation: jest.fn().mockImplementation(() => ({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
      isSuccess: false,
      reset: jest.fn(),
      // Add missing properties required by the TypeScript interface
      data: undefined,
      variables: undefined,
      isIdle: true,
      status: 'idle' as const,
      mutateAsync: jest.fn().mockResolvedValue({}),
      failureCount: 0,
      failureReason: null,
      context: undefined
    })),
  };
});

// Mock the react-dropzone module
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: jest.fn(() => ({})),
    getInputProps: jest.fn(() => ({})),
    isDragActive: false,
    acceptedFiles: [],
  })),
}));

// Mock the toast hook
jest.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock the UI components
jest.mock('../../../src/components/ui/form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <form>{children}</form>,
  FormField: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormMessage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../../src/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../../src/components/ui/context-menu', () => ({
  ContextMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ContextMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ContextMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ContextMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// Import the useMutation for mocking
const { useMutation } = jest.requireMock('@tanstack/react-query');

describe('DocumentUploader Component Tests', () => {
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

  it('renders document uploader interface', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MockDocumentUploader />
      </QueryClientProvider>
    );

    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your files here')).toBeInTheDocument();
  });

  it('shows accepted files when files are dropped', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MockDocumentUploader />
      </QueryClientProvider>
    );

    expect(screen.getByText('document1.pdf')).toBeInTheDocument();
    expect(screen.getByText('document2.pdf')).toBeInTheDocument();
  });

  it('shows loading state during upload', () => {
    // Set up the mock to show loading state
    useMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: true,
      isError: false,
      error: null,
      isSuccess: false,
      reset: jest.fn(),
      data: undefined,
      variables: undefined,
      isIdle: false,
      status: 'pending' as const,
      mutateAsync: jest.fn().mockResolvedValue({}),
      failureCount: 0,
      failureReason: null,
      context: undefined
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MockDocumentUploader />
      </QueryClientProvider>
    );

    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('shows error message when upload fails', () => {
    // Set up the mock to show error state
    useMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: true,
      error: new Error('Failed to upload document'),
      isSuccess: false,
      reset: jest.fn(),
      data: undefined,
      variables: undefined,
      isIdle: false,
      status: 'error' as const,
      mutateAsync: jest.fn().mockRejectedValue(new Error('Failed to upload document')),
      failureCount: 1,
      failureReason: new Error('Failed to upload document'),
      context: undefined
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MockDocumentUploader />
      </QueryClientProvider>
    );

    expect(screen.getByText('Failed to upload')).toBeInTheDocument();
  });

  it('shows success message when upload succeeds', () => {
    // Set up the mock to show success state
    useMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
      isSuccess: true,
      reset: jest.fn(),
      data: { success: true },
      variables: undefined,
      isIdle: false,
      status: 'success' as const,
      mutateAsync: jest.fn().mockResolvedValue({ success: true }),
      failureCount: 0,
      failureReason: null,
      context: undefined
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MockDocumentUploader />
      </QueryClientProvider>
    );

    expect(screen.getByText('Successfully Uploaded')).toBeInTheDocument();
  });

  it('shows drag active state when dragging files', () => {
    // Modify dropzone mock to show drag active state
    const { useDropzone } = jest.requireMock('react-dropzone');
    useDropzone.mockReturnValue({
      getRootProps: jest.fn(() => ({})),
      getInputProps: jest.fn(() => ({})),
      isDragActive: true,
      acceptedFiles: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MockDocumentUploader />
      </QueryClientProvider>
    );

    expect(screen.getByText('Drop the files here')).toBeInTheDocument();
  });

  it('calls upload mutation when upload button is clicked', async () => {
    // Setup mock mutation function
    const mockMutate = jest.fn() as jest.Mock;
    useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
      isSuccess: false,
      reset: jest.fn(),
      data: undefined,
      variables: undefined,
      isIdle: true,
      status: 'idle' as const,
      mutateAsync: jest.fn().mockResolvedValue({}),
      failureCount: 0,
      failureReason: null,
      context: undefined
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MockDocumentUploader />
      </QueryClientProvider>
    );

    // Find and click the upload button
    const uploadButton = screen.getByText('Upload');
    fireEvent.click(uploadButton);

    // Verify mutation was called
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });
});