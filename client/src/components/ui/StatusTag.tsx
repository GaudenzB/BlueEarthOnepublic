import React, { memo } from 'react';
import { Tag, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ApartmentOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { tokens } from '@/theme/tokens';

export type StatusType = 'active' | 'inactive' | 'on_leave' | 'remote';

export interface StatusTagProps {
  /**
   * Status value
   */
  status: StatusType;
  
  /**
   * Size of the status tag
   */
  size?: 'small' | 'default' | 'large';
  
  /**
   * Whether to show the status icon
   */
  showIcon?: boolean;
  
  /**
   * Tooltip text when hovering the tag
   */
  tooltip?: string;
  
  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * Converts a status value to its corresponding configuration
 */
const getStatusConfig = (status: StatusType) => {
  switch (status) {
    case 'active':
      return {
        color: tokens.colors.semantic.success,
        backgroundColor: tokens.colors.success.light,
        icon: <CheckCircleOutlined />,
        text: 'Active',
        ariaLabel: 'Active status',
      };
    
    case 'inactive':
      return {
        color: tokens.colors.semantic.error,
        backgroundColor: tokens.colors.error.light,
        icon: <CloseCircleOutlined />,
        text: 'Inactive',
        ariaLabel: 'Inactive status',
      };
    
    case 'on_leave':
      return {
        color: tokens.colors.semantic.warning,
        backgroundColor: tokens.colors.warning.light,
        icon: <ClockCircleOutlined />,
        text: 'On Leave',
        ariaLabel: 'On leave status',
      };
    
    case 'remote':
      return {
        color: tokens.colors.semantic.info,
        backgroundColor: tokens.colors.info.light,
        icon: <HomeOutlined />,
        text: 'Remote',
        ariaLabel: 'Remote status',
      };
    
    default:
      return {
        color: tokens.colors.neutral['500'],
        backgroundColor: tokens.colors.neutral['200'],
        icon: <InfoCircleOutlined />,
        text: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        ariaLabel: `${status.replace('_', ' ')} status`,
      };
  }
};

/**
 * StatusTag Component
 * 
 * A standardized component for displaying status values with consistent 
 * colors, icons, and styling across the application.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <StatusTag status="active" />
 * 
 * // Without icon
 * <StatusTag status="inactive" showIcon={false} />
 * 
 * // With tooltip
 * <StatusTag 
 *   status="on_leave" 
 *   tooltip="This employee is on paternity leave until June" 
 * />
 * 
 * // Custom size
 * <StatusTag status="remote" size="large" />
 * ```
 */
export const StatusTag: React.FC<StatusTagProps> = memo(({
  status,
  size = 'default',
  showIcon = true,
  tooltip,
  className = '',
}) => {
  const config = getStatusConfig(status);
  
  // Adjust padding based on size
  const sizeStyles = {
    small: {
      padding: '0 6px',
      fontSize: '12px',
      height: '20px',
      lineHeight: '20px',
    },
    default: {
      padding: '0 8px',
      fontSize: '14px',
      height: '24px',
      lineHeight: '24px',
    },
    large: {
      padding: '0 10px',
      fontSize: '16px',
      height: '30px',
      lineHeight: '30px',
    },
  };
  
  // Tag content including icon and text
  const tagContent = (
    <>
      {showIcon && (
        <span 
          className="status-icon" 
          style={{ marginRight: '4px', display: 'inline-flex', alignItems: 'center' }}
          aria-hidden="true"
        >
          {config.icon}
        </span>
      )}
      {config.text}
    </>
  );
  
  // Style customizations for the Tag component
  const tagStyle = {
    color: config.color,
    backgroundColor: config.backgroundColor,
    border: `1px solid ${config.color}`,
    ...sizeStyles[size],
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    borderRadius: tokens.borderRadius.sm,
    fontWeight: 500,
  };
  
  // Add accessibility attributes
  const accessibilityProps = {
    role: 'status',
    'aria-label': config.ariaLabel,
  };
  
  // If tooltip is provided, wrap in Tooltip component
  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="top">
        <Tag
          className={`status-tag ${className}`}
          style={tagStyle}
          {...accessibilityProps}
        >
          {tagContent}
        </Tag>
      </Tooltip>
    );
  }
  
  // Otherwise, just return the Tag
  return (
    <Tag
      className={`status-tag ${className}`}
      style={tagStyle}
      {...accessibilityProps}
    >
      {tagContent}
    </Tag>
  );
});

StatusTag.displayName = 'StatusTag';

export default StatusTag;