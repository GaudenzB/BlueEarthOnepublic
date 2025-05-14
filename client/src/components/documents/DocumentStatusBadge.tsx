import React from 'react';
import { Tooltip } from 'antd';
import { DocumentProcessingStatus } from '@/types/document';
import StatusTag from '@/components/ui/StatusTag';

interface DocumentStatusBadgeProps {
  status?: DocumentProcessingStatus | string | undefined;
  showText?: boolean;
}

type StatusConfigType = {
  [key in DocumentProcessingStatus]: {
    statusValue: string;  // Maps to our StatusTag component status values
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
      statusValue: 'completed', 
      text: 'Completed',
      tooltip: 'Document has been processed successfully'
    },
    PROCESSING: { 
      statusValue: 'in_review', 
      text: 'Processing',
      tooltip: 'Document is currently being processed'
    },
    FAILED: { 
      statusValue: 'rejected', 
      text: 'Failed',
      tooltip: 'Document processing has failed'
    },
    WARNING: { 
      statusValue: 'expired', 
      text: 'Warning',
      tooltip: 'Document processed with warnings'
    },
    PENDING: { 
      statusValue: 'pending', 
      text: 'Pending',
      tooltip: 'Document is waiting to be processed'
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
          text={showText ? config.text : undefined}
          size="default"
        />
      </div>
    </Tooltip>
  );
}

