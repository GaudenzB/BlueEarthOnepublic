import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration to add the user_permissions table
 */
export async function addUserPermissionsTable() {
  console.log("Running migration: Adding user_permissions table");

  try {
    // Check if table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_permissions'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log("user_permissions table already exists, skipping migration");
      return;
    }

    // Create the user_permissions table
    await db.execute(sql`
      CREATE TABLE user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        area TEXT NOT NULL,
        can_view BOOLEAN NOT NULL DEFAULT TRUE,
        can_edit BOOLEAN NOT NULL DEFAULT FALSE,
        can_delete BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create an index on user_id and area for faster lookups
    await db.execute(sql`
      CREATE INDEX idx_user_permissions_user_id_area ON user_permissions(user_id, area);
    `);
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}