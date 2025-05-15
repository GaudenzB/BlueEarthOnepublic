import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import NotFound from "@/pages/not-found";
import EmployeeDirectory from "@/pages/employee-directory";
import EmployeeDetail from "@/pages/employee-detail-new";
import Dashboard from "@/pages/dashboard";
import UserManagement from "@/pages/user-management";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import EntraComplete from "@/pages/auth/entra-complete";
import EntraError from "@/pages/auth/entra-error";
import Integrations from "@/pages/integrations";
import Documents from "@/pages/documents";
import DocumentDetail from "@/pages/document-detail-consolidated";
import DesignTesting from "@/pages/design-testing";
import DesignSystem from "@/pages/DesignSystem";
import ThemeShowcasePage from "@/pages/ThemeShowcasePage";
import AuthPage from "@/pages/auth-page";
import MainLayout from "@/components/layouts/MainLayout";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ROUTES, AUTH_ROUTES, ADMIN_ROUTES } from "@/lib/routes";

// Router with authentication controls
function Router() {
  return (
    <Switch>
      {/* Public authentication routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path={AUTH_ROUTES.FORGOT_PASSWORD} component={ForgotPassword} />
      <Route path={`${AUTH_ROUTES.RESET_PASSWORD}/:token`} component={ResetPassword} />
      <Route path={AUTH_ROUTES.ENTRA_COMPLETE} component={EntraComplete} />
      <Route path={AUTH_ROUTES.ENTRA_ERROR} component={EntraError} />
      
      {/* Protected main routes */}
      <ProtectedRoute path={ROUTES.HOME} component={EmployeeDirectory} />
      <ProtectedRoute path={ROUTES.EMPLOYEES.DETAIL(':id')} component={EmployeeDetail} />
      <ProtectedRoute path={ROUTES.DASHBOARD} component={Dashboard} />
      <ProtectedRoute path={ROUTES.DOCUMENTS.LIST} component={Documents} />
      <ProtectedRoute path={`${ROUTES.DOCUMENTS.LIST}/:id`} component={DocumentDetail} />
      <ProtectedRoute path={ROUTES.DESIGN_TESTING} component={DesignTesting} />
      <ProtectedRoute path={ROUTES.DESIGN_SYSTEM} component={DesignSystem} />
      <ProtectedRoute path={ROUTES.THEME_SHOWCASE} component={ThemeShowcasePage} />
      <ProtectedRoute path={ADMIN_ROUTES.USERS} component={UserManagement} />
      <ProtectedRoute path={ADMIN_ROUTES.INTEGRATIONS} component={Integrations} />
      
      {/* Fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HelmetProvider>
          <AuthProvider>
            <PermissionsProvider>
              <Toaster />
              <MainLayout>
                <Router />
              </MainLayout>
            </PermissionsProvider>
          </AuthProvider>
        </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
