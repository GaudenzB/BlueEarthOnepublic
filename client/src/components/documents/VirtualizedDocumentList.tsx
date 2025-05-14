import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { 
  Typography, 
  Tag, 
  Button, 
  Dropdown, 
  Space, 
  Tooltip, 
  Skeleton, 
  Empty, 
  Modal, 
  message 
} from "antd";
import { FixedSizeList as List } from 'react-window';
import { 
  InfoCircleOutlined, 
  FileOutlined, 
  DownloadOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  WarningOutlined, 
  ClockCircleOutlined,
  MoreOutlined,
  UploadOutlined
} from "@ant-design/icons";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import { queryClient } from "@/lib/queryClient";
import { Button as ShadcnButton } from "@/components/ui/button";

const { Text } = Typography;

interface Document {
  id: string;
  title: string;
  documentType: string;
  processingStatus: string;
  createdAt: string;
  uploadedBy: string;
  originalFilename?: string;
  canDownload?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

interface VirtualizedDocumentListProps {
  documents: Document[];
  isLoading: boolean;
  filter?: string;
  height?: number;
  itemSize?: number;
}

export default function VirtualizedDocumentList({ 
  documents, 
  isLoading, 
  filter = "all",
  height = 600,
  itemSize = 60
}: VirtualizedDocumentListProps) {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, title: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
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
    switch (status) {
      case "COMPLETED":
        return (
          <Tooltip title="Document processed successfully">
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Processed
            </Tag>
          </Tooltip>
        );
      case "PROCESSING":
        return (
          <Tooltip title="Document is being processed">
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              Processing
            </Tag>
          </Tooltip>
        );
      case "PENDING":
      case "QUEUED":
        return (
          <Tooltip title="Document is waiting for processing">
            <Tag color="processing" icon={<ClockCircleOutlined />}>
              Pending
            </Tag>
          </Tooltip>
        );
      case "FAILED":
      case "ERROR":
        return (
          <Tooltip title="Document processing failed">
            <Tag color="error" icon={<WarningOutlined />}>
              Failed
            </Tag>
          </Tooltip>
        );
      default:
        return (
          <Tooltip title="Unknown document status">
            <Tag icon={<InfoCircleOutlined />}>
              Unknown
            </Tag>
          </Tooltip>
        );
    }
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

  const rowRenderer = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const document = filteredDocuments[index];
    
    return (
      <div style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid #f0f0f0',
        background: index % 2 === 0 ? '#ffffff' : '#fafafa'
      }}>
        {/* Document title and icon */}
        <div style={{ flex: 3, maxWidth: '40%', overflow: 'hidden' }}>
          <Link href={`/documents/${document.id}`}>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ marginRight: 8, color: '#666' }}>
                {getDocumentTypeIcon(document.documentType)}
              </span>
              <Typography.Text 
                style={{ 
                  fontWeight: 500, 
                  color: '#1E2A40',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 200,
                }}
                ellipsis={{ tooltip: document.title || document.originalFilename }}
              >
                {document.title || document.originalFilename}
              </Typography.Text>
            </div>
          </Link>
        </div>
        
        {/* Document type */}
        <div style={{ flex: 1 }}>
          <Tag color="default">
            {document.documentType || "Other"}
          </Tag>
        </div>
        
        {/* Processing status */}
        <div style={{ flex: 1 }}>
          {getProcessingStatusBadge(document.processingStatus)}
        </div>
        
        {/* Created at */}
        <div style={{ flex: 1 }}>
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            {document.createdAt ? format(new Date(document.createdAt), "MMM d, yyyy") : ""}
          </Typography.Text>
        </div>
        
        {/* Uploaded by */}
        <div style={{ flex: 1 }}>
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            {document.uploadedBy || "System"}
          </Typography.Text>
        </div>
        
        {/* Actions dropdown */}
        <div style={{ width: 50 }}>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  label: (
                    <Link href={`/documents/${document.id}`}>
                      View
                    </Link>
                  ),
                  icon: <EyeOutlined />,
                },
                {
                  key: 'download',
                  label: (
                    <a href={`/api/documents/${document.id}/download`}>
                      Download
                    </a>
                  ),
                  icon: <DownloadOutlined />,
                  disabled: !document.canDownload,
                },
                {
                  key: 'replace',
                  label: 'Replace',
                  icon: <EditOutlined />,
                  disabled: !document.canEdit,
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDeleteClick(document.id, document.title || document.originalFilename || ""),
                  disabled: !document.canDelete,
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </div>
      </div>
    );
  };

  // Table header row
  const HeaderRow = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '16px',
      borderBottom: '1px solid #f0f0f0',
      fontWeight: 'bold',
      background: '#fafafa'
    }}>
      <div style={{ flex: 3, maxWidth: '40%' }}>Name</div>
      <div style={{ flex: 1 }}>Type</div>
      <div style={{ flex: 1 }}>Status</div>
      <div style={{ flex: 1 }}>Date Uploaded</div>
      <div style={{ flex: 1 }}>Uploaded By</div>
      <div style={{ width: 50 }}>Actions</div>
    </div>
  );

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
      <div style={{ width: '100%' }}>
        <HeaderRow />
        <List
          height={Math.min(height, filteredDocuments.length * itemSize + 2)}
          itemCount={filteredDocuments.length}
          itemSize={itemSize}
          width="100%"
        >
          {rowRenderer}
        </List>
      </div>
      
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