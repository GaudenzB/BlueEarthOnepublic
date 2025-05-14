import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { 
  Table, 
  Typography, 
  Button, 
  Dropdown, 
  Space, 
  Tooltip, 
  Skeleton, 
  Empty, 
  Modal, 
  message 
} from "antd";
import { 
  InfoCircleOutlined, 
  FileOutlined, 
  DownloadOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  EyeOutlined, 
  MoreOutlined,
  UploadOutlined
} from "@ant-design/icons";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import { queryClient } from "@/lib/queryClient";
// Import StatusTag dynamically in render functions to avoid circular dependencies

const { Text } = Typography;

interface DocumentListProps {
  documents: any[];
  isLoading: boolean;
  filter?: string;
}

export default function DocumentList({ documents, isLoading, filter = "all" }: DocumentListProps) {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, title: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  // Debug logging to help diagnose document data issues
  console.log('DocumentList component:', {
    receivedDocs: !!documents,
    docsIsArray: Array.isArray(documents),
    documentCount: Array.isArray(documents) ? documents.length : 0,
    sampleDoc: Array.isArray(documents) && documents.length > 0 ? documents[0] : null
  });

  const handleDeleteClick = (documentId: string, documentTitle: string) => {
    setDocumentToDelete({
      id: documentId,
      title: documentTitle || 'Untitled Document'
    });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete document');
      }
      
      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      toast({
        title: "Document deleted",
        description: `"${documentToDelete.title}" has been successfully deleted`,
        variant: "default",
      });
      
      message.success(`"${documentToDelete.title}" has been successfully deleted`);
    } catch (error: any) {
      toast({
        title: "Error deleting document",
        description: error.message || "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
      
      message.error(error.message || "Failed to delete the document. Please try again.");
      console.error('Error deleting document:', error);
    } finally {
      setIsDeleting(false);
      setDeleteModalVisible(false);
      setDocumentToDelete(null);
    }
  };

  const getDocumentTypeIcon = (type: string | null) => {
    switch (type) {
      case "CONTRACT":
        return <FileOutlined />;
      case "AGREEMENT":
        return <CheckCircleOutlined />;
      case "REPORT":
        return <InfoCircleOutlined />;
      case "POLICY":
        return <InfoCircleOutlined />;
      case "INVOICE":
        return <FileOutlined />;
      case "PRESENTATION":
        return <InfoCircleOutlined />;
      case "CORRESPONDENCE":
        return <InfoCircleOutlined />;
      default:
        return <FileOutlined />;
    }
  };

  const getProcessingStatusBadge = (status: string) => {
    // Map the document processing status to our StatusTag component status values
    let statusValue;
    let tooltipText;
    
    switch (status) {
      case "COMPLETED":
        statusValue = "completed";
        tooltipText = "Document processed successfully";
        break;
      case "PROCESSING":
        statusValue = "in_review";
        tooltipText = "Document is being processed";
        break;
      case "PENDING":
      case "QUEUED":
        statusValue = "pending";
        tooltipText = "Document is waiting for processing";
        break;
      case "FAILED":
      case "ERROR":
        statusValue = "rejected";
        tooltipText = "Document processing failed";
        break;
      default:
        statusValue = "draft";
        tooltipText = "Unknown document status";
    }
    
    // Import here to avoid circular dependency issues
    const StatusTag = require('@/components/ui/StatusTag').default;
    
    return (
      <Tooltip title={tooltipText}>
        <StatusTag status={statusValue} />
      </Tooltip>
    );
  };

  const filteredDocuments = useMemo(() => {
    if (filter === "all") {
      return documents;
    } else if (filter === "recent") {
      // Get documents from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return documents.filter(doc => 
        new Date(doc.createdAt) >= thirtyDaysAgo
      );
    } else {
      // Filter by document type
      return documents.filter(doc => doc.documentType === filter);
    }
  }, [documents, filter]);

  // Table columns configuration for Ant Design Table
  const columns: any = [
    {
      title: 'Name',
      dataIndex: 'title',
      key: 'title',
      width: '40%',
      render: (_, record) => (
        <Link href={`/documents/${record.id}`}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ marginRight: 8, color: '#666' }}>
              {getDocumentTypeIcon(record.documentType)}
            </span>
            <Typography.Text 
              style={{ 
                fontWeight: 500, 
                color: '#1E2A40',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 300,
              }}
              ellipsis={{ tooltip: record.title || record.originalFilename }}
            >
              {record.title || record.originalFilename}
            </Typography.Text>
          </div>
        </Link>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'documentType',
      key: 'documentType',
      render: (documentType) => {
        const StatusTag = require('@/components/ui/StatusTag').default;
        
        // Map document types to relevant statuses for styling purposes
        let statusType = "draft"; // Default styling
        
        if (documentType === "CONTRACT") statusType = "approved";
        else if (documentType === "POLICY") statusType = "pending";
        else if (documentType === "REPORT") statusType = "completed";
        
        return (
          <div style={{ maxWidth: 120 }}>
            <StatusTag 
              status={statusType} 
              text={documentType || "Other"} 
              size="small"
            />
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'processingStatus',
      key: 'processingStatus',
      render: (status) => getProcessingStatusBadge(status),
    },
    {
      title: 'Date Uploaded',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Typography.Text type="secondary" style={{ fontSize: 14 }}>
          {format(new Date(date), "MMM d, yyyy")}
        </Typography.Text>
      ),
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      render: (uploadedBy) => (
        <Typography.Text type="secondary" style={{ fontSize: 14 }}>
          {uploadedBy || "System"}
        </Typography.Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: (
                  <Link href={`/documents/${record.id}`}>
                    View
                  </Link>
                ),
                icon: <EyeOutlined />,
              },
              {
                key: 'download',
                label: (
                  <a href={`/api/documents/${record.id}/download`}>
                    Download
                  </a>
                ),
                icon: <DownloadOutlined />,
                disabled: !record.canDownload,
              },
              {
                key: 'replace',
                label: 'Replace',
                icon: <EditOutlined />,
                disabled: !record.canEdit,
              },
              {
                key: 'delete',
                label: 'Delete',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDeleteClick(record.id, record.title || record.originalFilename),
                disabled: !record.canDelete,
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    );
  }

  if (filteredDocuments.length === 0) {
    return (
      <Empty
        image={<FileOutlined style={{ fontSize: 48, color: '#ccc' }} />}
        description={
          <Space direction="vertical" size="small">
            <Typography.Text strong>No documents found</Typography.Text>
            <Typography.Text type="secondary">
              {filter === "all" 
                ? "No documents have been uploaded yet."
                : filter === "recent"
                  ? "No documents from the last 30 days."
                  : `No ${filter.toLowerCase()} documents found.`}
            </Typography.Text>
          </Space>
        }
      >
        <PermissionGuard area="documents" permission="edit">
          <Button type="primary" icon={<UploadOutlined />}>
            Upload your first document
          </Button>
        </PermissionGuard>
      </Empty>
    );
  }

  return (
    <>
      <Table 
        columns={columns}
        dataSource={filteredDocuments}
        rowKey="id"
        pagination={false}
        size="middle"
      />
      
      <Modal
        title="Confirm Document Deletion"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModalVisible(false)} disabled={isDeleting}>
            Cancel
          </Button>,
          <Button 
            key="delete" 
            type="primary" 
            danger
            onClick={handleConfirmDelete} 
            loading={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Document"}
          </Button>,
        ]}
      >
        <Typography.Paragraph>
          Are you sure you want to delete the following document?
        </Typography.Paragraph>
        {documentToDelete && (
          <Typography.Paragraph strong>
            "{documentToDelete.title}"
          </Typography.Paragraph>
        )}
        <Typography.Paragraph type="danger">
          This action cannot be undone and all associated data will be permanently removed.
        </Typography.Paragraph>
      </Modal>
    </>
  );
}