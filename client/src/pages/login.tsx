import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import blueEarthLogo from "@/assets/BlueEarth-Capital_blue.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // If user is already authenticated, redirect to home
  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

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
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Card className="w-[350px] shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-md flex justify-center items-center shadow-sm">
              <img src={blueEarthLogo} alt="BlueEarth Capital" className="h-12" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full bg-[#1e3a6e] hover:bg-[#2A4A75] transition-colors duration-150"
              disabled={login.isPending}
            >
              {login.isPending ? "Logging in..." : "Sign In"}
            </Button>
            <div className="text-sm text-center mt-4">
              <Button 
                variant="link" 
                className="text-[#1e3a6e] p-0 h-auto font-normal"
                onClick={() => {
                  toast({
                    title: "Password Reset",
                    description: "Please contact the system administrator to reset your password.",
                  });
                }}
              >
                Forgot your password?
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}