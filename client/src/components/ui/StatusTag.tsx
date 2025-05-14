import React from 'react';
import { Typography } from 'antd';
import { 
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  StopOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// Custom color palette for financial industry styling
const STATUS_COLORS = {
  active: {
    background: '#e6f7ef',
    text: '#0e6245',
    border: '#a8e6c9',
    icon: '#10b981'
  },
  inactive: {
    background: '#f3f4f6',
    text: '#4b5563',
    border: '#d1d5db',
    icon: '#6b7280'
  },
  warning: {
    background: '#fef6e6',
    text: '#92400e',
    border: '#fcd34d',
    icon: '#f59e0b'
  },
  processing: {
    background: '#eff6fe',
    text: '#1e40af',
    border: '#bfdbfe',
    icon: '#3b82f6'
  },
  error: {
    background: '#fee2e2',
    text: '#b91c1c',
    border: '#fecaca',
    icon: '#ef4444'
  }
};

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
  text?: string | undefined;

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
 * Optimized for financial services with a professional, trustworthy appearance.
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
  let colorScheme = STATUS_COLORS.inactive;
  let statusIcon: React.ReactElement | null = <StopOutlined />;
  let statusText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
  
  // Handle based on specific status values
  const lowercaseStatus = status.toLowerCase();
  
  // Employee statuses
  if (lowercaseStatus === 'active') {
    colorScheme = STATUS_COLORS.active;
    statusIcon = <CheckCircleOutlined />;
    statusText = 'Active';
  } else if (lowercaseStatus === 'inactive') {
    colorScheme = STATUS_COLORS.inactive;
    statusIcon = <StopOutlined />;
    statusText = 'Inactive';
  } else if (lowercaseStatus === 'on_leave') {
    colorScheme = STATUS_COLORS.warning;
    statusIcon = <ClockCircleOutlined />;
    statusText = 'On Leave';
  } else if (lowercaseStatus === 'remote') {
    colorScheme = STATUS_COLORS.processing;
    statusIcon = <GlobalOutlined />;
    statusText = 'Remote';
  }
  // Document statuses
  else if (lowercaseStatus === 'draft') {
    colorScheme = STATUS_COLORS.inactive;
    statusIcon = <FileTextOutlined />;
    statusText = 'Draft';
  } else if (lowercaseStatus === 'in_review') {
    colorScheme = STATUS_COLORS.processing;
    statusIcon = <ClockCircleOutlined />;
    statusText = 'In Review';
  } else if (lowercaseStatus === 'pending') {
    colorScheme = STATUS_COLORS.processing;
    statusIcon = <ClockCircleOutlined />;
    statusText = 'Pending';
  } else if (lowercaseStatus === 'approved') {
    colorScheme = STATUS_COLORS.active;
    statusIcon = <CheckCircleOutlined />;
    statusText = 'Approved';
  } else if (lowercaseStatus === 'completed') {
    colorScheme = STATUS_COLORS.active;
    statusIcon = <CheckCircleOutlined />;
    statusText = 'Completed';
  } else if (lowercaseStatus === 'rejected') {
    colorScheme = STATUS_COLORS.error;
    statusIcon = <ExclamationCircleOutlined />;
    statusText = 'Rejected';
  } else if (lowercaseStatus === 'expired') {
    colorScheme = STATUS_COLORS.warning;
    statusIcon = <WarningOutlined />;
    statusText = 'Expired';
  }
  
  // Size-dependent styling
  const sizeStyles = {
    small: {
      fontSize: '11px',
      padding: '0 8px',
      height: '20px',
      borderRadius: '10px'
    },
    default: {
      fontSize: '12px',
      padding: '0 10px',
      height: '24px',
      borderRadius: '12px'
    },
    large: {
      fontSize: '13px',
      padding: '0 12px',
      height: '28px',
      borderRadius: '14px'
    }
  }[size];
  
  // Render icon with proper styling
  const renderIcon = () => {
    try {
      // Use custom icon if provided, otherwise use statusIcon
      const iconToRender = customIcon || statusIcon;
      
      if (React.isValidElement(iconToRender)) {
        return (
          <span style={{ 
            fontSize: sizeStyles.fontSize, 
            color: colorScheme.icon, 
            marginRight: '4px', 
            display: 'inline-flex' 
          }}>
            {iconToRender}
          </span>
        );
      }
    } catch (error) {
      console.error('Error rendering icon:', error);
    }
    
    return null;
  };
  
  return (
    <div 
      className={`inline-flex items-center ${className}`}
      style={{
        backgroundColor: colorScheme.background,
        border: `1px solid ${colorScheme.border}`,
        color: colorScheme.text,
        height: sizeStyles.height,
        borderRadius: sizeStyles.borderRadius,
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize,
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: '0.2px',
        whiteSpace: 'nowrap'
      }}
    >
      {renderIcon()}
      <Text style={{ 
        fontSize: 'inherit', 
        color: 'inherit',
        fontWeight: 'inherit',
        lineHeight: 'inherit',
        margin: 0
      }}>
        {customText || statusText}
      </Text>
    </div>
  );
};

export default StatusTag;