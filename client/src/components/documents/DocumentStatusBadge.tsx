import React from 'react';
import { Badge, Tooltip } from 'antd';
import { CheckCircleOutlined, WarningOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { DocumentProcessingStatus } from '@/types/document';

interface DocumentStatusBadgeProps {
  status?: DocumentProcessingStatus | string | undefined;
  showText?: boolean;
}

type StatusConfigType = {
  [key in DocumentProcessingStatus]: {
    color: 'success' | 'processing' | 'error' | 'warning' | 'default';
    icon: React.ReactNode;
    text: string;
    tooltip: string;
  };
};

/**
 * Status badge component for documents with consistent styling
 */
export function DocumentStatusBadge({ 
  status,
  showText = true
}: DocumentStatusBadgeProps) {
  // Define status configurations
  const statusConfig: StatusConfigType = {
    COMPLETED: { 
      color: 'success', 
      icon: <CheckCircleOutlined />, 
      text: 'Completed',
      tooltip: 'Document has been processed successfully'
    },
    PROCESSING: { 
      color: 'processing', 
      icon: <ClockCircleOutlined />, 
      text: 'Processing',
      tooltip: 'Document is currently being processed'
    },
    FAILED: { 
      color: 'error', 
      icon: <CloseCircleOutlined />, 
      text: 'Failed',
      tooltip: 'Document processing has failed'
    },
    WARNING: { 
      color: 'warning', 
      icon: <WarningOutlined />, 
      text: 'Warning',
      tooltip: 'Document processed with warnings'
    },
    PENDING: { 
      color: 'default', 
      icon: <ClockCircleOutlined />, 
      text: 'Pending',
      tooltip: 'Document is waiting to be processed'
    }
  };
  
  // Default to PENDING if status is not recognized or not provided
  const safeStatus = status as DocumentProcessingStatus;
  const currentStatus = safeStatus && statusConfig[safeStatus] ? safeStatus : 'PENDING';
  const config = statusConfig[currentStatus];
  
  return (
    <Tooltip title={config.tooltip}>
      <Badge
        status={config.color}
        text={showText ? config.text : ''}
      />
    </Tooltip>
  );
}

