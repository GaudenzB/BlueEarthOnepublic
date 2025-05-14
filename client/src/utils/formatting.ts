/**
 * Formatting Utility Functions
 * 
 * This file contains centralized utility functions for formatting data across the application.
 * Having these helpers in a shared location improves consistency and DRY principles.
 */

/**
 * Formats a date string or Date object to a human-readable format
 * 
 * @param dateInput - Date object or ISO date string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  dateInput: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string {
  if (!dateInput) return '';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatDate:', dateInput);
      return '';
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Formats a number as currency
 * 
 * @param amount - Number to format
 * @param currency - Currency code (default: USD)
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency = 'USD',
  locale = 'en-US'
): string {
  if (amount === null || amount === undefined) return '';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '';
  }
}

/**
 * Truncates text with ellipsis if it exceeds maxLength
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation (default: 100)
 * @returns Truncated text with ellipsis
 */
export function truncateText(
  text: string | null | undefined,
  maxLength = 100
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength).trim()}...`;
}

/**
 * Formats a file size from bytes to a human-readable format
 * 
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size (e.g., "1.5 MB")
 */
export function formatFileSize(
  bytes: number | null | undefined,
  decimals = 2
): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Formats a phone number to a standardized format
 * 
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    // US format: (XXX) XXX-XXXX
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US with country code: +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 11)}`;
  }
  
  // For international or irregular formats, just add a plus if needed
  if (!phone.startsWith('+') && cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  // Return as is if none of the formats apply
  return phone;
}

/**
 * Formats a name into initials
 * 
 * @param name - Full name
 * @param fallback - Fallback string if name is empty
 * @returns Initials string
 */
export function getInitials(name: string | null | undefined, fallback = '??'): string {
  if (!name) return fallback;
  
  const nameParts = name.split(' ');
  
  if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
    // Get first initial of first and last name
    return `${nameParts[0][0] || ''}${nameParts[nameParts.length - 1][0] || ''}`.toUpperCase();
  } else if (nameParts[0]) {
    // Get first two letters of single name
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  
  return fallback;
}

/**
 * Converts snake_case or kebab-case to Title Case
 * 
 * @param text - Text in snake_case or kebab-case
 * @returns Text in Title Case
 */
export function formatCase(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    .replace(/[_-]/g, ' ')
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase());
}

/**
 * Normalizes a string for safe use in IDs, classes, etc.
 * Replaces special characters with underscores
 * 
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeString(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
}

/**
 * Pluralizes a word based on count
 * 
 * @param count - Numeric count
 * @param singular - Singular form of the word
 * @param plural - Plural form of the word (default: singular + 's')
 * @returns Pluralized word based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}