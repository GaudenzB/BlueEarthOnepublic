/**
 * Server-side formatting utilities
 */
import { format, parseISO } from 'date-fns';

/**
 * Format a date for display
 * 
 * @param date Date to format
 * @param formatString Format string for date-fns
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null, formatString: string = 'yyyy-MM-dd'): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    return String(date);
  }
}

/**
 * Format a date and time for display
 * 
 * @param date Date to format
 * @param formatString Format string for date-fns
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string | null, formatString: string = 'yyyy-MM-dd HH:mm:ss'): string {
  return formatDate(date, formatString);
}

/**
 * Format a file size in bytes to a human-readable string
 * 
 * @param bytes File size in bytes
 * @param decimals Number of decimal places
 * @returns Formatted file size string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number | string | null, decimals: number = 2): string {
  if (bytes === null || bytes === undefined || bytes === '') return '0 Bytes';
  
  const bytesNum = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  
  if (isNaN(bytesNum) || bytesNum === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytesNum) / Math.log(k));
  
  return parseFloat((bytesNum / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format a number with commas
 * 
 * @param num Number to format
 * @returns Formatted number string with commas
 */
export function formatNumber(num: number | string | null): string {
  if (num === null || num === undefined || num === '') return '0';
  
  const numVal = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numVal)) return '0';
  
  return numVal.toLocaleString();
}

/**
 * Format a currency value
 * 
 * @param amount Amount to format
 * @param currency Currency code
 * @param locale Locale for formatting
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string | null, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  if (amount === null || amount === undefined || amount === '') return '$0.00';
  
  const numVal = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numVal)) return '$0.00';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numVal);
}

/**
 * Format a percentage value
 * 
 * @param value Percentage value (0-100 or 0-1)
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | string | null, decimals: number = 2): string {
  if (value === null || value === undefined || value === '') return '0%';
  
  let numVal = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numVal)) return '0%';
  
  // If value is between 0 and 1, convert to percentage
  if (numVal > 0 && numVal < 1) {
    numVal = numVal * 100;
  }
  
  // Format with specified decimal places
  return numVal.toFixed(decimals) + '%';
}

/**
 * Format similarity score for display
 * 
 * @param score Similarity score (0-1)
 * @returns Formatted percentage with description
 */
export function formatRelevanceScore(score: number): string {
  if (score === null || score === undefined || isNaN(score)) return 'Unknown relevance';
  
  // Convert to percentage
  const percentage = (score * 100).toFixed(1);
  
  // Provide a description based on the score
  let description = 'Low relevance';
  if (score > 0.8) {
    description = 'Very high relevance';
  } else if (score > 0.6) {
    description = 'High relevance';
  } else if (score > 0.4) {
    description = 'Medium relevance';
  }
  
  return `${percentage}% (${description})`;
}

/**
 * Format a string with title case
 * 
 * @param str String to format
 * @returns Title-cased string
 */
export function titleCase(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncate a string with ellipsis
 * 
 * @param str String to truncate
 * @param maxLength Maximum length
 * @param ellipsis Ellipsis string to append
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number = 100, ellipsis: string = '...'): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Convert a CSV string to an array of objects
 * 
 * @param csvString CSV string to parse
 * @param delimiter Column delimiter
 * @returns Array of objects
 */
export function csvToObjects(csvString: string, delimiter: string = ','): Record<string, string>[] {
  if (!csvString) return [];
  
  const lines = csvString.split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(delimiter).map(header => header.trim());
  
  return lines.slice(1).map(line => {
    if (!line.trim()) return {} as Record<string, string>;
    
    const values = line.split(delimiter);
    const obj: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index]?.trim() || '';
    });
    
    return obj;
  }).filter(obj => Object.keys(obj).length > 0);
}

/**
 * Format document name from filename
 * 
 * @param filename Filename to format
 * @returns Formatted document name
 */
export function formatDocumentName(filename: string): string {
  if (!filename) return '';
  
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Replace underscores and hyphens with spaces
  const nameWithSpaces = nameWithoutExt.replace(/[_-]/g, ' ');
  
  // Title case the result
  return titleCase(nameWithSpaces);
}