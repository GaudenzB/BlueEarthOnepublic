import React, { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { colors } from "@/lib/colors";

/**
 * This component displays when Microsoft Entra ID authentication fails
 */
export default function EntraError() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Show error message when component mounts
    toast({
      title: "Authentication Failed",
      description: "An error occurred during Microsoft account sign-in. Please try again.",
      variant: "destructive",
    });
  }, [toast]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.page }}>
      <Card className="w-full max-w-md" style={{ backgroundColor: colors.background.card }}>
        <CardContent className="flex flex-col items-center justify-center space-y-4 text-center pt-8 pb-4">
          <div className="h-16 w-16 rounded-full flex items-center justify-center" 
               style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
            Authentication Failed
          </h2>
          <p className="text-sm" style={{ color: colors.text.muted }}>
            We couldn't complete your sign-in with Microsoft.
            This may be due to invalid credentials or a configuration issue.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button 
            onClick={() => setLocation("/login")}
            style={{ 
              backgroundColor: colors.primary.base,
              color: colors.text.inverse
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary.hover;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary.base;
            }}
          >
            Return to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}