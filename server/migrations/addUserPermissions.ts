import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Add user_permissions table
 * 
 * Version: 20250511_001
 * Created: May 11, 2025
 * 
 * This migration creates the user_permissions table to support fine-grained
 * functional area permissions (finance, HR, IT, legal, operations).
 * 
 * The table includes:
 * - Reference to the users table with CASCADE delete
 * - Area designation (e.g., "finance", "hr")
 * - View/edit/delete permission flags
 * - Created timestamp
 * - Index on user_id and area for optimized permission lookups
 */
export async function addUserPermissionsTable() {
  console.log("Running migration: Adding user_permissions table");

  try {
    // Transaction for atomicity
    await db.transaction(async (tx) => {
      // More robust check including table structure verification
      const tableExists = await tx.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'user_permissions'
        );
      `);
      
      if (tableExists.rows[0].exists) {
        // Verify that the table has the expected structure
        const columnCheck = await tx.execute(sql`
          SELECT 
            COUNT(*) = 7 AS correct_columns
          FROM 
            information_schema.columns
          WHERE 
            table_name = 'user_permissions'
            AND column_name IN ('id', 'user_id', 'area', 'can_view', 'can_edit', 'can_delete', 'created_at');
        `);
        
        const hasCorrectColumns = columnCheck.rows[0].correct_columns;
        
        if (hasCorrectColumns) {
          console.log("user_permissions table already exists with correct structure, skipping migration");
          return;
        } else {
          console.log("user_permissions table exists but has incorrect structure, recreating...");
          await tx.execute(sql`DROP TABLE user_permissions CASCADE;`);
        }
      }

      // Create the user_permissions table
      await tx.execute(sql`
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
      await tx.execute(sql`
        CREATE INDEX idx_user_permissions_user_id_area ON user_permissions(user_id, area);
      `);
      
      // Create a unique constraint to prevent duplicate permissions
      await tx.execute(sql`
        CREATE UNIQUE INDEX idx_user_permissions_unique ON user_permissions(user_id, area);
      `);
    });
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}