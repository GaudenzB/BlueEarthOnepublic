import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { message } from "antd";
import { apiRequest } from "@/lib/queryClient";
import { Document } from "@/types/document";
import { DocumentDetailContent } from "@/components/documents/DocumentDetailContent";
import { DocumentDeleteDialog } from "@/components/documents/DocumentDeleteDialog";
import { DocumentShareDialog } from "@/components/documents/DocumentShareDialog";

/**
 * Skeleton loading state for document detail
 */
function DocumentDetailSkeleton() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        marginBottom: 24, 
        alignItems: 'center', 
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div style={{ width: 100, height: 32, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
        <div style={{ width: 300, height: 32, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
        <div style={{ flex: 1 }}></div>
        <div style={{ width: 100, height: 32, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
        <div style={{ width: 100, height: 32, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </div>
      
      <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 16, width: '100%' }} />
      <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 16, width: '90%' }} />
      <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 16, width: '95%' }} />
      
      <div style={{ marginTop: 24 }}>
        <div style={{ height: 32, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 16, width: '20%' }} />
        <div style={{ height: 200, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 16, width: '100%' }} />
      </div>
    </div>
  );
}

/**
 * Error display for document detail
 */
function DocumentDetailError({ error, onReturn }: { error: Error; onReturn: () => void }) {
  return (
    <div style={{ maxWidth: '800px', margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
      <h2 style={{ color: '#cf1322' }}>Error Loading Document</h2>
      <p style={{ color: '#666' }}>We encountered a problem while retrieving the document.</p>
      <div style={{ margin: '32px 0', color: '#cf1322' }}>
        {error.message || 'An unexpected error occurred'}
      </div>
      <button 
        onClick={onReturn}
        style={{
          backgroundColor: '#1890ff',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        Return to Documents
      </button>
    </div>
  );
}

/**
 * Not found display for document detail
 */
function DocumentDetailNotFound({ onReturn }: { onReturn: () => void }) {
  return (
    <div style={{ maxWidth: '800px', margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
      <h2>Document Not Found</h2>
      <p style={{ color: '#666' }}>The document you're looking for doesn't exist or you don't have permission to view it.</p>
      <div style={{ margin: '32px 0' }}>
        <button 
          onClick={onReturn}
          style={{
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Return to Documents
        </button>
      </div>
    </div>
  );
}

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
    data: document = {} as Document,
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
  
  // Mutation for deleting a document with optimistic UI updates
  interface DeleteMutationContext {
    previousDocuments: Document[] | undefined;
  }
  
  const deleteDocumentMutation = useMutation<void, Error, void, DeleteMutationContext>({
    mutationFn: () => {
      return apiRequest<void>(`/api/documents/${id}`, { method: 'DELETE' });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/documents'] });
      
      // Snapshot the previous value
      const previousDocuments = queryClient.getQueryData<Document[]>(['/api/documents']);
      
      // Optimistically update the documents list (remove this document)
      if (previousDocuments) {
        queryClient.setQueryData<Document[]>(
          ['/api/documents'], 
          previousDocuments.filter(doc => doc.id !== id)
        );
      }
      
      // Show success message 
      message.success('Document deleted successfully');
      
      // Return context with the previous documents
      return { previousDocuments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setLocation('/documents');
    },
    onError: (error: Error, _, context: DeleteMutationContext | undefined) => {
      // If there was an error, restore previous documents 
      if (context?.previousDocuments) {
        queryClient.setQueryData<Document[]>(['/api/documents'], context.previousDocuments);
      }
      message.error(`Failed to delete document: ${error.message || 'Unknown error'}`);
    },
  });
  
  // Mutation for refreshing document status
  const refreshStatusMutation = useMutation<void, Error, void>({
    mutationFn: () => {
      return apiRequest<void>(`/api/documents/${id}/refresh-status`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', id] });
      message.success('Document status updated');
    },
    onError: (error: Error) => {
      message.error(`Failed to refresh document status: ${error.message || 'Unknown error'}`);
    }
  });
  
  // Event handlers
  const handleDeleteClick = () => setShowDeleteDialog(true);
  const handleShareClick = () => setShowShareDialog(true);
  const handleConfirmDelete = () => deleteDocumentMutation.mutate();
  const handleRefreshStatus = () => refreshStatusMutation.mutate();
  const handleTabChange = (key: string) => setActiveTab(key);
  const handleReturn = () => setLocation('/documents');

  // Handle loading and error states
  if (isLoading) {
    return <DocumentDetailSkeleton />;
  }
  
  if (isError && error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return <DocumentDetailError error={errorObj} onReturn={handleReturn} />;
  }
  
  // Handle not found or empty document response
  if (!document || !document.id) {
    return <DocumentDetailNotFound onReturn={handleReturn} />;
  }
  
  return (
    <>
      <Helmet>
        <title>{document.title || "Document"} | BlueEarth Portal</title>
        <meta name="description" content={`View details and insights for ${document.title || "document"}`} />
      </Helmet>
      
      {/* Main content area */}
      <DocumentDetailContent
        document={document}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onDeleteClick={handleDeleteClick}
        onShareClick={handleShareClick}
        onRefreshStatus={handleRefreshStatus}
        isRefreshing={refreshStatusMutation.isPending}
      />
      
      {/* Modals and dialogs */}
      <DocumentDeleteDialog 
        document={document}
        open={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteDocumentMutation.isPending}
      />
      
      <DocumentShareDialog 
        document={document}
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
    </>
  );
}