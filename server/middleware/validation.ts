import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendValidationError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

/**
 * Middleware factory for request validation using Zod schemas
 * 
 * Features:
 * - Validates request body, query, or params against Zod schemas
 * - Returns standardized 422 Unprocessable Entity responses
 * - Includes detailed validation error information
 * - Uses safeParse() for better error handling
 * - Adds parsed data to request object
 * 
 * @param schema Zod schema to validate against
 * @param type Which part of the request to validate (body, query, params)
 */
export const validate = (
  schema: z.ZodType<any>,
  type: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[type];
    const result = schema.safeParse(data);
    
    if (!result.success) {
      logger.debug({ 
        validation: 'failed',
        path: req.path,
        data,
        errors: result.error.format()
      }, 'Validation failed');
      
      return sendValidationError(
        res, 
        result.error.format(), 
        `Validation failed for request ${type}`
      );
    }
    
    // Replace request data with validated and typed data
    req[type] = result.data;
    next();
  };
};

/**
 * Enhanced version that allows validating multiple parts of the request
 */
export const validateRequest = (schemas: {
  body?: z.ZodType<any>;
  query?: z.ZodType<any>;
  params?: z.ZodType<any>;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, any> = {};
    let hasErrors = false;
    
    // Validate each part of the request
    for (const [key, schema] of Object.entries(schemas)) {
      if (schema) {
        const result = schema.safeParse(req[key as keyof typeof schemas]);
        if (!result.success) {
          errors[key] = result.error.format();
          hasErrors = true;
        } else {
          // Replace with validated data
          req[key as keyof typeof schemas] = result.data;
        }
      }
    }
    
    if (hasErrors) {
      logger.debug({ 
        validation: 'failed',
        path: req.path,
        errors
      }, 'Multiple validation errors');
      
      return sendValidationError(
        res, 
        errors, 
        'Validation failed for request'
      );
    }
    
    next();
  };
};