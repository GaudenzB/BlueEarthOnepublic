import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import Logo from "@/components/logo";
import { colors } from "@/lib/colors";

export default function Login() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const usernameInputRef = React.useRef<HTMLInputElement>(null);
  
  // Set focus once when component mounts
  React.useEffect(() => {
    if (usernameInputRef.current) {
      // Use a slight delay to ensure focus after any re-renders
      const timer = setTimeout(() => {
        usernameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Redirect if authenticated (as a proper side effect)
  React.useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please provide both username and password",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await login.mutateAsync({ username, password });
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      // Don't navigate here - let the useEffect handle redirect
      // to avoid component unmounting during state updates
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Authentication failed. Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.page }}>
      <Card className="w-full max-w-sm shadow-lg" style={{ backgroundColor: colors.background.card }}>
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="bg-white p-4 rounded-md flex justify-center items-center">
            <Logo className="h-12" />
          </div>
          <CardTitle className="text-xl" style={{ color: colors.text.primary }}>Login</CardTitle>
          <CardDescription className="text-center" style={{ color: colors.text.muted }}>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              ref={usernameInputRef}
              id="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full"
              style={{ 
                backgroundColor: colors.primary.base,
                color: colors.text.inverse, // Use white text for better contrast
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary.hover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary.base;
              }}
              disabled={login.isPending}
            >
              {login.isPending ? "Logging in..." : "Sign In"}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" style={{ borderColor: colors.border.muted }}></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2" style={{ backgroundColor: colors.background.card, color: colors.text.muted }}>
                  Or continue with
                </span>
              </div>
            </div>
            
            <Button 
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
              onClick={async () => {
                try {
                  // Check if Entra ID is enabled
                  const response = await fetch('/api/auth/entra/status');
                  const data = await response.json();
                  
                  if (data.enabled) {
                    // If enabled, proceed with login
                    window.location.href = '/api/auth/entra/login';
                  } else {
                    // If not enabled, show a toast message
                    toast({
                      title: "Microsoft Login Unavailable",
                      description: "Microsoft SSO is not configured. Please use username and password login.",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  console.error("Error checking Entra ID status:", error);
                  toast({
                    title: "Error",
                    description: "Could not verify Microsoft SSO availability. Please use username and password login.",
                    variant: "destructive",
                  });
                }
              }}
              style={{ borderColor: colors.border.default }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              <span>Microsoft Account</span>
            </Button>
            
            <div className="text-sm text-center mt-4">
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal"
                style={{ color: colors.primary.light }}
                asChild
              >
                <Link href="/forgot-password">
                  Forgot your password?
                </Link>
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}