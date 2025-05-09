import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import EmployeeDirectory from "@/pages/employee-directory";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import UserManagement from "@/pages/user-management";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import MainLayout from "@/components/layouts/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Suspense, lazy } from "react";

// Auth protected route component
function ProtectedRoute({ component: Component, requireSuperAdmin = false, ...rest }: any) {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const [, setLocation] = useLocation();
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }
  
  // If superadmin is required but user is not superadmin, redirect to home
  if (requireSuperAdmin && !isSuperAdmin) {
    setLocation("/");
    return null;
  }
  
  return <Component {...rest} />;
}

// Public route that redirects to home if already authenticated
function PublicRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  if (isAuthenticated) {
    setLocation("/");
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
      <Route path="/dashboard" component={(props) => <ProtectedRoute component={Dashboard} {...props} />} />
      
      {/* Super admin routes */}
      <Route 
        path="/users" 
        component={(props) => <ProtectedRoute component={UserManagement} requireSuperAdmin={true} {...props} />} 
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
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
