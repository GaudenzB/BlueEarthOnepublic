import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from './usePermissions';
import { useAuth } from './useAuth';

/**
 * A hook for checking if the current user has a specific permission
 */
export function usePermissionCheck() {
  const { user, isAuthenticated, isSuperAdmin } = useAuth();
  const { hasPermission } = usePermissions(user?.id);
  const [permissionResults, setPermissionResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has permission for a specific area and action
  const checkPermission = useCallback(async (
    area: string,
    permission: 'view' | 'edit' | 'delete'
  ): Promise<boolean> => {
    // SuperAdmins always have access
    if (isSuperAdmin) return true;
    
    // Not authenticated users never have access
    if (!isAuthenticated || !user?.id) return false;
    
    // Generate a unique key for caching the result
    const permissionKey = `${area}:${permission}`;
    
    // Check if we already have the result cached
    if (permissionResults[permissionKey] !== undefined) {
      return permissionResults[permissionKey];
    }
    
    setIsLoading(true);
    try {
      const result = await hasPermission(area, permission);
      
      // Cache the result
      setPermissionResults(prev => ({
        ...prev,
        [permissionKey]: result
      }));
      
      return result;
    } catch (error) {
      console.error(`Error checking permission ${area}:${permission}:`, error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, isAuthenticated, isSuperAdmin, permissionResults, user?.id]);

  // A simpler synchronous check that uses cached results only
  const hasPermissionCached = useCallback((
    area: string,
    permission: 'view' | 'edit' | 'delete'
  ): boolean | null => {
    // SuperAdmins always have access
    if (isSuperAdmin) return true;
    
    // Not authenticated users never have access
    if (!isAuthenticated || !user?.id) return false;
    
    const permissionKey = `${area}:${permission}`;
    return permissionResults[permissionKey] ?? null;
  }, [isAuthenticated, isSuperAdmin, permissionResults, user?.id]);

  // Clear cache when user changes
  useEffect(() => {
    setPermissionResults({});
  }, [user?.id]);

  return {
    checkPermission,
    hasPermissionCached,
    permissionResults,
    isLoading
  };
}