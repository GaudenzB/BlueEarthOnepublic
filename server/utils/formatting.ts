/**
 * Formatting utilities for consistent data presentation
 */

/**
 * Format a date to a standard string representation
 * @param date Date to format
 * @returns formatted date string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes Size in bytes
 * @returns Formatted size string (e.g. '1.5 MB')
 */
export function formatFileSize(bytes: number | string | null | undefined): string {
  if (bytes === null || bytes === undefined) return '';
  
  const bytesNum = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  
  if (isNaN(bytesNum)) return 'Unknown size';
  
  if (bytesNum === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytesNum) / Math.log(1024));
  
  return `${(bytesNum / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Truncate a string to a specified length with ellipsis
 * @param str String to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated string
 */
export function truncateString(str: string | null | undefined, maxLength: number = 100): string {
  if (!str) return '';
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
}

/**
 * Format a document type to a more readable form
 * @param type Document type string
 * @returns Formatted type string
 */
export function formatDocumentType(type: string | null | undefined): string {
  if (!type) return 'Other';
  
  // Convert SNAKE_CASE or UPPERCASE to Title Case
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format a processing status to a readable form
 * @param status Status string
 * @returns Formatted status string
 */
export function formatProcessingStatus(status: string | null | undefined): string {
  if (!status) return 'Unknown';
  
  const statusMap: Record<string, string> = {
    'PENDING': 'Pending',
    'PROCESSING': 'Processing',
    'COMPLETED': 'Completed',
    'FAILED': 'Failed',
    'QUEUED': 'Queued'
  };
  
  return statusMap[status] || status;
}