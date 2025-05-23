import React, { useRef, useEffect } from 'react';
import { Typography, Card, Space, Spin, Result, Button, Progress, Skeleton, Image } from 'antd';
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

// CSS for animations
const fadeInAnimation = `
  @keyframes fadeIn {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }
  
  .stagger-item-1 { animation-delay: 0.1s; }
  .stagger-item-2 { animation-delay: 0.2s; }
  .stagger-item-3 { animation-delay: 0.3s; }
  .stagger-item-4 { animation-delay: 0.4s; }
`;

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
 * Enhanced with fade-in animations for better user experience
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
  // Reference to component for animation
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Apply animations when component mounts
  useEffect(() => {
    // Allow animations to trigger on component mount
    const timer = setTimeout(() => {
      if (previewRef.current) {
        previewRef.current.style.opacity = '1';
        previewRef.current.classList.add('fade-in');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // We're using props for loading and error states instead of internal state
  // This is a comment to document the design decision
  
  // Get file extension
  const getFileExtension = (filename?: string): string => {
    if (!filename) return '';
    try {
      // Split filename by dot and get the last part as extension
      const parts = filename.split('.');
      
      // Safety check for empty parts array
      if (!parts || parts.length <= 1) return '';
      
      // Get the last part and convert to lowercase
      const extension = parts[parts.length - 1];
      return extension ? extension.toLowerCase() : '';
    } catch (error) {
      console.error('Error getting file extension:', error);
      return '';
    }
  };
  
  // Get icon based on file type
  const getFileIcon = (filename?: string) => {
    const ext = getFileExtension(filename);
    
    const iconProps = { style: { fontSize: 64, color: '#1890ff' as string } };
    
    switch (ext) {
      case 'pdf': // Fall through
       // Fall through
       return <FilePdfOutlined {...iconProps} />;
      case 'doc': // Fall through
       // Fall through
       // Fall through
      case 'docx': // Fall through
       // Fall through
       return <FileWordOutlined {...iconProps} />;
      case 'xls': // Fall through
       // Fall through
       // Fall through
      case 'xlsx': // Fall through
       // Fall through
       return <FileExcelOutlined {...iconProps} />;
      case 'ppt': // Fall through
       // Fall through
       // Fall through
      case 'pptx': // Fall through
       // Fall through
       return <FilePptOutlined {...iconProps} />;
      case 'jpg': // Fall through
       // Fall through
       // Fall through
      case 'jpeg': // Fall through
       // Fall through
       // Fall through
      case 'png': // Fall through
       // Fall through
       // Fall through
      case 'gif': // Fall through
       // Fall through
       return <FileImageOutlined {...iconProps} />;
      case 'txt': // Fall through
       // Fall through
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
        <div className="fade-in stagger-item-1">
          {getFileIcon(document.filename)}
        </div>
        
        <Space direction="vertical" align="center" style={{ marginTop: 24 as number }} className="fade-in stagger-item-2">
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
        
        <div style={{ marginTop: 32 as number }} className="fade-in stagger-item-3">
          {canPreview ? (
            <Button 
              type="primary" 
              icon={<EyeOutlined />} 
              onClick={onViewFullScreen}
              className="bg-link hover:bg-link/90"
            >
              View Document
            </Button>
          ) : onDownload && (
            <Button 
              icon={<DownloadOutlined />} 
              onClick={onDownload}
              className="text-link hover:text-link/90 border-link hover:border-link/90"
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
        <div style={{ marginTop: 16 as number }}>
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
          icon={<WarningOutlined style={{ fontSize: 48, color: '#faad14' as string }} />}
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
        <div style={{ marginTop: 24 as number }}>
          <Text strong style={{ fontSize: 16 }}>
            {isProcessing ? 'Processing Document' : 'Document in Queue'}
          </Text>
          <div style={{ marginTop: 16 as number, marginBottom: 24 as number }}>
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
              <div style={{ marginTop: 8 as number }}>
                <Text type="secondary">
                  Estimated time remaining: {estimatedProcessingTime > 60 
                    ? `${Math.ceil(estimatedProcessingTime / 60)} minutes` 
                    : `${estimatedProcessingTime} seconds`}
                </Text>
              </div>
            </div>
          )}
          
          {onRefresh && (
            <div style={{ marginTop: 24 as number }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={onRefresh}
                loading={isLoading}
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
  if (document.processingStatus === 'FAILED' || previewError) {
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
            <WarningOutlined style={{ marginRight: 8 as number }} />
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
      <style>{fadeInAnimation}</style>
      <div ref={previewRef} className="opacity-0" style={{ transition: 'opacity 0.4s ease-out' }}>
        {renderPreviewContent()}
      </div>
    </Card>
  );
}