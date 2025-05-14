import React, { memo } from 'react';
import { Document } from '@/types/document';
import { DocumentHeader } from './DocumentHeader';
import { DocumentProcessingAlert } from './DocumentProcessingAlert';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentTabs } from './DocumentTabs';

interface DocumentDetailContentProps {
  document: Document;
  activeTab: string;
  onTabChange: (key: string) => void;
  onDeleteClick: () => void;
  onShareClick: () => void;
  onRefreshStatus: () => void;
  isRefreshing: boolean;
}

/**
 * Main content component for the document detail page
 * Encapsulates all document display elements
 * Memoized to prevent unnecessary re-renders
 */
export const DocumentDetailContent = memo(({
  document,
  activeTab,
  onTabChange,
  onDeleteClick,
  onShareClick,
  onRefreshStatus,
  isRefreshing
}: DocumentDetailContentProps) => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Document Header */}
      <DocumentHeader 
        document={document}
        statusBadge={<DocumentStatusBadge status={document.processingStatus} />}
        onDeleteClick={onDeleteClick}
        onShareClick={onShareClick}
      />
      
      {/* Processing Alert if needed */}
      <DocumentProcessingAlert 
        document={document}
        onRefresh={onRefreshStatus}
        isRefreshing={isRefreshing}
      />
      
      {/* Document Tabs */}
      <DocumentTabs 
        document={document}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
});