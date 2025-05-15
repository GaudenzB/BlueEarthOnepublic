import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { colors } from "@/lib/colors";

/**
 * This component handles the authentication completion after a successful Entra ID login.
 * It extracts tokens from the URL hash, processes them, and redirects to the home page.
 */
export default function EntraComplete() {
  const { setTokens } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Function to process tokens from the URL hash
    const processTokens = () => {
      try {
        // Extract the tokens from the URL hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('token');
        const refreshToken = params.get('refreshToken');

        if (!accessToken || !refreshToken) {
          throw new Error('Invalid or missing authentication tokens');
        }

        // Store the tokens
        setTokens({
          accessToken,
          refreshToken,
        });

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
          setLocation("/login");
        }, 2000); // Give user time to see the error
      }
    };

    // Process tokens when component mounts
    processTokens();
  }, [setTokens, toast, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.page }}>
      <Card className="w-full max-w-md p-6" style={{ backgroundColor: colors.background.card }}>
        <CardContent className="flex flex-col items-center justify-center space-y-4 text-center py-8">
          <Spinner className="h-12 w-12" style={{ borderTopColor: colors.primary.base }} />
          <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
            Completing Authentication
          </h2>
          <p className="text-sm" style={{ color: colors.text.muted }}>
            Please wait while we complete your sign-in with Microsoft...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}