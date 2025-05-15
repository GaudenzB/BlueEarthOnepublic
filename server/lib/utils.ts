/**
 * Server utility functions for general purpose use
 */

import { logger } from '../utils/logger';

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, or empty object)
 * @param value - Value to check
 * @returns True if the value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return true;
  }
  
  return false;
}

/**
 * Safely gets a value from an object with a nested path
 * @param obj - The object to extract from
 * @param path - Path to the property (e.g., 'user.profile.name')
 * @param defaultValue - Default value if not found
 * @returns The value or default if not found
 */
export function getNestedValue(obj: any, path: string, defaultValue: any = undefined): any {
  try {
    const travel = (regexp: RegExp) =>
      String.prototype.split
        .call(path, regexp)
        .filter(Boolean)
        .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
    const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
    return result === undefined ? defaultValue : result;
  } catch (error) {
    logger.debug('Error in getNestedValue', { error, path });
    return defaultValue;
  }
}

/**
 * Safely converts a string to a float, returning defaultValue if it fails
 * @param value - String to convert
 * @param defaultValue - Default value to return if conversion fails
 * @returns Parsed float or defaultValue
 */
export function safeParseFloat(value: string | undefined | null, defaultValue: number = 0): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Converts a string to a boolean value
 * @param value - String to convert
 * @param defaultValue - Default value if conversion fails
 * @returns Boolean value
 */
export function stringToBoolean(value: string | undefined | null, defaultValue: boolean = false): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  value = value.toLowerCase().trim();
  if (['true', 'yes', '1', 'on'].includes(value)) {
    return true;
  }
  
  if (['false', 'no', '0', 'off'].includes(value)) {
    return false;
  }
  
  return defaultValue;
}

/**
 * Check if a URL is valid
 * @param url - URL to validate
 * @returns True if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Truncates a string to a specified length with an optional suffix
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated string
 */
export function truncateString(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Sanitizes a filename to make it safe for file system operations
 * @param filename - Filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Replace invalid characters
  return filename
    .replace(/[\\/:*?"<>|]/g, '-') // Replace invalid chars with dash
    .replace(/\s+/g, '_')          // Replace spaces with underscore
    .replace(/\.+$/g, '')          // Remove trailing dots
    .replace(/^\.+/g, '')          // Remove leading dots
    .trim();
}

/**
 * Generates a random string with specified length
 * @param length - Length of the random string
 * @returns Random string
 */
export function generateRandomString(length: number = 10): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Checks if two arrays have the same elements (order doesn't matter)
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns True if arrays have the same elements
 */
export function arraysHaveSameElements<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  
  const set1 = new Set(arr1);
  for (const item of arr2) {
    if (!set1.has(item)) return false;
  }
  
  return true;
}

/**
 * Returns the intersection of two arrays
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns Array with common elements
 */
export function getArrayIntersection<T>(arr1: T[], arr2: T[]): T[] {
  return arr1.filter(item => arr2.includes(item));
}

/**
 * Helper function for handling async/await errors
 * @param promise - Promise to handle
 * @returns [data, error] tuple
 */
export async function safeAwait<T, E = Error>(
  promise: Promise<T>
): Promise<[T | null, E | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error as E];
  }
}

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is a valid JSON string
 * @param str - String to check
 * @returns True if the string is valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param delay - Initial delay in ms
 * @returns Promise resolving to the function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw lastError!;
}