/**
 * General utility functions for server-side code
 */

import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Generate a unique identifier
 * @returns Unique string suitable for IDs
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get a file's extension
 * @param filename Filename to extract extension from
 * @returns Lowercase extension without the dot
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().replace(/^\./, '');
}

/**
 * Create a file path for storage
 * 
 * @param tenantId Tenant ID
 * @param documentType Document type
 * @param filename Original filename
 * @returns Structured path for storing the file
 */
export function createStoragePath(
  tenantId: string,
  documentType: string,
  filename: string,
  id: string
): string {
  // Format: tenants/{tenantId}/{documentType}/{date}/{id}/{sanitized_filename}
  const today = new Date().toISOString().split('T')[0];
  const sanitizedFilename = sanitizeFilename(filename);
  
  return `tenants/${tenantId}/${documentType}/${today}/${id}/${sanitizedFilename}`;
}

/**
 * Sanitize a filename for storage
 * 
 * @param filename Original filename
 * @returns Sanitized filename safe for storage
 */
export function sanitizeFilename(filename: string): string {
  // Replace spaces with underscores
  let sanitized = filename.replace(/\s+/g, '_');
  
  // Remove special characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9_.-]/g, '');
  
  // Convert to lowercase
  sanitized = sanitized.toLowerCase();
  
  return sanitized;
}

/**
 * Calculate the hash of a file
 * 
 * @param buffer File data buffer
 * @returns MD5 hash of the file
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Generate a download URL for a file
 * 
 * @param documentId Document ID
 * @param filename Original filename
 * @returns Download URL
 */
export function generateDownloadUrl(documentId: string, filename: string): string {
  return `/api/documents/${documentId}/download?filename=${encodeURIComponent(filename)}`;
}

/**
 * Generate a preview URL for a document
 * 
 * @param documentId Document ID
 * @param token Preview token
 * @returns Preview URL
 */
export function generatePreviewUrl(documentId: string, token: string): string {
  return `/api/documents/${documentId}/preview?token=${token}`;
}

/**
 * Determine if a file is a supported document type
 * 
 * @param mimeType MIME type of the file
 * @returns Whether the file type is supported
 */
export function isSupportedDocumentType(mimeType: string): boolean {
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
  
  return supportedTypes.includes(mimeType);
}

/**
 * Get API base URL based on current environment
 * @returns API base URL
 */
export function getApiBaseUrl(): string {
  return env.API_URL || (
    env.NODE_ENV === 'production' 
      ? 'https://api.blueearth.capital' 
      : `http://${env.HOST}:${env.PORT}`
  );
}