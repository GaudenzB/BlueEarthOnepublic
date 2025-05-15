import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.ReactElement;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Render the route element with additional logic
  return (
    <Route path={path} render={() => {
      // Show loading indicator while authentication state is being determined
      if (isLoading) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
      }

      // Redirect to auth page if not authenticated
      if (!user) {
        // Use a timeout to avoid immediate redirect which can cause issues
        setTimeout(() => {
          setLocation("/auth");
        }, 100);
        return null;
      }

      // Render the component if authenticated
      return <Component />;
    }} />
  );
}