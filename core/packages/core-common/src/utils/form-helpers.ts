/**
 * Form Helper Utilities
 * 
 * This file contains utility types and functions to help with form handling and validation.
 */

import { z } from 'zod';
import { markAsUnused } from './ts-helpers';

/**
 * Creates a validation schema for a simple search form
 * 
 * @example
 * // Use in a component
 * const searchSchema = createSearchSchema();
 * const form = useForm({
 *   resolver: zodResolver(searchSchema),
 *   defaultValues: { query: '', page: 1, limit: 10 }
 * });
 */
export const createSearchSchema = () => {
  return z.object({
    query: z.string().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10)
  });
};

/**
 * Creates a validation schema for a date range form
 * 
 * @example
 * // Use in a component
 * const dateRangeSchema = createDateRangeSchema();
 * const form = useForm({
 *   resolver: zodResolver(dateRangeSchema),
 *   defaultValues: { 
 *     startDate: new Date(), 
 *     endDate: new Date(),
 *     includeTime: false
 *   }
 * });
 */
export const createDateRangeSchema = () => {
  return z.object({
    startDate: z.date(),
    endDate: z.date(),
    includeTime: z.boolean().default(false)
  }).refine(
    data => data.startDate <= data.endDate,
    {
      message: "End date must be after start date",
      path: ["endDate"]
    }
  );
};

/**
 * Validates a file upload based on file type and size
 * 
 * @example
 * // Validate PDF files up to 10MB
 * const isValidFile = validateFileUpload(
 *   file, 
 *   ['application/pdf'], 
 *   10 * 1024 * 1024
 * );
 */
export const validateFileUpload = (
  file: File | null,
  allowedTypes: string[],
  maxSizeBytes: number
): { isValid: boolean; errorMessage?: string } => {
  if (!file) {
    return { isValid: false, errorMessage: 'No file selected' };
  }

  const isValidType = allowedTypes.includes(file.type);
  if (!isValidType) {
    return { 
      isValid: false, 
      errorMessage: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }

  const isValidSize = file.size <= maxSizeBytes;
  if (!isValidSize) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    return { 
      isValid: false, 
      errorMessage: `File too large. Maximum size: ${maxSizeMB}MB` 
    };
  }

  return { isValid: true };
};

/**
 * Common document file types for validation
 */
export const DOCUMENT_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

// Silence unused warnings if these aren't used yet
markAsUnused(
  createSearchSchema,
  createDateRangeSchema,
  validateFileUpload,
  DOCUMENT_FILE_TYPES
);