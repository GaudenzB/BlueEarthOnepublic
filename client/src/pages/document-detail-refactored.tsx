import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Tabs } from "antd";
import { apiRequest } from "@/lib/queryClient";
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
  } = useQuery<Document>({
    queryKey: ['/api/documents', id],
    enabled: !!id,
  });
  
  // Mutation for deleting a document
  const deleteDocumentMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/api/documents/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setLocation('/documents');
    },
  });
  
  // Mutation for refreshing document status
  const refreshStatusMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/api/documents/${id}/refresh-status`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', id] });
    },
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
    return <DocumentDetailError error={error as Error} onReturn={handleReturn} />;
  }
  
  // Handle not found
  if (!document.id) {
    return <DocumentDetailNotFound onReturn={handleReturn} />;
  }
  
  return (
    <>
      <Helmet>
        <title>{document.title || "Document"} | BlueEarth Portal</title>
        <meta name="description" content={`View details and insights for ${document.title || "document"}`} />
      </Helmet>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Document Header */}
        <DocumentHeader 
          document={document}
          statusBadge={<DocumentStatusBadge status={document.processingStatus} />}
          onDeleteClick={handleDeleteClick}
          onShareClick={handleShareClick}
        />
        
        {/* Processing Alert if needed */}
        <DocumentProcessingAlert 
          document={document}
          onRefresh={handleRefreshStatus}
          isRefreshing={refreshStatusMutation.isPending}
        />
        
        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <Tabs.TabPane tab="Overview" key="1">
            <DocumentOverviewTab document={document} />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="Version History" key="2">
            <DocumentVersionsTab document={document} />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="Comments" key="3">
            <DocumentCommentsTab document={document} />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="Timeline" key="4">
            <DocumentTimelineTab document={document} />
          </Tabs.TabPane>
        </Tabs>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DocumentDeleteDialog 
        document={document}
        open={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteDocumentMutation.isPending}
      />
      
      {/* Share Dialog */}
      <DocumentShareDialog 
        document={document}
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
    </>
  );
}