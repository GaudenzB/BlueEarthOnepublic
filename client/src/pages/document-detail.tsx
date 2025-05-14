import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { message } from "antd";
import { Document } from "@/types/document";
import { DocumentDetailContent } from "@/components/documents/DocumentDetailContent";
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
      <DocumentDetailContent
        document={safeDocument}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onDeleteClick={handleDeleteClick}
        onShareClick={handleShareClick}
        onRefreshStatus={handleRefreshStatus}
        onFavoriteToggle={handleFavoriteToggle}
        onRestoreVersion={handleRestoreVersion}
        isFavorited={safeDocument.isFavorite || false}
        isRefreshing={refreshStatusMutation.isPending}
        loading={{
          favorite: toggleFavoriteMutation.isPending,
          delete: deleteDocumentMutation.isPending,
          restore: restoreVersionMutation.isPending
        }}
      />
      
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