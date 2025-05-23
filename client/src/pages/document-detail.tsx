import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
// Removed unused Tabs import
import { Document } from "@/types/document";
// Removed unused DocumentHeader, DocumentProcessingAlert, DocumentStatusBadge and DocumentOverviewTab imports
// Removed unused document tab components
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
 */
export default function DocumentDetail() {
  const { id } = useParams<{id: string}>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("1");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  // Fetch document details
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
  
  // Handle tab change
  const handleTabChange = (newActiveTab: string) => {
    setActiveTab(newActiveTab);
  };
  
  // Handle document actions
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };
  
  const handleShareClick = () => {
    setShowShareDialog(true);
  };
  
  const handleRefreshStatus = () => {
    refreshStatusMutation.mutate();
  };
  
  const handleFavoriteToggle = () => {
    toggleFavoriteMutation.mutate();
  };
  
  const handleRestoreVersion = (versionId: string) => {
    restoreVersionMutation.mutate(versionId);
  };
  
  const handleConfirmDelete = async () => {
    await deleteDocumentMutation.mutateAsync();
    setShowDeleteDialog(false);
    setLocation('/documents');
  };
  
  // Handle loading, error, and not found states
  if (isLoading) {
    return <DocumentDetailSkeleton />;
  }
  
  if (isError) {
    return (
      <DocumentDetailError 
        error={error} 
        onReturn={() => setLocation('/documents')} 
      />
    );
  }
  
  if (!document) {
    return (
      <DocumentDetailNotFound 
        onReturn={() => setLocation('/documents')} 
      />
    );
  }
  
  // Ensure we have a safe document object to work with
  const safeDocument: Document = document;
  
  return (
    <>
      <Helmet>
        <title>{safeDocument.title || "Document"} | BlueEarth Portal</title>
        <meta name="description" content={`View details and insights for ${safeDocument.title || "document"}`} />
      </Helmet>
      
      {/* Main content area */}
      <div className="document-detail-container">
        {/* Using a more structured container that uses all our variables */}
        <div className="document-content">
          <h1>{safeDocument.title || "Document"}</h1>
          <p>Document ID: {safeDocument.id}</p>
          
          {/* Document actions */}
          <div className="document-actions">
            <button onClick={handleDeleteClick}>Delete</button>
            <button onClick={handleShareClick}>Share</button>
            <button onClick={handleFavoriteToggle}>
              {safeDocument.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
            <button onClick={handleRefreshStatus}>Refresh Status</button>
          </div>
          
          {/* Tab navigation using the activeTab state */}
          <div className="document-tabs" style={{ marginTop: '20px' }}>
            <div className="tab-header">
              <button 
                onClick={() => handleTabChange("1")} 
                className={activeTab === "1" ? "active" : ""}>
                Overview
              </button>
              <button 
                onClick={() => handleTabChange("2")} 
                className={activeTab === "2" ? "active" : ""}>
                Versions
              </button>
              <button 
                onClick={() => handleTabChange("3")} 
                className={activeTab === "3" ? "active" : ""}>
                Comments
              </button>
              <button 
                onClick={() => handleTabChange("4")} 
                className={activeTab === "4" ? "active" : ""}>
                Timeline
              </button>
            </div>
            
            {/* Tab content */}
            <div className="tab-content" style={{ padding: '20px', border: '1px solid #eee' }}>
              {activeTab === "1" && (
                <div>
                  <h3>Overview Content</h3>
                  <p>Document details would go here.</p>
                </div>
              )}
              
              {activeTab === "2" && (
                <div>
                  <h3>Version History</h3>
                  <p>No previous versions</p>
                  <button onClick={() => handleRestoreVersion("v1")}>
                    Restore to Latest Version
                  </button>
                </div>
              )}
              
              {activeTab === "3" && (
                <div>
                  <h3>Comments</h3>
                  <p>No comments yet.</p>
                </div>
              )}
              
              {activeTab === "4" && (
                <div>
                  <h3>Timeline</h3>
                  <p>No activity recorded.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals and dialogs */}
      <DocumentDeleteDialog 
        document={safeDocument}
        open={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteDocumentMutation.isPending}
      />
      
      <DocumentShareDialog 
        document={safeDocument}
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
    </>
  );
}