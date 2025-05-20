import React from 'react';
import { Button } from 'antd';
import { FileTextOutlined, InboxOutlined } from '@ant-design/icons';

/**
 * Props for loading, error, and not found states in document detail
 */
export interface DocumentDetailStateProps {
  onReturn: () => void;
  error?: Error;
}

/**
 * Empty state component with icon and message for document detail
 * 
 * @param message - The message to display
 * @param subMessage - Optional secondary message
 * @param onAction - Optional action callback
 * @param actionText - Optional action button text
 */
export function EmptyState({ 
  message = "No Document Selected", 
  subMessage,
  onAction,
  actionText
}: {
  message: string;
  subMessage?: string;
  onAction?: () => void;
  actionText?: string;
}) {
  return (
    <div 
      className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-100 shadow-sm"
      style={{ 
        minHeight: '300px',
        maxWidth: '800px',
        margin: '48px auto'
      }}
    >
      <div className="text-slate-300 mb-4">
        <InboxOutlined style={{ fontSize: '64px' }} />
      </div>
      
      <h2 className="text-xl font-semibold text-slate-800 mb-2">
        {message}
      </h2>
      
      {subMessage && (
        <p className="text-slate-500 text-center max-w-md mb-6">
          {subMessage}
        </p>
      )}
      
      {onAction && actionText && (
        <Button 
          type="primary"
          onClick={onAction}
          icon={<FileTextOutlined />}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}

/**
 * Skeleton loading state for document detail
 * Enhanced with better visual representation and accessibility
 */
export function DocumentDetailSkeleton() {
  // Creating a pulsating animation effect for skeletons
  const pulseAnimation = {
    animation: 'pulse 1.5s ease-in-out 0.5s infinite',
  };
  
  // CSS for the animation to be inserted in a style tag
  const animationStyle = `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `;
  
  return (
    <div 
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}
      aria-busy="true"
      aria-live="polite"
    >
      <style>{animationStyle}</style>
      
      {/* Document Header Skeleton */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        marginBottom: 24 as number, 
        alignItems: 'center', 
        gap: 16,
        flexWrap: 'wrap'
      }}>
        {/* Status Badge */}
        <div style={{ 
          width: 100, 
          height: 32, 
          backgroundColor: '#f0f0f0', 
          borderRadius: 4,
          ...pulseAnimation
        }} 
        aria-hidden="true"
        />
        
        {/* Document Title */}
        <div style={{ 
          width: 300, 
          height: 32, 
          backgroundColor: '#f0f0f0', 
          borderRadius: 4,
          ...pulseAnimation
        }} 
        aria-hidden="true"
        />
        
        <div style={{ flex: 1 }}></div>
        
        {/* Action Buttons */}
        <div style={{ 
          width: 100, 
          height: 32, 
          backgroundColor: '#f0f0f0', 
          borderRadius: 4,
          ...pulseAnimation
        }} 
        aria-hidden="true"
        />
        <div style={{ 
          width: 100, 
          height: 32, 
          backgroundColor: '#f0f0f0', 
          borderRadius: 4,
          ...pulseAnimation
        }} 
        aria-hidden="true"
        />
      </div>
      
      {/* Document Info Skeleton Lines */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#fafafa', 
        borderRadius: '8px', 
        marginBottom: '24px',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ 
          height: 20, 
          backgroundColor: '#f0f0f0', 
          borderRadius: 4, 
          marginBottom: 12 as number, 
          width: '100%',
          ...pulseAnimation
        }} 
        aria-hidden="true"
        />
        <div style={{ 
          height: 20, 
          backgroundColor: '#f0f0f0', 
          borderRadius: 4, 
          marginBottom: 12 as number, 
          width: '90%',
          ...pulseAnimation
        }} 
        aria-hidden="true"
        />
        <div style={{ 
          height: 20, 
          backgroundColor: '#f0f0f0', 
          borderRadius: 4, 
          width: '95%',
          ...pulseAnimation
        }} 
        aria-hidden="true"
        />
      </div>
      
      {/* Tabs Skeleton */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)', 
        padding: '24px',
        border: '1px solid #e5e7eb',
      }}>
        {/* Tab headers */}
        <div style={{ 
          display: 'flex',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '24px',
          paddingBottom: '16px',
          gap: '24px'
        }}>
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              style={{ 
                height: 24, 
                backgroundColor: i === 1 ? '#e6f7ff' : '#f0f0f0', 
                borderRadius: 4, 
                width: '80px',
                ...pulseAnimation
              }}
              aria-hidden="true"
            />
          ))}
        </div>
        
        {/* Tab content */}
        <div style={{ 
          height: 32, 
          backgroundColor: '#f0f0f0', 
          borderRadius: 4, 
          marginBottom: 16 as number, 
          width: '30%',
          ...pulseAnimation
        }} 
        aria-hidden="true"
        />
        
        <div style={{ 
          height: 250, 
          backgroundColor: '#f0f0f0', 
          borderRadius: 4, 
          marginBottom: 16 as number, 
          width: '100%',
          ...pulseAnimation
        }} 
        aria-hidden="true"
        />
      </div>
      
      {/* Screen reader only text */}
      <div style={{ 
        position: 'absolute', 
        width: '1px', 
        height: '1px', 
        padding: '0', 
        margin: '-1px', 
        overflow: 'hidden', 
        clip: 'rect(0, 0, 0, 0)', 
        whiteSpace: 'nowrap', 
        borderWidth: '0' 
      }} 
      role="status"
      >
        Loading document details, please wait...
      </div>
    </div>
  );
}

/**
 * Error display for document detail
 * Enhanced with better error message formatting and accessibility
 */
export function DocumentDetailError({ error, onReturn }: DocumentDetailStateProps) {
  // Parse error message to provide more context
  const getErrorContext = (err: Error | undefined) => {
    if (!err) return { title: 'An unexpected error occurred', details: 'Please try again later or contact support.' };
    
    const message = err.message || 'Unknown error';
    
    // Handle specific error types
    if (message.includes('401') || message.includes('unauthorized')) {
      return {
        title: 'Authentication Error',
        details: 'You are not authorized to access this document. Please log in again or contact your administrator.'
      };
    } else if (message.includes('403') || message.includes('forbidden')) {
      return {
        title: 'Access Denied',
        details: 'You don\'t have permission to access this document. Please request access from your administrator.'
      };
    } else if (message.includes('404') || message.includes('not found')) {
      return {
        title: 'Document Not Found',
        details: 'The document you\'re looking for may have been moved or deleted.'
      };
    } else if (message.includes('timeout') || message.includes('timed out')) {
      return {
        title: 'Request Timeout',
        details: 'The server took too long to respond. Please check your connection and try again.'
      };
    } else if (message.includes('network') || message.includes('connection')) {
      return {
        title: 'Network Error',
        details: 'Please check your internet connection and try again.'
      };
    }
    
    return { 
      title: 'Error Loading Document', 
      details: message 
    };
  };
  
  const errorInfo = getErrorContext(error);
  
  return (
    <div 
      style={{ maxWidth: '800px', margin: '48px auto', padding: '24px', textAlign: 'center', backgroundColor: '#FFF1F0', borderRadius: '8px', border: '1px solid #FFCCC7' }}
      role="alert"
      aria-live="assertive"
    >
      <div style={{ fontSize: '48px', color: '#CF1322' as string, marginBottom: '16px' }}>
        ⚠️
      </div>
      <h2 style={{ color: '#CF1322' as string, fontSize: '24px', marginBottom: '16px' }} id="error-heading">
        {errorInfo.title}
      </h2>
      <p style={{ color: '#666' as string, marginBottom: '16px', fontSize: '16px' }}>
        {errorInfo.details}
      </p>
      <div style={{ margin: '24px 0' }}>
        <div style={{ fontSize: '14px', backgroundColor: '#FFEBE9', padding: '12px', borderRadius: '4px', color: '#5C0011' as string, fontFamily: 'monospace', textAlign: 'left', maxHeight: '100px', overflow: 'auto' }}>
          {error?.stack ? error.stack.split('\n')[0] : 'No additional error information available'}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <Button 
          type="primary"
          onClick={onReturn}
          aria-describedby="error-heading"
        >
          Return to Documents
        </Button>
        <Button 
          onClick={() => window.location.reload()}
          aria-describedby="error-heading"
        >
          Refresh Page
        </Button>
      </div>
    </div>
  );
}

/**
 * Not found display for document detail
 * Enhanced with better visuals and accessibility
 */
export function DocumentDetailNotFound({ onReturn }: DocumentDetailStateProps) {
  return (
    <div 
      style={{ maxWidth: '800px', margin: '48px auto', padding: '32px', textAlign: 'center', backgroundColor: '#F6FFED', borderRadius: '8px', border: '1px solid #B7EB8F' }}
      role="alert"
      aria-live="polite"
    >
      <div style={{ fontSize: '48px', color: '#52C41A' as string, marginBottom: '16px' }}>
        🔍
      </div>
      <h2 style={{ color: '#135200' as string, fontSize: '24px', marginBottom: '16px' }} id="not-found-heading">
        Document Not Found
      </h2>
      <p style={{ color: '#666' as string, marginBottom: '24px', fontSize: '16px', maxWidth: '600px', margin: '0 auto 24px' }}>
        The document you're looking for doesn't exist or you don't have permission to view it. 
        This could be because:
      </p>
      <ul style={{ listStyle: 'none', textAlign: 'left', width: 'fit-content', margin: '0 auto 24px', color: '#444' as string }}>
        <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '8px', color: '#52C41A' as string }}>•</span> 
          The document has been deleted or moved
        </li>
        <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '8px', color: '#52C41A' as string }}>•</span> 
          The URL you entered is incorrect
        </li>
        <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '8px', color: '#52C41A' as string }}>•</span> 
          You need additional permissions to access this document
        </li>
      </ul>
      <div style={{ margin: '32px 0' }}>
        <Button 
          type="primary"
          onClick={onReturn}
          aria-describedby="not-found-heading"
          style={{ background: '#52C41A', borderColor: '#52C41A' }}
        >
          Return to Documents
        </Button>
      </div>
    </div>
  );
}