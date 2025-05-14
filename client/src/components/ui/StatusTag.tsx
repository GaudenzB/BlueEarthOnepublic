import React, { useMemo } from 'react';
import { Tag, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined, 
  SyncOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { tokens } from '@/theme/tokens';
import { createAccessibleId } from '@/utils/a11y';

// Document status types
type DocumentStatus = 
  | 'draft' 
  | 'in_review' 
  | 'pending'
  | 'approved'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'custom';

// Employee status types
type EmployeeStatus = 
  | 'active'
  | 'inactive'
  | 'on_leave'
  | 'remote'
  | 'custom';

// Combined status types
export type StatusType = DocumentStatus | EmployeeStatus;

/**
 * Props for StatusTag component
 */
export interface StatusTagProps {
  /**
   * Status value to display
   */
  status: StatusType;
  
  /**
   * Custom text to display (only for status="custom")
   */
  text?: string;
  
  /**
   * Size of the tag
   */
  size?: 'small' | 'default' | 'large';
  
  /**
   * Optional tooltip text
   */
  tooltip?: string;
  
  /**
   * Makes the tag interactive with hover and click states
   */
  interactive?: boolean;
  
  /**
   * Click handler - only triggered if interactive=true
   */
  onClick?: () => void;
  
  /**
   * Custom className
   */
  className?: string;
}

/**
 * StatusTag Component
 * 
 * A standardized component for displaying status indicators throughout the application.
 * Provides consistent styling, iconography, and accessibility attributes.
 * 
 * @example
 * ```tsx
 * // Document status
 * <StatusTag status="approved" />
 * 
 * // Employee status
 * <StatusTag status="on_leave" />
 * 
 * // With tooltip
 * <StatusTag status="expired" tooltip="Expired on Jan 15, 2025" />
 * 
 * // Interactive with click handler
 * <StatusTag 
 *   status="draft" 
 *   interactive 
 *   onClick={() => handleStatusChange()} 
 * />
 * 
 * // Custom status
 * <StatusTag status="custom" text="Under Review" />
 * ```
 */
export const StatusTag: React.FC<StatusTagProps> = ({
  status,
  text,
  size = 'default',
  tooltip,
  interactive = false,
  onClick,
  className = ''
}) => {
  // Generate a unique ID for ARIA attributes
  const id = useMemo(() => createAccessibleId('status', status), [status]);
  
  // Determine configuration for the current status
  const config = useMemo(() => {
    // Get display text based on status
    const getStatusText = () => {
      if (status === 'custom' && text) {
        return text;
      }
      
      const statusTextMap: Record<StatusType, string> = {
        // Document statuses
        draft: 'Draft',
        in_review: 'In Review',
        pending: 'Pending',
        approved: 'Approved',
        completed: 'Completed',
        rejected: 'Rejected',
        expired: 'Expired',
        
        // Employee statuses
        active: 'Active',
        inactive: 'Inactive',
        on_leave: 'On Leave',
        remote: 'Remote',
        
        // Custom
        custom: text || 'Custom'
      };
      
      return statusTextMap[status];
    };
    
    // Get color based on status
    const getStatusColor = () => {
      const statusColorMap: Record<StatusType, string> = {
        // Document statuses
        draft: tokens.colors.neutral[400],
        in_review: tokens.colors.blue[500],
        pending: tokens.colors.orange[500],
        approved: tokens.colors.green[500],
        completed: tokens.colors.green[700],
        rejected: tokens.colors.red[500],
        expired: tokens.colors.red[300],
        
        // Employee statuses
        active: tokens.colors.green[500],
        inactive: tokens.colors.neutral[400],
        on_leave: tokens.colors.amber[500],
        remote: tokens.colors.blue[500],
        
        // Custom
        custom: tokens.colors.purple[500]
      };
      
      return statusColorMap[status];
    };
    
    // Get icon based on status
    const getStatusIcon = () => {
      const statusIconMap: Record<StatusType, React.ReactNode> = {
        // Document statuses
        draft: <ClockCircleOutlined />,
        in_review: <SyncOutlined spin={interactive} />,
        pending: <ClockCircleOutlined />,
        approved: <CheckCircleOutlined />,
        completed: <CheckCircleOutlined />,
        rejected: <CloseCircleOutlined />,
        expired: <ExclamationCircleOutlined />,
        
        // Employee statuses
        active: <CheckCircleOutlined />,
        inactive: <CloseCircleOutlined />,
        on_leave: <ClockCircleOutlined />,
        remote: <HomeOutlined />,
        
        // Custom
        custom: <QuestionCircleOutlined />
      };
      
      return statusIconMap[status];
    };
    
    return {
      text: getStatusText(),
      color: getStatusColor(),
      icon: getStatusIcon()
    };
  }, [status, text, interactive]);
  
  // Calculate styles based on size
  const sizeStyles = useMemo(() => {
    const sizeMap = {
      small: {
        fontSize: '10px',
        padding: '0 6px',
        height: '20px',
        lineHeight: '20px'
      },
      default: {
        fontSize: '12px',
        padding: '0 8px',
        height: '24px',
        lineHeight: '24px'
      },
      large: {
        fontSize: '14px',
        padding: '0 12px',
        height: '32px',
        lineHeight: '32px'
      }
    };
    
    return sizeMap[size];
  }, [size]);
  
  // Combine styles
  const tagStyle = useMemo(() => ({
    backgroundColor: `${config.color}10`, // 10% opacity version of color
    color: config.color,
    border: `1px solid ${config.color}40`, // 40% opacity version of color
    cursor: interactive ? 'pointer' : 'default',
    ...sizeStyles
  }), [config.color, interactive, sizeStyles]);
  
  // Handle click
  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };
  
  // Determine ARIA attributes based on status type
  const ariaAttrs = useMemo(() => {
    // For document statuses
    if (['draft', 'in_review', 'pending', 'approved', 'completed', 'rejected', 'expired'].includes(status)) {
      return {
        'aria-label': `Document status: ${config.text}`
      };
    }
    
    // For employee statuses
    if (['active', 'inactive', 'on_leave', 'remote'].includes(status)) {
      return {
        'aria-label': `Employee status: ${config.text}`
      };
    }
    
    // For custom status
    return {
      'aria-label': `Status: ${config.text}`
    };
  }, [status, config.text]);
  
  // Render tag with or without tooltip
  const tag = (
    <Tag
      className={`status-tag status-tag-${status} ${className}`}
      style={tagStyle}
      icon={config.icon}
      onClick={handleClick}
      id={id}
      {...ariaAttrs}
      role="status"
    >
      {config.text}
    </Tag>
  );
  
  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <Tooltip title={tooltip} aria-describedby={id}>
        {tag}
      </Tooltip>
    );
  }
  
  return tag;
};

export default StatusTag;