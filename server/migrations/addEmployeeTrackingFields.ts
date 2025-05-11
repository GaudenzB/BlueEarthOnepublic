import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { pool } from '../db';

/**
 * Migration: Add tracking fields to employees table
 * 
 * Version: 20250511_003
 * Created: May 11, 2025
 * 
 * This migration adds tracking fields to the employees table:
 * - updated_at: Timestamp for the last update
 * - synced_at: Timestamp for the last sync with Bubble.io
 * 
 * These fields enhance the employee management with better tracking
 * of when records were last modified or synchronized.
 */
export async function addEmployeeTrackingFields(): Promise<boolean> {
  logger.info('Running migration: Adding tracking fields to employees table');
  
  try {
    // Use raw client for better control
    const client = await pool.connect();
    try {
      // Check if updated_at column exists
      const checkUpdatedAt = await client.query(
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'updated_at'"
      );
      
      if (parseInt(checkUpdatedAt.rows[0].count) === 0) {
        // Add updated_at column
        await client.query(
          "ALTER TABLE employees ADD COLUMN updated_at TEXT DEFAULT current_timestamp"
        );
        logger.info("Added 'updated_at' column to employees table");
      } else {
        logger.info("'updated_at' column already exists in employees table");
      }
      
      // Check if synced_at column exists
      const checkSyncedAt = await client.query(
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'synced_at'"
      );
      
      if (parseInt(checkSyncedAt.rows[0].count) === 0) {
        // Add synced_at column
        await client.query(
          "ALTER TABLE employees ADD COLUMN synced_at TEXT DEFAULT current_timestamp"
        );
        logger.info("Added 'synced_at' column to employees table");
      } else {
        logger.info("'synced_at' column already exists in employees table");
      }
    } finally {
      client.release();
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to add tracking fields to employees table:', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}