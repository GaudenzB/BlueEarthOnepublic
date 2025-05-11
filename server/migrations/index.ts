import { addBioAndResponsibilitiesFields } from './addEmployeeFields';
import { addUserPermissionsTable } from './addUserPermissions';

/**
 * Migration Registry
 * 
 * This file manages the ordered execution of migrations.
 * Each migration is registered with:
 * - A version identifier (timestamp-based)
 * - A human-readable name
 * - The migration function to execute
 * 
 * When adding new migrations:
 * 1. Create a new migration file following the timestamp naming convention (YYYYMMDD_NNN_descriptiveName.ts)
 * 2. Register the migration in this file with the same version number
 * 3. Export the migration from this file
 */

// Migration registry with ordered execution
interface Migration {
  version: string;
  name: string;
  execute: () => Promise<boolean | void>;
}

export const migrations: Migration[] = [
  {
    version: '20250511_001',
    name: 'Add user permissions table',
    execute: addUserPermissionsTable
  },
  {
    version: '20250511_002',
    name: 'Add bio and responsibilities to employee table',
    execute: addBioAndResponsibilitiesFields
  }
  // Add new migrations here, following the version ordering
];

/**
 * Run all pending migrations in the correct order
 */
export async function runMigrations(): Promise<void> {
  console.log('Running database migrations...');
  
  for (const migration of migrations) {
    try {
      console.log(`Executing migration ${migration.version}: ${migration.name}`);
      await migration.execute();
    } catch (error) {
      console.error(`Failed to run migration ${migration.version}: ${migration.name}`, error);
      throw error;
    }
  }
  
  console.log('All migrations completed successfully');
}

// Re-export individual migrations for direct use
export { addBioAndResponsibilitiesFields, addUserPermissionsTable };