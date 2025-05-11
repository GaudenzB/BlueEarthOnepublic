import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Add bio and responsibilities fields to employees table
 * 
 * Version: 20250511_002
 * Created: May 11, 2025
 * 
 * This migration adds two text columns to the employees table:
 * - bio: Text field for employee biography and background information
 * - responsibilities: Text field for employee job responsibilities
 * 
 * These fields enhance the employee profile with more detailed information
 * for display in the employee detail page.
 */
export async function addBioAndResponsibilitiesFields() {
  console.log("Running migration: Adding bio and responsibilities fields to employees table");
  
  try {
    // Use a transaction for atomicity
    await db.transaction(async (tx) => {
      // Check if the employees table exists
      const tableExists = await tx.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'employees'
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log("employees table does not exist, skipping migration");
        return;
      }
      
      // Check if columns already exist
      const columnsCheck = await tx.execute(sql`
        SELECT 
          column_name
        FROM 
          information_schema.columns
        WHERE 
          table_name = 'employees'
          AND column_name IN ('bio', 'responsibilities');
      `);
      
      const existingColumns = new Set(columnsCheck.rows.map(row => row.column_name));
      
      // Add bio column if it doesn't exist
      if (!existingColumns.has('bio')) {
        await tx.execute(sql`
          ALTER TABLE "employees" ADD COLUMN "bio" text;
        `);
        console.log("Added 'bio' column to employees table");
      } else {
        console.log("'bio' column already exists in employees table");
      }
      
      // Add responsibilities column if it doesn't exist
      if (!existingColumns.has('responsibilities')) {
        await tx.execute(sql`
          ALTER TABLE "employees" ADD COLUMN "responsibilities" text;
        `);
        console.log("Added 'responsibilities' column to employees table");
      } else {
        console.log("'responsibilities' column already exists in employees table");
      }
    });
    
    console.log("Migration completed successfully");
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
}