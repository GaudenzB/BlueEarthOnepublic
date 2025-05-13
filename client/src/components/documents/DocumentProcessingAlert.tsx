import React from "react";
import { Alert, Button, Progress } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { Document } from "@/types/document";

interface DocumentProcessingAlertProps {
  document: Document;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Helper to get processing status text
 */
function getProcessingStatusText(status: string): string {
  switch (status) {
    case "PROCESSING":
      return "Your document is currently being processed. This may take a few minutes.";
    case "PENDING":
      return "Your document is pending processing. It will be processed shortly.";
    case "QUEUED":
      return "Your document is in the processing queue. Processing will begin soon.";
    default:
      return "Document status is being updated...";
  }
}

/**
 * Helper to get processing progress percentage
 */
function getProcessingProgress(status: string): number {
  switch (status) {
    case "PROCESSING":
      return 75;
    case "PENDING":
      return 25;
    case "QUEUED":
      return 10;
    default:
      return 0;
  }
}

/**
 * Alert displayed when document is being processed
 */
export function DocumentProcessingAlert({ 
  document, 
  onRefresh, 
  isRefreshing 
}: DocumentProcessingAlertProps) {
  if (!['PROCESSING', 'PENDING', 'QUEUED'].includes(document.processingStatus)) {
    return null;
  }

  return (
    <Alert
      type="info"
      showIcon
      message="Document Processing"
      description={
        <div>
          <div>{getProcessingStatusText(document.processingStatus)}</div>
          <Progress 
            style={{ marginTop: 8 }}
            percent={getProcessingProgress(document.processingStatus)} 
            status="active"
          />
        </div>
      }
      action={
        <Button 
          size="small" 
          type="text"
          icon={<SyncOutlined />}
          onClick={onRefresh}
          loading={isRefreshing}
        >
          Refresh
        </Button>
      }
      style={{ marginBottom: 24 }}
    />
  );
}