/**
 * Data Transformation Utilities
 * 
 * This file contains utility functions for transforming data between different formats.
 * Useful for processing API responses or preparing data for submission.
 */

import { markAsUnused } from './ts-helpers';

/**
 * Converts snake_case keys to camelCase
 * 
 * @example
 * // Returns { userId: 1, firstName: 'John' }
 * snakeToCamel({ user_id: 1, first_name: 'John' });
 */
export function snakeToCamel<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.entries(obj).reduce((result, [key, value]) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Handle nested objects and arrays recursively
    let transformedValue = value;
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        transformedValue = value.map(item => 
          item && typeof item === 'object' ? snakeToCamel(item) : item
        );
      } else {
        transformedValue = snakeToCamel(value);
      }
    }
    
    return { ...result, [camelKey]: transformedValue };
  }, {});
}

/**
 * Converts camelCase keys to snake_case
 * 
 * @example
 * // Returns { user_id: 1, first_name: 'John' }
 * camelToSnake({ userId: 1, firstName: 'John' });
 */
export function camelToSnake<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.entries(obj).reduce((result, [key, value]) => {
    const snakeKey = key.replace(/([A-Z])/g, letter => `_${letter.toLowerCase()}`);
    
    // Handle nested objects and arrays recursively
    let transformedValue = value;
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        transformedValue = value.map(item => 
          item && typeof item === 'object' ? camelToSnake(item) : item
        );
      } else {
        transformedValue = camelToSnake(value);
      }
    }
    
    return { ...result, [snakeKey]: transformedValue };
  }, {});
}

/**
 * Formats a date string into a localized date display
 * 
 * @example
 * // Returns "May 20, 2025"
 * formatDate("2025-05-20T12:00:00Z");
 */
export function formatDate(
  dateString: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
}

/**
 * Formats a number as currency
 * 
 * @example
 * // Returns "$1,234.56"
 * formatCurrency(1234.56);
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: Intl.NumberFormatOptions = { 
    style: 'currency', 
    currency: 'USD' 
  }
): string {
  if (amount === null || amount === undefined) return '';
  
  try {
    return new Intl.NumberFormat('en-US', options).format(amount);
  } catch (e) {
    console.error('Error formatting currency:', e);
    return '';
  }
}

/**
 * Truncates text to a specified length with an ellipsis
 * 
 * @example
 * // Returns "This is a long..."
 * truncateText("This is a long text", 15);
 */
export function truncateText(
  text: string | null | undefined, 
  maxLength: number = 100, 
  ellipsis: string = '...'
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Creates a URL-friendly slug from a string
 * 
 * @example
 * // Returns "hello-world"
 * slugify("Hello World!");
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/&/g, '-and-')         // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')       // Remove all non-word characters
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
}

/**
 * Groups an array of objects by a specified key
 * 
 * @example
 * // Returns { active: [...], inactive: [...] }
 * groupBy(users, 'status');
 */
export function groupBy<T extends Record<string, any>, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    return {
      ...result,
      [groupKey]: [...(result[groupKey] || []), item]
    };
  }, {} as Record<string, T[]>);
}

// Silence unused warnings if these aren't used yet
markAsUnused(
  snakeToCamel,
  camelToSnake,
  formatDate,
  formatCurrency,
  truncateText,
  slugify,
  groupBy
);