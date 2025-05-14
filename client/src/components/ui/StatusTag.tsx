import React from 'react';
import { Tag } from 'antd';
import { 
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  StopOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { theme } from '@/lib/theme';

export interface StatusTagProps {
  /**
   * The status value (e.g., 'active', 'inactive', 'on_leave', 'remote', 'draft', etc.)
   */
  status: string;

  /**
   * Optional className for additional styling
   */
  className?: string;

  /**
   * Optional custom icon to override the default icon for the status
   */
  icon?: React.ReactNode;

  /**
   * Optional custom text to override the default text for the status
   */
  text?: string;

  /**
   * Optional size of the tag. Default is 'default'
   */
  size?: 'small' | 'default' | 'large';
}

/**
 * StatusTag Component
 * 
 * A standardized component to display entity status across the application.
 * Provides consistent styling and representation of various status types.
 * 
 * @example
 * <StatusTag status="active" />
 * <StatusTag status="in_review" text="Under Review" />
 */
export const StatusTag: React.FC<StatusTagProps> = ({ 
  status, 
  className = '', 
  icon: customIcon, 
  text: customText,
  size = 'default'
}) => {
  // Get status configuration based on status value
  let color = "default";
  let statusIcon = <StopOutlined />;
  let statusText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
  
  // Handle based on specific status values
  const lowercaseStatus = status.toLowerCase();
  
  // Employee statuses
  if (lowercaseStatus === 'active') {
    color = "success";
    statusIcon = <CheckCircleOutlined />;
    statusText = 'Active';
  } else if (lowercaseStatus === 'inactive') {
    color = "default";
    statusIcon = <StopOutlined />;
    statusText = 'Inactive';
  } else if (lowercaseStatus === 'on_leave') {
    color = "warning";
    statusIcon = <ClockCircleOutlined />;
    statusText = 'On Leave';
  } else if (lowercaseStatus === 'remote') {
    color = "processing";
    statusIcon = <GlobalOutlined />;
    statusText = 'Remote';
  }
  // Document statuses
  else if (lowercaseStatus === 'draft') {
    color = "default";
    statusIcon = <FileTextOutlined />;
    statusText = 'Draft';
  } else if (lowercaseStatus === 'in_review') {
    color = "processing";
    statusIcon = <ClockCircleOutlined />;
    statusText = 'In Review';
  } else if (lowercaseStatus === 'pending') {
    color = "processing";
    statusIcon = <ClockCircleOutlined />;
    statusText = 'Pending';
  } else if (lowercaseStatus === 'approved') {
    color = "success";
    statusIcon = <CheckCircleOutlined />;
    statusText = 'Approved';
  } else if (lowercaseStatus === 'completed') {
    color = "success";
    statusIcon = <CheckCircleOutlined />;
    statusText = 'Completed';
  } else if (lowercaseStatus === 'rejected') {
    color = "error";
    statusIcon = <ExclamationCircleOutlined />;
    statusText = 'Rejected';
  } else if (lowercaseStatus === 'expired') {
    color = "warning";
    statusIcon = <WarningOutlined />;
    statusText = 'Expired';
  }
  
  return (
    <Tag
      color={color}
      icon={customIcon || statusIcon}
      className={className}
      style={{
        borderRadius: '9999px', // Using direct value instead of theme to avoid any issues
        textTransform: 'lowercase',
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: size === 'small' ? theme.typography.fontSize.xs : 
                 size === 'large' ? theme.typography.fontSize.sm :
                 theme.typography.fontSize.xs,
        padding: size === 'small' ? '0 8px' : 
                size === 'large' ? '4px 12px' : 
                '2px 10px',
        lineHeight: size === 'small' ? '18px' : 
                   size === 'large' ? '24px' : 
                   '20px',
      }}
    >
      {customText || statusText}
    </Tag>
  );
};

export default StatusTag;