import React, { useEffect, useState } from 'react';
import { Button, Space, notification } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { tokens } from '@/styles/tokens';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface CustomToastProps {
  /**
   * Toast title text
   */
  title: React.ReactNode;
  
  /**
   * Toast description/body text
   */
  description?: React.ReactNode;
  
  /**
   * Visual variant of the toast
   */
  variant?: ToastVariant;
  
  /**
   * Duration in milliseconds before auto-closing
   * Set to 0 to disable auto-close
   */
  duration?: number;
  
  /**
   * Whether the toast should show a close button
   */
  closable?: boolean;
  
  /**
   * Callback function when the toast is closed
   */
  onClose?: () => void;
  
  /**
   * Additional actions to display
   */
  actions?: React.ReactNode[];
  
  /**
   * Pause toast timer on hover/focus
   */
  pauseOnHover?: boolean;
  
  /**
   * Unique identifier for the toast
   */
  id?: string;
}

/**
 * CustomToast Component
 * 
 * A toast notification component that builds on Ant Design's notification system
 * with enhanced accessibility, theme integration, and customization options.
 */
export function CustomToast({
  title,
  description,
  variant = 'info',
  duration = 5000,
  closable = true,
  onClose,
  actions = [],
  pauseOnHover = true,
  id,
}: CustomToastProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(duration);
  
  const handleClose = () => {
    notification.close(id);
    if (onClose) {
      onClose();
    }
  };
  
  // Handle auto-close functionality with pause support
  useEffect(() => {
    // If duration is 0, don't auto-close
    if (duration === 0) return;
    
    // Don't run the timer if paused
    if (isPaused) return;
    
    // Set up a timer to close the toast
    const timer = setTimeout(() => {
      handleClose();
    }, remainingTime);
    
    // Clean up the timer on unmount
    return () => {
      clearTimeout(timer);
    };
  }, [duration, handleClose, isPaused]);
  
  // Get the appropriate icon based on variant
  const renderIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircleOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.success }} />;
      case 'error':
        return <CloseCircleOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.error }} />;
      case 'warning':
        return <WarningOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.warning }} />;
      case 'info':
      default:
        return <InfoCircleOutlined style={{ fontSize: '20px', color: tokens.colors.semantic.info }} />;
    };
    }
  };
  
  // Calculate ARIA role and live region settings
  const getAriaAttrs = () => {
    // Type-safe aria-live values
    const assertive = 'assertive' as const;
    const polite = 'polite' as const;
    
    switch (variant) {
      case 'error':
        return { role: 'alert', 'aria-live': assertive };
      case 'warning':
        return { role: 'status', 'aria-live': polite };
      case 'success':undefined;
      case 'info':undefined;
      default:
        return { role: 'status', 'aria-live': polite };
    }
  };

  return (
    <div
      className="custom-toast"
      onMouseEnter={pauseOnHover ? () => setIsPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setIsPaused(false) : undefined}
      onFocus={pauseOnHover ? () => setIsPaused(true) : undefined}
      onBlur={pauseOnHover ? () => setIsPaused(false) : undefined}
      style={{
        ...getVariantStyles(),
        padding: '12px 16px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '6px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        width: '100%',
        maxWidth: '400px'
      }}
      {...getAriaAttrs()}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flexShrink: 0 }}>
          {renderIcon()}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: '0 0 4px 0', 
            fontSize: '16px', 
            fontWeight: 600,
            color: tokens.colors.text.primary 
          }}>
            {title}
          </h3>
          
          {description && (
            <p style={{ 
              margin: '0', 
              fontSize: '14px',
              color: tokens.colors.text.secondary 
            }}>
              {description}
            </p>
          )}
          
          {actions.length > 0 && (
            <Space className="toast-actions" style={{ marginTop: '8px' }}>
              {actions.map((action, index) => (
                <React.Fragment key={index}>{action}</ReactReact.Fragment>
              ))}
            </Space>
          )}
        </div>
        
        {closable && (
          <Button
            type="text"
            size="small"
            onClick={handleClose}
            aria-label="Close notification"
            style={{ 
              padding: '4px', 
              height: 'auto', 
              marginLeft: '8px',
              color: tokens.colors.text.secondary
            }}
          >
            <CloseCircleOutlined />
          </CloseCircleOutlinedButton>
        )}
      </div>
    </div>
  );
}