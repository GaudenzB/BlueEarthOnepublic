/**
 * Text formatting utilities
 * 
 * Common text formatting functions used across the application
 */

type DateFormat = 'short' | 'medium' | 'long' | 'full' | 'numeric' | 'relative';

/**
 * Format a date string into a human-readable format
 */
export const formatDate = (dateString: string, format: DateFormat = 'medium'): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'medium':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      case 'long':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'full':
        return date.toLocaleDateString(undefined, { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'numeric':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        });
      case 'relative':
        return formatRelativeTime(date);
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date as a relative time string (e.g., "2 days ago")
 */
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  }
};

/**
 * Truncate text to a specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Capitalize the first letter of a string
 */
export const capitalizeFirst = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Format a number as currency
 */
export const formatCurrency = (
  value: number, 
  currency = 'USD', 
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency 
  }).format(value);
};

/**
 * Format a number with thousand separators
 */
export const formatNumber = (
  value: number, 
  minimumFractionDigits = 0,
  maximumFractionDigits = 2
): string => {
  return new Intl.NumberFormat(undefined, { 
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

/**
 * Format bytes to human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format a phone number to a consistent format
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Strip all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if we can't format it
  return phoneNumber;
};

/**
 * Convert camelCase to Title Case
 */
export const camelToTitleCase = (camelCase: string): string => {
  const result = camelCase
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
  
  return result;
};

/**
 * Format a percentage
 */
export const formatPercentage = (
  value: number,
  minimumFractionDigits = 0,
  maximumFractionDigits = 2
): string => {
  return `${new Intl.NumberFormat(undefined, { 
    minimumFractionDigits,
    maximumFractionDigits, 
    style: 'percent'
  }).format(value / 100)}`;
};

/**
 * Sanitize HTML to prevent XSS
 */
export const sanitizeHtml = (html: string): string => {
  // Very basic sanitization - for production use DOMPurify or similar
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};