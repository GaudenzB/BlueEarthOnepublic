/**
 * Document type definitions
 */

// Document type options
export const DOC_TYPES = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'doc', label: 'Word Document' },
  { value: 'xls', label: 'Excel Spreadsheet' },
  { value: 'ppt', label: 'PowerPoint Presentation' },
  { value: 'txt', label: 'Plain Text' },
  { value: 'image', label: 'Image' },
  { value: 'other', label: 'Other' }
];

// Document visibility options
export const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team' },
  { value: 'public', label: 'Public' }
];

export interface Document {
  id: string;
  title: string;
  description?: string;
  uploadDate: string;
  lastAccessed?: string;
  size?: number;
  fileSize?: number; // alias for size used in some components
  type?: string;
  documentType?: string; // alias for type used in some components
  status?: string;
  processingStatus?: 'PROCESSING' | 'PENDING' | 'COMPLETED' | 'ERROR';
  createdAt?: string;
  updatedAt?: string;
  visibility?: 'private' | 'team' | 'public';
  tags?: string[];
  thumbnailUrl?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  sharedWith?: Array<{
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  }>;
  metadata?: {
    [key: string]: any;
  };
  versions?: DocumentVersion[];
  comments?: DocumentComment[];
  timeline?: TimelineEvent[];
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  changes?: string;
  size?: number;
}

export interface DocumentComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  replies?: DocumentComment[];
}

export interface TimelineEvent {
  id: string;
  eventType: 'CREATED' | 'UPDATED' | 'SHARED' | 'VIEWED' | 'COMMENTED' | 'PROCESSED';
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
  details?: string;
}