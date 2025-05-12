/**
 * Common formatting functions for dates, numbers, currency, etc.
 */

/**
 * Format a date to a human-readable string
 * @param date Date to format
 * @param options Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format a date to a time string
 * @param date Date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  
  return formatDate(date, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date to a datetime string
 * @param date Date to format
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a number as currency
 * @param amount Number to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency = 'USD'
): string {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format a number with commas
 * @param number Number to format
 * @param decimalPlaces Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(
  number: number | null | undefined,
  decimalPlaces = 0
): string {
  if (number === null || number === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(number);
}

/**
 * Format a percentage
 * @param number Number to format (0-1)
 * @param decimalPlaces Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(
  number: number | null | undefined,
  decimalPlaces = 0
): string {
  if (number === null || number === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(number);
}

/**
 * Format a phone number
 * @param phoneNumber Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 11)}`;
  }
  
  // Return original if it doesn't match expected formats
  return phoneNumber;
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @param decimals Number of decimal places
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number | null | undefined, decimals = 2): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format a name (capitalize first letter of each word)
 * @param name Name to format
 * @returns Formatted name
 */
export function formatName(name: string | null | undefined): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Truncate a string if it exceeds the maximum length
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @param suffix Suffix to add if truncated
 * @returns Truncated text
 */
export function truncateText(
  text: string | null | undefined,
  maxLength = 100,
  suffix = '...'
): string {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return `${text.substring(0, maxLength)}${suffix}`;
}