import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Tabs } from "antd";
import { Document } from "@/types/document";
import { DocumentHeader } from "@/components/documents/DocumentHeader";
import { DocumentProcessingAlert } from "@/components/documents/DocumentProcessingAlert";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { DocumentOverviewTab } from "@/components/documents/tabs/DocumentOverviewTab";
import { DocumentVersionsTab } from "@/components/documents/tabs/DocumentVersionsTab";
import { DocumentCommentsTab } from "@/components/documents/tabs/DocumentCommentsTab";
import { DocumentTimelineTab } from "@/components/documents/tabs/DocumentTimelineTab";
import { DocumentDeleteDialog } from "@/components/documents/DocumentDeleteDialog";
import { DocumentShareDialog } from "@/components/documents/DocumentShareDialog";
import { 
  DocumentDetailSkeleton,
  DocumentDetailError,
  DocumentDetailNotFound 
} from "@/components/documents/DocumentDetailState";
import {
  useDocumentDelete,
  useDocumentRefreshStatus,
  useDocumentFavoriteToggle,
  useDocumentVersionRestore
} from "@/hooks/useDocumentMutations";

/**
 * Document detail page component
 * 
 * Consolidated version that merges functionality from multiple implementations:
 * - Auto-refresh functionality for processing documents
 * - Improved component structure with dedicated tab components
 * - Consistent styling and user experience
 */
export default function DocumentDetail() {
  const { id } = useParams<{id: string}>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("1");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  // Fetch document details with auto-refresh for processing documents
  const { 
    data: document,
    isLoading, 
    isError, 
    error
  } = useQuery<Document, Error, Document>({
    queryKey: ['/api/documents', id],
    enabled: !!id,
    // Auto-refresh every 5 seconds for documents in processing states
    refetchInterval: 5000,
    // Only refetch if document is in a processing state
    refetchIntervalInBackground: true,
    // Custom selector to determine if we need to continue polling
    select: (data: Document) => {
      // If processing is done, signal to stop polling by invalidating query
      if (data && data.processingStatus !== 'PROCESSING' && data.processingStatus !== 'PENDING') {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/documents', id] });
        }, 1000);
      }
      return data;
    },
  });
  
  // Use custom mutation hooks for document operations
  const deleteDocumentMutation = useDocumentDelete(id);
  const refreshStatusMutation = useDocumentRefreshStatus(id);
  const toggleFavoriteMutation = useDocumentFavoriteToggle(id);
  const restoreVersionMutation = useDocumentVersionRestore(id);
  
  // Event handlers
  const handleTabChange = (newActiveTab: string) => {
    setActiveTab(newActiveTab);
  };
  
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };
  
  const handleShareClick = () => {
    setShowShareDialog(true);
  };
  
  const handleRefreshStatus = () => {
    refreshStatusMutation.mutate();
  };
  
  const handleToggleFavorite = () => {
    const newFavoriteStatus = !document?.isFavorite;
    // Fix typing of mutation parameter
    toggleFavoriteMutation.mutate(newFavoriteStatus as any);
  };
  
  const handleRestoreVersion = (versionId: string) => {
    // Fix typing of mutation parameter
    restoreVersionMutation.mutate(versionId);
  };
  
  const handleConfirmDelete = () => {
    deleteDocumentMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation('/documents');
      }
    });
  };
  
  const handleReturn = () => {
    setLocation('/documents');
  };
  
  // Handle loading state
  if (isLoading) {
    return <DocumentDetailSkeleton />;
  }
  
  // Handle error state
  if (isError && error) {
    return <DocumentDetailError error={error} onReturn={handleReturn} />;
  }
  
  // Safe access to document data
  // Cast to Document only if document is defined
  const safeDocument = document as Document;

  // Handle not found state
  if (!safeDocument || !safeDocument.id) {
    return <DocumentDetailNotFound onReturn={handleReturn} />;
  }
  
  // Ensure we have a valid Document object with all required properties
  const validDocument: Document = {
    ...safeDocument,
    // Ensure any potentially undefined properties have default values
    id: safeDocument.id || '',
    title: safeDocument.title || 'Untitled Document',
    processingStatus: safeDocument.processingStatus || 'COMPLETED',
  };
  // Render document details with improved UI structure
  return (
    <>
      <Helmet>
        <title>{validDocument.title || "Document"} | BlueEarth Portal</title>
        <meta name="description" content={`View details and insights for ${validDocument.title || "document"}`} />
      </Helmet>
      
      <div className="document-detail-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Document Header */}
        <DocumentHeader 
          document={validDocument}
          statusBadge={<DocumentStatusBadge status={validDocument.processingStatus} />}
          onDeleteClick={handleDeleteClick}
          onShareClick={handleShareClick}
          onFavorite={handleToggleFavorite}
          isFavorited={!!validDocument.isFavorite}
          loading={{
            favorite: toggleFavoriteMutation.isPending,
            delete: deleteDocumentMutation.isPending,
          }}
        />
        
        {/* Processing Alert if needed */}
        <DocumentProcessingAlert 
          document={validDocument}
          onRefresh={handleRefreshStatus}
          isRefreshing={refreshStatusMutation.isPending}
        />
        
        {/* Tabs - Using Ant Design's Tabs directly for better UX */}
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
          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <Tabs.TabPane tab="Overview" key="1">
              <DocumentOverviewTab document={validDocument} />
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="Version History" key="2">
              <DocumentVersionsTab 
                document={validDocument} 
                onRestoreVersion={handleRestoreVersion}
                isRestoring={restoreVersionMutation.isPending}
              />
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="Comments" key="3">
              <DocumentCommentsTab document={validDocument} />
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="Timeline" key="4">
              <DocumentTimelineTab document={validDocument} />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DocumentDeleteDialog 
        document={safeDocument}
        open={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteDocumentMutation.isPending}
      />
      
      {/* Share Dialog */}
      <DocumentShareDialog 
        document={safeDocument}
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
    </>
  );
}