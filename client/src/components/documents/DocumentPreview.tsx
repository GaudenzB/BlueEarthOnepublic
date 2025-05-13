import React, { useState } from 'react';
import { Typography, Card, Space, Spin, Result, Button, Empty, Progress, Skeleton, Image } from 'antd';
import { 
  FilePdfOutlined, 
  FileWordOutlined, 
  FileExcelOutlined, 
  FilePptOutlined, 
  FileImageOutlined, 
  FileTextOutlined,
  FileUnknownOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { Document } from '@/types/document';

const { Text } = Typography;

interface DocumentPreviewProps {
  document: Document;
  isLoading?: boolean;
  onDownload?: () => void;
  onRefresh?: () => void;
  onViewFullScreen?: () => void;
  previewUrl?: string;
  showFullPreview?: boolean;
  previewError?: string;
  canPreview?: boolean;
  estimatedProcessingTime?: number;
}

/**
 * Component for previewing document content
 * Handles different file types with appropriate previews
 */
export function DocumentPreview({ 
  document, 
  isLoading = false,
  onDownload,
  onRefresh,
  onViewFullScreen,
  previewUrl,
  showFullPreview = false,
  previewError,
  canPreview = false,
  estimatedProcessingTime
}: DocumentPreviewProps) {
  // State for tracking preview loading
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewFailed, setPreviewFailed] = useState<boolean>(false);
  
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
  
  // Function to render appropriate preview content based on file type
  const renderPreviewContent = () => {
    // If we have an explicit preview URL
    if (previewUrl) {
      const fileExt = getFileExtension(document.filename);
      
      // Handle image files
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
        return (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <Image
              src={previewUrl}
              alt={document.title || 'Document preview'}
              style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
              placeholder={<Skeleton.Image style={{ width: '100%', height: '400px' }} active />}
              fallback="/placeholder-image.png"
              preview={showFullPreview}
            />
          </div>
        );
      }
      
      // Handle PDF files
      if (fileExt === 'pdf') {
        return (
          <div style={{ height: '600px', width: '100%', overflow: 'hidden' }}>
            <iframe
              src={previewUrl}
              title={document.title || 'PDF preview'}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          </div>
        );
      }
      
      // Default case for other previewable files
      return (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            {getFileIcon(document.filename)}
          </div>
          <Text>Preview available. Click below to view full document.</Text>
          <div style={{ marginTop: '16px' }}>
            <Button 
              type="primary"
              icon={<EyeOutlined />}
              onClick={onViewFullScreen}
            >
              Open Full Preview
            </Button>
          </div>
        </div>
      );
    }
    
    // Default case - show placeholder with document info
    return (
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
        
        <div style={{ marginTop: 32 }}>
          {canPreview ? (
            <Button 
              type="primary" 
              icon={<EyeOutlined />} 
              onClick={onViewFullScreen}
            >
              View Document
            </Button>
          ) : onDownload && (
            <Button 
              icon={<DownloadOutlined />} 
              onClick={onDownload}
            >
              Download to View
            </Button>
          )}
        </div>
      </div>
    );
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
      <Card>
        <EmptyState 
          title="Document Not Found"
          description="The document may have been deleted or you don't have permission to view it."
          type="default"
          size="large"
          icon={<WarningOutlined style={{ fontSize: 48, color: '#faad14' }} />}
        />
      </Card>
    );
  }
  
  // Check if document is being processed
  if (document.processingStatus === 'PROCESSING' || document.processingStatus === 'PENDING') {
    const isProcessing = document.processingStatus === 'PROCESSING';
    
    return (
      <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 24 }}>
          <Text strong style={{ fontSize: 16 }}>
            {isProcessing ? 'Processing Document' : 'Document in Queue'}
          </Text>
          <div style={{ marginTop: 16, marginBottom: 24 }}>
            <Text>
              {isProcessing 
                ? 'We are preparing your document for preview. This may take a few moments.' 
                : 'Your document is waiting to be processed. It will begin shortly.'}
            </Text>
          </div>
          
          {isProcessing && estimatedProcessingTime && (
            <div style={{ width: '80%', margin: '0 auto' }}>
              <Progress 
                percent={Math.min(90, Math.floor(Math.random() * 80) + 10)} 
                status="active" 
                strokeColor={{ from: '#108ee9', to: '#87d068' }} 
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  Estimated time remaining: {estimatedProcessingTime > 60 
                    ? `${Math.ceil(estimatedProcessingTime / 60)} minutes` 
                    : `${estimatedProcessingTime} seconds`}
                </Text>
              </div>
            </div>
          )}
          
          {onRefresh && (
            <div style={{ marginTop: 24 }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={onRefresh}
                loading={previewLoading}
              >
                Refresh Status
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // If document processing failed or explicit preview error
  if (document.processingStatus === 'FAILED' || previewError || previewFailed) {
    const errorMessage = previewError || document.processingError || 'Could not generate a preview for this document.';
    
    return (
      <Card>
        <Result
          status="error"
          title="Preview Generation Failed"
          subTitle={errorMessage}
          extra={[
            onRefresh && (
              <Button 
                key="retry" 
                icon={<ReloadOutlined />} 
                onClick={onRefresh}
              >
                Retry Preview
              </Button>
            ),
            onDownload && (
              <Button 
                key="download" 
                type="primary" 
                icon={<DownloadOutlined />} 
                onClick={onDownload}
              >
                Download Document
              </Button>
            )
          ].filter(Boolean)}
        />
      </Card>
    );
  }
  
  // Check if document has a warning state
  if (document.processingStatus === 'WARNING') {
    return (
      <Card>
        <div style={{ padding: '16px', marginBottom: '24px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px' }}>
          <Text type="warning" strong>
            <WarningOutlined style={{ marginRight: 8 }} />
            Warning: {document.processingError || 'This document was processed with warnings.'}
          </Text>
        </div>
        {renderPreviewContent()}
      </Card>
    );
  }
  
  // Normal preview
  return (
    <Card>
      {renderPreviewContent()}
    </Card>
  );
}