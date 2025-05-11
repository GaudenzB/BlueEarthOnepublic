import React, { Suspense, lazy, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import EmployeeDirectory from "@/pages/employee-directory";
import EmployeeDetail from "@/pages/employee-detail";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import UserManagement from "@/pages/user-management";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Integrations from "@/pages/integrations";
import Documents from "@/pages/documents";
import DocumentDetail from "@/pages/document-detail";
import Contracts from "@/pages/contracts";
import MainLayout from "@/components/layouts/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

// Auth protected route component
function ProtectedRoute({ component: Component, requireSuperAdmin = false, ...rest }: any) {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const [, setLocation] = useLocation();
  
  // Handle redirects properly as side effects
  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      setLocation("/login");
    }
    // If superadmin is required but user is not superadmin, redirect to home
    else if (requireSuperAdmin && !isSuperAdmin) {
      setLocation("/");
    }
  }, [isAuthenticated, isSuperAdmin, requireSuperAdmin, setLocation]);
  
  // Don't render until authentication state is confirmed
  if (!isAuthenticated || (requireSuperAdmin && !isSuperAdmin)) {
    return null;
  }
  
  return <Component {...rest} />;
}

// Public route that redirects to home if already authenticated
function PublicRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Handle redirect to home as a side effect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);
  
  // Don't render if authenticated
  if (isAuthenticated) {
    return null;
  }
  
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={(props) => <PublicRoute component={Login} {...props} />} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      
      {/* Protected routes */}
      <Route path="/" component={(props) => <ProtectedRoute component={EmployeeDirectory} {...props} />} />
      <Route path="/employees/:id" component={(props) => <ProtectedRoute component={EmployeeDetail} {...props} />} />
      <Route path="/dashboard" component={(props) => <ProtectedRoute component={Dashboard} {...props} />} />
      <Route path="/documents" component={(props) => <ProtectedRoute component={Documents} {...props} />} />
      <Route path="/documents/:id" component={(props) => <ProtectedRoute component={DocumentDetail} {...props} />} />
      <Route path="/contracts" component={(props) => <ProtectedRoute component={Contracts} {...props} />} />
      
      {/* Super admin routes */}
      <Route 
        path="/users" 
        component={(props) => <ProtectedRoute component={UserManagement} requireSuperAdmin={true} {...props} />} 
      />
      
      <Route 
        path="/integrations" 
        component={(props) => <ProtectedRoute component={Integrations} requireSuperAdmin={true} {...props} />} 
      />
      
      {/* Fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Don't use MainLayout for auth-related pages
  if (
    location === "/login" || 
    location === "/forgot-password" || 
    location.startsWith("/reset-password") || 
    !isAuthenticated
  ) {
    return <Router />;
  }
  
  return (
    <MainLayout>
      <Router />
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PermissionsProvider>
          <Toaster />
          <AppContent />
        </PermissionsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
