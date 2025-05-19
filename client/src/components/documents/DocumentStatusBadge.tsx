import React from 'react';
import { Tooltip } from 'antd';
import { DocumentProcessingStatus } from '@shared/types';
import StatusTag, { StatusType } from '@/components/ui/StatusTag';

interface DocumentStatusBadgeProps {
  status?: DocumentProcessingStatus | string | undefined;
  showText?: boolean;
}

type StatusConfigType = {
  [key in DocumentProcessingStatus]: {
    statusValue: StatusType;  // Maps to our StatusTag component status values
    text: string;
    tooltip: string;
  };
};

/**
 * Status badge component for documents with consistent styling
 * Uses our centralized StatusTag component for visual consistency across the application
 */
export function DocumentStatusBadge({ 
  status,
  showText = true
}: DocumentStatusBadgeProps) {
  // Define status configurations with mapping to StatusTag statuses
  const statusConfig: StatusConfigType = {
    COMPLETED: { 
      statusValue: 'completed' as StatusType, 
      text: 'Completed',
      tooltip: 'Document has been processed successfully'
    },
    PROCESSING: { 
      statusValue: 'in_review' as StatusType, 
      text: 'Processing',
      tooltip: 'Document is currently being processed'
    },
    FAILED: { 
      statusValue: 'rejected' as StatusType, 
      text: 'Failed',
      tooltip: 'Document processing has failed'
    },
    WARNING: { 
      statusValue: 'expired' as StatusType, 
      text: 'Warning',
      tooltip: 'Document processed with warnings'
    },
    PENDING: { 
      statusValue: 'pending' as StatusType, 
      text: 'Pending',
      tooltip: 'Document is waiting to be processed'
    },
    QUEUED: { 
      statusValue: 'in_review' as StatusType, 
      text: 'Queued',
      tooltip: 'Document is queued for processing'
    },
    ERROR: { 
      statusValue: 'rejected' as StatusType, 
      text: 'Error',
      tooltip: 'An error occurred during document processing'
    }
  };
  
  // Default to PENDING if status is not recognized or not provided
  const safeStatus = status as DocumentProcessingStatus;
  const currentStatus = safeStatus && statusConfig[safeStatus] ? safeStatus : 'PENDING';
  const config = statusConfig[currentStatus];
  
  // Use our StatusTag component with standard styling
  return (
    <Tooltip title={config.tooltip}>
      <div style={{ display: 'inline-block' }}>
        <StatusTag 
          status={config.statusValue} 
          text={showText ? config.text : ""}
          size="medium"
        />
      </div>
    </Tooltip>
  );
}

