/**
 * Document Type Definitions
 * 
 * This file contains the type definitions for document-related objects
 * used throughout the application.
 */

/**
 * Document Type Options
 */
export const DOC_TYPES = [
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'REPORT', label: 'Report' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'FORM', label: 'Form' },
  { value: 'POLICY', label: 'Policy' },
  { value: 'OTHER', label: 'Other' }
];

/**
 * Document Visibility Options
 */
export const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team' },
  { value: 'public', label: 'Public' }
];

/**
 * Document Processing Status
 */
export type DocumentProcessingStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'WARNING';

/**
 * Document Visibility
 */
export type DocumentVisibility = 
  | 'private'
  | 'team'
  | 'public';

/**
 * Document Type
 */
export type DocumentType = 
  | 'CONTRACT'
  | 'REPORT'
  | 'PRESENTATION'
  | 'FORM'
  | 'POLICY'
  | 'OTHER';

/**
 * Document user/team share permissions
 */
export interface DocumentShare {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

/**
 * Document Version
 */
export interface DocumentVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  sizeBytes?: number;
  changes?: string;
}

/**
 * Document Comment
 */
export interface DocumentComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  replyTo?: string;
}

/**
 * Document Timeline Event
 */
export interface DocumentEvent {
  id: string;
  eventType: 'CREATE' | 'UPDATE' | 'VIEW' | 'COMMENT' | 'SHARE' | 'DOWNLOAD';
  userId: string;
  userName: string;
  timestamp: string;
  details?: string;
}

/**
 * Document AI Metadata
 */
export interface DocumentAIMetadata {
  summary?: string;
  keywords?: string[];
  categories?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  entities?: Array<{
    name: string;
    type: string;
    confidence: number;
  }>;
  confidentiality?: number;
}

/**
 * Main Document Interface
 */
export interface Document {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  
  // File information
  filename: string;
  originalFilename?: string;
  mimeType?: string;
  fileSize?: number;
  fileType?: string;
  storageKey?: string;
  checksum?: string;
  
  // Classification
  documentType?: DocumentType;
  type?: string;
  category?: string;
  tags?: string[];
  
  // Access control
  isConfidential?: boolean;
  visibility?: DocumentVisibility;
  sharedWith?: DocumentShare[];
  
  // Processing information
  processingStatus?: DocumentProcessingStatus;
  processingError?: string;
  aiProcessed?: boolean;
  aiMetadata?: DocumentAIMetadata;
  
  // Display/preview
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadUrl?: string;
  
  // Related collections
  versions?: DocumentVersion[];
  comments?: DocumentComment[];
  events?: DocumentEvent[];
  
  // Flags
  isFavorite?: boolean;
  isArchived?: boolean;
}

/**
 * Document list response from API (paginated)
 */
export interface DocumentListResponse {
  data: Document[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Document filter options
 */
export interface DocumentFilter {
  search?: string;
  type?: string;
  dateRange?: [string, string];
  status?: DocumentProcessingStatus;
  tags?: string[];
  onlyFavorites?: boolean;
  onlyArchived?: boolean;
}