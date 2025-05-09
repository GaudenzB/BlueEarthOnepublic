import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LoginCredentials {
  username: string;
  password: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  active: boolean;
  createdAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  // Get the current user from local storage
  const getLocalUser = (): User | null => {
    const userJson = localStorage.getItem("user");
    return userJson ? JSON.parse(userJson) : null;
  };

  // Store token in local storage
  const setToken = (token: string) => {
    localStorage.setItem("token", token);
  };

  // Get token from local storage
  const getToken = (): string | null => {
    return localStorage.getItem("token");
  };

  // Store user in local storage
  const setUser = (user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
  };

  // Remove user and token from local storage
  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    queryClient.clear();
  };

  // Login mutation
  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return await apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    },
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  // Logout function
  const logout = () => {
    clearAuth();
    window.location.href = "/";
  };

  // Get current user query
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;
      
      try {
        return await apiRequest<User>("/api/auth/me");
      } catch (error) {
        // If auth fails, clear local storage
        clearAuth();
        return null;
      }
    },
    initialData: getLocalUser,
    retry: false,
  });

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Check if user has a specific role
  const hasRole = (role: string | string[]) => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };

  // Check if user is superadmin
  const isSuperAdmin = hasRole("superadmin");

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    isSuperAdmin,
  };
}