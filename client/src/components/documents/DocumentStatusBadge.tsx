import React from "react";
import { Badge } from "antd";

interface DocumentStatusBadgeProps {
  status: string;
}

/**
 * Component to display document processing status as a badge
 */
export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  switch (status) {
    case "COMPLETED":
      return <Badge status="success" text="Completed" />;
    case "APPROVED":
      return <Badge status="success" text="Approved" />;
    case "PROCESSING":
      return <Badge status="processing" text="Processing" />;
    case "PENDING":
      return <Badge status="warning" text="Pending" />;
    case "QUEUED":
      return <Badge status="warning" text="Queued" />;
    case "REJECTED":
      return <Badge status="error" text="Rejected" />;
    case "ERROR":
      return <Badge status="error" text="Error" />;
    default:
      return <Badge status="default" text={status || "Unknown"} />;
  }
}