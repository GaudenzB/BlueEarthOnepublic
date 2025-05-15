/**
 * User Repository
 * 
 * Handles database operations related to users
 */

import { User, users } from '../../shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

export const userRepository = {
  /**
   * Find user by ID
   * @param id User ID
   * @returns User object or undefined if not found
   */
  async findById(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      logger.error('Error finding user by ID', { error, userId: id });
      return undefined;
    }
  },

  /**
   * Find user by username
   * @param username Username
   * @returns User object or undefined if not found
   */
  async findByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      logger.error('Error finding user by username', { error, username });
      return undefined;
    }
  },

  /**
   * Find user by email
   * @param email Email address
   * @returns User object or undefined if not found
   */
  async findByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      logger.error('Error finding user by email', { error, email });
      return undefined;
    }
  }
};