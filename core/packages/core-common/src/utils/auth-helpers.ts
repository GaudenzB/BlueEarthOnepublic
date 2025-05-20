/**
 * Authentication Helper Utilities
 * 
 * This file contains utility functions for handling authentication-related tasks.
 */

import { markAsUnused } from './ts-helpers';

/**
 * Type for user permissions
 */
export type Permission = 'read' | 'write' | 'delete' | 'admin';

/**
 * Type for permission areas in the application
 */
export type PermissionArea = 'documents' | 'contracts' | 'employees' | 'analytics';

/**
 * Type for user role
 */
export type UserRole = 'user' | 'editor' | 'admin' | 'owner';

/**
 * Permission checking interface
 */
export interface PermissionMap {
  [area: string]: {
    [permission: string]: boolean;
  };
}

/**
 * Simplified JWT structure
 */
export interface JwtToken {
  sub: string;
  name?: string;
  email?: string;
  roles?: string[];
  permissions?: PermissionMap;
  exp: number;
  iat: number;
}

/**
 * Checks if a user has a specific permission for an area
 * 
 * @example
 * if (hasPermission(user, 'documents', 'write')) {
 *   // Allow document editing
 * }
 */
export function hasPermission(
  permissions: PermissionMap | null | undefined,
  area: PermissionArea,
  permission: Permission
): boolean {
  if (!permissions) return false;
  
  // Check if area exists
  if (!permissions[area]) return false;
  
  // Check if permission exists in area
  return !!permissions[area][permission];
}

/**
 * Checks if a user has any of the specified roles
 * 
 * @example
 * if (hasRole(user, ['admin', 'owner'])) {
 *   // Show admin controls
 * }
 */
export function hasRole(
  userRoles: string[] | null | undefined,
  requiredRoles: UserRole[]
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Checks if a JWT token is expired
 * 
 * @example
 * if (isTokenExpired(token)) {
 *   // Redirect to login
 * }
 */
export function isTokenExpired(token: JwtToken | null | undefined): boolean {
  if (!token) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return token.exp < currentTime;
}

/**
 * Calculates the expiration time for a token in human-readable format
 * 
 * @example
 * // Returns "15 minutes"
 * getTokenExpirationTime(token);
 */
export function getTokenExpirationTime(token: JwtToken | null | undefined): string {
  if (!token) return 'Token not found';
  
  const currentTime = Math.floor(Date.now() / 1000);
  const expiresIn = token.exp - currentTime;
  
  if (expiresIn <= 0) return 'Expired';
  
  if (expiresIn < 60) return `${expiresIn} seconds`;
  if (expiresIn < 3600) return `${Math.floor(expiresIn / 60)} minutes`;
  if (expiresIn < 86400) return `${Math.floor(expiresIn / 3600)} hours`;
  
  return `${Math.floor(expiresIn / 86400)} days`;
}

/**
 * Generates a redacted version of sensitive data for logging
 * 
 * @example
 * // Returns "j***@example.com"
 * redactSensitiveData("john@example.com");
 */
export function redactSensitiveData(data: string): string {
  if (!data) return '';
  
  // Email redaction
  if (data.includes('@')) {
    const [username, domain] = data.split('@');
    const firstChar = username.charAt(0);
    const redactedUsername = firstChar + '*'.repeat(username.length - 1);
    return `${redactedUsername}@${domain}`;
  }
  
  // Generic string redaction (e.g., API keys, tokens)
  if (data.length > 8) {
    const firstFour = data.substring(0, 4);
    const lastFour = data.substring(data.length - 4);
    return `${firstFour}...${lastFour}`;
  }
  
  // Short string
  return '*'.repeat(data.length);
}

// Silence unused warnings if these aren't used yet
markAsUnused(
  hasPermission,
  hasRole,
  isTokenExpired,
  getTokenExpirationTime,
  redactSensitiveData
);