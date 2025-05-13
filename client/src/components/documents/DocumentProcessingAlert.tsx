import React from 'react';
import { Alert, Button, Space } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { Document } from '@/types/document';

interface DocumentProcessingAlertProps {
  document: Document;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Alert component shown when a document is being processed
 */
export function DocumentProcessingAlert({ 
  document, 
  onRefresh, 
  isRefreshing 
}: DocumentProcessingAlertProps) {
  // Don't show for completed or errored documents
  if (document.processingStatus !== 'PROCESSING' && document.processingStatus !== 'PENDING') {
    return null;
  }
  
  return (
    <Alert
      type="info"
      message="Document Processing"
      description={
        <>
          <p>
            This document is currently being processed. Document information and preview 
            will be available once processing is complete.
          </p>
          <Space>
            <Button 
              type="primary" 
              size="small" 
              onClick={onRefresh}
              loading={isRefreshing}
              icon={<SyncOutlined />}
            >
              Refresh Status
            </Button>
          </Space>
        </>
      }
      style={{ marginBottom: 24 }}
    />
  );
}