/**
 * TypeScript Helper Utilities
 * 
 * This file contains utility types and functions to help with common TypeScript patterns.
 * These utilities facilitate type-safe code, null safety, and improved developer experience.
 * 
 * @module TypeScriptHelpers
 * @preferred
 */

/**
 * Mark a variable as intentionally unused to suppress TypeScript compiler warnings
 * 
 * Use this type when you have variables or imports that are needed for type checking
 * but aren't directly used in your code. This is particularly useful for:
 * - Type-only imports that might be flagged as unused
 * - Constants that will be used in the future
 * - Properties that are required by an interface but not used in a particular implementation
 * 
 * @typeParam T - The type of the unused variable
 * 
 * @example
 * // Import something you need for types but don't use directly
 * import { _unused } from './some-module';
 * 
 * // Mark an export that's defined for public API but not used internally
 * export const _unusedExport: Unused<MyType> = { prop: 'value' };
 */
export type Unused<T> = T;

/**
 * Helper to mark variables as intentionally unused
 * 
 * Use this function to silence TypeScript warnings about unused variables.
 * It's particularly useful during development when you have code that's
 * temporarily unused but will be needed later.
 * 
 * @param _args - Any number of arguments of any type that are intentionally unused
 * @returns void - This function has no return value
 * 
 * @example
 * // Silence warnings for multiple variables
 * markAsUnused(tempVariable, importedButUnusedFunction);
 * 
 * @example
 * // Keep an import for later use
 * import { someUtility } from './utilities';
 * markAsUnused(someUtility);
 */
export function markAsUnused(..._args: unknown[]): void {
  // This function intentionally does nothing
  // It's just used to silence TypeScript warnings
}

/**
 * A type that excludes null, undefined, and empty strings
 * 
 * This is more strict than TypeScript's built-in NonNullable type,
 * as it also excludes empty strings. It's useful for data validation
 * and filtering empty values from collections.
 * 
 * @typeParam T - The input type to filter
 * 
 * @example
 * // Define a type that cannot be null, undefined, or empty string
 * type RequiredName = NonEmpty<string>;
 * 
 * @example
 * // Use with filter to remove empty values
 * const data = ['value', '', null, undefined, 'another'];
 * const filtered: NonEmpty<string>[] = data.filter(isNonEmpty);
 * // filtered is ['value', 'another']
 */
export type NonEmpty<T> = T extends null | undefined | '' ? never : T;

/**
 * Type guard to check if a value is not null, undefined, or empty string
 * 
 * Use this function to safely filter out empty values from arrays or 
 * to validate that a value is present and meaningful. This is a runtime
 * check that also provides TypeScript with type narrowing information.
 * 
 * @typeParam T - The type of value to check
 * @param value - The value to check for emptiness
 * @returns A boolean indicating if the value is non-empty, with type predicate
 * 
 * @example
 * // Use as a filter function
 * const validValues = mixedData.filter(isNonEmpty);
 * 
 * @example
 * // Use as a type guard
 * if (isNonEmpty(value)) {
 *   // Here TypeScript knows value is not null, undefined, or empty string
 *   return value.toUpperCase();
 * }
 */
export function isNonEmpty<T>(value: T): value is NonEmpty<T> {
  return value !== null && value !== undefined && value !== '';
}

/**
 * Ensures a value is an array, wrapping non-array values automatically
 * 
 * This utility helps handle inputs that might be single items or arrays,
 * ensuring consistent array handling. It also safely handles null and
 * undefined by returning an empty array.
 * 
 * @typeParam T - The type of elements in the array
 * @param value - A single value, array, null, or undefined
 * @returns An array of type T
 * 
 * @example
 * // Returns [1, 2, 3]
 * ensureArray([1, 2, 3]); 
 * 
 * @example
 * // Returns [42]
 * ensureArray(42);
 * 
 * @example
 * // Returns []
 * ensureArray(null);
 * 
 * @example
 * // Practical use case with API response
 * const tags = ensureArray(response.tags);
 * tags.forEach(tag => renderTag(tag));
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
 * Safely retrieves a value from a record object with a fallback default value
 * if the key doesn't exist or if the record itself is null/undefined.
 * 
 * @typeParam T - The type of values in the record
 * @typeParam K - The type of keys in the record (must be a valid property key)
 * @param record - The record to lookup a value in
 * @param key - The key to lookup
 * @param defaultValue - The default value to return if the key isn't found
 * @returns The value associated with the key, or the default value
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
 * 
 * @example
 * // Safe handling of potentially undefined records
 * const permissions = getFromRecord(user?.permissions, 'documents', { read: false });
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
 * 
 * This function provides a type-safe way to access nested properties
 * that might be undefined at runtime. It catches any exceptions from 
 * attempting to access properties on null/undefined values and returns
 * the default value instead.
 * 
 * @typeParam T - The type of the value being accessed
 * @param accessor - A function that attempts to access the nested property
 * @param defaultValue - The fallback value if access fails
 * @returns The accessed value or the default value
 * 
 * @example
 * // Basic usage - provides a fallback if any part of the path is null/undefined
 * const userName = safeGet(() => user.profile.name, 'Unknown User');
 * 
 * @example
 * // Works with complex nested structures
 * const count = safeGet(
 *   () => response.data.results[0].statistics.count,
 *   0
 * );
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
 * 
 * Similar to TypeScript's built-in Partial<T> type, but applies the
 * transformation recursively to all nested objects. This is useful for
 * form data, partial updates, and handling incomplete data structures.
 * 
 * @typeParam T - The type to make deeply partial
 * 
 * @example
 * // Original type
 * type User = {
 *   id: string;
 *   profile: {
 *     name: string;
 *     email: string;
 *   }
 * };
 * 
 * // DeepPartial type
 * // { id?: string; profile?: { name?: string; email?: string; } }
 * type PartialUser = DeepPartial<User>;
 * 
 * @example
 * // Use in a component for form state
 * const [formData, setFormData] = useState<DeepPartial<UserData>>({});
 */
export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/**
 * Type-safe assertion for exhaustive switch cases
 * 
 * Use this function to enforce compile-time checks for exhaustive handling
 * of union types in switch statements. If a new case is added to the union
 * but not handled in your switch, TypeScript will generate a compile error.
 * 
 * @param value - A value of type 'never', which should be unreachable if all cases are handled
 * @returns Never returns - either throws an error or causes a compile-time error
 * 
 * @example
 * // With a string union type
 * type Status = 'pending' | 'success' | 'error';
 * 
 * function getStatusMessage(status: Status): string {
 *   switch (status) {
 *     case 'pending': return 'Loading...';
 *     case 'success': return 'Success!';
 *     case 'error': return 'Error occurred';
 *     default: return exhaustiveCheck(status); // Error if Status gets a new value
 *   }
 * }
 * 
 * @example
 * // With an enum
 * enum Direction { Up, Down, Left, Right }
 * 
 * function getArrowKey(direction: Direction): string {
 *   switch (direction) {
 *     case Direction.Up: return 'ArrowUp';
 *     case Direction.Down: return 'ArrowDown';
 *     case Direction.Left: return 'ArrowLeft';
 *     case Direction.Right: return 'ArrowRight';
 *     default: return exhaustiveCheck(direction);
 *   }
 * }
 */
export function exhaustiveCheck(value: never): never {
  throw new Error(`Unhandled case: ${String(value)}`);
}

/**
 * Creates a type-safe event emitter for strongly-typed events
 * 
 * This utility provides an event emitter with compile-time checking
 * of event names and parameter types. It ensures that event handlers
 * receive the correct arguments and prevents typos in event names.
 * 
 * @typeParam Events - A record mapping event names to parameter tuple types
 * @returns An object with on, off, and emit methods
 * 
 * @example
 * // Define your application's events with their parameter types
 * type AppEvents = {
 *   'user:login': [username: string, timestamp: number],
 *   'document:update': [documentId: string, content: string],
 *   'modal:close': [] // event with no parameters
 * };
 * 
 * // Create a type-safe emitter
 * const events = createTypedEmitter<AppEvents>();
 * 
 * // Subscribe with proper type checking
 * events.on('user:login', (username, timestamp) => {
 *   console.log(`${username} logged in at ${new Date(timestamp)}`);
 * });
 * 
 * // Emit events with type checking
 * events.emit('user:login', 'john.doe', Date.now()); // ✓ Correct
 * events.emit('user:login', Date.now(), 'john.doe'); // ✗ Type error
 * events.emit('user:logon', 'john.doe', Date.now()); // ✗ Type error (typo)
 */
export function createTypedEmitter<Events extends Record<string, any[]>>() {
  type EventMap = {
    [E in keyof Events]: (...args: Events[E]) => void;
  };
  
  const listeners = new Map<keyof Events, Function[]>();
  
  return {
    /**
     * Subscribe to an event
     * 
     * @param event - The event name to subscribe to
     * @param listener - The callback function to execute when the event occurs
     */
    on<E extends keyof Events>(event: E, listener: EventMap[E]): void {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(listener);
    },
    
    /**
     * Unsubscribe from an event
     * 
     * @param event - The event name to unsubscribe from
     * @param listener - The callback function to remove
     */
    off<E extends keyof Events>(event: E, listener: EventMap[E]): void {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }
    },
    
    /**
     * Emit an event with typed parameters
     * 
     * @param event - The event name to emit
     * @param args - The arguments to pass to event listeners
     */
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