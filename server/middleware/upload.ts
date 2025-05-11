import multer from 'multer';
import path from 'path';
import sanitizeFilename from 'sanitize-filename';
import { Request } from 'express';
import { logger } from '../utils/logger';

// File size limits
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 5; // Maximum number of files per upload

// Allowed file types
const ALLOWED_MIME_TYPES = [
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
  'text/xml',
  'image/jpeg',
  'image/png'
];

// Configure multer for in-memory storage
const storage = multer.memoryStorage();

// File filter function to check valid file types
const fileFilter = (req: Request, file: Express.Multer.File, callback: Function) => {
  // Check if the file mime type is allowed
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    // Accept the file
    callback(null, true);
  } else {
    // Reject the file
    logger.warn('Rejected file upload with invalid mimetype', { 
      mimetype: file.mimetype, 
      filename: file.originalname 
    });
    callback(new Error(`File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }
};

// Sanitize filename to prevent path traversal and ensure safe filenames
export const sanitizeFile = (filename: string): string => {
  // First sanitize to remove dangerous characters
  const sanitized = sanitizeFilename(filename);
  
  // Extract extension
  const ext = path.extname(sanitized);
  
  // Get the base name
  const baseName = path.basename(sanitized, ext);
  
  // Remove spaces and special characters from base name
  const cleanBaseName = baseName
    .replace(/[^a-zA-Z0-9-_.]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
  
  // Combine cleaned base name and original extension
  return cleanBaseName + ext;
};

// Create different multer configurations for various upload scenarios

// For single file uploads
export const singleFileUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
}).single('file');

// For multiple file uploads
export const multiFileUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
}).array('files', MAX_FILES);

// For specific document type uploads (with custom field name)
export const documentUpload = (fieldName: string = 'document') => multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
}).single(fieldName);

// For contract specific uploads
export const contractUpload = multer({
  storage,
  fileFilter: (req, file, callback) => {
    // Only allow PDF and Word documents for contracts
    if (['application/pdf', 
         'application/msword', 
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype)) {
      callback(null, true);
    } else {
      logger.warn('Rejected contract upload with invalid mimetype', { 
        mimetype: file.mimetype, 
        filename: file.originalname 
      });
      callback(new Error('Contracts must be PDF or Word documents'), false);
    }
  },
  limits: {
    fileSize: MAX_FILE_SIZE
  }
}).single('contract');