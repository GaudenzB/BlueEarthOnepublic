import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
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

// Server response structures updated to match our new standardized API responses
interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

// Updated interface to match the actual server response structure
interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export function useAuth() {
  // Check if there's a token in localStorage
  const token = localStorage.getItem("token");
  
  // Define interface for me endpoint response
  interface MeResponse {
    success: boolean;
    message: string;
    data: User;
  }

  // Query to fetch the current user, but only if we have a token
  const { data, isLoading, error, refetch } = useQuery<MeResponse | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Reduced from 1 minute to 5 minutes to match staleTime
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    enabled: !!token, // Only run the query if there's a token
  });
  
  // Extract the user from the standardized API response
  const user = data?.data || null;

  // Handle auth errors
  if (error) {
    localStorage.removeItem("token");
  }

  // Set user in local state
  const setUser = (userData: User) => {
    queryClient.setQueryData(["/api/auth/me"], {
      success: true,
      message: "User data retrieved successfully",
      data: userData
    });
  };

  // Login mutation
  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        // Log the request for debugging
        console.log("Sending login request:", { username: credentials.username });
        
        const response = await apiRequest<any>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(credentials),
        });
        
        // Log entire response for debugging
        console.log("Login response received:", response);
        
        // Verify response structure
        if (!response) {
          throw new Error("No response received from server");
        }
        
        if (!response.success) {
          throw new Error(response.message || "Server returned unsuccessful response");
        }
        
        if (!response.data) {
          throw new Error("Response missing data property");
        }
        
        // Extract token and user from the correct response structure
        const { token, user } = response.data;
        
        // Log token and user for debugging
        console.log("Token received:", !!token);
        console.log("User data received:", !!user);
        
        if (!token) {
          throw new Error("Token missing from server response");
        }
        
        if (!user) {
          throw new Error("User data missing from server response");
        }
        
        // Store token in local storage
        localStorage.setItem("token", token);
        
        return user;
      } catch (error) {
        console.error("Login mutation error:", error);
        throw error;
      }
    },
    onSuccess: (userData) => {
      console.log("Login successful, setting user data");
      setUser(userData);
    },
  });

  // Logout function with server-side token revocation
  const logout = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Call the server logout endpoint to revoke the token
          await apiRequest("/api/auth/logout", {
            method: "POST"
          });
        } catch (error) {
          console.error("Error during logout:", error);
          // Continue with local logout even if server logout fails
        }
      }
      // Local cleanup
      localStorage.removeItem("token");
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries();
    }
  });

  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Check if user is a superadmin
  const isSuperAdmin = isAuthenticated && user?.role === "superadmin";
  
  // Check if user is an admin (including superadmin)
  const isAdmin = isAuthenticated && (user?.role === "admin" || user?.role === "superadmin");
  
  // Get user's full name
  const fullName = user 
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username
    : '';

  // Function to set tokens directly (used for SSO flows)
  const setTokens = async (tokens: AuthTokens) => {
    try {
      // Store the access token
      localStorage.setItem("token", tokens.accessToken);
      
      // Store refresh token if provided
      if (tokens.refreshToken) {
        localStorage.setItem("refreshToken", tokens.refreshToken);
      }
      
      // Manually trigger a user data fetch to update the UI
      await refetch();
      
      return true;
    } catch (error) {
      console.error("Error setting tokens:", error);
      return false;
    }
  };

  return {
    user,
    login,
    logout,
    setTokens,
    isLoading,
    error,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    fullName,
    refetchUser: refetch,
  };
}