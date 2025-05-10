import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "./useAuth";

interface Permission {
  id: number;
  userId: number;
  area: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
}

interface AddPermissionData {
  area: 'finance' | 'hr' | 'it' | 'legal' | 'operations';
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

interface UpdatePermissionData {
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function usePermissions(userId?: number) {
  const { user, isAuthenticated, isSuperAdmin } = useAuth();
  const targetUserId = userId || user?.id;

  // Get permissions for a user
  const { data: permissions, isLoading } = useQuery({
    queryKey: [`/api/users/${targetUserId}/permissions`],
    queryFn: async () => {
      if (!isAuthenticated || !targetUserId) return [];
      // Only allow fetching other users' permissions if superadmin
      if (targetUserId !== user?.id && !isSuperAdmin) return [];
      return await apiRequest<Permission[]>(`/api/users/${targetUserId}/permissions`);
    },
    enabled: !!isAuthenticated && !!targetUserId,
  });

  // Add a permission for a user
  const addPermission = useMutation({
    mutationFn: async (data: AddPermissionData) => {
      if (!targetUserId) throw new Error("No user ID provided");
      return await apiRequest<Permission>(`/api/users/${targetUserId}/permissions`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/permissions`] });
    },
  });

  // Update a permission
  const updatePermission = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePermissionData }) => {
      return await apiRequest<Permission>(`/api/permissions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/permissions`] });
    },
  });

  // Delete a permission
  const deletePermission = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest<{ message: string }>(`/api/permissions/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/permissions`] });
    },
  });

  // Check if user has a specific permission
  const checkPermission = useQuery({
    queryKey: ['/api/check-permission', user?.id],
    queryFn: async () => {
      return {};
    },
    enabled: false, // Don't run automatically
  });

  // Function to check specific permission
  const hasPermission = async (area: string, action: 'view' | 'edit' | 'delete'): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) return false;
    
    // Superadmins always have all permissions
    if (isSuperAdmin) return true;
    
    try {
      const { hasPermission } = await apiRequest<{ hasPermission: boolean }>(
        `/api/check-permission/${area}/${action}`
      );
      return hasPermission;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  };

  return {
    permissions: permissions || [],
    isLoading,
    addPermission,
    updatePermission,
    deletePermission,
    hasPermission,
  };
}