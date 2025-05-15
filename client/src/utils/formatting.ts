/**
 * Formatting utilities for client-side use
 */

/**
 * Format a date to a standard string representation
 * @param date Date to format
 * @param format Format style ('short', 'medium', 'long')
 * @returns formatted date string
 */
export function formatDate(date: Date | string | null | undefined, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      case 'long':
        return dateObj.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      case 'medium':
      default:
        return dateObj.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
    }
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
 * Truncate a string to a specified length with ellipsis (alias for truncateString)
 * @param str String to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated string
 */
export function truncateText(str: string | null | undefined, maxLength: number = 100): string {
  return truncateString(str, maxLength);
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
 * Format a processing status to a readable form with appropriate color class
 * @param status Status string
 * @returns Object with formatted text and CSS class
 */
export function formatProcessingStatus(
  status: string | null | undefined
): { text: string; className: string } {
  if (!status) {
    return { text: 'Unknown', className: 'text-gray-500' };
  }
  
  const statusMap: Record<string, { text: string; className: string }> = {
    'PENDING': { text: 'Pending', className: 'text-yellow-500' },
    'PROCESSING': { text: 'Processing', className: 'text-blue-500' },
    'COMPLETED': { text: 'Completed', className: 'text-green-500' },
    'FAILED': { text: 'Failed', className: 'text-red-500' },
    'QUEUED': { text: 'Queued', className: 'text-purple-500' }
  };
  
  return statusMap[status] || { text: status, className: 'text-gray-500' };
}

/**
 * Format a relevance score (0-1) as a percentage
 * @param score Relevance score between 0-1
 * @returns Formatted percentage
 */
export function formatRelevanceScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}