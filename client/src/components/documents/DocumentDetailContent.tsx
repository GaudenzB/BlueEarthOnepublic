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
  onFavoriteToggle: (() => void) | undefined;
  onRestoreVersion: ((versionId: string) => void) | undefined;
  isFavorited: boolean | undefined;
  isRefreshing: boolean;
  loading?: {
    favorite?: boolean;
    delete?: boolean;
    download?: boolean;
    restore?: boolean;
  };
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
  onFavoriteToggle,
  onRestoreVersion,
  isFavorited,
  isRefreshing,
  loading = {}
}: DocumentDetailContentProps) => {
  return (
    <div 
      style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '24px 16px' 
      }}
      className="document-detail-container"
    >
      {/* Document Header with financial services styling */}
      <div className="financial-section">
        <DocumentHeader 
          document={document}
          statusBadge={<DocumentStatusBadge status={document.processingStatus} />}
          onDeleteClick={onDeleteClick}
          onShareClick={onShareClick}
          onFavorite={onFavoriteToggle}
          isFavorited={isFavorited}
          loading={loading}
        />
      </div>
      
      {/* Processing Alert if needed */}
      <DocumentProcessingAlert 
        document={document}
        onRefresh={onRefreshStatus}
        isRefreshing={isRefreshing}
      />
      
      {/* Document Tabs with financial industry styling */}
      <div 
        className="financial-section"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)', 
          padding: '24px',
          border: '1px solid #e5e7eb',
          marginTop: '16px'
        }}
      >
        <DocumentTabs 
          document={document}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onRestoreVersion={onRestoreVersion}
          isRestoring={loading?.restore || false}
        />
      </div>
    </div>
  );
});