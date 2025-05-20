/**
 * Data Transformation Utilities
 * 
 * This file contains utility functions for transforming data between different formats.
 * These utilities help with API integrations, data processing, and frontend-backend
 * data exchange patterns commonly used in the application.
 * 
 * @module DataTransform
 * @preferred
 */

import { markAsUnused } from './ts-helpers';

/**
 * Recursively converts all object keys from snake_case to camelCase
 * 
 * This function is useful when working with APIs that return snake_case
 * keys (common in Python/Ruby backends) but you want to use camelCase
 * in your JavaScript/TypeScript frontend code.
 * 
 * @typeParam T - The input object type
 * @param obj - The object with snake_case keys to transform
 * @returns A new object with all keys converted to camelCase
 * 
 * @example
 * // Basic usage
 * const apiResponse = { user_id: 1, first_name: 'John' };
 * const converted = snakeToCamel(apiResponse);
 * // Returns { userId: 1, firstName: 'John' }
 * 
 * @example
 * // Handles nested objects and arrays
 * const nestedResponse = {
 *   user_data: {
 *     first_name: 'John',
 *     last_name: 'Doe',
 *     contact_info: {
 *       email_address: 'john@example.com'
 *     },
 *     tag_list: ['primary_tag', 'secondary_tag']
 *   }
 * };
 * const converted = snakeToCamel(nestedResponse);
 * // Returns deep conversion of all keys
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
 * Recursively converts all object keys from camelCase to snake_case
 * 
 * This function is useful when sending data to APIs that expect snake_case
 * keys (common in Python/Ruby backends) from your JavaScript/TypeScript
 * frontend code that uses camelCase.
 * 
 * @typeParam T - The input object type
 * @param obj - The object with camelCase keys to transform
 * @returns A new object with all keys converted to snake_case
 * 
 * @example
 * // Basic usage for API requests
 * const userData = { userId: 1, firstName: 'John' };
 * const apiReadyData = camelToSnake(userData);
 * // Returns { user_id: 1, first_name: 'John' }
 * 
 * @example
 * // Use in API submission
 * async function createUser(userData) {
 *   return fetch('/api/users', {
 *     method: 'POST',
 *     body: JSON.stringify(camelToSnake(userData))
 *   });
 * }
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
 * Transforms any string into a format suitable for URLs by:
 * - Converting to lowercase
 * - Replacing spaces with hyphens
 * - Removing special characters
 * - Handling common entities like '&'
 * - Normalizing multiple hyphens
 * 
 * @param text - The string to convert to a slug
 * @returns A URL-friendly slug string
 * 
 * @example
 * // Basic usage
 * const pageTitle = "Hello World!";
 * const slug = slugify(pageTitle);
 * // Returns "hello-world"
 * 
 * @example
 * // For route generation
 * function getDocumentRoute(document) {
 *   return `/documents/${document.id}/${slugify(document.title)}`;
 * }
 * // Returns "/documents/123/my-important-document"
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
 * Groups an array of objects by a specified key property
 * 
 * This utility organizes a collection of objects into groups based on the
 * value of a specific property. This is useful for creating categorized views,
 * organizing data for charts, or preparing hierarchical data structures.
 * 
 * @typeParam T - The type of objects in the array
 * @typeParam K - The key property used for grouping (must be a key of T)
 * @param array - The array of objects to group
 * @param key - The property name to group by
 * @returns An object with keys representing each unique value of the specified property
 *          and values as arrays of objects with that property value
 * 
 * @example
 * // Group users by status
 * const users = [
 *   { id: 1, name: 'John', status: 'active' },
 *   { id: 2, name: 'Jane', status: 'inactive' },
 *   { id: 3, name: 'Bob', status: 'active' }
 * ];
 * const usersByStatus = groupBy(users, 'status');
 * // Returns:
 * // {
 * //   active: [
 * //     { id: 1, name: 'John', status: 'active' },
 * //     { id: 3, name: 'Bob', status: 'active' }
 * //   ],
 * //   inactive: [
 * //     { id: 2, name: 'Jane', status: 'inactive' }
 * //   ]
 * // }
 * 
 * @example
 * // Use with UI components
 * function DocumentList({ documents }) {
 *   const documentsByCategory = groupBy(documents, 'category');
 *   
 *   return (
 *     <div>
 *       {Object.entries(documentsByCategory).map(([category, docs]) => (
 *         <div key={category}>
 *           <h2>{category}</h2>
 *           <ul>
 *             {docs.map(doc => <DocumentItem key={doc.id} document={doc} />)}
 *           </ul>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
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
 * This function converts a deeply nested object structure into a flat object
 * where keys represent the path to each value using dot notation. This is
 * useful for form libraries, serialization, and accessing deeply nested values.
 * 
 * @param obj - The nested object to flatten
 * @param prefix - Internal parameter for recursion (omit when calling)
 * @returns A flat object with dot notation keys
 * 
 * @example
 * // Basic usage
 * const userData = {
 *   user: {
 *     id: 1,
 *     profile: {
 *       name: "John",
 *       contact: { email: "john@example.com" }
 *     }
 *   }
 * };
 * const flat = flattenObject(userData);
 * // Returns:
 * // {
 * //   "user.id": 1,
 * //   "user.profile.name": "John",
 * //   "user.profile.contact.email": "john@example.com"
 * // }
 * 
 * @example
 * // Use for form data initialization
 * function initializeFormFromNestedData(data) {
 *   const flatData = flattenObject(data);
 *   Object.entries(flatData).forEach(([path, value]) => {
 *     form.setValue(path, value);
 *   });
 * }
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
 * This function is the inverse of flattenObject, converting an object with
 * dot notation keys back into a deeply nested object structure. Useful for
 * recreating hierarchical data from flat form submissions or query parameters.
 * 
 * @param obj - The flat object with dot notation keys to unflatten
 * @returns A nested object structure
 * 
 * @example
 * // Basic usage
 * const flatData = {
 *   "user.id": 1,
 *   "user.profile.name": "John",
 *   "user.profile.email": "john@example.com"
 * };
 * const nested = unflattenObject(flatData);
 * // Returns:
 * // {
 * //   user: {
 * //     id: 1,
 * //     profile: {
 * //       name: "John",
 * //       email: "john@example.com"
 * //     }
 * //   }
 * // }
 * 
 * @example
 * // Use with form submissions
 * function handleFormSubmit(formData) {
 *   // Form data is a flat object with keys like "user.profile.name"
 *   const structuredData = unflattenObject(formData);
 *   
 *   // Now it's ready for API submission as a nested object
 *   api.updateUser(structuredData);
 * }
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
 * Creates a new object with only the specified properties from the original
 * 
 * This is a type-safe implementation of lodash's pick function. It creates
 * a subset of an object containing only the specified keys. Useful for
 * filtering objects to contain only relevant data.
 * 
 * @typeParam T - The type of the input object
 * @typeParam K - Union type of allowed keys to pick
 * @param obj - The source object to pick properties from
 * @param keys - Array of keys to include in the new object
 * @returns A new object containing only the specified properties
 * 
 * @example
 * // Basic usage - include only specific user fields
 * const user = {
 *   id: 123,
 *   name: "John Doe",
 *   email: "john@example.com",
 *   password: "hashedpassword",
 *   role: "admin"
 * };
 * const publicUserData = pick(user, ["id", "name", "email"]);
 * // Returns { id: 123, name: "John Doe", email: "john@example.com" }
 * 
 * @example
 * // Use for API responses
 * function sanitizeUserResponse(user) {
 *   // Only return safe fields to the client
 *   return pick(user, ["id", "name", "email", "role"]);
 * }
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
 * Creates a new object excluding the specified properties from the original
 * 
 * This is a type-safe implementation of lodash's omit function. It creates
 * a copy of an object without the specified keys. Useful for removing
 * sensitive or unnecessary data.
 * 
 * @typeParam T - The type of the input object
 * @typeParam K - Union type of keys to exclude
 * @param obj - The source object to omit properties from
 * @param keys - Array of keys to exclude from the new object
 * @returns A new object with all properties except those specified
 * 
 * @example
 * // Basic usage - remove sensitive fields
 * const user = {
 *   id: 123,
 *   name: "John Doe",
 *   email: "john@example.com",
 *   password: "hashedpassword",
 *   token: "jwt-token"
 * };
 * const safeUser = omit(user, ["password", "token"]);
 * // Returns { id: 123, name: "John Doe", email: "john@example.com" }
 * 
 * @example
 * // Use for form data preparation
 * function prepareFormData(formValues) {
 *   // Remove metadata fields before submission
 *   return omit(formValues, ["_id", "_created", "_modified"]);
 * }
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