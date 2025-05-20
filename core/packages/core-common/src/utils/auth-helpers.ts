/**
 * Authentication Helper Utilities
 * 
 * This file contains utility functions and types for handling authentication,
 * authorization, user permissions, and security-related tasks in the application.
 * 
 * @module AuthHelpers
 * @preferred
 */

import { markAsUnused } from './ts-helpers';

/**
 * Available permission actions that can be performed in the application
 * 
 * These represent the core actions that can be authorized for a user:
 * - 'read': View resources but not modify them
 * - 'write': Create or update resources
 * - 'delete': Remove resources
 * - 'admin': Full access to manage resources and their settings
 * 
 * @example
 * // Use in permission checks
 * const canEdit: Permission = 'write';
 * 
 * @example
 * // Use for typing function parameters
 * function checkDocumentAccess(permission: Permission) { ... }
 */
export type Permission = 'read' | 'write' | 'delete' | 'admin';

/**
 * Application areas/modules that can have permission controls
 * 
 * This represents the main functional areas of the application:
 * - 'documents': Document management features
 * - 'contracts': Contract management features
 * - 'employees': Employee directory and HR features
 * - 'analytics': Reporting and dashboard features
 * 
 * @example
 * // Use to specify which part of the application to check
 * const documentArea: PermissionArea = 'documents';
 * 
 * @example
 * // Use in UI components to conditionally render sections
 * if (hasPermission(user.permissions, 'analytics', 'read')) {
 *   return <AnalyticsDashboard />;
 * }
 */
export type PermissionArea = 'documents' | 'contracts' | 'employees' | 'analytics';

/**
 * User roles available in the system
 * 
 * These define the hierarchy of user access levels:
 * - 'user': Regular user with limited access
 * - 'editor': Can create and edit content
 * - 'admin': Has elevated privileges across most features
 * - 'owner': Full system access and control
 * 
 * Higher-level roles typically have more permissions than lower-level ones.
 * 
 * @example
 * // Type annotation for variables
 * const requiredRole: UserRole = 'admin';
 * 
 * @example
 * // Use in role-based authorization
 * if (hasRole(currentUser.roles, ['admin', 'owner'])) {
 *   // Show privileged controls
 * }
 */
export type UserRole = 'user' | 'editor' | 'admin' | 'owner';

/**
 * Structure for storing user permissions across different application areas
 * 
 * This interface represents a two-level map:
 * - First level: Application areas (e.g., 'documents', 'contracts')
 * - Second level: Permissions for that area (e.g., 'read', 'write')
 * 
 * The boolean value indicates whether the permission is granted.
 * 
 * @example
 * // Example permission map for a user
 * const userPermissions: PermissionMap = {
 *   documents: { read: true, write: true, delete: false, admin: false },
 *   contracts: { read: true, write: false, delete: false, admin: false },
 *   employees: { read: true, write: false, delete: false, admin: false },
 *   analytics: { read: false, write: false, delete: false, admin: false }
 * };
 */
export interface PermissionMap {
  [area: string]: {
    [permission: string]: boolean;
  };
}

/**
 * Simplified JWT token structure used in the application
 * 
 * This interface represents the expected structure of decoded JWTs:
 * - 'sub': Subject identifier (usually the user ID)
 * - 'name': User's display name
 * - 'email': User's email address
 * - 'roles': Array of user roles
 * - 'permissions': Structured permission map
 * - 'exp': Token expiration timestamp (Unix epoch seconds)
 * - 'iat': Token issue timestamp (Unix epoch seconds)
 * 
 * @example
 * // Type annotation for a decoded token
 * const decodedToken: JwtToken = JSON.parse(atob(token.split('.')[1]));
 * 
 * @example
 * // Check if token is still valid
 * if (!isTokenExpired(decodedToken)) {
 *   // Proceed with authenticated operation
 * }
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
 * Checks if a user has a specific permission for an application area
 * 
 * This function safely verifies if a user has been granted a specific
 * permission within a particular area of the application. It handles
 * null/undefined permissions gracefully, defaulting to false.
 * 
 * @param permissions - The user's permission map, or null/undefined
 * @param area - The application area to check (e.g., 'documents')
 * @param permission - The specific permission to verify (e.g., 'write')
 * @returns Boolean indicating whether the user has the specified permission
 * 
 * @example
 * // Basic usage with user object
 * if (hasPermission(user.permissions, 'documents', 'write')) {
 *   // Allow document editing
 *   showEditButton();
 * }
 * 
 * @example
 * // Usage with conditional rendering
 * return (
 *   <div>
 *     <DocumentViewer document={doc} />
 *     {hasPermission(user.permissions, 'documents', 'write') && (
 *       <EditButton onClick={handleEdit} />
 *     )}
 *   </div>
 * );
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
 * This function verifies if a user has at least one of the roles from
 * the provided list. It handles null/undefined role lists gracefully,
 * defaulting to false.
 * 
 * @param userRoles - Array of the user's roles, or null/undefined
 * @param requiredRoles - Array of roles to check against
 * @returns Boolean indicating whether the user has any of the required roles
 * 
 * @example
 * // Basic usage for admin-only features
 * if (hasRole(user.roles, ['admin', 'owner'])) {
 *   // Show admin controls
 *   showAdminPanel();
 * }
 * 
 * @example
 * // Usage with conditional rendering
 * return (
 *   <Layout>
 *     <MainContent />
 *     {hasRole(user.roles, ['admin']) && (
 *       <AdminPanel />
 *     )}
 *   </Layout>
 * );
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
 * This function compares the expiration time in the token with the current time
 * to determine if the token has expired. It handles null/undefined tokens
 * gracefully, considering them as expired.
 * 
 * @param token - The JWT token object to check, or null/undefined
 * @returns Boolean indicating whether the token is expired (true) or valid (false)
 * 
 * @example
 * // Basic usage for auth checks
 * if (isTokenExpired(authToken)) {
 *   // Redirect to login page
 *   navigateToLogin();
 * }
 * 
 * @example
 * // Use in API request interceptor
 * axios.interceptors.request.use(config => {
 *   if (authToken && !isTokenExpired(authToken)) {
 *     config.headers.Authorization = `Bearer ${authToken.raw}`;
 *   } else {
 *     // Handle token refresh or redirect to login
 *   }
 *   return config;
 * });
 */
export function isTokenExpired(token: JwtToken | null | undefined): boolean {
  if (!token) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return token.exp < currentTime;
}

/**
 * Calculates the remaining time until token expiration in human-readable format
 * 
 * This function converts the token expiration timestamp into a user-friendly
 * string indicating how much time remains before the token expires. It handles
 * null/undefined tokens gracefully.
 * 
 * @param token - The JWT token object, or null/undefined
 * @returns String representing the time until expiration (e.g., "15 minutes")
 * 
 * @example
 * // Display expiration time to user
 * const expirationMessage = `Your session will expire in ${getTokenExpirationTime(authToken)}`;
 * showNotification(expirationMessage);
 * 
 * @example
 * // Use in a session timer component
 * function SessionTimer({ token }) {
 *   const [timeLeft, setTimeLeft] = useState(getTokenExpirationTime(token));
 *   
 *   useEffect(() => {
 *     const timer = setInterval(() => {
 *       setTimeLeft(getTokenExpirationTime(token));
 *     }, 60000); // Update every minute
 *     
 *     return () => clearInterval(timer);
 *   }, [token]);
 *   
 *   return <div>Session expires in: {timeLeft}</div>;
 * }
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
 * Creates a redacted version of sensitive data for safe logging
 * 
 * This function obscures sensitive information like email addresses, API keys,
 * and tokens to prevent accidental exposure in logs or UI. It intelligently
 * detects the type of data and applies an appropriate redaction pattern.
 * 
 * @param data - The sensitive string to redact
 * @returns Redacted version of the input string
 * 
 * @example
 * // Redact email in logs
 * console.log(`Processing login for ${redactSensitiveData('john.doe@example.com')}`);
 * // Logs: "Processing login for j***@example.com"
 * 
 * @example
 * // Redact API key in debug output
 * console.debug(`Using API key: ${redactSensitiveData('sk_live_1234567890abcdef')}`);
 * // Logs: "Using API key: sk_l...cdef"
 * 
 * @example
 * // Use in UI for partially hidden sensitive information
 * function UserEmail({ email }) {
 *   return <span title="Click to reveal">
 *     {showFull ? email : redactSensitiveData(email)}
 *   </span>;
 * }
 */
export function redactSensitiveData(data: string): string {
  if (!data) return '';
  
  // Email redaction
  if (data.includes('@')) {
    const parts = data.split('@');
    if (parts.length >= 2) {
      const username = parts[0];
      const domain = parts[1];
      if (username && username.length > 0) {
        const firstChar = username.charAt(0);
        const redactedUsername = firstChar + '*'.repeat(username.length - 1);
        return `${redactedUsername}@${domain}`;
      }
    }
    // If email format is invalid, fall through to other redaction methods
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