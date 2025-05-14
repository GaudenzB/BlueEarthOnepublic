/**
 * Formatting utilities for displaying data consistently across the application
 */

/**
 * Truncates a string to a specified length and adds an ellipsis if needed
 * 
 * @param text - String to truncate
 * @param maxLength - Maximum allowed length (default: 50)
 * @param ellipsis - String to append when truncated (default: '...')
 * @returns Truncated string with ellipsis if needed
 */
export function truncateText(
  text: string,
  maxLength: number = 50,
  ellipsis: string = '...'
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + ellipsis;
}

/**
 * Formats a date string into a localized display format
 * 
 * @param dateString - ISO date string to format
 * @param format - Formatting style (short, medium, long, full)
 * @param locale - Locale to use for formatting (default: user's locale)
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale?: string
): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Format options based on the requested format
    const options: Intl.DateTimeFormatOptions = 
      format === 'short' ? { year: 'numeric', month: 'numeric', day: 'numeric' } :
      format === 'medium' ? { year: 'numeric', month: 'short', day: 'numeric' } :
      format === 'long' ? { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' } :
      { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Formats a time string into a localized display format
 * 
 * @param timeString - ISO date string to extract time from
 * @param format - Formatting style (short, medium, long)
 * @param locale - Locale to use for formatting (default: user's locale)
 * @returns Formatted time string
 */
export function formatTime(
  timeString: string,
  format: 'short' | 'medium' | 'long' = 'medium',
  locale?: string
): string {
  if (!timeString) return '';
  
  try {
    const date = new Date(timeString);
    
    // Format options based on the requested format
    const options: Intl.DateTimeFormatOptions = 
      format === 'short' ? { hour: 'numeric', minute: 'numeric' } :
      format === 'medium' ? { hour: 'numeric', minute: 'numeric' } :
      { hour: 'numeric', minute: 'numeric', second: 'numeric' };
    
    return new Intl.DateTimeFormat(locale, {
      ...options,
      hour12: true
    }).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
}

/**
 * Formats a date and time string into a localized display format
 * 
 * @param dateTimeString - ISO date string to format
 * @param format - Formatting style (short, medium, long)
 * @param locale - Locale to use for formatting (default: user's locale)
 * @returns Formatted date and time string
 */
export function formatDateTime(
  dateTimeString: string,
  format: 'short' | 'medium' | 'long' = 'medium',
  locale?: string
): string {
  if (!dateTimeString) return '';
  
  try {
    const date = new Date(dateTimeString);
    
    // Format options based on the requested format
    const options: Intl.DateTimeFormatOptions = 
      format === 'short' ? { 
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric'
      } :
      format === 'medium' ? { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: 'numeric', minute: 'numeric'
      } :
      { 
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric'
      };
    
    return new Intl.DateTimeFormat(locale, {
      ...options,
      hour12: true
    }).format(date);
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return dateTimeString;
  }
}

/**
 * Formats a number as currency
 * 
 * @param value - Number to format as currency
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @param locale - Locale to use for formatting (default: user's locale)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale?: string
): string {
  if (value === null || value === undefined) return '';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return value.toString();
  }
}

/**
 * Formats a number with thousands separators and decimal places
 * 
 * @param value - Number to format
 * @param decimalPlaces - Number of decimal places to show (default: 0)
 * @param locale - Locale to use for formatting (default: user's locale)
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  decimalPlaces: number = 0,
  locale?: string
): string {
  if (value === null || value === undefined) return '';
  
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value);
  } catch (error) {
    console.error('Error formatting number:', error);
    return value.toString();
  }
}

/**
 * Formats a percentage value
 * 
 * @param value - Number to format as percentage (0.1 = 10%)
 * @param decimalPlaces - Number of decimal places to show (default: 0)
 * @param locale - Locale to use for formatting (default: user's locale)
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number,
  decimalPlaces: number = 0,
  locale?: string
): string {
  if (value === null || value === undefined) return '';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return value.toString();
  }
}

/**
 * Formats a file size in bytes to a human-readable format
 * 
 * @param bytes - File size in bytes
 * @param decimalPlaces - Number of decimal places to show (default: 1)
 * @param locale - Locale to use for formatting (default: user's locale)
 * @returns Formatted file size string
 */
export function formatFileSize(
  bytes: number,
  decimalPlaces: number = 1,
  locale?: string
): string {
  if (bytes === 0) return '0 Bytes';
  if (bytes === null || bytes === undefined) return '';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${formatNumber(parseFloat((bytes / Math.pow(k, i)).toFixed(decimalPlaces)), decimalPlaces, locale)} ${sizes[i]}`;
}

/**
 * Formats a phone number into a standardized format
 * 
 * @param phone - Phone number to format
 * @param countryCode - ISO country code for formatting rules (default: 'US')
 * @returns Formatted phone number
 */
export function formatPhoneNumber(
  phone: string,
  countryCode: string = 'US'
): string {
  if (!phone) return '';
  
  // Strip all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Apply formatting based on country code
  switch (countryCode) {
    case 'US':
    case 'CA':
      // Format: (XXX) XXX-XXXX or XXX-XXX-XXXX
      if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
      } else if (cleaned.length === 11 && cleaned[0] === '1') {
        return `+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 11)}`;
      }
      break;
    
    case 'UK':
    case 'GB':
      // UK numbers have various formats
      if (cleaned.length === 11 && cleaned.startsWith('07')) {
        // Mobile: 07XXX XXX XXX
        return `${cleaned.substring(0, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
      }
      break;
    
    // Add more country-specific formats as needed
    
    default:
      // For unsupported countries or formats, return with spaces every 3 digits
      return cleaned.replace(/(\d{3})(?=\d)/g, '$1 ');
  }
  
  // If no specific format matched, return the original
  return phone;
}

/**
 * Capitalizes the first letter of each word in a string
 * 
 * @param text - String to capitalize
 * @returns Capitalized string
 */
export function titleCase(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Converts snake_case to Title Case
 * 
 * @param snakeCase - Snake case string to convert
 * @returns Title case string
 */
export function snakeToTitleCase(snakeCase: string): string {
  if (!snakeCase) return '';
  
  return snakeCase
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a name for display (first name first)
 * 
 * @param firstName - First name
 * @param lastName - Last name
 * @param middleName - Middle name or initial (optional)
 * @returns Formatted full name
 */
export function formatName(
  firstName: string,
  lastName: string,
  middleName?: string
): string {
  if (!firstName && !lastName) return '';
  
  if (middleName) {
    return `${firstName} ${middleName} ${lastName}`.trim();
  }
  
  return `${firstName} ${lastName}`.trim();
}

/**
 * Formats a name for formal display (last name first)
 * 
 * @param firstName - First name
 * @param lastName - Last name
 * @param middleName - Middle name or initial (optional)
 * @returns Formatted formal name
 */
export function formatFormalName(
  firstName: string,
  lastName: string,
  middleName?: string
): string {
  if (!firstName && !lastName) return '';
  
  if (middleName) {
    return `${lastName}, ${firstName} ${middleName}`.trim();
  }
  
  return `${lastName}, ${firstName}`.trim();
}

/**
 * Extracts initials from a name (up to 2 characters)
 * 
 * @param fullName - Full name to extract initials from
 * @returns Initials (1-2 characters)
 */
export function getInitials(fullName: string): string {
  if (!fullName) return '';
  
  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default {
  truncateText,
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatFileSize,
  formatPhoneNumber,
  titleCase,
  snakeToTitleCase,
  formatName,
  formatFormalName,
  getInitials
};