import React, { memo } from 'react';
import { Tag, Tooltip } from 'antd';
import type { TagProps } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  InfoCircleFilled,
  PauseCircleFilled,
  SyncOutlined,
} from '@ant-design/icons';
import { tokens } from '@/theme/tokens';

/**
 * Available status types
 */
export type StatusType = 
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'processing'
  | 'on_leave'
  | 'remote'
  | 'draft'
  | 'in_review'
  | 'expired'
  | 'custom';

/**
 * Props for the StatusTag component
 */
export interface StatusTagProps {
  /**
   * The status to display
   */
  status: StatusType;
  
  /**
   * Optional text override (default is capitalized status)
   */
  text?: string;
  
  /**
   * Size of the tag
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Whether to animate the tag (pulsing effect for processing status)
   */
  animated?: boolean;
  
  /**
   * Optional tooltip text to show on hover
   */
  tooltip?: string;
  
  /**
   * Optional click handler
   */
  onClick?: () => void;
  
  /**
   * Whether the tag is interactive (clickable)
   */
  interactive?: boolean;
  
  /**
   * Accessibility label for screen readers
   */
  ariaLabel?: string;
}

/**
 * Configuration for each status type
 */
const STATUS_CONFIG: Record<StatusType, {
  color: string; 
  icon: React.ReactNode; 
  text: string;
  borderColor?: string;
  bg?: string;
}> = {
  active: {
    color: tokens.colors.semantic.success,
    icon: <CheckCircleFilled />,
    text: 'Active',
    bg: tokens.colors.status.success.light,
  },
  inactive: {
    color: tokens.colors.neutral['600'],
    icon: <PauseCircleFilled />,
    text: 'Inactive',
    bg: tokens.colors.neutral['100'],
  },
  pending: {
    color: tokens.colors.semantic.warning,
    icon: <ClockCircleFilled />,
    text: 'Pending',
    bg: tokens.colors.status.warning.light,
  },
  approved: {
    color: tokens.colors.semantic.success,
    icon: <CheckCircleFilled />,
    text: 'Approved',
    bg: tokens.colors.status.success.light,
  },
  rejected: {
    color: tokens.colors.semantic.error,
    icon: <CloseCircleFilled />,
    text: 'Rejected',
    bg: tokens.colors.status.error.light,
  },
  completed: {
    color: tokens.colors.status.info.default,
    icon: <InfoCircleFilled />,
    text: 'Completed',
    bg: tokens.colors.status.info.light,
  },
  processing: {
    color: tokens.colors.status.info.default,
    icon: <SyncOutlined spin />,
    text: 'Processing',
    bg: tokens.colors.status.info.light,
  },
  on_leave: {
    color: tokens.colors.semantic.warning,
    icon: <PauseCircleFilled />,
    text: 'On Leave',
    bg: tokens.colors.status.warning.light,
  },
  remote: {
    color: tokens.colors.status.info.default,
    icon: <InfoCircleFilled />,
    text: 'Remote',
    bg: tokens.colors.status.info.light,
  },
  draft: {
    color: tokens.colors.neutral['600'],
    icon: <PauseCircleFilled />,
    text: 'Draft',
    bg: tokens.colors.neutral['100'],
  },
  in_review: {
    color: tokens.colors.semantic.warning,
    icon: <ClockCircleFilled />,
    text: 'In Review',
    bg: tokens.colors.status.warning.light,
  },
  expired: {
    color: tokens.colors.semantic.error,
    icon: <CloseCircleFilled />,
    text: 'Expired',
    bg: tokens.colors.status.error.light,
  },
  custom: {
    color: tokens.colors.status.pending.default,
    icon: <InfoCircleFilled />,
    text: 'Custom',
    bg: tokens.colors.status.pending.light,
  }
};

/**
 * Format the status text - capitalize each word
 */
const formatStatusText = (status: StatusType): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * StatusTag Component
 * 
 * A unified component for displaying status indicators throughout the application.
 * Follows a consistent design language with appropriate colors, icons and sizes.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <StatusTag status="active" />
 * 
 * // With custom text
 * <StatusTag status="pending" text="Awaiting Review" />
 * 
 * // With tooltip
 * <StatusTag status="completed" tooltip="Task finished on March 12, 2025" />
 * 
 * // Processing state with animation
 * <StatusTag status="processing" animated />
 * ```
 */
function StatusTag({
  status,
  text,
  size = 'medium',
  animated = false,
  tooltip,
  onClick,
  ariaLabel,
}: StatusTagProps): JSX.Element {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.custom;
  
  // Default to formatted status if no text provided
  const displayText = text || config?.text || formatStatusText(status);
  
  // Determine size-specific styles
  const sizeStyles = {
    small: {
      fontSize: '0.75rem',
      padding: '0px 6px',
      height: '20px',
      iconSize: 12,
    },
    medium: {
      fontSize: '0.8125rem',
      padding: '0px 8px',
      height: '24px',
      iconSize: 14,
    },
    large: {
      fontSize: '0.875rem',
      padding: '0px 10px',
      height: '28px',
      iconSize: 16,
    },
  };
  
  // Get the style for the selected size or default to medium
  const currentSizeConfig = sizeStyles[size] || sizeStyles.medium;
  
  // Set tag props
  const tagProps: TagProps = {
    icon: animated && status === 'processing' 
      ? <SyncOutlined spin /> 
      : config?.icon,
    style: {
      backgroundColor: config?.bg || 'transparent',
      color: config?.color || tokens.colors.neutral[600],
      borderColor: config?.borderColor || config?.color || tokens.colors.neutral[300],
      padding: currentSizeConfig.padding || '0px 8px',
      fontSize: currentSizeConfig.fontSize || '0.8125rem',
      height: currentSizeConfig.height || '24px',
      lineHeight: currentSizeConfig.height ? `${parseInt(currentSizeConfig.height) - 2}px` : '22px',
      display: 'inline-flex',
      alignItems: 'center',
      fontWeight: 500,
    },
    onClick: onClick,
  };
  
  // Create the accessible tag
  const accessibleTag = (
    <Tag 
      {...tagProps} 
      role="status" 
      aria-label={ariaLabel || `Status: ${displayText}`}
    >
      {displayText}
    </Tag>
  );
  
  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="top">
        {accessibleTag}
      </Tooltip>
    );
  }
  
  return accessibleTag;
}

export default memo(StatusTag);