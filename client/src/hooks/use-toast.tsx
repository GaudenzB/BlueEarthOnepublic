import React from 'react';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

/**
 * Toast hook for displaying notifications
 */
export const useToast = () => {
  const toast = (props: ToastProps) => {
    console.log('Toast displayed:', props);
    // In a real implementation, this would show a toast notification
  };

  return { toast };
};