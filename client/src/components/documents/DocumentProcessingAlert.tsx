import React, { useState, useEffect } from 'react';
import { Alert, Progress, Space, Typography, Tag, Button } from 'antd';
import { 
  SyncOutlined, 
  ClockCircleOutlined, 
  WarningOutlined,
  ReloadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
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
  // State for auto-refresh feature
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5 seconds default
  
  // Auto-refresh effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (autoRefresh && onRefresh && 
        (document.processingStatus === 'PROCESSING' || document.processingStatus === 'PENDING')) {
      timer = setInterval(() => {
        if (!isRefreshing) {
          onRefresh();
          setLastRefreshTime(Date.now());
        }
      }, refreshInterval);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoRefresh, onRefresh, isRefreshing, document.processingStatus, refreshInterval]);
  
  // Update refresh interval based on processing status
  useEffect(() => {
    if (document.processingStatus === 'PENDING') {
      setRefreshInterval(7000); // Longer interval for pending
    } else if (document.processingStatus === 'PROCESSING') {
      setRefreshInterval(3000); // Shorter interval for processing
    }
  }, [document.processingStatus]);
  
  // Calculate time since last refresh in seconds
  const getTimeSinceLastRefresh = (): number => {
    return Math.floor((Date.now() - lastRefreshTime) / 1000);
  };
  
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
  
  // Function to handle auto-refresh toggle
  const handleAutoRefreshToggle = () => {
    setAutoRefresh(prev => !prev);
    if (!autoRefresh && onRefresh) {
      onRefresh();
      setLastRefreshTime(Date.now());
    }
  };
  
  // Function to handle manual refresh
  const handleManualRefresh = () => {
    if (onRefresh && !isRefreshing) {
      onRefresh();
      setLastRefreshTime(Date.now());
    }
  };
  
  // Alert configuration based on processing status
  let alertType: 'info' | 'warning' | 'error' | 'success' = 'info';
  let alertIcon = <SyncOutlined spin />;
  let alertTitle = 'Processing Document';
  let alertDescription = 'Your document is being processed. This may take a few moments.';
  let showProgressBar = false;
  let showAutoRefresh = false;
  let showRetry = false;
  
  // Status-specific configurations
  if (document.processingStatus === 'FAILED') {
    alertType = 'error';
    alertIcon = <WarningOutlined />;
    alertTitle = 'Processing Failed';
    alertDescription = document.processingError || 'An error occurred during document processing.';
    showRetry = true;
    
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
    showAutoRefresh = true;
    
  } else if (document.processingStatus === 'PROCESSING') {
    alertType = 'info';
    alertIcon = <SyncOutlined spin />;
    alertTitle = 'Processing Document';
    alertDescription = 'Your document is being processed. This may take a few moments.';
    showProgressBar = true;
    showAutoRefresh = true;
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
          
          {/* Processing status with progress bar */}
          {showProgressBar && (
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
                    onClick={handleManualRefresh}
                    style={{ cursor: 'pointer', marginLeft: 8 }}
                  >
                    {isRefreshing ? 'Refreshing' : 'Refresh'}
                  </Tag>
                )}
              </div>
              <Text type="secondary">{getTimeRemainingText()}</Text>
            </>
          )}
          
          {/* Auto-refresh toggle for pending or processing status */}
          {showAutoRefresh && onRefresh && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
              <Button 
                type="text"
                size="small"
                icon={autoRefresh ? <CheckCircleOutlined /> : <ReloadOutlined />}
                onClick={handleAutoRefreshToggle}
                style={{ 
                  padding: '0 8px',
                  color: autoRefresh ? '#52c41a' : '#1890ff'
                }}
              >
                {autoRefresh ? 'Auto-refresh on' : 'Turn on auto-refresh'}
              </Button>
              {autoRefresh && (
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  {isRefreshing 
                    ? 'Refreshing...' 
                    : `Last refresh: ${getTimeSinceLastRefresh()}s ago`}
                </Text>
              )}
            </div>
          )}
          
          {/* Retry button for failed status */}
          {showRetry && onRefresh && (
            <div style={{ marginTop: 12 }}>
              <Button 
                type="primary" 
                danger
                icon={<ReloadOutlined />}
                onClick={handleManualRefresh}
                loading={isRefreshing ? true : false}
              >
                Retry Processing
              </Button>
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
                You can try processing this document again
              </Text>
            </div>
          )}
          
          {/* Show detailed error message for failed documents */}
          {document.processingStatus === 'FAILED' && document.processingError && (
            <div style={{ marginTop: 12, padding: 12, background: '#fff1f0', borderRadius: 4 }}>
              <Text type="danger" strong>Error details:</Text>
              <Text type="danger" style={{ display: 'block', marginTop: 4 }}>
                {document.processingError}
              </Text>
            </div>
          )}
        </Space>
      }
      style={{ marginBottom: 24 }}
    />
  );
}