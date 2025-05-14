/**
 * Formatting Utility Functions
 * 
 * This file contains utility functions for formatting data
 * consistently across the application. Functions include
 * date formatting, number formatting, string manipulation,
 * and other common formatting tasks.
 */

/**
 * Formats a date to a standard string representation
 * 
 * @param date - Date to format (Date object or ISO string)
 * @param format - Format string ('short', 'medium', 'long', 'full')
 * @param locale - Optional locale (defaults to user's locale)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale?: string
): string {
  if (!date) return '';
  
  // Convert to Date object if string or number
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  // Options for different formats
  const options: Intl.DateTimeFormatOptions = {
    short: { year: 'numeric', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' },
    full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  }[format];
  
  // Get user's locale if not specified
  const userLocale = locale || navigator.language || 'en-US';
  
  return new Intl.DateTimeFormat(userLocale, options).format(dateObj);
}

/**
 * Formats a time to a standard string representation
 * 
 * @param date - Date/time to format (Date object or ISO string)
 * @param format - Format string ('short', 'medium')
 * @param locale - Optional locale (defaults to user's locale)
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string | number,
  format: 'short' | 'medium' = 'short',
  locale?: string
): string {
  if (!date) return '';
  
  // Convert to Date object if string or number
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid time';
  }
  
  // Options for different formats
  const options: Intl.DateTimeFormatOptions = {
    short: { hour: 'numeric', minute: 'numeric' },
    medium: { hour: 'numeric', minute: 'numeric', second: 'numeric' }
  }[format];
  
  // Get user's locale if not specified
  const userLocale = locale || navigator.language || 'en-US';
  
  return new Intl.DateTimeFormat(userLocale, options).format(dateObj);
}

/**
 * Formats a date and time to a standard string representation
 * 
 * @param date - Date/time to format (Date object or ISO string)
 * @param format - Format string ('short', 'medium', 'long')
 * @param locale - Optional locale (defaults to user's locale)
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' = 'medium',
  locale?: string
): string {
  if (!date) return '';
  
  // Convert to Date object if string or number
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date/time';
  }
  
  // Options for different formats
  const options: Intl.DateTimeFormatOptions = {
    short: { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }
  }[format];
  
  // Get user's locale if not specified
  const userLocale = locale || navigator.language || 'en-US';
  
  return new Intl.DateTimeFormat(userLocale, options).format(dateObj);
}

/**
 * Formats a relative time (e.g., "2 hours ago", "in 3 days")
 * 
 * @param date - Date to format relative to now
 * @param options - Formatting options
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  date: Date | string | number,
  options: {
    now?: Date;
    style?: 'long' | 'short' | 'narrow';
    numeric?: 'always' | 'auto';
    locale?: string;
  } = {}
): string {
  if (!date) return '';
  
  const { 
    now = new Date(),
    style = 'long',
    numeric = 'auto',
    locale = navigator.language || 'en-US'
  } = options;
  
  // Convert to Date object if string or number
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  // Difference in seconds
  const diffSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
  const absoluteDiff = Math.abs(diffSeconds);
  
  // Determine the appropriate unit
  let unit: Intl.RelativeTimeFormatUnit;
  let value: number;
  
  if (absoluteDiff < 60) {
    unit = 'second';
    value = diffSeconds;
  } else if (absoluteDiff < 3600) {
    unit = 'minute';
    value = Math.floor(diffSeconds / 60);
  } else if (absoluteDiff < 86400) {
    unit = 'hour';
    value = Math.floor(diffSeconds / 3600);
  } else if (absoluteDiff < 2592000) {
    unit = 'day';
    value = Math.floor(diffSeconds / 86400);
  } else if (absoluteDiff < 31536000) {
    unit = 'month';
    value = Math.floor(diffSeconds / 2592000);
  } else {
    unit = 'year';
    value = Math.floor(diffSeconds / 31536000);
  }
  
  // Format using RelativeTimeFormat
  const formatter = new Intl.RelativeTimeFormat(locale, { style, numeric });
  
  return formatter.format(value, unit);
}

/**
 * Formats a number with thousands separators and decimal places
 * 
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | string,
  options: {
    decimalPlaces?: number;
    useGrouping?: boolean;
    locale?: string;
  } = {}
): string {
  if (value === undefined || value === null || value === '') return '';
  
  // Convert to number if string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if value is a valid number
  if (isNaN(numValue)) {
    return 'Invalid number';
  }
  
  const { 
    decimalPlaces = 2,
    useGrouping = true,
    locale = navigator.language || 'en-US'
  } = options;
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping
  }).format(numValue);
}

/**
 * Formats a currency value
 * 
 * @param value - Currency amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string,
  options: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    currencyDisplay?: 'symbol' | 'code' | 'name';
  } = {}
): string {
  if (value === undefined || value === null || value === '') return '';
  
  // Convert to number if string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if value is a valid number
  if (isNaN(numValue)) {
    return 'Invalid amount';
  }
  
  const { 
    currency = 'USD',
    locale = navigator.language || 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    currencyDisplay = 'symbol'
  } = options;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    currencyDisplay
  }).format(numValue);
}

/**
 * Formats a percentage value
 * 
 * @param value - Percentage to format (as decimal or percentage)
 * @param options - Formatting options
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number | string,
  options: {
    decimalPlaces?: number;
    includeSign?: boolean;
    locale?: string;
    convertFromDecimal?: boolean;
  } = {}
): string {
  if (value === undefined || value === null || value === '') return '';
  
  // Convert to number if string
  let numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if value is a valid number
  if (isNaN(numValue)) {
    return 'Invalid percentage';
  }
  
  const { 
    decimalPlaces = 2,
    includeSign = false,
    locale = navigator.language || 'en-US',
    convertFromDecimal = true
  } = options;
  
  // Convert from decimal to percentage if needed (e.g., 0.42 -> 42%)
  if (convertFromDecimal && numValue < 10) {
    numValue *= 100;
  }
  
  const formatted = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(numValue / 100);
  
  return includeSign ? formatted : formatted;
}

/**
 * Truncates a string to a maximum length and adds ellipsis if needed
 * 
 * @param text - String to truncate
 * @param length - Maximum length
 * @param options - Truncation options
 * @returns Truncated string
 */
export function truncateText(
  text: string,
  length: number,
  options: {
    ellipsis?: string;
    useWordBoundary?: boolean;
  } = {}
): string {
  if (!text) return '';
  
  const { 
    ellipsis = '...',
    useWordBoundary = true
  } = options;
  
  // If text is shorter than max length, return it as is
  if (text.length <= length) {
    return text;
  }
  
  // Truncate to maximum length
  let truncated = text.substring(0, length - ellipsis.length);
  
  // If using word boundary, find the last space
  if (useWordBoundary) {
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.substring(0, lastSpace);
    }
  }
  
  // Add ellipsis
  return truncated + ellipsis;
}

/**
 * Converts a string to title case (first letter of each word capitalized)
 * 
 * @param text - String to convert
 * @param options - Conversion options
 * @returns Title-cased string
 */
export function toTitleCase(
  text: string,
  options: {
    lowerCaseRest?: boolean;
    keepInternalCapitalization?: boolean;
    excludedWords?: string[];
  } = {}
): string {
  if (!text) return '';
  
  const { 
    lowerCaseRest = true,
    keepInternalCapitalization = true,
    excludedWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'with']
  } = options;
  
  // Split text into words
  const words = text.split(' ');
  
  // Process each word
  const titleCasedWords = words.map((word, index) => {
    // Skip small words that aren't at the beginning or end
    if (index !== 0 && index !== words.length - 1 && excludedWords.includes(word.toLowerCase())) {
      return lowerCaseRest ? word.toLowerCase() : word;
    }
    
    // Skip empty words
    if (word.length === 0) {
      return word;
    }
    
    // Function to capitalize the first letter
    const capitalizeFirst = (w: string) => w.charAt(0).toUpperCase() + 
      (lowerCaseRest ? w.substring(1).toLowerCase() : w.substring(1));
    
    // Handle internal capitalization (e.g., "iOS", "iPhone")
    if (keepInternalCapitalization) {
      // Check if the word has internal capitalization
      if (/[A-Z]/.test(word.substring(1))) {
        // Split the word at points where case changes
        const parts = word.match(/[A-Z]?[a-z]*/g)?.filter(Boolean) || [];
        
        if (parts.length > 1) {
          // Capitalize the first letter of the first part
          parts[0] = capitalizeFirst(parts[0]);
          return parts.join('');
        }
      }
    }
    
    // Regular capitalization
    return capitalizeFirst(word);
  });
  
  // Join words back together
  return titleCasedWords.join(' ');
}

/**
 * Formats a file size into a human-readable string
 * 
 * @param bytes - File size in bytes
 * @param options - Formatting options
 * @returns Formatted file size string
 */
export function formatFileSize(
  bytes: number,
  options: {
    decimalPlaces?: number;
    binary?: boolean;
    locale?: string;
  } = {}
): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) {
    return 'Unknown size';
  }
  
  const { 
    decimalPlaces = 2,
    binary = false,
    locale = navigator.language || 'en-US'
  } = options;
  
  // Units for decimal (1000-based) and binary (1024-based) formats
  const units = {
    decimal: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    binary: ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  };
  
  // Base for calculation (1000 for decimal, 1024 for binary)
  const base = binary ? 1024 : 1000;
  const unitSet = binary ? units.binary : units.decimal;
  
  // Handle 0 bytes
  if (bytes === 0) {
    return `0 ${unitSet[0]}`;
  }
  
  // Calculate the appropriate unit
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), unitSet.length - 1);
  const value = bytes / Math.pow(base, exponent);
  
  // Format the number
  const formattedValue = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
  
  // Combine with unit
  return `${formattedValue} ${unitSet[exponent]}`;
}

/**
 * Formats a phone number based on the specified country format
 * 
 * @param phoneNumber - Phone number to format
 * @param options - Formatting options
 * @returns Formatted phone number
 */
export function formatPhoneNumber(
  phoneNumber: string,
  options: {
    countryCode?: string;
    format?: 'national' | 'international';
  } = {}
): string {
  if (!phoneNumber) return '';
  
  const { 
    countryCode = 'US',
    format = 'national'
  } = options;
  
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Simple formatter for US numbers
  if (countryCode === 'US') {
    if (digits.length === 10) {
      const areaCode = digits.substring(0, 3);
      const prefix = digits.substring(3, 6);
      const line = digits.substring(6, 10);
      
      if (format === 'national') {
        return `(${areaCode}) ${prefix}-${line}`;
      } else {
        return `+1 ${areaCode} ${prefix} ${line}`;
      }
    } else if (digits.length === 11 && digits.charAt(0) === '1') {
      const areaCode = digits.substring(1, 4);
      const prefix = digits.substring(4, 7);
      const line = digits.substring(7, 11);
      
      if (format === 'national') {
        return `(${areaCode}) ${prefix}-${line}`;
      } else {
        return `+1 ${areaCode} ${prefix} ${line}`;
      }
    }
  }
  
  // For other countries, just do basic grouping
  // In a real app, you'd want to use a proper phone formatting library like libphonenumber
  return digits.replace(/(\d{1,3})(?=(\d{3})+(?!\d))/g, '$1 ');
}

/**
 * Formats name parts into a full name
 * 
 * @param parts - Name parts object
 * @param options - Formatting options
 * @returns Formatted full name
 */
export function formatName(
  parts: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    prefix?: string;
    suffix?: string;
  },
  options: {
    format?: 'short' | 'medium' | 'long' | 'formal';
    includeMiddleName?: boolean;
  } = {}
): string {
  const { 
    format = 'medium',
    includeMiddleName = true
  } = options;
  
  const { firstName, middleName, lastName, prefix, suffix } = parts;
  
  // Handle missing first and last name
  if (!firstName && !lastName) {
    return '';
  }
  
  // Format based on specified format
  switch (format) {
    case 'short':
      return firstName || lastName || '';
      
    case 'formal':
      return [
        prefix,
        lastName,
        firstName ? `, ${firstName}` : '',
        (suffix ? `, ${suffix}` : '')
      ].filter(Boolean).join('');
      
    case 'long':
      return [
        prefix,
        firstName,
        includeMiddleName && middleName ? middleName : '',
        lastName,
        suffix
      ].filter(Boolean).join(' ');
      
    case 'medium':
    default:
      return [
        firstName,
        includeMiddleName && middleName ? middleName.charAt(0) + '.' : '',
        lastName
      ].filter(Boolean).join(' ');
  }
}

/**
 * Formats a status code into a readable string
 * 
 * @param status - Status to format (string or code)
 * @param options - Formatting options
 * @returns Formatted status string
 */
export function formatStatus(
  status: string | number,
  options: {
    capitalize?: boolean;
    replaceUnderscores?: boolean;
  } = {}
): string {
  if (status === undefined || status === null) return '';
  
  const { 
    capitalize = true,
    replaceUnderscores = true
  } = options;
  
  // Convert to string
  let statusStr = String(status);
  
  // Replace underscores with spaces
  if (replaceUnderscores) {
    statusStr = statusStr.replace(/_/g, ' ');
  }
  
  // Capitalize
  if (capitalize) {
    statusStr = statusStr.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  return statusStr;
}