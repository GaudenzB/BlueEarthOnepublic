import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { tenants } from '../../shared/schema/tenants';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

// Default tenant ID for development/testing
// In production, this should be properly derived from authenticated users
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Fallback UUID to use when an invalid format is detected
const FALLBACK_UUID = '00000000-0000-0000-0000-000000000001';

/**
 * Middleware to establish tenant context for multi-tenant operations
 * This adds tenantId to the request object for use in handlers
 */
export const tenantContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tenantId from various sources, in order of precedence:
    // 1. From request query parameters (?tenantId=xyz)
    // 2. From request headers (X-Tenant-ID)
    // 3. From authenticated user's tenant association
    // 4. Default tenant ID for development/testing

    let tenantId = req.query.tenantId as string || 
                  req.headers['x-tenant-id'] as string || 
                  (req.user as any)?.tenantId;
    
    // If no tenant ID is found in the request, use the default for development/testing
    if (!tenantId) {
      // In production, this might be more restrictive
      if (process.env['NODE_ENV'] === 'production') {
        logger.warn('No tenant ID found in request, using default tenant', { 
          url: req.url, 
          method: req.method 
        });
      }
      tenantId = DEFAULT_TENANT_ID;
    }
    
    // Ensure tenantId is a valid UUID format
    if (!isValidUUID(tenantId)) {
      logger.warn('Invalid UUID format for tenant ID, using fallback', { 
        invalidTenantId: tenantId,
        url: req.url,
        method: req.method
      });
      tenantId = FALLBACK_UUID;
    }

    // Validate that the tenant exists in the database
    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant) {
      // For security, don't reveal too much information in the error message
      logger.warn('Invalid tenant ID provided', { tenantId });
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or unauthorized tenant access'
      });
    }

    // If tenant is not active, deny access
    if (!tenant.isActive) {
      logger.warn('Attempted access to inactive tenant', { tenantId, tenant: tenant.name });
      return res.status(403).json({ 
        success: false, 
        message: 'Tenant account is inactive'
      });
    }

    // Add tenant context to the request for use in route handlers
    (req as any).tenantId = tenantId;
    (req as any).tenant = tenant;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    logger.error('Error in tenant context middleware', { error });
    res.status(500).json({ 
      success: false, 
      message: 'Server error processing tenant context'
    });
  }
};

export default tenantContext;