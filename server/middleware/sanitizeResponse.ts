import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Fields that should always be removed from API responses
 * regardless of the response type
 */
const SENSITIVE_FIELDS = [
  'password',
  'hashedPassword',
  'passwordHash',
  'salt',
  'resetToken',
  'resetTokenExpiry',
  'verificationToken',
  'refreshToken',
  'accessToken',
  'secret',
  'apiKey',
  'clientSecret',
];

/**
 * Fields that should be removed from specific entity types
 */
const ENTITY_SENSITIVE_FIELDS: Record<string, string[]> = {
  user: [
    // These fields are sensitive for user objects specifically
    'twoFactorSecret',
    'twoFactorRecoveryCodes',
    'twoFactorEnabled',
    'lastLoginIp',
    'passwordChangedAt',
    'failedLoginAttempts',
  ],
  document: [
    // These fields are sensitive for document objects specifically
    'storageKey',
    'internalPath',
    'processingMetadata',
  ],
};

/**
 * Recursively sanitize an object by removing sensitive fields
 */
function sanitizeObject(obj: any, entityType?: string): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays recursively
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, entityType));
  }

  // Create a new object to avoid modifying the original
  const sanitized = { ...obj };

  // Remove sensitive fields that apply to all entities
  SENSITIVE_FIELDS.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  // Remove entity-specific sensitive fields if entity type is provided
  if (entityType && ENTITY_SENSITIVE_FIELDS[entityType]) {
    ENTITY_SENSITIVE_FIELDS[entityType].forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });
  }

  // Process nested objects recursively
  for (const key in sanitized) {
    if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeObject(sanitized[key], 
        // Try to determine entity type for nested objects
        key === 'user' ? 'user' : 
        key === 'document' ? 'document' : 
        entityType);
    }
  }

  return sanitized;
}

/**
 * Determine the entity type from the request path
 */
function getEntityTypeFromPath(path: string): string | undefined {
  if (path.includes('/api/users') || path.includes('/api/auth')) {
    return 'user';
  }
  if (path.includes('/api/documents')) {
    return 'document';
  }
  // Add more entity types as needed
  return undefined;
}

/**
 * Middleware to sanitize API responses by removing sensitive fields
 */
export function sanitizeResponse(req: Request, res: Response, next: NextFunction): void {
  // Cache the original res.json method
  const originalJson = res.json;
  
  // Override the res.json method
  res.json = function(body: any): Response {
    try {
      // Determine the entity type from the URL
      const entityType = getEntityTypeFromPath(req.path);
      
      // Only sanitize successful responses
      if (body && (body.success === undefined || body.success === true)) {
        if (body.data) {
          // Sanitize the data property if it exists
          body.data = sanitizeObject(body.data, entityType);
        } else {
          // Sanitize the whole body if it doesn't have a data property
          body = sanitizeObject(body, entityType);
        }
      }
    } catch (error) {
      // Log the error but don't block the response
      logger.error(`Error sanitizing response: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
      });
    }
    
    // Call the original json method
    return originalJson.call(this, body);
  };
  
  next();
}