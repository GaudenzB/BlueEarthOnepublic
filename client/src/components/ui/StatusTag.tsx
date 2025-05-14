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
 * Maps status values to their display configuration (color, icon, text)
 */
export const getStatusConfig = (status: string) => {
  const lowercaseStatus = status.toLowerCase();

  switch (lowercaseStatus) {
    // Employee statuses
    case 'active':
      return { 
        color: "success", 
        icon: <CheckCircleOutlined />, 
        text: 'Active' 
      };
    case 'inactive':
      return { 
        color: "default", 
        icon: <StopOutlined />, 
        text: 'Inactive' 
      };
    case 'on_leave':
      return { 
        color: "warning", 
        icon: <ClockCircleOutlined />, 
        text: 'On Leave' 
      };
    case 'remote':
      return { 
        color: "processing", 
        icon: <GlobalOutlined />, 
        text: 'Remote' 
      };
    
    // Document statuses
    case 'draft':
      return { 
        color: "default", 
        icon: <FileTextOutlined />, 
        text: 'Draft' 
      };
    case 'in_review':
    case 'pending':
      return { 
        color: "processing", 
        icon: <ClockCircleOutlined />, 
        text: lowercaseStatus === 'in_review' ? 'In Review' : 'Pending' 
      };
    case 'approved':
    case 'completed':
      return { 
        color: "success", 
        icon: <CheckCircleOutlined />, 
        text: lowercaseStatus === 'approved' ? 'Approved' : 'Completed' 
      };
    case 'rejected':
      return { 
        color: "error", 
        icon: <ExclamationCircleOutlined />, 
        text: 'Rejected' 
      };
    case 'expired':
      return { 
        color: "warning", 
        icon: <WarningOutlined />, 
        text: 'Expired' 
      };
    
    // Default case
    default:
      return { 
        color: "default", 
        icon: <StopOutlined />, 
        text: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ')
      };
  }
};

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
  icon, 
  text,
  size = 'default'
}) => {
  const config = getStatusConfig(status);
  
  return (
    <Tag
      color={config.color}
      icon={icon || config.icon}
      className={className}
      style={{
        borderRadius: theme.borderRadius.full,
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
      {text || config.text}
    </Tag>
  );
};

export default StatusTag;