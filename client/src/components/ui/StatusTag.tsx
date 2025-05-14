import React, { memo } from 'react';
import { Typography } from 'antd';
import { 
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  StopOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  TagOutlined,
  LockOutlined
} from '@ant-design/icons';
import { tokens } from '@/theme/tokens';

const { Text } = Typography;

/**
 * StatusConfig interface defines the visual appearance of a status
 */
interface StatusConfig {
  background: string;
  text: string;
  border: string;
  icon: string;
  IconComponent: React.ComponentType<any>;
  displayName?: string;
}

// Default status config to use as fallback
const DEFAULT_STATUS_CONFIG: StatusConfig = {
  background: '#f3f4f6',
  text: '#4b5563',
  border: '#d1d5db',
  icon: tokens.colors.neutral[600],
  IconComponent: TagOutlined
};

/**
 * Map all common status values to their visual representation
 * This allows for consistent status representation across the application
 */
const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Employee statuses
  active: {
    background: '#e6f7ef',
    text: '#0e6245',
    border: '#a8e6c9',
    icon: tokens.colors.semantic.success,
    IconComponent: CheckCircleOutlined,
    displayName: 'Active'
  },
  inactive: {
    background: '#f3f4f6',
    text: '#4b5563',
    border: '#d1d5db',
    icon: tokens.colors.neutral[600],
    IconComponent: StopOutlined,
    displayName: 'Inactive'
  },
  on_leave: {
    background: '#fef6e6',
    text: '#92400e',
    border: '#fcd34d',
    icon: tokens.colors.semantic.warning,
    IconComponent: ClockCircleOutlined,
    displayName: 'On Leave'
  },
  remote: {
    background: '#eff6fe',
    text: '#1e40af',
    border: '#bfdbfe',
    icon: tokens.colors.semantic.info,
    IconComponent: GlobalOutlined,
    displayName: 'Remote'
  },
  
  // Document statuses
  draft: {
    background: '#f3f4f6',
    text: '#4b5563',
    border: '#d1d5db',
    icon: tokens.colors.neutral[600],
    IconComponent: FileTextOutlined,
    displayName: 'Draft'
  },
  in_review: {
    background: '#eff6fe',
    text: '#1e40af',
    border: '#bfdbfe',
    icon: tokens.colors.semantic.info,
    IconComponent: ClockCircleOutlined,
    displayName: 'In Review'
  },
  pending: {
    background: '#eff6fe',
    text: '#1e40af',
    border: '#bfdbfe',
    icon: tokens.colors.semantic.info,
    IconComponent: ClockCircleOutlined,
    displayName: 'Pending'
  },
  approved: {
    background: '#e6f7ef',
    text: '#0e6245',
    border: '#a8e6c9',
    icon: tokens.colors.semantic.success,
    IconComponent: CheckCircleOutlined,
    displayName: 'Approved'
  },
  completed: {
    background: '#e6f7ef',
    text: '#0e6245',
    border: '#a8e6c9',
    icon: tokens.colors.semantic.success,
    IconComponent: CheckCircleOutlined,
    displayName: 'Completed'
  },
  rejected: {
    background: '#fee2e2',
    text: '#b91c1c',
    border: '#fecaca',
    icon: tokens.colors.semantic.error,
    IconComponent: ExclamationCircleOutlined,
    displayName: 'Rejected'
  },
  expired: {
    background: '#fef6e6',
    text: '#92400e',
    border: '#fcd34d',
    icon: tokens.colors.semantic.warning,
    IconComponent: WarningOutlined,
    displayName: 'Expired'
  },
  
  // Version status
  version: {
    background: '#f3f0ff',
    text: '#5b21b6',
    border: '#c4b5fd',
    icon: '#8b5cf6',
    IconComponent: HistoryOutlined,
    displayName: 'Version'
  },
  
  // Document visibility/access
  restricted: {
    background: '#fff1f2',
    text: '#9f1239',
    border: '#fda4af',
    icon: '#f43f5e',
    IconComponent: LockOutlined,
    displayName: 'Restricted'
  },
  
  // Archive status
  archived: {
    background: '#f8fafc',
    text: '#334155',
    border: '#cbd5e1',
    icon: tokens.colors.neutral[600],
    IconComponent: TagOutlined,
    displayName: 'Archived'
  },
  
  // Add the default to the map itself
  default: DEFAULT_STATUS_CONFIG
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
  text?: string;

  /**
   * Optional size of the tag. Default is 'default'
   */
  size?: 'small' | 'default' | 'large';

  /**
   * Optional callback for click events
   */
  onClick?: (e: React.MouseEvent) => void;

  /**
   * Optional flag to make the status tag interactive (hover/focus states)
   */
  interactive?: boolean;
}

/**
 * Size configurations for different tag sizes
 */
const SIZE_STYLES = {
  small: {
    fontSize: '11px',
    padding: '0 8px',
    height: '20px',
    borderRadius: tokens.radii.pill
  },
  default: {
    fontSize: '12px',
    padding: '0 10px',
    height: '24px',
    borderRadius: tokens.radii.pill
  },
  large: {
    fontSize: '13px',
    padding: '0 12px',
    height: '28px',
    borderRadius: tokens.radii.pill
  }
} as const;

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
 * <StatusTag status="approved" size="large" onClick={handleClick} />
 */
export const StatusTag = memo(({ 
  status, 
  className = '', 
  icon: customIcon, 
  text: customText,
  size = 'default',
  onClick,
  interactive = false
}: StatusTagProps) => {
  // Get config based on normalized status value
  const normalizedStatus = status?.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'default';
  
  // Get status config with type-safe fallback
  const statusConfig = STATUS_CONFIG[normalizedStatus] || DEFAULT_STATUS_CONFIG;
  
  // Determine text content (priority: custom text > config display name > formatted status)
  const displayText = customText || 
    statusConfig.displayName || 
    (status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ') : 'Unknown');
  
  // Get size styling with type safety
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.default;
  
  // Handle interactive styles
  const interactiveStyle: React.CSSProperties = interactive ? {
    cursor: 'pointer',
    transition: tokens.transitions.default,
  } : {};
  
  return (
    <div 
      className={`inline-flex items-center ${className}`}
      style={{
        backgroundColor: statusConfig.background,
        border: `1px solid ${statusConfig.border}`,
        color: statusConfig.text,
        height: sizeStyle.height,
        borderRadius: sizeStyle.borderRadius,
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: 1,
        letterSpacing: '0.2px',
        whiteSpace: 'nowrap',
        ...interactiveStyle
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {customIcon || (
        <span style={{ 
          fontSize: sizeStyle.fontSize, 
          color: statusConfig.icon, 
          marginRight: '4px', 
          display: 'inline-flex' 
        }}>
          <statusConfig.IconComponent />
        </span>
      )}
      
      <Text style={{ color: 'inherit', fontSize: 'inherit', margin: 0 }}>
        {displayText}
      </Text>
    </div>
  );
});

// Set displayName for better debugging experience
StatusTag.displayName = 'StatusTag';

// Default export
export default StatusTag;