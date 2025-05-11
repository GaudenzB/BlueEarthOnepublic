import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Middleware to validate request data using Zod schemas
 * 
 * This middleware validates a request body, query params, or route params
 * against a provided Zod schema.
 * 
 * @param schema Zod schema to validate against
 * @returns Express middleware
 */
export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request against schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.reduce((acc: Record<string, string>, curr) => {
          // Get the field path (removing 'body.' prefix if it exists)
          const path = curr.path.join('.').replace(/^body\./, '');
          acc[path] = curr.message;
          return acc;
        }, {});
        
        logger.debug({ 
          path: req.path, 
          errors: formattedErrors 
        }, 'Validation error');
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: formattedErrors
        });
      }
      
      // Pass other errors to the error handler
      next(error);
    }
  };
}

/**
 * Validate request parameters (like IDs)
 * 
 * @param paramName Name of the parameter to validate
 * @returns Express middleware
 */
export function validateIdParameter(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    // Check if id exists
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `Missing parameter: ${paramName}`,
        errors: { [paramName]: 'Parameter is required' }
      });
    }
    
    // Check if id is a valid number
    const parsedId = parseInt(id);
    if (isNaN(parsedId) || parsedId <= 0 || parsedId.toString() !== id) {
      return res.status(400).json({
        success: false,
        message: `Invalid parameter: ${paramName}`,
        errors: { [paramName]: 'Must be a positive integer' }
      });
    }
    
    next();
  };
}