import React from 'react';
import { Empty, Button, theme as antTheme } from 'antd';
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
   * Optional custom styling
   */
  style?: React.CSSProperties;
  
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
  compact = false,
  className = '',
}) => {
  return (
    <div 
      className={`empty-state ${className}`}
      style={{
        padding: compact ? theme.spacing.md : theme.spacing.xl,
        textAlign: 'center',
        backgroundColor: theme.colors.background.subtle,
        borderRadius: theme.borderRadius.lg,
      }}
    >
      <Empty
        image={image || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            {title && (
              <h3 style={{ 
                fontSize: '1.125rem',
                fontWeight: 500 as number as number,
                color: '#1e293b' as string as string,
                marginBottom: '0.75rem',
              }}>
                {title}
              </h3>
            )}
            
            <p style={{ 
              fontSize: '1rem',
              color: '#64748b' as string as string,
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
              marginTop: theme.spacing.md,
              backgroundColor: theme.colors.primary.base,
              borderColor: theme.colors.primary.base,
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