/**
 * Value Formatting Utilities
 * 
 * This module provides functions for consistently formatting different types of values
 * throughout the application (dates, currency, numbers, etc).
 */

/**
 * Formats a date as a localized string with various format options
 * 
 * @param date - Date to format (Date object or ISO string)
 * @param options - Formatting options
 * @returns Formatted date string
 * 
 * @example
 * ```typescript
 * formatDate('2025-04-15T14:30:00Z') // "Apr 15, 2025"
 * formatDate('2025-04-15T14:30:00Z', { format: 'full' }) // "Tuesday, April 15, 2025"
 * formatDate('2025-04-15T14:30:00Z', { includeTime: true }) // "Apr 15, 2025, 2:30 PM"
 * ```
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: {
    format?: 'short' | 'medium' | 'long' | 'full';
    includeTime?: boolean;
    timeFormat?: '12h' | '24h';
    locale?: string;
  } = {}
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }
  
  const {
    format = 'medium',
    includeTime = false,
    timeFormat = '12h',
    locale = 'en-US',
  } = options;
  
  // Date style options based on format parameter
  const dateStyleMap = {
    short: { dateStyle: 'short' as const },
    medium: { dateStyle: 'medium' as const },
    long: { dateStyle: 'long' as const },
    full: { dateStyle: 'full' as const }
  };
  
  // Time style options based on 12h/24h format
  const timeStyleMap = {
    '12h': { hour: 'numeric' as const, minute: 'numeric' as const, hour12: true },
    '24h': { hour: 'numeric' as const, minute: 'numeric' as const, hour12: false }
  };
  
  // Set up formatting options
  let formatOptions: Intl.DateTimeFormatOptions = {
    ...dateStyleMap[format]
  };
  
  if (includeTime) {
    formatOptions = {
      ...formatOptions,
      ...timeStyleMap[timeFormat]
    };
  }
  
  // Create formatter with locale and options
  const formatter = new Intl.DateTimeFormat(locale, formatOptions);
  return formatter.format(dateObj);
}

/**
 * Formats a relative time span (like "2 days ago" or "in 3 hours")
 * 
 * @param date - Date to calculate relative time from
 * @param relativeTo - Date to calculate relative time to (default: now)
 * @param options - Formatting options
 * @returns Formatted relative time string
 * 
 * @example
 * ```typescript
 * formatRelativeTime('2025-04-13T14:30:00Z') // "2 days ago" (if today is Apr 15)
 * formatRelativeTime('2025-04-17T14:30:00Z') // "in 2 days" (if today is Apr 15)
 * ```
 */
export function formatRelativeTime(
  date: Date | string | null | undefined,
  relativeTo: Date | string = new Date(),
  options: {
    style?: 'long' | 'short' | 'narrow';
    locale?: string;
    numericThreshold?: number;
  } = {}
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const relativeToObj = typeof relativeTo === 'string' ? new Date(relativeTo) : relativeTo;
  
  if (
    !(dateObj instanceof Date) || 
    isNaN(dateObj.getTime()) || 
    !(relativeToObj instanceof Date) || 
    isNaN(relativeToObj.getTime())
  ) {
    return '';
  }
  
  const {
    style = 'long',
    locale = 'en-US',
    numericThreshold = 0, // 0 means always show numeric, e.g. "2 days ago" instead of "yesterday"
  } = options;
  
  const diffMs = dateObj.getTime() - relativeToObj.getTime();
  const diffAbsMs = Math.abs(diffMs);
  
  // Define time units in milliseconds
  const units = [
    { unit: 'year', ms: 31536000000 },
    { unit: 'month', ms: 2592000000 },
    { unit: 'week', ms: 604800000 },
    { unit: 'day', ms: 86400000 },
    { unit: 'hour', ms: 3600000 },
    { unit: 'minute', ms: 60000 },
    { unit: 'second', ms: 1000 }
  ];
  
  // Find the appropriate unit to use
  for (const { unit, ms } of units) {
    if (diffAbsMs >= ms || unit === 'second') {
      const value = Math.round(diffAbsMs / ms);
      
      // Format with RelativeTimeFormat
      const formatter = new Intl.RelativeTimeFormat(locale, { 
        style, 
        numeric: value <= numericThreshold ? 'auto' : 'always' 
      });
      
      // Use negative value for past dates, positive for future dates
      return formatter.format(diffMs < 0 ? -value : value, unit as Intl.RelativeTimeFormatUnit);
    }
  }
  
  return '';
}

/**
 * Formats a number with proper thousands separators and decimal points
 * 
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 * 
 * @example
 * ```typescript
 * formatNumber(1234.56) // "1,234.56"
 * formatNumber(1234.56, { maximumFractionDigits: 0 }) // "1,235"
 * formatNumber(0.5, { style: 'percent' }) // "50%"
 * ```
 */
export function formatNumber(
  value: number | string | null | undefined,
  options: {
    style?: 'decimal' | 'percent' | 'unit';
    unit?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
    notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
    signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
  } = {}
): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '';
  }
  
  const {
    style = 'decimal',
    unit,
    minimumFractionDigits,
    maximumFractionDigits,
    locale = 'en-US',
    notation = 'standard',
    signDisplay = 'auto'
  } = options;
  
  // Set up formatting options
  const formatOptions: Intl.NumberFormatOptions = {
    style,
    notation,
    signDisplay
  };
  
  // Add unit if style is unit
  if (style === 'unit' && unit) {
    formatOptions.unit = unit;
  }
  
  // Add fraction digits settings if provided
  if (minimumFractionDigits !== undefined) {
    formatOptions.minimumFractionDigits = minimumFractionDigits;
  }
  
  if (maximumFractionDigits !== undefined) {
    formatOptions.maximumFractionDigits = maximumFractionDigits;
  }
  
  // Create formatter with locale and options
  const formatter = new Intl.NumberFormat(locale, formatOptions);
  return formatter.format(numValue);
}

/**
 * Formats a currency value with proper currency symbol and formatting
 * 
 * @param value - Currency amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * ```typescript
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, { currency: 'EUR' }) // "€1,234.56"
 * formatCurrency(1234.56, { currencyDisplay: 'code' }) // "USD 1,234.56"
 * ```
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: {
    currency?: string;
    currencyDisplay?: 'symbol' | 'code' | 'name' | 'narrowSymbol';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
    signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
  } = {}
): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '';
  }
  
  const {
    currency = 'USD',
    currencyDisplay = 'symbol',
    minimumFractionDigits,
    maximumFractionDigits,
    locale = 'en-US',
    signDisplay = 'auto'
  } = options;
  
  // Set up formatting options
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    currencyDisplay,
    signDisplay
  };
  
  // Add fraction digits settings if provided
  if (minimumFractionDigits !== undefined) {
    formatOptions.minimumFractionDigits = minimumFractionDigits;
  }
  
  if (maximumFractionDigits !== undefined) {
    formatOptions.maximumFractionDigits = maximumFractionDigits;
  }
  
  // Create formatter with locale and options
  const formatter = new Intl.NumberFormat(locale, formatOptions);
  return formatter.format(numValue);
}

/**
 * Formats a file size in bytes to a human-readable string (KB, MB, GB, etc.)
 * 
 * @param bytes - File size in bytes
 * @param options - Formatting options
 * @returns Formatted file size string
 * 
 * @example
 * ```typescript
 * formatFileSize(1500) // "1.5 KB"
 * formatFileSize(1500000) // "1.5 MB"
 * formatFileSize(1500000, { decimals: 0 }) // "2 MB"
 * ```
 */
export function formatFileSize(
  bytes: number | null | undefined,
  options: {
    decimals?: number;
    binary?: boolean;
    locale?: string;
  } = {}
): string {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes < 0) {
    return '';
  }
  
  const {
    decimals = 1,
    binary = false,
    locale = 'en-US'
  } = options;
  
  // Use 1024 for binary (KiB, MiB) or 1000 for decimal (KB, MB)
  const base = binary ? 1024 : 1000;
  
  // Size units
  const units = binary
    ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    : ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  // Find the appropriate unit
  let i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(base));
  i = Math.min(i, units.length - 1);
  
  // Calculate the size in the selected unit
  const size = bytes / Math.pow(base, i);
  
  // Format the number
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: i === 0 ? 0 : decimals,
    maximumFractionDigits: i === 0 ? 0 : decimals
  });
  
  return `${formatter.format(size)} ${units[i]}`;
}

/**
 * Formats a phone number according to the specified format
 * 
 * @param phoneNumber - Phone number to format
 * @param options - Formatting options
 * @returns Formatted phone number string
 * 
 * @example
 * ```typescript
 * formatPhoneNumber('1234567890') // "(123) 456-7890"
 * formatPhoneNumber('1234567890', { format: 'international', countryCode: '1' }) // "+1 (123) 456-7890"
 * formatPhoneNumber('1234567890', { format: 'dashed' }) // "123-456-7890"
 * ```
 */
export function formatPhoneNumber(
  phoneNumber: string | null | undefined,
  options: {
    format?: 'default' | 'international' | 'dashed' | 'spaced' | 'dotted';
    countryCode?: string;
  } = {}
): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if we have a valid 10-digit number (US format)
  if (cleaned.length !== 10) {
    // If not properly formatted, just return the cleaned number
    return cleaned;
  }
  
  const {
    format = 'default',
    countryCode
  } = options;
  
  // Extract parts of the phone number
  const areaCode = cleaned.slice(0, 3);
  const prefix = cleaned.slice(3, 6);
  const lineNumber = cleaned.slice(6);
  
  // Format based on the selected format
  switch (format) {
    case 'international':
      return countryCode
        ? `+${countryCode} (${areaCode}) ${prefix}-${lineNumber}`
        : `(${areaCode}) ${prefix}-${lineNumber}`;
      
    case 'dashed':
      return `${areaCode}-${prefix}-${lineNumber}`;
      
    case 'spaced':
      return `${areaCode} ${prefix} ${lineNumber}`;
      
    case 'dotted':
      return `${areaCode}.${prefix}.${lineNumber}`;
      
    case 'default':
    default:
      return `(${areaCode}) ${prefix}-${lineNumber}`;
  }
}

/**
 * Truncates text to a specified length and adds an ellipsis if needed
 * 
 * @param text - Text to truncate
 * @param options - Truncation options
 * @returns Truncated text string
 * 
 * @example
 * ```typescript
 * truncateText('This is a long sentence that needs truncation', { length: 20 }) 
 * // "This is a long sent..."
 * 
 * truncateText('This is a long sentence', { length: 10, ellipsis: ' [more]' }) 
 * // "This is a [more]"
 * ```
 */
export function truncateText(
  text: string | null | undefined,
  options: {
    length?: number;
    ellipsis?: string;
    preserveWords?: boolean;
  } = {}
): string {
  if (!text) return '';
  
  const {
    length = 30,
    ellipsis = '...',
    preserveWords = true
  } = options;
  
  // Return the original text if it's shorter than the limit
  if (text.length <= length) {
    return text;
  }
  
  // If we don't need to preserve words, simply truncate at the exact position
  if (!preserveWords) {
    return text.slice(0, length) + ellipsis;
  }
  
  // Find a good breaking point that doesn't cut words in half
  let truncated = text.slice(0, length);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  // If there's a space in the truncated text, break at that space
  if (lastSpaceIndex > 0) {
    truncated = truncated.slice(0, lastSpaceIndex);
  }
  
  return truncated + ellipsis;
}

/**
 * Formats an email address with masking options for privacy
 * 
 * @param email - Email address to format
 * @param options - Formatting options
 * @returns Formatted email string
 * 
 * @example
 * ```typescript
 * formatEmail('john.doe@example.com') // "john.doe@example.com"
 * formatEmail('john.doe@example.com', { mask: true }) // "j****e@example.com"
 * formatEmail('john.doe@example.com', { mask: true, maskChar: 'x' }) // "jxxxe@example.com"
 * ```
 */
export function formatEmail(
  email: string | null | undefined,
  options: {
    mask?: boolean;
    maskChar?: string;
    preserveLength?: boolean;
    preserveDomainName?: boolean;
  } = {}
): string {
  if (!email) return '';
  
  // Return the original email if no masking is needed
  if (!options.mask) {
    return email;
  }
  
  const {
    maskChar = '*',
    preserveLength = true,
    preserveDomainName = true
  } = options;
  
  // Split email into local part and domain
  const [localPart, domain] = email.split('@');
  
  if (!localPart || !domain) {
    // If email format is invalid, return the original
    return email;
  }
  
  // Mask the local part
  let maskedLocalPart: string;
  
  if (localPart.length <= 2) {
    // If local part is very short, just mask everything
    maskedLocalPart = maskChar.repeat(localPart.length);
  } else {
    // Otherwise, keep first and last characters
    const middleLength = localPart.length - 2;
    maskedLocalPart = localPart[0] + maskChar.repeat(middleLength) + localPart[localPart.length - 1];
  }
  
  // Process domain part
  let maskedDomain: string;
  
  if (preserveDomainName) {
    // Keep the domain intact
    maskedDomain = domain;
  } else {
    // Split domain into name and TLD
    const lastDotIndex = domain.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
      // If no TLD, mask the whole domain
      maskedDomain = maskChar.repeat(domain.length);
    } else {
      // Keep the TLD, mask the domain name
      const domainName = domain.slice(0, lastDotIndex);
      const tld = domain.slice(lastDotIndex);
      
      maskedDomain = maskChar.repeat(domainName.length) + tld;
    }
  }
  
  return `${maskedLocalPart}@${maskedDomain}`;
}

/**
 * Formats a name with various formatting options
 * 
 * @param firstName - First name
 * @param lastName - Last name
 * @param options - Formatting options
 * @returns Formatted name string
 * 
 * @example
 * ```typescript
 * formatName('John', 'Doe') // "John Doe"
 * formatName('John', 'Doe', { format: 'last-first' }) // "Doe, John"
 * formatName('John', 'Doe', { format: 'initial-last' }) // "J. Doe"
 * ```
 */
export function formatName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  options: {
    format?: 'first-last' | 'last-first' | 'initial-last' | 'last-initial' | 'initials';
    includeMiddle?: boolean;
    middleName?: string;
    honorific?: string;
    suffix?: string;
  } = {}
): string {
  if (!firstName && !lastName) return '';
  
  // Default to empty strings if not provided
  const first = firstName || '';
  const last = lastName || '';
  
  const {
    format = 'first-last',
    includeMiddle = false,
    middleName = '',
    honorific = '',
    suffix = ''
  } = options;
  
  // Get initials if needed
  const firstInitial = first ? `${first[0]}.` : '';
  const middleInitial = includeMiddle && middleName ? `${middleName[0]}.` : '';
  const lastInitial = last ? `${last[0]}.` : '';
  
  // Prepare honorific and suffix with proper spacing
  const honorificWithSpace = honorific ? `${honorific} ` : '';
  const suffixWithComma = suffix ? `, ${suffix}` : '';
  
  // Format based on the selected format
  switch (format) {
    case 'last-first':
      return `${honorificWithSpace}${last}${last ? ', ' : ''}${includeMiddle && middleName ? `${first} ${middleName}` : first}${suffixWithComma}`.trim();
      
    case 'initial-last':
      return `${honorificWithSpace}${firstInitial} ${includeMiddle ? middleInitial + ' ' : ''}${last}${suffixWithComma}`.trim();
      
    case 'last-initial':
      return `${honorificWithSpace}${last}${last ? ', ' : ''}${firstInitial} ${includeMiddle ? middleInitial : ''}${suffixWithComma}`.trim();
      
    case 'initials':
      return `${honorificWithSpace}${firstInitial}${includeMiddle ? middleInitial : ''}${lastInitial}${suffixWithComma}`.trim();
      
    case 'first-last':
    default:
      return `${honorificWithSpace}${first}${includeMiddle && middleName ? ` ${middleName}` : ''} ${last}${suffixWithComma}`.trim();
  }
}

/**
 * Formats a list of items into a string with proper separators and conjunctions
 * 
 * @param items - Array of items to format
 * @param options - Formatting options
 * @returns Formatted list string
 * 
 * @example
 * ```typescript
 * formatList(['apple', 'banana', 'orange']) // "apple, banana, and orange"
 * formatList(['apple', 'banana']) // "apple and banana"
 * formatList(['apple', 'banana', 'orange'], { conjunction: 'or' }) // "apple, banana, or orange"
 * ```
 */
export function formatList(
  items: (string | null | undefined)[],
  options: {
    conjunction?: string;
    oxford?: boolean;
    separator?: string;
    formatter?: (item: string, index: number) => string;
  } = {}
): string {
  // Filter out null and undefined items
  const filteredItems = items.filter(item => item !== null && item !== undefined) as string[];
  
  if (filteredItems.length === 0) {
    return '';
  }
  
  const {
    conjunction = 'and',
    oxford = true,
    separator = ',',
    formatter
  } = options;
  
  // Apply formatter if provided
  const formattedItems = formatter 
    ? filteredItems.map((item, index) => formatter(item, index))
    : filteredItems;
  
  // For a single item, just return it
  if (formattedItems.length === 1) {
    return formattedItems[0];
  }
  
  // For two items, join with conjunction
  if (formattedItems.length === 2) {
    return `${formattedItems[0]} ${conjunction} ${formattedItems[1]}`;
  }
  
  // For more items, join with separators and conjunction
  const lastItem = formattedItems.pop();
  const oxfordComma = oxford ? `${separator} ` : ' ';
  
  return `${formattedItems.join(`${separator} `)}${oxfordComma}${conjunction} ${lastItem}`;
}

export default {
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatFileSize,
  formatPhoneNumber,
  truncateText,
  formatEmail,
  formatName,
  formatList
};