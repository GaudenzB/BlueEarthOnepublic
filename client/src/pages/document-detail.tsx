import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { message } from "antd";
import { apiRequest } from "@/lib/queryClient";
import { Document, DocumentProcessingStatus } from "@/types/document";
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
  
  // Mutation for refreshing document status with optimistic updates
  interface RefreshMutationContext {
    previousDocument: Document | undefined;
    previousDocumentsList: Document[] | undefined;
  }
  
  const refreshStatusMutation = useMutation<void, Error, void, RefreshMutationContext>({
    mutationFn: () => {
      return apiRequest<void>(`/api/documents/${id}/refresh-status`, { method: 'POST' });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/documents', id] });
      await queryClient.cancelQueries({ queryKey: ['/api/documents'] });
      
      // Snapshot the previous document state
      const previousDocument = queryClient.getQueryData<Document>(['/api/documents', id]);
      const previousDocumentsList = queryClient.getQueryData<Document[]>(['/api/documents']);
      
      // Optimistically update the document status to PROCESSING if it's not already
      if (previousDocument && previousDocument.processingStatus !== 'PROCESSING') {
        const optimisticDocument: Document = {
          ...previousDocument,
          processingStatus: 'PROCESSING' as DocumentProcessingStatus
        };
        
        // Update the individual document
        queryClient.setQueryData<Document>(['/api/documents', id], optimisticDocument);
        
        // Also update document in the list if it exists there
        if (previousDocumentsList) {
          const updatedList = previousDocumentsList.map(doc => 
            doc.id === id ? optimisticDocument : doc
          );
          queryClient.setQueryData<Document[]>(['/api/documents'], updatedList);
        }
      }
      
      // Return context with the previous document states
      return { 
        previousDocument,
        previousDocumentsList 
      };
    },
    onSuccess: () => {
      // Invalidate both the individual document and the documents list
      queryClient.invalidateQueries({ queryKey: ['/api/documents', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      message.success('Document status updated');
    },
    onError: (error: Error, _, context: RefreshMutationContext | undefined) => {
      // If there was an error, restore previous document states
      if (context?.previousDocument) {
        queryClient.setQueryData<Document>(['/api/documents', id], context.previousDocument);
      }
      
      if (context?.previousDocumentsList) {
        queryClient.setQueryData<Document[]>(['/api/documents'], context.previousDocumentsList);
      }
      
      message.error(`Failed to refresh document status: ${error.message || 'Unknown error'}`);
    }
  });
  
  // Mutation for toggling document favorite status with optimistic updates
  interface FavoriteMutationContext {
    previousDocument: Document | undefined;
    previousDocumentsList: Document[] | undefined;
  }
  
  // Mutation for restoring a specific document version
  interface RestoreVersionMutationContext {
    previousDocument: Document | undefined;
    previousDocumentsList: Document[] | undefined;
  }
  
  const toggleFavoriteMutation = useMutation<void, Error, void, FavoriteMutationContext>({
    mutationFn: () => {
      // The API endpoint would typically accept a parameter to toggle favorite status
      const isFavorite = !document?.isFavorite;
      return apiRequest<void>(`/api/documents/${id}/favorite`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFavorite })
      });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/documents', id] });
      await queryClient.cancelQueries({ queryKey: ['/api/documents'] });
      
      // Snapshot the previous document states
      const previousDocument = queryClient.getQueryData<Document>(['/api/documents', id]);
      const previousDocumentsList = queryClient.getQueryData<Document[]>(['/api/documents']);
      
      if (previousDocument) {
        // Create an optimistic update with toggled favorite status
        const optimisticDocument: Document = {
          ...previousDocument,
          isFavorite: !previousDocument.isFavorite
        };
        
        // Update the individual document
        queryClient.setQueryData<Document>(['/api/documents', id], optimisticDocument);
        
        // Also update the document in the list if it exists there
        if (previousDocumentsList) {
          const updatedList = previousDocumentsList.map(doc => 
            doc.id === id ? optimisticDocument : doc
          );
          queryClient.setQueryData<Document[]>(['/api/documents'], updatedList);
        }
        
        // Show optimistic success message
        message.success(
          optimisticDocument.isFavorite 
            ? 'Added to favorites' 
            : 'Removed from favorites'
        );
      }
      
      // Return context with the previous document states
      return { 
        previousDocument,
        previousDocumentsList 
      };
    },
    onSuccess: () => {
      // Invalidate both the individual document and the documents list
      queryClient.invalidateQueries({ queryKey: ['/api/documents', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: Error, _, context: FavoriteMutationContext | undefined) => {
      // If there was an error, restore previous document states
      if (context?.previousDocument) {
        queryClient.setQueryData<Document>(['/api/documents', id], context.previousDocument);
      }
      
      if (context?.previousDocumentsList) {
        queryClient.setQueryData<Document[]>(['/api/documents'], context.previousDocumentsList);
      }
      
      message.error(`Failed to update favorite status: ${error.message || 'Unknown error'}`);
    }
  });
  
  // Event handlers
  const handleDeleteClick = () => setShowDeleteDialog(true);
  const handleShareClick = () => setShowShareDialog(true);
  const handleConfirmDelete = () => deleteDocumentMutation.mutate();
  const handleRefreshStatus = () => refreshStatusMutation.mutate();
  const handleFavoriteToggle = () => toggleFavoriteMutation.mutate();
  const handleTabChange = (key: string) => setActiveTab(key);
  const handleReturn = () => setLocation('/documents');
  
  // Implementation of the restore version mutation
  const restoreVersionMutation = useMutation<void, Error, string, RestoreVersionMutationContext>({
    mutationFn: (versionId: string) => {
      return apiRequest<void>(`/api/documents/${id}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onMutate: async (versionId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/documents', id] });
      await queryClient.cancelQueries({ queryKey: ['/api/documents'] });
      
      // Snapshot the previous document states
      const previousDocument = queryClient.getQueryData<Document>(['/api/documents', id]);
      const previousDocumentsList = queryClient.getQueryData<Document[]>(['/api/documents']);
      
      if (previousDocument) {
        // Find the selected version
        const selectedVersion = previousDocument.versions?.find(v => v.id === versionId);
        
        if (selectedVersion) {
          // Create an optimistic update with the restored version info
          const optimisticDocument: Document = {
            ...previousDocument,
            updatedAt: new Date().toISOString(), // Update timestamp
            processingStatus: 'PROCESSING' as DocumentProcessingStatus // Show as processing
          };
          
          // Update the individual document
          queryClient.setQueryData<Document>(['/api/documents', id], optimisticDocument);
          
          // Also update document in the list if it exists there
          if (previousDocumentsList) {
            const updatedList = previousDocumentsList.map(doc => 
              doc.id === id ? optimisticDocument : doc
            );
            queryClient.setQueryData<Document[]>(['/api/documents'], updatedList);
          }
          
          // Show optimistic success message
          message.success(`Restoring to version ${selectedVersion.versionNumber}...`);
        }
      }
      
      // Return context with the previous document states
      return { 
        previousDocument,
        previousDocumentsList 
      };
    },
    onSuccess: () => {
      // Invalidate both the individual document and the documents list
      queryClient.invalidateQueries({ queryKey: ['/api/documents', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      message.success('Document version restored successfully');
    },
    onError: (error: Error, _, context: RestoreVersionMutationContext | undefined) => {
      // If there was an error, restore previous document states
      if (context?.previousDocument) {
        queryClient.setQueryData<Document>(['/api/documents', id], context.previousDocument);
      }
      
      if (context?.previousDocumentsList) {
        queryClient.setQueryData<Document[]>(['/api/documents'], context.previousDocumentsList);
      }
      
      message.error(`Failed to restore version: ${error.message || 'Unknown error'}`);
    }
  });
  
  // Handler for version restore
  const handleRestoreVersion = (versionId: string) => {
    restoreVersionMutation.mutate(versionId);
  };

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
    // If it's not loading and not an error, but we still don't have document data
    if (!isLoading && !isError) {
      return <DocumentDetailNotFound onReturn={handleReturn} />;
    }
    // Otherwise we'll fall through to either the loading or error states
  }
  
  // Create a safe document object to use in the JSX
  // This is needed for TypeScript when document might be undefined
  // The document should never be used in components if it's undefined
  // but TypeScript needs the fallback for type safety
  const safeDocument: Document = document as Document;
  
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