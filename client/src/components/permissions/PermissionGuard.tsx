import { ReactNode, useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  area: string;
  permission: 'view' | 'edit' | 'delete';
  fallback?: ReactNode;
  showAlert?: boolean;
}

/**
 * A component that conditionally renders its children based on user permissions
 */
export function PermissionGuard({
  children,
  area,
  permission,
  fallback,
  showAlert = true
}: PermissionGuardProps) {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { hasPermission } = usePermissions(user?.id);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      // Get authentication info from useAuth hook
      const authenticated = !!user; // Double-check authentication status
      
      console.log('PermissionGuard check:', { 
        area, 
        permission, 
        authenticated,
        userRole: user?.role,
        userId: user?.id,
        isAdmin,
        isSuperAdmin
      });

      // Always grant access to admin/superadmin for documents
      if (user && (isAdmin || isSuperAdmin) && 
          (area?.toLowerCase() === 'document' || area?.toLowerCase() === 'documents')) {
        console.log(`PermissionGuard: Granting ${area}:${permission} access to admin user`);
        setHasAccess(true);
        return;
      }
      
      if (!authenticated) {
        console.log('PermissionGuard: Not authenticated');
        setHasAccess(false);
        return;
      }
      
      // Directly use isAdmin and isSuperAdmin from useAuth hook
      
      // Handle both "documents" and "document" variations
      const isDocumentArea = area?.toLowerCase() === 'documents' || area?.toLowerCase() === 'document';
      
      // Special case: Always grant document permissions to admin and superadmin users
      if (isDocumentArea && (isAdmin || isSuperAdmin)) {
        console.log(`PermissionGuard: Granting ${area}:${permission} permission to ${user?.role} user`);
        setHasAccess(true);
        return;
      }
      
      // Default case: check permissions for regular users or non-document areas
      try {
        console.log(`PermissionGuard: Checking permission via API for ${area}:${permission}`);
        const result = await hasPermission(area, permission);
        console.log(`PermissionGuard: API permission check result: ${result}`);
        setHasAccess(result);
      } catch (error) {
        console.error("PermissionGuard: Error checking permission:", error);
        setHasAccess(false);
      }
    };

    checkPermission();
  }, [hasPermission, area, permission, user, user?.role, isAdmin, isSuperAdmin]);

  // Loading state
  if (hasAccess === null) {
    return <Skeleton className="w-full h-20" />;
  }

  // Access granted, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Access denied, render fallback or permission denied message
  if (fallback) {
    return <>{fallback}</>;
  }

  // Render a permission denied alert if showAlert is true
  if (showAlert) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <Lock className="h-4 w-4 text-yellow-600 mr-2" />
        <AlertDescription>
          You don't have permission to {permission} {area} information.
        </AlertDescription>
      </Alert>
    );
  }

  // Render nothing if no fallback and showAlert is false
  return null;
}