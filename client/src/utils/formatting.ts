/**
 * Utility functions for text formatting and display
 */

/**
 * Format text for display, trimming whitespace and handling null values
 */
export const formatText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.trim();
};

/**
 * Format a date string into a human-readable format
 * @param dateStr - ISO date string or Date object
 * @param format - Format style: 'short', 'medium', 'long', or 'full'
 */
export const formatDate = (
  dateStr: string | Date, 
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string => {
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric',
      hour: format === 'full' || format === 'long' ? 'numeric' : undefined,
      minute: format === 'full' || format === 'long' ? 'numeric' : undefined,
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return String(dateStr);
  }
};

/**
 * Truncate text to a specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Format file size into human-readable form
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};