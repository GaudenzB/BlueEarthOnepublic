import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
// Using shadcn UI, not Chakra
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import NotFound from "@/pages/not-found";
import EmployeeDirectory from "@/pages/employee-directory";
import EmployeeDetail from "@/pages/employee-detail-new";
import Dashboard from "@/pages/dashboard";
import UserManagement from "@/pages/user-management-fixed";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import EntraComplete from "@/pages/auth/entra-complete";
import EntraError from "@/pages/auth/entra-error";
import Integrations from "@/pages/integrations";
import Documents from "@/pages/documents";
import DocumentDetail from "@/pages/document-detail-consolidated";
import DesignTesting from "@/pages/design-testing";
import DesignSystem from "@/pages/DesignSystem";
import AuthPage from "@/pages/auth-page";
import MainLayout from "@/components/layouts/MainLayout";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import SidebarProviderWrapper from "@/hooks/use-sidebar";
import { ProtectedRoute } from "@/lib/protected-route";
import { ROUTES, AUTH_ROUTES, ADMIN_ROUTES } from "@/lib/routes";
// Initialize contract routes
const ContractList = React.lazy(() => import("../../modules/contracts/client/pages/ContractList"));
const ContractDetail = React.lazy(() => import("../../modules/contracts/client/pages/ContractDetail"));
const ContractWizard = React.lazy(() => import("../../modules/contracts/client/pages/ContractWizard.shadcn"));
const ContractUploadFlow = React.lazy(() => import("../../modules/contracts/client/pages/ContractUploadFlow"));

// Router configuration with separate auth and protected routes
function AppRoutes() {
  const { isLoading } = useAuth(); // Removed unused 'user' variable
  
  // Show loader while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public authentication routes - available when logged out */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/login">
        <Redirect to="/auth" />
      </Route>
      <Route path={AUTH_ROUTES.FORGOT_PASSWORD} component={ForgotPassword} />
      <Route path={`${AUTH_ROUTES.RESET_PASSWORD}/:token`} component={ResetPassword} />
      <Route path={AUTH_ROUTES.ENTRA_COMPLETE} component={EntraComplete} />
      <Route path={AUTH_ROUTES.ENTRA_ERROR} component={EntraError} />
      
      {/* Protected routes - require authentication */}
      <ProtectedRoute path={ROUTES.HOME} component={() => (
        <MainLayout>
          <EmployeeDirectory />
        </MainLayout>
      )} />
      
      <ProtectedRoute path={ROUTES.EMPLOYEES.DETAIL(':id')} component={() => (
        <MainLayout>
          <EmployeeDetail />
        </MainLayout>
      )} />
      
      <ProtectedRoute path={ROUTES.DASHBOARD} component={() => (
        <MainLayout>
          <Dashboard />
        </MainLayout>
      )} />
      
      <ProtectedRoute path={ROUTES.DOCUMENTS.LIST} component={() => (
        <MainLayout>
          <Documents />
        </MainLayout>
      )} />
      
      <ProtectedRoute path={`${ROUTES.DOCUMENTS.LIST}/:id`} component={() => (
        <MainLayout>
          <DocumentDetail />
        </MainLayout>
      )} />
      
      <ProtectedRoute path={ROUTES.DESIGN_TESTING} component={() => (
        <MainLayout>
          <DesignTesting />
        </MainLayout>
      )} />
      
      <ProtectedRoute path={ROUTES.DESIGN_SYSTEM} component={() => (
        <MainLayout>
          <DesignSystem />
        </MainLayout>
      )} />
      

      
      <ProtectedRoute path={ADMIN_ROUTES.USERS} component={() => (
        <MainLayout>
          <UserManagement />
        </MainLayout>
      )} />
      
      <ProtectedRoute path={ADMIN_ROUTES.INTEGRATIONS} component={() => (
        <MainLayout>
          <Integrations />
        </MainLayout>
      )} />
      
      {/* Contract Routes - with Suspense loading */}
      {/* Specific routes must come before the dynamic id routes to prevent swallowing */}
      <ProtectedRoute path="/contracts/upload" component={() => (
        <MainLayout>
          <React.Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <ContractUploadFlow />
          </React.Suspense>
        </MainLayout>
      )} />
      <ProtectedRoute path="/contracts/new" component={() => (
        <MainLayout>
          <React.Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <ContractWizard />
          </React.Suspense>
        </MainLayout>
      )} />
      <ProtectedRoute 
        path="/contracts/:id/edit" 
        component={function ContractEditRoute({ params }) {
          return (
            <MainLayout>
              <React.Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                <ContractWizard documentId={params.id} />
              </React.Suspense>
            </MainLayout>
          );
        }}
      />
      <ProtectedRoute 
        path="/contracts/:id" 
        component={function ContractDetailRoute({ params }) {
          // ContractDetail gets contract ID from route params on its own
          return (
            <MainLayout>
              <React.Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                <ContractDetail />
              </React.Suspense>
            </MainLayout>
          );
        }}
      />
      <ProtectedRoute path="/contracts" component={() => (
        <MainLayout>
          <React.Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <ContractList />
          </React.Suspense>
        </MainLayout>
      )} />
      
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
              <SidebarProviderWrapper>
                <Toaster />
                <AppRoutes />
              </SidebarProviderWrapper>
            </PermissionsProvider>
          </AuthProvider>
        </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
