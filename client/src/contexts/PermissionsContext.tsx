import { createContext, useContext, ReactNode } from 'react';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

// Define the context type
interface PermissionsContextType {
  checkPermission: (area: string, permission: 'view' | 'edit' | 'delete') => Promise<boolean>;
  hasPermissionCached: (area: string, permission: 'view' | 'edit' | 'delete') => boolean | null;
  permissionResults: Record<string, boolean>;
  isLoading: boolean;
}

// Create the context with default values
const PermissionsContext = createContext<PermissionsContextType>({
  checkPermission: async () => false,
  hasPermissionCached: () => false,
  permissionResults: {},
  isLoading: false,
});

// Provider component
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const permissionCheck = usePermissionCheck();
  
  return (
    <PermissionsContext.Provider value={permissionCheck}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Hook for using the permissions context
export function usePermissionsContext() {
  return useContext(PermissionsContext);
}