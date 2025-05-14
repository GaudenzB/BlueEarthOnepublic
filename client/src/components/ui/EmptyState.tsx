import React from 'react';
import { Empty, Button } from 'antd';
import { theme } from '@/lib/theme';

export interface EmptyStateProps {
  /**
   * Title text for the empty state
   */
  title?: string;
  
  /**
   * Description text explaining why content is empty
   */
  description: string;
  
  /**
   * Optional action button text
   */
  actionText?: string;
  
  /**
   * Optional action button handler
   */
  onAction?: () => void;
  
  /**
   * Optional custom image
   */
  image?: React.ReactNode;
  
  /**
   * Optional icon to display
   */
  icon?: React.ReactNode;
  
  /**
   * Whether to use a compact layout
   */
  compact?: boolean;
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * EmptyState Component
 * 
 * A standardized component for displaying empty states
 * across the application. Provides consistent styling and
 * messaging when content is not available.
 * 
 * @example
 * <EmptyState 
 *   title="No Documents Found"
 *   description="There are no documents matching your search criteria."
 *   actionText="Clear Filters"
 *   onAction={handleClearFilters}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  image,
  icon,
  compact = false,
  className = '',
}) => {
  return (
    <div 
      className={`empty-state ${className}`}
      style={{
        padding: compact ? theme.spacing[4] : theme.spacing[8],
        textAlign: 'center',
        backgroundColor: theme.gray[50],
        borderRadius: theme.borderRadius.lg,
      }}
    >
      <Empty
        image={image || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            {title && (
              <h3 style={{ 
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.gray[800],
                marginBottom: theme.spacing[2],
              }}>
                {title}
              </h3>
            )}
            
            <p style={{ 
              fontSize: theme.typography.fontSize.base,
              color: theme.gray[600],
              maxWidth: '500px',
              margin: '0 auto',
            }}>
              {description}
            </p>
          </div>
        }
      >
        {actionText && onAction && (
          <Button 
            type="primary" 
            onClick={onAction}
            style={{
              marginTop: theme.spacing[4],
              backgroundColor: theme.brand[500],
              borderColor: theme.brand[500],
            }}
          >
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
};

export default EmptyState;