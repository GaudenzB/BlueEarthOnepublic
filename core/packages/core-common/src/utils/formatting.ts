/**
 * Formatting Utilities
 * 
 * This file provides common formatting helpers for data presentation
 * that can be used across both client and server code.
 */

/**
 * Format a date to a localized string
 * Default format: "Jan 1, 2023"
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  },
  locale: string = 'en-US'
): string {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString(locale, options);
}

/**
 * Format a date with time
 * Default format: "Jan 1, 2023, 12:00 PM"
 */
export function formatDateTime(
  date: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  },
  locale: string = 'en-US'
): string {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleString(locale, options);
}

/**
 * Format a currency value
 * Default format: "$1,234.56"
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}

/**
 * Format a number with commas and decimal places
 * Default format: "1,234.56"
 */
export function formatNumber(
  value: number | null | undefined,
  decimalPlaces: number = 2,
  locale: string = 'en-US'
): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
}

/**
 * Format a phone number
 * Default format: "(123) 456-7890"
 */
export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  } else {
    // If the format is unknown, return the original
    return phoneNumber;
  }
}

/**
 * Format a file size
 * Default format: "1.23 MB"
 */
export function formatFileSize(
  bytes: number | null | undefined,
  decimals: number = 2
): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis if it exceeds the maximum length
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number = 100,
  ellipsis: string = '...'
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}${ellipsis}`;
}

/**
 * Convert a string to title case
 * Example: "hello world" -> "Hello World"
 */
export function toTitleCase(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert a camelCase string to a human-readable format
 * Example: "camelCaseString" -> "Camel Case String"
 */
export function camelCaseToHuman(text: string | null | undefined): string {
  if (!text) return '';
  const result = text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
  return result.trim();
}

/**
 * Remove HTML tags from a string
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Format a relative time
 * Example: "2 hours ago", "in 3 days"
 */
export function formatRelativeTime(
  date: Date | string | number | null | undefined,
  locale: string = 'en-US'
): string {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(-Math.round(diffInSeconds), 'second');
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(-diffInMinutes, 'minute');
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(-diffInHours, 'hour');
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(-diffInDays, 'day');
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(-diffInMonths, 'month');
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return rtf.format(-diffInYears, 'year');
}