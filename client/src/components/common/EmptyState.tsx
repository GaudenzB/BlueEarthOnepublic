import React from 'react';
import { Empty, Button, Typography, Space } from 'antd';
import { EmptyProps } from 'antd/lib/empty';

const { Text } = Typography;

interface EmptyStateProps extends EmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  size?: 'small' | 'default' | 'large';
  type?: 'default' | 'compact' | 'info';
}

/**
 * Enhanced Empty component with improved UX
 * Provides contextual messaging and actions for empty states
 */
export function EmptyState({
  title,
  description,
  icon,
  actionText,
  onAction,
  size = 'default',
  type = 'default',
  ...props
}: EmptyStateProps) {
  // Calculate styles based on size
  const getEmptyStyles = () => {
    switch (size) {
      case 'small': // Fall through
       // Fall through
       return { padding: '16px 0' };
      case 'large': // Fall through
       // Fall through
       return { padding: '48px 0' };
      default:
        return { padding: '32px 0' };
    }
  };
  
  // Different visualization based on type
  const getEmptyImage = () => {
    switch (type) {
      case 'compact': // Fall through
       // Fall through
       return Empty.PRESENTED_IMAGE_SIMPLE;
      case 'info': // Fall through
       // Fall through
       return undefined; // No image for info type
      default:
        return props.image;
    }
  };
  
  return (
    <Empty
      image={getEmptyImage()}
      description={null}
      style={getEmptyStyles()}
      {...props}
    >
      <Space direction="vertical" align="center" size="middle">
        {title && <Text strong style={{ fontSize: size === 'large' ? 18 : 16 }}>{title}</Text>}
        {description && (
          <Text type="secondary" style={{ fontSize: size === 'small' ? 12 : 14 }}>
            {description}
          </Text>
        )}
        {actionText && onAction && (
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </Space>
    </Empty>
  );
}