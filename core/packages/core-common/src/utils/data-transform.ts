/**
 * Data Transformation Utilities
 * 
 * This file contains utility functions for transforming data between different formats.
 * Useful for processing API responses or preparing data for submission.
 */

import { markAsUnused } from './ts-helpers';

/**
 * Converts snake_case keys to camelCase
 * 
 * @example
 * // Returns { userId: 1, firstName: 'John' }
 * snakeToCamel({ user_id: 1, first_name: 'John' });
 */
export function snakeToCamel<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.entries(obj).reduce((result, [key, value]) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Handle nested objects and arrays recursively
    let transformedValue = value;
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        transformedValue = value.map(item => 
          item && typeof item === 'object' ? snakeToCamel(item) : item
        );
      } else {
        transformedValue = snakeToCamel(value);
      }
    }
    
    return { ...result, [camelKey]: transformedValue };
  }, {});
}

/**
 * Converts camelCase keys to snake_case
 * 
 * @example
 * // Returns { user_id: 1, first_name: 'John' }
 * camelToSnake({ userId: 1, firstName: 'John' });
 */
export function camelToSnake<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.entries(obj).reduce((result, [key, value]) => {
    const snakeKey = key.replace(/([A-Z])/g, letter => `_${letter.toLowerCase()}`);
    
    // Handle nested objects and arrays recursively
    let transformedValue = value;
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        transformedValue = value.map(item => 
          item && typeof item === 'object' ? camelToSnake(item) : item
        );
      } else {
        transformedValue = camelToSnake(value);
      }
    }
    
    return { ...result, [snakeKey]: transformedValue };
  }, {});
}

/**
 * Creates a URL-friendly slug from a string
 * 
 * @example
 * // Returns "hello-world"
 * slugify("Hello World!");
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/&/g, '-and-')         // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')       // Remove all non-word characters
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
}

/**
 * Groups an array of objects by a specified key
 * 
 * @example
 * // Returns { active: [...], inactive: [...] }
 * groupBy(users, 'status');
 */
export function groupBy<T extends Record<string, any>, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    return {
      ...result,
      [groupKey]: [...(result[groupKey] || []), item]
    };
  }, {} as Record<string, T[]>);
}

/**
 * Flattens a nested object structure into a flat object with dot notation keys
 * 
 * @example
 * // Returns { "user.id": 1, "user.profile.name": "John" }
 * flattenObject({ user: { id: 1, profile: { name: "John" } } });
 */
export function flattenObject(
  obj: Record<string, any>, 
  prefix: string = ''
): Record<string, any> {
  return Object.keys(obj).reduce((acc, key) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], prefixedKey));
    } else {
      acc[prefixedKey] = obj[key];
    }
    
    return acc;
  }, {} as Record<string, any>);
}

/**
 * Unflatten a dot-notation object back into a nested structure
 * 
 * @example
 * // Returns { user: { id: 1, profile: { name: "John" } } }
 * unflattenObject({ "user.id": 1, "user.profile.name": "John" });
 */
export function unflattenObject(
  obj: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    const keys = key.split('.');
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k]) {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
  });
  
  return result;
}

/**
 * Picks specific properties from an object
 * 
 * @example
 * // Returns { name: "John", email: "john@example.com" }
 * pick(user, ["name", "email"]);
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
}

/**
 * Omits specific properties from an object
 * 
 * @example
 * // Returns { name: "John" } (without the password)
 * omit(user, ["password", "token"]);
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  return Object.entries(obj).reduce((result, [key, value]) => {
    if (!keys.includes(key as K)) {
      result[key as keyof Omit<T, K>] = value as any;
    }
    return result;
  }, {} as Omit<T, K>);
}

// Silence unused warnings if these aren't used yet
markAsUnused(
  snakeToCamel,
  camelToSnake,
  slugify,
  groupBy,
  flattenObject,
  unflattenObject,
  pick,
  omit
);