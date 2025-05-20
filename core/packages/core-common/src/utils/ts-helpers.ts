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

/**
 * NonNullable but better - removes null, undefined and empty strings
 * Useful for filtering out empty values from arrays or objects
 * 
 * @example
 * const cleanArray = dirtyArray.filter(isNonEmpty);
 */
export type NonEmpty<T> = T extends null | undefined | '' ? never : T;

/**
 * Type guard to check if a value is not null, undefined, or empty string
 */
export function isNonEmpty<T>(value: T): value is NonEmpty<T> {
  return value !== null && value !== undefined && value !== '';
}

/**
 * Ensures a value is an array, wrapping non-array values automatically
 * 
 * @example
 * // Returns [1, 2, 3]
 * ensureArray([1, 2, 3]); 
 * 
 * // Returns [42]
 * ensureArray(42);
 * 
 * // Returns []
 * ensureArray(null);
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Type-safe record lookup that returns the default value if the key doesn't exist
 * 
 * @example
 * const userRoles = {
 *   'admin': ['read', 'write', 'delete'],
 *   'editor': ['read', 'write']
 * };
 * 
 * // Returns ['read', 'write', 'delete']
 * getFromRecord(userRoles, 'admin', []); 
 * 
 * // Returns [] (default value)
 * getFromRecord(userRoles, 'viewer', []);
 */
export function getFromRecord<T, K extends PropertyKey>(
  record: Record<K, T> | null | undefined,
  key: K,
  defaultValue: T
): T {
  if (!record) return defaultValue;
  return record[key] ?? defaultValue;
}

/**
 * Safely access deeply nested properties with a default fallback
 * Uses optional chaining and nullish coalescing internally
 * 
 * @example
 * // Returns 'John' or defaultName if user.profile.name is null/undefined
 * safeGet(() => user.profile.name, defaultName);
 */
export function safeGet<T>(accessor: () => T, defaultValue: T): T {
  try {
    const value = accessor();
    return value !== null && value !== undefined ? value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Makes all properties of an object optional recursively
 * Useful for partial updates and form data
 */
export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/**
 * Type-safe assertion for exhaustive switch cases
 * Forces handling all possible enum values in switch statements
 * 
 * @example
 * switch (status) {
 *   case 'pending': return 'Loading...';
 *   case 'success': return 'Success!';
 *   case 'error': return 'Error occurred';
 *   default: exhaustiveCheck(status);
 * }
 */
export function exhaustiveCheck(value: never): never {
  throw new Error(`Unhandled case: ${String(value)}`);
}

/**
 * Creates a type-safe event emitter for strongly-typed events
 * @example
 * type AppEvents = {
 *   'user:login': [username: string, timestamp: number],
 *   'document:update': [documentId: string, content: string]
 * };
 * 
 * const emitter = createTypedEmitter<AppEvents>();
 * emitter.on('user:login', (username, timestamp) => { 
 *   // Both params are properly typed
 * });
 */
export function createTypedEmitter<Events extends Record<string, any[]>>() {
  type EventMap = {
    [E in keyof Events]: (...args: Events[E]) => void;
  };
  
  const listeners = new Map<keyof Events, Function[]>();
  
  return {
    on<E extends keyof Events>(event: E, listener: EventMap[E]): void {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(listener);
    },
    
    off<E extends keyof Events>(event: E, listener: EventMap[E]): void {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }
    },
    
    emit<E extends keyof Events>(event: E, ...args: Events[E]): void {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(listener => {
          listener(...args);
        });
      }
    }
  };
}