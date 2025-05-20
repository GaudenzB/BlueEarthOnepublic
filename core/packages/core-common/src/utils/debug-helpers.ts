/**
 * Debug Helper Utilities
 * 
 * This file contains utility functions to help with debugging TypeScript issues.
 */

import { markAsUnused } from './ts-helpers';

/**
 * Type that shows the exact type of a value in hover tooltips
 * Useful for debugging complex TypeScript types
 * 
 * @example
 * type User = { id: string; name: string; };
 * const user: User = { id: '123', name: 'John' };
 * 
 * // When you hover over `debugType`, the IDE will show the full type
 * const debugType = typeOf(user);
 */
export function typeOf<T>(value: T): T {
  return value;
}

/**
 * Asserts that a type is exactly what we expect it to be
 * This is a compile-time check only, no runtime effect
 * 
 * @example
 * type Expected = { id: string; name: string; };
 * type Actual = { id: string; name: string; role: string; };
 * 
 * // This will cause a compile-time error
 * assertType<Expected, Actual>(true);
 */
export function assertType<Expected, Actual>(
  _isEqual: Actual extends Expected ? (Expected extends Actual ? true : false) : false
): void {}

/**
 * Logs a value and its type to help with debugging
 * 
 * @example
 * const user = { id: '123', name: 'John' };
 * logWithType('User object', user);
 * // Console output: "User object:" { id: '123', name: 'John' }
 * // With type information shown in IDE tooltips
 */
export function logWithType<T>(label: string, value: T): T {
  console.log(`${label}:`, value);
  return value;
}

/**
 * Creates a function that measures and logs execution time
 * 
 * @example
 * const slowFunction = timeFunction('processData', () => {
 *   // expensive operation
 *   return result;
 * });
 * 
 * // When called, logs: "⏱️ processData took 123ms"
 * const result = slowFunction();
 */
export function timeFunction<T extends any[], R>(
  name: string,
  fn: (...args: T) => R
): (...args: T) => R {
  return (...args: T): R => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(`⏱️ ${name} took ${Math.round(end - start)}ms`);
    return result;
  };
}

/**
 * Asserts that a value is not null or undefined at runtime
 * Throws an error if the value is null or undefined
 * 
 * @example
 * function getUserById(id: string): User | null {
 *   const user = findUser(id);
 *   return user;
 * }
 * 
 * // Will throw an error if user is null
 * const user = assertDefined(getUserById('123'), 'User not found');
 * // Now TypeScript knows user is not null
 */
export function assertDefined<T>(
  value: T,
  message: string = 'Value is undefined or null'
): NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
  return value as NonNullable<T>;
}

/**
 * A typed version of console.log that preserves the value for chaining
 * 
 * @example
 * // Logs the value and returns it for further operations
 * fetchData()
 *   .then(debug)
 *   .then(processData);
 */
export function debug<T>(value: T): T {
  console.log(value);
  return value;
}

/**
 * Logs a specific property path of an object
 * Useful for debugging deep nested objects
 * 
 * @example
 * const data = { user: { profile: { settings: { theme: 'dark' } } } };
 * 
 * // Logs: "theme: dark"
 * debugPath(data, 'user.profile.settings.theme');
 */
export function debugPath<T extends object>(
  object: T,
  path: string
): unknown {
  const parts = path.split('.');
  let value: any = object;
  
  for (const part of parts) {
    if (value === null || value === undefined || typeof value !== 'object') {
      console.log(`Path ${path} not found - stopped at ${part}`);
      return undefined;
    }
    value = value[part];
  }
  
  console.log(`${path}:`, value);
  return value;
}

// Silence unused warnings if these aren't used yet
markAsUnused(
  typeOf,
  assertType,
  logWithType,
  timeFunction,
  assertDefined,
  debug,
  debugPath
);