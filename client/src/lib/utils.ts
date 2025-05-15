/**
 * General utility functions for client-side code
 */

import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 * 
 * @param inputs Class values to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a random ID
 * @returns Random ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
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
 * Get the file extension from a filename
 * 
 * @param filename Filename to process
 * @returns Lowercase file extension without the dot
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if a file is of a supported document type
 * 
 * @param file File object to check
 * @returns Whether the file is a supported document type
 */
export function isSupportedDocument(file: File): boolean {
  const supportedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml'
  ];
  
  return supportedTypes.includes(file.type);
}

/**
 * Get document type from file extension or mime type
 * 
 * @param fileInfo File extension or mime type
 * @returns Document type
 */
export function getDocumentType(fileInfo: string): string {
  const typeMap: Record<string, string> = {
    // By extension
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
    'xml': 'OTHER',
    
    // By MIME type
    'application/pdf': 'REPORT',
    'application/msword': 'CORRESPONDENCE',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'CORRESPONDENCE',
    'application/vnd.ms-excel': 'REPORT',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'REPORT',
    'application/vnd.ms-powerpoint': 'PRESENTATION',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PRESENTATION',
    'text/plain': 'CORRESPONDENCE',
    'text/csv': 'REPORT',
    'application/json': 'OTHER',
    'application/xml': 'OTHER',
    'text/xml': 'OTHER'
  };
  
  return typeMap[fileInfo.toLowerCase()] || 'OTHER';
}

/**
 * Download a file from a URL
 * 
 * @param url URL to download from
 * @param filename Filename to save as
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}