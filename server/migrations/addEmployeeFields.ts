import { db } from "../db";
import { sql } from "drizzle-orm";

export async function addBioAndResponsibilitiesFields() {
  console.log("Running migration: Adding bio and responsibilities fields to employees table");
  
  try {
    // Add bio column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "bio" text;
    `);
    
    // Add responsibilities column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "responsibilities" text;
    `);
    
    console.log("Migration completed successfully");
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
}