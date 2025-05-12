import { db } from '../db';
import { tenants } from '../../shared/schema/tenants';
import { logger } from './logger';
import { eq } from 'drizzle-orm';

/**
 * Default tenant ID used across the application
 */
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Creates a default tenant if one doesn't exist.
 * This is useful for development and testing environments
 * or when deploying the application for the first time.
 */
export async function setupDefaultTenant(): Promise<void> {
  try {
    logger.info('Checking for default tenant...');
    
    // Check if default tenant exists
    const [existingTenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.id, DEFAULT_TENANT_ID));
    
    if (existingTenant) {
      logger.info('Default tenant already exists', { 
        tenantId: DEFAULT_TENANT_ID,
        name: existingTenant.name 
      });
      return;
    }
    
    // Create the default tenant
    logger.info('Creating default tenant');
    
    await db.insert(tenants)
      .values({
        id: DEFAULT_TENANT_ID,
        name: 'BlueEarth Capital',
        slug: 'blueearth',
        description: 'Default tenant for BlueEarth Capital Portal',
        domain: process.env.APP_DOMAIN || 'localhost',
        logoUrl: '/src/assets/BlueEarth-Capital_white.png',
        primaryColor: '#1A2B47',
        secondaryColor: '#324D6F',
        isActive: true,
        maxUsers: '1000',
        maxStorage: '50GB',
        settings: JSON.stringify({
          enableDocumentManagement: true,
          enableEmployeeDirectory: true
        })
      });
    
    logger.info('Default tenant created successfully', { tenantId: DEFAULT_TENANT_ID });
  } catch (error) {
    logger.error('Error setting up default tenant', { error });
    throw error;
  }
}