import React, { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

/**
 * This component handles the authentication completion after a successful Entra ID login.
 * Session cookies are already set by the server, so we just need to fetch the user data.
 */
export default function EntraComplete() {
  const { refetchUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Function to complete the authentication process
    const completeAuth = async () => {
      try {
        // Refresh user data since cookies are already set by the server
        const result = await refetchUser();

        if (!result.data) {
          throw new Error('Failed to retrieve user data');
        }

        // Show success message
        toast({
          title: "Success",
          description: "Logged in successfully with Microsoft account",
        });

        // Redirect to home page
        setTimeout(() => {
          setLocation("/");
        }, 1000); // Small delay to show the success state
      } catch (error) {
        console.error("Authentication error:", error);
        
        // Show error message
        toast({
          title: "Authentication Failed",
          description: error instanceof Error ? error.message : "Failed to authenticate with Microsoft. Please try again.",
          variant: "destructive",
        });
        
        // Redirect to login page
        setTimeout(() => {
          setLocation("/auth");
        }, 2000); // Give user time to see the error
      }
    };

    // Complete authentication when component mounts
    completeAuth();
  }, [refetchUser, toast, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-6">
        <CardContent className="flex flex-col items-center justify-center space-y-4 text-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-xl font-semibold">
            Completing Authentication
          </h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we complete your sign-in with Microsoft...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}