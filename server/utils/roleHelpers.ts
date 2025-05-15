/**
 * Role helpers utility file
 * 
 * Provides standardized role checking functions to be used
 * throughout the application for consistent permission handling.
 */

/**
 * User role types used for permission handling
 * This supports both uppercase and lowercase formats for backward compatibility
 */
export type UserRole = 
  | 'SUPER_ADMIN' | 'superadmin' 
  | 'ADMIN' | 'admin' 
  | 'MANAGER' | 'manager'
  | 'USER' | 'user';

/**
 * Helper functions for role checks
 */
export const roleHelpers = {
  /**
   * Check if a role has admin privileges (ADMIN or SUPER_ADMIN)
   */
  isAdmin: (role?: UserRole): boolean => {
    if (!role) return false;
    return (
      role === 'ADMIN' || 
      role === 'admin' || 
      role === 'SUPER_ADMIN' || 
      role === 'superadmin'
    );
  },
  
  /**
   * Check if a role is a super admin
   */
  isSuperAdmin: (role?: UserRole): boolean => {
    if (!role) return false;
    return role === 'SUPER_ADMIN' || role === 'superadmin';
  },

  /**
   * Check if a role is a manager (includes admin privileges)
   */
  isManager: (role?: UserRole): boolean => {
    if (!role) return false;
    return (
      role === 'MANAGER' || 
      role === 'manager' || 
      roleHelpers.isAdmin(role)
    );
  },

  /**
   * Check if a user has at least the specified role level
   * Order: USER < MANAGER < ADMIN < SUPER_ADMIN
   */
  hasRoleLevel: (userRole?: UserRole, requiredRole?: UserRole): boolean => {
    if (!userRole || !requiredRole) return false;
    
    // Normalize roles to lowercase for comparison
    const normalizedUserRole = userRole.toLowerCase();
    const normalizedRequiredRole = requiredRole.toLowerCase();
    
    // Role hierarchy
    const roleHierarchy = {
      'user': 1,
      'manager': 2,
      'admin': 3,
      'superadmin': 4
    };
    
    // Get user's role level (default to 0 if not found)
    const userRoleLevel = roleHierarchy[normalizedUserRole] || 0;
    
    // Get required role level (default to 999 if not found, impossible to match)
    const requiredRoleLevel = roleHierarchy[normalizedRequiredRole] || 999;
    
    // User has sufficient privileges if their role level is >= required level
    return userRoleLevel >= requiredRoleLevel;
  }
};