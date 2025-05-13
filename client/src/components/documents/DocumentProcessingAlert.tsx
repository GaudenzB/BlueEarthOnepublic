import React from 'react';
import { Alert, Progress, Space, Typography, Tag } from 'antd';
import { SyncOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Document } from '@/types/document';

const { Text } = Typography;

interface DocumentProcessingAlertProps {
  document: Document;
  processingStartTime?: string;
  estimatedTimeRemaining?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * Component to display document processing status with progress indicators
 */
export function DocumentProcessingAlert({ 
  document,
  processingStartTime,
  estimatedTimeRemaining,
  onRefresh,
  isRefreshing
}: DocumentProcessingAlertProps) {
  // Don't show alert if document is completed or not being processed
  if (!document.processingStatus || document.processingStatus === 'COMPLETED') {
    return null;
  }
  
  // Calculate estimated progress if available
  const getEstimatedProgress = (): number => {
    if (!processingStartTime || !estimatedTimeRemaining) {
      return 50; // Default to 50% if we can't calculate
    }
    
    const startTime = new Date(processingStartTime).getTime();
    const currentTime = new Date().getTime();
    const elapsedMs = currentTime - startTime;
    const totalEstimatedMs = estimatedTimeRemaining * 1000;
    
    // Calculate progress as percentage
    const progress = Math.min(Math.floor((elapsedMs / totalEstimatedMs) * 100), 99);
    
    // Return progress between 0-99 (never show 100% until COMPLETED)
    return progress;
  };
  
  // Get formatted time remaining
  const getTimeRemainingText = (): string => {
    if (!estimatedTimeRemaining) {
      return 'Processing time varies based on document size';
    }
    
    // More than a minute, show minutes
    if (estimatedTimeRemaining >= 60) {
      return `About ${Math.ceil(estimatedTimeRemaining / 60)} minutes remaining`;
    }
    
    // Less than a minute, show seconds
    return `About ${Math.ceil(estimatedTimeRemaining)} seconds remaining`;
  };
  
  // Alert configuration based on processing status
  let alertType: 'info' | 'warning' | 'error' | 'success' = 'info';
  let alertIcon = <SyncOutlined spin />;
  let alertTitle = 'Processing Document';
  let alertDescription = 'Your document is being processed. This may take a few moments.';
  
  // Status-specific configurations
  if (document.processingStatus === 'FAILED') {
    alertType = 'error';
    alertIcon = <WarningOutlined />;
    alertTitle = 'Processing Failed';
    alertDescription = document.processingError || 'An error occurred during document processing.';
    
  } else if (document.processingStatus === 'WARNING') {
    alertType = 'warning';
    alertIcon = <WarningOutlined />;
    alertTitle = 'Processing Complete with Warnings';
    alertDescription = document.processingError || 'The document was processed but with some warnings.';
    
  } else if (document.processingStatus === 'PENDING') {
    alertType = 'info';
    alertIcon = <ClockCircleOutlined />;
    alertTitle = 'Document Queued for Processing';
    alertDescription = 'Your document is in the queue and will be processed shortly.';
  }
  
  return (
    <Alert
      type={alertType}
      icon={alertIcon}
      message={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{alertTitle}</span>
          {document.processingStatus === 'PROCESSING' && (
            <Tag 
              icon={<SyncOutlined spin />} 
              color="processing"
              onClick={onRefresh}
              style={{ cursor: onRefresh ? 'pointer' : 'default' }}
            >
              {isRefreshing ? 'Refreshing...' : 'Processing'}
            </Tag>
          )}
          {document.processingStatus === 'PENDING' && (
            <Tag icon={<ClockCircleOutlined />} color="default">
              Pending
            </Tag>
          )}
          {document.processingStatus === 'FAILED' && (
            <Tag color="error">Failed</Tag>
          )}
          {document.processingStatus === 'WARNING' && (
            <Tag color="warning">Warning</Tag>
          )}
        </div>
      }
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>{alertDescription}</Text>
          
          {document.processingStatus === 'PROCESSING' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Progress 
                  percent={getEstimatedProgress()} 
                  status="active" 
                  strokeColor={{ 
                    from: '#108ee9', 
                    to: '#87d068' 
                  }}
                  style={{ width: 'calc(100% - 100px)' }}
                />
                {onRefresh && (
                  <Tag 
                    icon={isRefreshing ? <SyncOutlined spin /> : <SyncOutlined />} 
                    color="blue"
                    onClick={onRefresh}
                    style={{ cursor: 'pointer', marginLeft: 8 }}
                  >
                    {isRefreshing ? 'Refreshing' : 'Refresh'}
                  </Tag>
                )}
              </div>
              <Text type="secondary">{getTimeRemainingText()}</Text>
            </>
          )}
          
          {document.processingStatus === 'FAILED' && document.processingError && (
            <Text type="danger">{document.processingError}</Text>
          )}
        </Space>
      }
      style={{ marginBottom: 24 }}
    />
  );
}