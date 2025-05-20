import React from 'react';
import { Spin, Skeleton, Result } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

/**
 * Props for the LoadingState component
 */
export interface LoadingStateProps {
  /**
   * Loading state variant
   * - 'spinner': Simple spinner with optional text
   * - 'skeleton': Content placeholder skeleton
   * - 'result': Full page result with spinner and message
   * - 'inline': Small inline spinner
   */
  variant?: 'spinner' | 'skeleton' | 'result' | 'inline';
  
  /**
   * Optional message to display with the loading state
   */
  message?: string;
  
  /**
   * Optional size in pixels for spinner variants
   */
  size?: number;
  
  /**
   * Optional duration in milliseconds before showing the loading state
   * This helps prevent flashing loaders for quick operations
   */
  delay?: number;
  
  /**
   * Optional className for styling
   */
  className?: string;
  
  /**
   * For 'skeleton' variant, the number of rows to show
   */
  rows?: number;
  
  /**
   * Whether to use an avatar in the skeleton
   */
  avatar?: boolean;
  
  /**
   * Whether to show a title in the skeleton
   */
  title?: boolean;
  
  /**
   * Optional children to replace default skeleton
   */
  children?: React.ReactNode;
}

/**
 * LoadingState Component
 * 
 * A versatile loading state component with multiple variants that can be
 * used across the application to provide a consistent loading experience.
 * 
 * @example
 * // Simple spinner
 * <LoadingState />
 * 
 * // With custom message
 * <LoadingState message="Loading documents..." />
 * 
 * // Content placeholder
 * <LoadingState variant="skeleton" rows={3} avatar />
 * 
 * // Full page loading
 * <LoadingState variant="result" message="Preparing dashboard data..." />
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  message,
  size = 24,
  delay = 0,
  className = '',
  rows = 4,
  avatar = false,
  title = true,
  children
}) => {
  // Custom spinner icon using primary color
  const spinIcon = <LoadingOutlined style={{ fontSize: size, color: '#0e4a86' as string as string }} spin />;
  
  // Delay the display of the loading state if needed
  const [show, setShow] = React.useState(!delay);
  
  React.useEffect(() => {
    if (delay) {
      const timer = setTimeout(() => {
        setShow(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
    return undefined; // Explicitly return for the case where delay is falsy
  }, [delay]);
  
  // Don't show anything during the delay period
  if (!show) return null;
  
  // Render different variants
  switch (variant) {
    case 'spinner': // Fall through
       return (
        <div 
          className={`flex flex-col items-center justify-center py-6 ${className}`}
          role="status"
          aria-live="polite"
          aria-label={message || 'Loading'}
        >
          <Spin indicator={spinIcon} />
          {message && (
            <div className="mt-3 text-sm text-gray-600">{message}</div>
          )}
        </div>
      );
      
    case 'skeleton': // Fall through
       return (
        <div 
          className={className}
          role="status"
          aria-live="polite"
          aria-label="Loading content"
        >
          {children || (
            <Skeleton 
              active 
              paragraph={{ rows }} 
              avatar={avatar} 
              title={title}
            />
          )}
        </div>
      );
      
    case 'result': // Fall through
       return (
        <div 
          className={className}
          role="status"
          aria-live="polite"
          aria-label={message || 'Loading'}
        >
          <Result
            icon={<Spin indicator={spinIcon} />}
            title={message || 'Loading...'}
          />
        </div>
      );
      
    case 'inline': // Fall through
       return (
        <span 
          className={`inline-flex items-center ${className}`}
          role="status"
          aria-live="polite"
          aria-label={message || 'Loading'}
        >
          <Spin indicator={spinIcon} size="small" />
          {message && (
            <span className="ml-2 text-sm">{message}</span>
          )}
        </span>
      );
      
    default:
      return null;
  }
};

export default LoadingState;