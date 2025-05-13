import React, { Suspense, lazy, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
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
import ChakraTest from "@/pages/chakra-test";
import DocumentsExample from "@/pages/documents-example";
import PdfTest from "@/pages/pdf-test";
import TestRoute from "@/pages/test-route";
import MainLayout from "@/components/layouts/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { ROUTES, AUTH_ROUTES, ADMIN_ROUTES, isAuthRoute } from "@/lib/routes";

// Auth protected route component
function ProtectedRoute({ component: Component, requireSuperAdmin = false, ...rest }: any) {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const [, setLocation] = useLocation();
  
  // Handle redirects properly as side effects
  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      setLocation(AUTH_ROUTES.LOGIN);
    }
    // If superadmin is required but user is not superadmin, redirect to home
    else if (requireSuperAdmin && !isSuperAdmin) {
      setLocation(ROUTES.HOME);
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
      setLocation(ROUTES.HOME);
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
      <Route path={AUTH_ROUTES.LOGIN} component={(props) => <PublicRoute component={Login} {...props} />} />
      <Route path={AUTH_ROUTES.FORGOT_PASSWORD} component={ForgotPassword} />
      <Route path={`${AUTH_ROUTES.RESET_PASSWORD}/:token`} component={ResetPassword} />
      
      {/* Protected routes */}
      <Route path={ROUTES.HOME} component={(props) => <ProtectedRoute component={EmployeeDirectory} {...props} />} />
      {/* Use the ROUTES constant with regex pattern to match dynamic route */}
      <Route path={ROUTES.EMPLOYEES.DETAIL(':id')} component={(props) => <ProtectedRoute component={EmployeeDetail} {...props} />} />
      <Route path={ROUTES.DASHBOARD} component={(props) => <ProtectedRoute component={Dashboard} {...props} />} />
      <Route path={ROUTES.DOCUMENTS.LIST} component={(props) => <ProtectedRoute component={Documents} {...props} />} />
      <Route path={`${ROUTES.DOCUMENTS.LIST}/:id`} component={(props) => <ProtectedRoute component={DocumentDetail} {...props} />} />
      <Route path={ROUTES.CONTRACTS.LIST} component={(props) => <ProtectedRoute component={Contracts} {...props} />} />
      <Route path={ROUTES.CHAKRA_TEST} component={(props) => <ProtectedRoute component={ChakraTest} {...props} />} />
      <Route path={ROUTES.DOCUMENTS_EXAMPLE} component={(props) => <ProtectedRoute component={DocumentsExample} {...props} />} />
      <Route path={ROUTES.PDF_TEST} component={(props) => <ProtectedRoute component={PdfTest} {...props} />} />
      <Route path={ROUTES.TEST_ROUTE} component={(props) => <ProtectedRoute component={TestRoute} {...props} />} />
      
      {/* Super admin routes */}
      <Route 
        path={ADMIN_ROUTES.USERS} 
        component={(props) => <ProtectedRoute component={UserManagement} requireSuperAdmin={true} {...props} />} 
      />
      
      <Route 
        path={ADMIN_ROUTES.INTEGRATIONS} 
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
  if (isAuthRoute(location) || !isAuthenticated) {
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
        <HelmetProvider>
          <PermissionsProvider>
            <Toaster />
            <AppContent />
          </PermissionsProvider>
        </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
