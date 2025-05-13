import React from 'react';
import { Typography, Card, Space, Spin, Result } from 'antd';
import { 
  FilePdfOutlined, 
  FileWordOutlined, 
  FileExcelOutlined, 
  FilePptOutlined, 
  FileImageOutlined, 
  FileTextOutlined,
  FileUnknownOutlined
} from '@ant-design/icons';
import { Document } from '@/types/document';

const { Text } = Typography;

interface DocumentPreviewProps {
  document: Document;
  isLoading?: boolean;
}

/**
 * Component for previewing document content
 * Handles different file types with appropriate previews
 */
export function DocumentPreview({ document, isLoading = false }: DocumentPreviewProps) {
  // Get file extension
  const getFileExtension = (filename?: string): string => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };
  
  // Get icon based on file type
  const getFileIcon = (filename?: string) => {
    const ext = getFileExtension(filename);
    
    const iconProps = { style: { fontSize: 64, color: '#1890ff' } };
    
    switch (ext) {
      case 'pdf':
        return <FilePdfOutlined {...iconProps} />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined {...iconProps} />;
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined {...iconProps} />;
      case 'ppt':
      case 'pptx':
        return <FilePptOutlined {...iconProps} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImageOutlined {...iconProps} />;
      case 'txt':
        return <FileTextOutlined {...iconProps} />;
      default:
        return <FileUnknownOutlined {...iconProps} />;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Card style={{ textAlign: 'center', padding: '48px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading document preview...</Text>
        </div>
      </Card>
    );
  }
  
  // Error state if document is missing required data
  if (!document || !document.id) {
    return (
      <Result
        status="warning"
        title="Document Preview Unavailable"
        subTitle="The document may have been deleted or you don't have permission to view it."
      />
    );
  }
  
  // Check if document is being processed
  if (document.processingStatus === 'PROCESSING' || document.processingStatus === 'PENDING') {
    return (
      <Card style={{ textAlign: 'center', padding: '48px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Processing document for preview...</Text>
        </div>
      </Card>
    );
  }
  
  // If document processing failed
  if (document.processingStatus === 'FAILED') {
    return (
      <Result
        status="error"
        title="Preview Generation Failed"
        subTitle="We couldn't generate a preview for this document. Please try downloading it instead."
      />
    );
  }
  
  // Default case - show placeholder with document info
  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
        {getFileIcon(document.filename)}
        
        <Space direction="vertical" align="center" style={{ marginTop: 24 }}>
          <Text strong>{document.filename || document.originalFilename || document.title}</Text>
          
          {document.fileSize && (
            <Text type="secondary">
              {`${(document.fileSize / 1024 / 1024).toFixed(2)} MB`}
            </Text>
          )}
          
          <Text type="secondary">
            {document.fileType || document.mimeType || getFileExtension(document.filename)}
          </Text>
        </Space>
        
        <div style={{ 
          marginTop: 32, 
          textAlign: 'center',
          padding: '16px',
          borderRadius: '4px',
          backgroundColor: '#f5f5f5',
          maxWidth: '80%'
        }}>
          <Text type="secondary">
            Preview not available. Please download the document to view its contents.
          </Text>
        </div>
      </div>
    </Card>
  );
}