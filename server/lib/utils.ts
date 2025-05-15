/**
 * General utility functions for server-side code
 */

import crypto from 'crypto';
import { customAlphabet } from 'nanoid';
import { NextFunction, Request, Response } from 'express';
import { db } from '../db';
import { logger } from './logger';

// Create a custom alphabet nanoid generator for more readable IDs
const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', 12);

/**
 * Generate a unique ID
 * @returns Random ID string
 */
export function generateId(): string {
  return nanoid();
}

/**
 * Generate a UUID
 * @returns UUID string
 */
export function generateUuid(): string {
  return crypto.randomUUID();
}

/**
 * Wrap an async function for Express route handlers to catch errors
 * 
 * @param fn Async function to wrap
 * @returns Express route handler with error catching
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Sleep for specified milliseconds
 * 
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after ms milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert bytes to human-readable size
 * 
 * @param bytes Bytes to convert
 * @returns Human-readable string
 */
export function bytesToSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
}

/**
 * Parse a string to boolean
 * 
 * @param value String value
 * @returns Parsed boolean
 */
export function parseBoolean(value: string | boolean | undefined | null): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  
  const normalized = value.toString().toLowerCase().trim();
  return ['true', '1', 'yes', 'y', 'on'].includes(normalized);
}

/**
 * Debounce a function call
 * 
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Run a function with retry logic
 * 
 * @param fn Function to run
 * @param options Retry options
 * @returns Promise with function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    exponential?: boolean;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { 
    retries = 3, 
    delay = 1000, 
    exponential = true,
    onRetry
  } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt < retries) {
        if (onRetry) {
          onRetry(error, attempt + 1);
        }
        
        const waitTime = exponential ? delay * Math.pow(2, attempt) : delay;
        await sleep(waitTime);
      }
    }
  }
  
  // If we've exhausted retries, throw the last error
  throw lastError;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * 
 * @param value Value to check
 * @returns Whether the value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  
  return false;
}

/**
 * Ensure a string is a valid UUID
 * 
 * @param str String to validate
 * @returns Whether the string is a valid UUID
 */
export function isValidUuid(str: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(str);
}

/**
 * Hash a string (for passwords, etc.)
 * 
 * @param str String to hash
 * @returns Hashed string
 */
export function hashString(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Safely parse JSON with error handling
 * 
 * @param str JSON string to parse
 * @param fallback Fallback value if parsing fails
 * @returns Parsed JSON or fallback
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch (error) {
    logger.error({ error }, 'Failed to parse JSON');
    return fallback;
  }
}

/**
 * Get the file extension from a filename
 * 
 * @param filename Filename to process
 * @returns Lowercase file extension without the dot
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if a file is of a supported document type based on extension
 * 
 * @param filename Filename to check
 * @returns Whether the file has a supported extension
 */
export function isSupportedDocument(filename: string): boolean {
  const supportedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'json', 'xml'];
  const extension = getFileExtension(filename);
  
  return supportedExtensions.includes(extension);
}

/**
 * Get document type from file extension
 * 
 * @param filename Filename to check
 * @returns Document type
 */
export function getDocumentTypeFromFilename(filename: string): string {
  const extension = getFileExtension(filename);
  
  const typeMap: Record<string, string> = {
    'pdf': 'REPORT',
    'doc': 'CORRESPONDENCE',
    'docx': 'CORRESPONDENCE',
    'xls': 'REPORT',
    'xlsx': 'REPORT',
    'ppt': 'PRESENTATION',
    'pptx': 'PRESENTATION',
    'txt': 'CORRESPONDENCE',
    'csv': 'REPORT',
    'json': 'OTHER',
    'xml': 'OTHER'
  };
  
  return typeMap[extension] || 'OTHER';
}

/**
 * Get the MIME type from a file extension
 * 
 * @param extension File extension
 * @returns MIME type
 */
export function getMimeTypeFromExtension(extension: string): string {
  const mimeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'json': 'application/json',
    'xml': 'application/xml',
    'html': 'text/html',
    'htm': 'text/html',
    'js': 'application/javascript',
    'css': 'text/css',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml'
  };
  
  return mimeMap[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Generate a random string
 * 
 * @param length Length of the random string
 * @returns Random string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Redact sensitive information from logs
 * 
 * @param obj Object to redact
 * @returns Redacted copy of the object
 */
export function redactSensitiveInfo<T extends object>(obj: T): T {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey', 'auth', 'credentials'];
  const result = { ...obj };
  
  for (const key of Object.keys(result)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      (result as any)[key] = '[REDACTED]';
    } else if (typeof (result as any)[key] === 'object' && (result as any)[key] !== null) {
      (result as any)[key] = redactSensitiveInfo((result as any)[key]);
    }
  }
  
  return result;
}