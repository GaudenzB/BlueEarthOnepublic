/**
 * Document interface defining the structure of a document object
 */
export interface Document {
  id: string;
  title: string;
  processingStatus: string;
  createdAt?: string;
  updatedAt?: string;
  fileSize?: number;
  type?: string;
  visibility?: string;
  description?: string;
  tags?: string[];
  sharedWith?: { name: string; email: string; accessLevel?: string }[];
  versions?: any[];
  comments?: any[];
  timeline?: any[];
  thumbnailUrl?: string;
  documentType?: string;
  isConfidential?: boolean;
  aiProcessed?: boolean;
  aiMetadata?: any;
  filename?: string;
  originalFilename?: string;
  mimeType?: string;
}

/**
 * Status options for document processing
 */
export const DOC_STATUS_OPTIONS = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
  ERROR: "Error",
  QUEUED: "Queued",
};

/**
 * Document type options
 */
export const DOC_TYPES = {
  INVOICE: "Invoice",
  CONTRACT: "Contract",
  REPORT: "Report",
  PROPOSAL: "Proposal",
  FORM: "Form",
  OTHER: "Other",
};

/**
 * Document visibility options
 */
export const VISIBILITY_OPTIONS = {
  PUBLIC: "Public",
  PRIVATE: "Private",
  SHARED: "Shared",
  RESTRICTED: "Restricted",
};