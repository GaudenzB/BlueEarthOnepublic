/**
 * TypeScript Helper Utilities
 * 
 * This file contains utility types and functions to help with common TypeScript patterns.
 */

/**
 * Mark a variable as intentionally unused
 * This suppresses "unused variable" warnings in the TypeScript compiler
 * 
 * @example
 * // Import something you need for types but don't use directly
 * import { _unused } from './some-module';
 * 
 * // Mark an export that's defined for public API but not used internally
 * export const _unusedExport = z.object({...});
 */
export type Unused<T> = T;

/**
 * Helper to mark variables as intentionally unused
 * Use this when you need to keep variables around for future use
 * but don't want TypeScript to complain about them being unused
 * 
 * @example
 * markAsUnused(myUnusedVar1, myUnusedVar2);
 */
export function markAsUnused(..._args: unknown[]): void {
  // This function intentionally does nothing
  // It's just used to silence TypeScript warnings
}