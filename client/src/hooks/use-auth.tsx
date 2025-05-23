import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { getQueryFn, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Type for Microsoft auth status
type MicrosoftAuthStatus = {
  enabled: boolean;
  message: string;
};

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, any>;
  microsoftAuthStatus: MicrosoftAuthStatus | null;
  isMicrosoftAuthStatusLoading: boolean;
  refetchUser: () => Promise<any>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

type LoginData = { username: string; password: string; rememberMe?: boolean };

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: userData,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<{success: boolean; user: SelectUser} | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Extract the user from the response
  const user = userData?.success ? userData.user : null;
  
  // Check if Microsoft Entra ID (Azure AD) SSO is configured
  const {
    data: microsoftAuthStatus,
    isLoading: isMicrosoftAuthStatusLoading,
  } = useQuery<MicrosoftAuthStatus | null>({
    queryKey: ["/api/auth/entra/microsoft/status"],
    queryFn: getQueryFn({ on401: "returnNull" })
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || response.statusText || "Login failed");
      }
      
      return data.user;
    },
    onSuccess: (user: SelectUser) => {
      // Update the user data with the proper format that matches the query data structure
      queryClient.setQueryData(["/api/user"], { 
        success: true, 
        user: user 
      });
      
      // Refresh the user data to ensure we have the latest
      refetchUser();
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || response.statusText || "Registration failed");
      }
      
      return data.user;
    },
    onSuccess: (user: SelectUser) => {
      // Update the user data with the proper format that matches the query data structure
      queryClient.setQueryData(["/api/user"], { 
        success: true, 
        user: user 
      });
      
      // Refresh the user data to ensure we have the latest
      refetchUser();
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || response.statusText || "Logout failed");
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Set user data to null when logged out
      queryClient.setQueryData(["/api/user"], null);
      
      // Force a refetch to ensure all user data is cleared
      refetchUser();
      
      toast({
        title: "Logged out successfully",
        description: data.message || "You have been logged out"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if the user has admin privileges
  const isAdmin = !!user && (user.role === 'admin' || user.role === 'superadmin');
  
  // Check if the user has superadmin privileges
  const isSuperAdmin = !!user && user.role === 'superadmin';
  
  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        microsoftAuthStatus: microsoftAuthStatus ? microsoftAuthStatus as MicrosoftAuthStatus : null,
        isMicrosoftAuthStatusLoading,
        refetchUser,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}