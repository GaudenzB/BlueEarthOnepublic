import React from 'react';
import { Card } from 'antd';
import { theme } from '@/lib/theme';

export interface CardContainerProps {
  /**
   * Card title
   */
  title?: React.ReactNode;
  
  /**
   * Card subtitle or description
   */
  description?: React.ReactNode;
  
  /**
   * Card content
   */
  children: React.ReactNode;
  
  /**
   * Optional card footer
   */
  footer?: React.ReactNode;
  
  /**
   * Optional extra content in the top-right corner
   */
  extra?: React.ReactNode;
  
  /**
   * Optional CSS class name
   */
  className?: string;
  
  /**
   * Optional inline styles
   */
  style?: React.CSSProperties;
  
  /**
   * Whether the card should have hover effects
   */
  hoverable?: boolean;
  
  /**
   * Card size
   */
  size?: 'default' | 'small';
  
  /**
   * Card border radius size
   */
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

/**
 * CardContainer Component
 * 
 * A standardized card component with consistent styling
 * based on the design system.
 * 
 * @example
 * <CardContainer 
 *   title="Employee Information" 
 *   description="Personal details and contact information"
 * >
 *   Card content goes here
 * </CardContainer>
 */
export const CardContainer: React.FC<CardContainerProps> = ({
  title,
  description,
  children,
  footer,
  extra,
  className = '',
  style = {},
  hoverable = false,
  size = 'default',
  borderRadius = 'xl',
  onClick,
}) => {
  // Get border radius value from theme
  const getBorderRadius = () => {
    switch (borderRadius) {
      case 'sm': return theme.borderRadius.sm;
      case 'md': return theme.borderRadius.md;
      case 'lg': return theme.borderRadius.lg;
      case 'xl': return theme.borderRadius.xl;
      case '2xl': return theme.borderRadius['xl']; // Corrected since '2xl' isn't available
      default: return theme.borderRadius.xl;
    }
  };

  return (
    <Card
      title={title ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: theme.spacing.sm, // Using string key instead of numeric index
        }}>
          <div style={{ 
            fontSize: size === 'small' ? theme.typography.fontSizes.lg : theme.typography.fontSizes.xl,
            fontWeight: theme.typography.fontWeights.semibold,
            color: theme.colors.text.primary, // Using correct path in theme object
          }}>
            {title}
          </div>
          
          {description && (
            <div style={{ 
              fontSize: theme.typography.fontSizes.sm,
              color: theme.colors.text.secondary,
            }}>
              {description}
            </div>
          )}
        </div>
      ) : null}
      extra={extra}
      className={`card-container ${className}`}
      style={{
        borderRadius: getBorderRadius(),
        boxShadow: theme.shadows.sm,
        ...style,
      }}
      hoverable={hoverable}
      size={size}
      onClick={onClick}
    >
      {children}
      
      {footer && (
        <div className="card-footer" style={{ 
          marginTop: theme.spacing.md,
          paddingTop: theme.spacing.md,
          borderTop: `1px solid ${theme.colors.border.light}`,
        }}>
          {footer}
        </div>
      )}
    </Card>
  );
};

export default CardContainer;