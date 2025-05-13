/**
 * Document interface
 */
export interface Document {
  id: string;
  title: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  filename?: string;
  originalFilename?: string;
  fileSize?: number;
  mimeType?: string;
  checksum?: string;
  storageKey?: string;
  thumbnailUrl?: string;
  documentType?: string;
  type?: string;
  tags?: string[];
  processingStatus?: string;
  processingError?: string;
  aiProcessed?: boolean;
  aiMetadata?: any;
  isConfidential?: boolean;
  visibility?: string;
  sharedWith?: Array<{
    id?: string;
    name: string;
    email: string;
    accessLevel?: string;
  }>;
  versions?: Array<{
    version: string;
    date: string;
    modifiedBy: string;
  }>;
  comments?: Array<{
    id: string;
    author: string;
    date: string;
    text: string;
  }>;
  timeline?: Array<{
    type: string;
    action: string;
    timestamp: string;
    details?: string;
  }>;
}

/**
 * Document types
 */
export const DOC_TYPES = {
  INVOICE: 'Invoice',
  CONTRACT: 'Contract',
  REPORT: 'Report',
  PRESENTATION: 'Presentation',
  OTHER: 'Other Document'
};

/**
 * Document visibility options
 */
export const VISIBILITY_OPTIONS = {
  PUBLIC: 'Public',
  PRIVATE: 'Private',
  CONFIDENTIAL: 'Confidential',
  RESTRICTED: 'Restricted Access'
};

/**
 * Document processing status options
 */
export const PROCESSING_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
};