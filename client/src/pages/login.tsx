import { useState, useRef, useEffect, memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import blueEarthLogo from "@/assets/BlueEarth-Capital_blue.png";
import { colors } from "@/lib/colors";

// Create a stable form component that won't re-render when the parent does
const StableLoginForm = memo(function StableLoginForm({ 
  onSubmit, 
  isPending 
}: { 
  onSubmit: (username: string, password: string) => void,
  isPending: boolean
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Focus username field once on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      usernameInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(username, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" style={{ color: colors.text.body }}>Username</Label>
          <input
            ref={usernameInputRef}
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" style={{ color: colors.text.body }}>Password</Label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          type="submit" 
          className="w-full transition-colors duration-150 shadow-md hover:shadow-lg"
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
          disabled={isPending}
        >
          {isPending ? "Logging in..." : "Sign In"}
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
  );
});

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // If user is already authenticated, redirect to home
  if (isAuthenticated) {
    setLocation("/");
    return null;
  }
  
  const handleFormSubmit = async (username: string, password: string) => {
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
    <div className="flex h-screen items-center justify-center" style={{ backgroundColor: colors.background.base }}>
      <Card className="w-[350px] shadow-lg" style={{ backgroundColor: colors.background.card }}>
        <CardHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-md flex justify-center items-center shadow-sm">
              <img src={blueEarthLogo} alt="BlueEarth Capital" className="h-12" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold" style={{ color: colors.text.body }}>Login</CardTitle>
          <CardDescription className="text-center" style={{ color: colors.text.muted }}>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <StableLoginForm onSubmit={handleFormSubmit} isPending={login.isPending} />
      </Card>
    </div>
  );
}