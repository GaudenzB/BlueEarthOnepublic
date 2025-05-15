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
  // Define interface for me endpoint response
  interface MeResponse {
    success: boolean;
    message: string;
    data: User;
  }

  // We don't need to check for a token in localStorage anymore
  // because we're using HttpOnly cookies that are automatically 
  // sent with requests
  
  // Query to fetch the current user
  const { data, isLoading, error, refetch } = useQuery<MeResponse | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Reduced from 1 minute to 5 minutes to match staleTime
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    // Always enabled, the API will return 401 if not authenticated
  });
  
  // Extract the user from the standardized API response
  const user = data?.data || null;

  // No need to handle auth errors by removing tokens from localStorage
  // since we're using HttpOnly cookies

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
          // Set credentials: 'include' to include cookies in the request
          credentials: 'include',
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
        
        // Extract user from the response structure
        // Token is now handled via HttpOnly cookies
        const { user } = response.data;
        
        // Log user data for debugging
        console.log("User data received:", !!user);
        
        if (!user) {
          throw new Error("User data missing from server response");
        }
        
        // No need to store token in localStorage anymore
        
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
      try {
        // Call the server logout endpoint to clear cookies and revoke the token server-side
        await apiRequest("/api/auth/logout", {
          method: "POST",
          credentials: 'include'
        });
      } catch (error) {
        console.error("Error during logout:", error);
        // Continue with local logout even if server logout fails
      }
      
      // Local cleanup
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
  // Note: This function is now primarily used to trigger a refetch
  // after a successful authentication flow that sets cookies server-side
  const setTokens = async () => {
    try {
      // No need to store tokens in localStorage anymore
      // Tokens are now handled via HttpOnly cookies
      
      // Manually trigger a user data fetch to update the UI
      await refetch();
      
      return true;
    } catch (error) {
      console.error("Error refreshing user data:", error);
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