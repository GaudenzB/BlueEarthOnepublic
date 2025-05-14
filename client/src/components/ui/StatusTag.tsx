import React, { memo } from 'react';
import { Tag, Tooltip } from 'antd';
import { 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { snakeToTitleCase } from '@/utils/formatting';
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
        color: tokens.colors.success.default,
        icon: <CheckCircleOutlined />,
        text: 'Active'
      };
    case 'inactive':
      return {
        color: tokens.colors.error.default,
        icon: <CloseCircleOutlined />,
        text: 'Inactive'
      };
    case 'on_leave':
      return {
        color: tokens.colors.warning.default,
        icon: <ExclamationCircleOutlined />,
        text: 'On Leave'
      };
    case 'remote':
      return {
        color: tokens.colors.info.default,
        icon: <GlobalOutlined />,
        text: 'Remote'
      };
    default:
      return {
        color: tokens.colors.neutral[500],
        icon: <ExclamationCircleOutlined />,
        text: snakeToTitleCase(status as string)
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
  className = ''
}) => {
  const { color, icon, text } = getStatusConfig(status);
  
  // Determine font and padding size based on the size prop
  const sizeStyles = {
    small: { fontSize: 12, padding: '0 6px', height: 22 },
    default: { fontSize: 14, padding: '0 8px', height: 24 },
    large: { fontSize: 14, padding: '0 10px', height: 28 }
  };
  
  const tagContent = (
    <Tag 
      className={`status-tag ${className}`}
      color={color}
      style={{
        textTransform: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: sizeStyles[size].fontSize,
        padding: sizeStyles[size].padding,
        height: sizeStyles[size].height,
        lineHeight: `${sizeStyles[size].height - 2}px`,
        border: `1px solid ${color}`,
        borderRadius: '4px'
      }}
    >
      {showIcon && (
        <span 
          style={{ 
            marginRight: 5, 
            fontSize: size === 'small' ? 10 : 12,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {icon}
        </span>
      )}
      {text}
    </Tag>
  );
  
  // Wrap with tooltip if tooltip text is provided
  if (tooltip) {
    return (
      <Tooltip title={tooltip}>
        {tagContent}
      </Tooltip>
    );
  }
  
  return tagContent;
});

StatusTag.displayName = 'StatusTag';

export default StatusTag;