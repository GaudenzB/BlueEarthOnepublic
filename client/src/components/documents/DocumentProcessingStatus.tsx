import React from 'react';
import { Document } from '@/types/document';
import { DocumentStatusBadge } from './DocumentStatusBadge';

interface DocumentProcessingStatusProps {
  document: Document;
}

/**
 * Specialized component for document processing status
 * Handles different processing states and displays appropriate badge
 */
export function DocumentProcessingStatus({ document }: DocumentProcessingStatusProps) {
  // If document is not being processed, don't show anything
  if (!document.processingStatus || document.processingStatus === 'COMPLETED') {
    return null;
  }

  return (
    <DocumentStatusBadge 
      status={document.processingStatus} 
      showText={true}
    />
  );
}