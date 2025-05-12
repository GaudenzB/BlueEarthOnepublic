/**
 * This file re-exports all schemas from the schemas directory
 * This allows importing from '@blueearth/core/schemas' instead of '@blueearth/core/schemas/employee', etc.
 */

// For now, export all schemas from the shared directory 
// as a compatibility measure during refactoring
export * from '../../../shared/schema';
export * from './employee';

// Add new schema exports here when they are created

/**
 * This file is intended to be a transition point during refactoring.
 * Eventually, the goal is to move all schema definitions from shared/schema.ts
 * to individual files in this directory.
 */