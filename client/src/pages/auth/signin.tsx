import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed unused Label import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Schema for form validation
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function SigninPage() {
  const { user, loginMutation, microsoftAuthStatus, isMicrosoftAuthStatusLoading } = useAuth();
  // Removed unused toast import and variable
  const [, setLocation] = useLocation();
  const [isEntraLoading, setIsEntraLoading] = useState(false);
  const [entraError, setEntraError] = useState<string | null>(null);

  // Create form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Check for Microsoft Entra ID login errors in URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    
    if (error) {
      setEntraError(errorDescription || 'Error during Microsoft authentication');
      // Clear the URL parameters
      url.searchParams.delete('error');
      url.searchParams.delete('error_description');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  // Handler for form submission
  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  // Handler for Microsoft SSO login
  const handleMicrosoftLogin = () => {
    setIsEntraLoading(true);
    setEntraError(null);
    // Redirect to the Microsoft Entra ID SSO endpoint
    window.location.href = "/api/auth/entra/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Welcome to BlueEarth Capital
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Microsoft SSO Button */}
          {microsoftAuthStatus?.enabled ? (
            <>
              {entraError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{entraError}</AlertDescription>
                </Alert>
              )}
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleMicrosoftLogin}
                disabled={isEntraLoading || isMicrosoftAuthStatusLoading}
              >
                {isEntraLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 23 23">
                    <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                )}
                <span>Continue with Microsoft</span>
              </Button>
            </>
          ) : isMicrosoftAuthStatusLoading ? (
            <Button 
              variant="outline" 
              className="w-full" 
              disabled
            >
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking authentication options...
            </Button>
          ) : null}

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}