import React from 'react';
import { Badge, Space } from 'antd';
import { 
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  WarningOutlined
} from '@ant-design/icons';

interface DocumentStatusBadgeProps {
  status?: string;
}

/**
 * Badge component for document processing status
 */
export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  if (!status) {
    return null;
  }
  
  switch (status) {
    case 'COMPLETED':
      return (
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <Badge status="success" text="Completed" />
        </Space>
      );
    case 'PROCESSING':
      return (
        <Space>
          <SyncOutlined spin style={{ color: '#1890ff' }} />
          <Badge status="processing" text="Processing" />
        </Space>
      );
    case 'PENDING':
      return (
        <Space>
          <ClockCircleOutlined style={{ color: '#faad14' }} />
          <Badge status="warning" text="Pending" />
        </Space>
      );
    case 'FAILED':
      return (
        <Space>
          <WarningOutlined style={{ color: '#f5222d' }} />
          <Badge status="error" text="Failed" />
        </Space>
      );
    default:
      return <Badge status="default" text={status} />;
  }
}