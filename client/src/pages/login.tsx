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
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.base }}>
      <Card className="w-full max-w-sm shadow-lg" style={{ backgroundColor: colors.background.card }}>
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="bg-white p-4 rounded-md flex justify-center items-center shadow-sm">
            <Logo className="h-12" />
          </div>
          <CardTitle className="text-xl" style={{ color: colors.text.body }}>Login</CardTitle>
          <CardDescription className="text-center" style={{ color: colors.text.muted }}>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              autoFocus
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
                color: colors.text.primary,
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