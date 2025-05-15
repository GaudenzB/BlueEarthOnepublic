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
import MainLayout from "@/components/layouts/MainLayout";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { ROUTES, AUTH_ROUTES, ADMIN_ROUTES } from "@/lib/routes";

// Simplified router function until we fix our auth components
function Router() {
  return (
    <Switch>
      {/* All routes temporarily public */}
      <Route path="/auth/login" component={() => <div>Login Page (temp)</div>} />
      <Route path={AUTH_ROUTES.FORGOT_PASSWORD} component={ForgotPassword} />
      <Route path={`${AUTH_ROUTES.RESET_PASSWORD}/:token`} component={ResetPassword} />
      <Route path={AUTH_ROUTES.ENTRA_COMPLETE} component={EntraComplete} />
      <Route path={AUTH_ROUTES.ENTRA_ERROR} component={EntraError} />
      
      {/* Main routes */}
      <Route path={ROUTES.HOME} component={EmployeeDirectory} />
      <Route path={ROUTES.EMPLOYEES.DETAIL(':id')} component={EmployeeDetail} />
      <Route path={ROUTES.DASHBOARD} component={Dashboard} />
      <Route path={ROUTES.DOCUMENTS.LIST} component={Documents} />
      <Route path={`${ROUTES.DOCUMENTS.LIST}/:id`} component={DocumentDetail} />
      <Route path={ROUTES.DESIGN_TESTING} component={DesignTesting} />
      <Route path={ROUTES.DESIGN_SYSTEM} component={DesignSystem} />
      <Route path={ROUTES.THEME_SHOWCASE} component={ThemeShowcasePage} />
      <Route path={ADMIN_ROUTES.USERS} component={UserManagement} />
      <Route path={ADMIN_ROUTES.INTEGRATIONS} component={Integrations} />
      
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
          <PermissionsProvider>
            <Toaster />
            <MainLayout>
              <Router />
            </MainLayout>
          </PermissionsProvider>
        </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
