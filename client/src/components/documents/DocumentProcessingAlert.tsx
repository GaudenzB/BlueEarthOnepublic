import React from 'react';
import { Alert, Button, Space, Progress, Typography } from 'antd';
import { SyncOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Document } from '@/types/document';

interface DocumentProcessingAlertProps {
  document: Document;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const { Text } = Typography;

/**
 * Alert component shown when a document is being processed
 * Displays different progress levels based on status
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
  
  // Calculate estimated progress
  const isProcessing = document.processingStatus === 'PROCESSING';
  const isPending = document.processingStatus === 'PENDING';
  
  // Estimate progress based on status (in a real app this would come from the API)
  const progressPercent = isProcessing ? 65 : (isPending ? 25 : 0);
  
  // Get steps based on status
  const steps = [
    { title: 'Queued', complete: true, icon: <FileTextOutlined /> },
    { title: 'Analyzing Document', complete: isProcessing || isPending, icon: <SyncOutlined spin={isProcessing} /> },
    { title: 'Processing Complete', complete: false, icon: <CheckCircleOutlined /> }
  ];
  
  return (
    <Alert
      type="info"
      message="Document Processing"
      description={
        <>
          <p>
            This document is currently being {isPending ? 'prepared' : 'processed'}. 
            Document information and preview will be available once processing is complete.
            {isProcessing && ' The system is analyzing the document content and generating metadata.'}
          </p>
          
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <Progress percent={progressPercent} status="active" />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: 12,
              marginBottom: 16
            }}>
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    opacity: step.complete ? 1 : 0.5
                  }}
                >
                  <div style={{ marginBottom: 4 }}>
                    {step.icon}
                  </div>
                  <Text strong={step.complete}>
                    {step.title}
                  </Text>
                </div>
              ))}
            </div>
          </div>
          
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
            <Text type="secondary">
              {isPending 
                ? 'Your document is in the processing queue.' 
                : 'Processing should complete within a few minutes.'
              }
            </Text>
          </Space>
        </>
      }
      style={{ marginBottom: 24 }}
    />
  );
}