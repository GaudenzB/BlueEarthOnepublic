import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
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

export function useAuth() {
  // Define interface for me endpoint response
  interface MeResponse {
    success: boolean;
    message: string;
    data: User;
  }
  
  // Skip additional declarations as they're defined below

  // We don't need to check for a token in localStorage anymore
  // because we're using HttpOnly cookies that are automatically 
  // sent with requests
  
  // Check for existing tokens via a cookie before fetching
  const [tokenExists, setTokenExists] = React.useState<boolean>(false);

  // Initialize tokenExists and check for existing login session
  React.useEffect(() => {
    const detectExistingLogin = () => {
      // In development, we'll always assume there might be a token to trigger the auth check
      // This is because HttpOnly cookies can't be reliably detected via JavaScript
      const isDev = import.meta.env.DEV;
      
      if (isDev) {
        // In development, always try to authenticate
        console.debug("Development environment: Always try to authenticate");
        setTokenExists(true);
        return;
      }
      
      // For production, we still attempt to detect cookies 
      // Check for our non-HttpOnly marker cookie which is set alongside the HttpOnly auth cookies
      const hasCookie = document.cookie.split(';').some(item => {
        const trimmed = item.trim();
        return trimmed.startsWith('auth_present=') || 
               trimmed.startsWith('accessToken=') || 
               trimmed.startsWith('connect.sid=');
      });
      console.debug("Cookie detection result:", hasCookie);
      setTokenExists(hasCookie);
    };
    
    detectExistingLogin();
    
    // Set up an interval to occasionally check for the presence of the auth cookie
    // This addresses issues where cookies might be set after this component is mounted
    const cookieCheckInterval = setInterval(() => {
      detectExistingLogin();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(cookieCheckInterval);
  }, []);

  // Query to fetch the current user, but only if we might be logged in
  // Use /api/user instead of /api/auth/me based on server endpoints
  const { data, isLoading, error, refetch } = useQuery<MeResponse | null>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: Infinity, // Don't auto-refresh, we'll manually refresh when needed
    gcTime: Infinity, // Don't garbage collect this query
    refetchInterval: false, // No polling
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    refetchOnMount: false, // Don't refetch on component mount
    enabled: tokenExists, // Only run the query if we might have a login
    networkMode: 'online', // Only fetch when online
  });
  
  // Extract the user from the standardized API response
  const user = data?.data || null;

  // No need to handle auth errors by removing tokens from localStorage
  // since we're using HttpOnly cookies

  // Set user in local state
  const setUser = (userData: User) => {
    queryClient.setQueryData(["/api/user"], {
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
          // Set credentials: 'include' to include cookies in the request,
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
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
    }
  });

  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Check if user is a superadmin - case insensitive check
  const isSuperAdmin = isAuthenticated && 
    (user?.role?.toLowerCase() === "superadmin" || user?.role?.toUpperCase() === "SUPERADMIN");
  
  // Check if user is an admin (including superadmin) - case insensitive check
  const isAdmin = isAuthenticated && 
    (user?.role?.toLowerCase() === "admin" || 
     user?.role?.toLowerCase() === "superadmin" || 
     user?.role?.toUpperCase() === "ADMIN" || 
     user?.role?.toUpperCase() === "SUPERADMIN");
  
  // Get user's full name
  const fullName = user 
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username
    : '';

  // Function to refresh user data after successful authentication
  // This is primarily used after a successful SSO flow that sets cookies server-side
  // We've removed the tokens parameter as we're not storing tokens in localStorage anymore
  const setTokens = async () => {
    try {
      // Manually trigger a user data fetch to update the UI after cookie-based auth
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