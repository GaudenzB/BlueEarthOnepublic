import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, userLoginSchema } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
// Import Microsoft logo from a different icon set
import { FaMicrosoft } from "react-icons/fa";

// Extend the userLoginSchema to include rememberMe option
const extendedLoginSchema = userLoginSchema.extend({
  rememberMe: z.boolean().optional().default(false)
});

type ExtendedLoginFormValues = z.infer<typeof extendedLoginSchema>;

const LoginForm = () => {
  const { loginMutation, microsoftAuthStatus, isMicrosoftAuthStatusLoading } = useAuth();
  
  // Debug logging for Microsoft auth status
  console.log("Microsoft auth status:", microsoftAuthStatus);
  console.log("Microsoft auth loading:", isMicrosoftAuthStatusLoading);
  
  const form = useForm<ExtendedLoginFormValues>({
    resolver: zodResolver(extendedLoginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false
    },
  });

  const onSubmit = (values: ExtendedLoginFormValues) => {
    loginMutation.mutate(values);
  };
  
  // Function to handle Microsoft SSO login
  const handleMicrosoftLogin = () => {
    // Redirect to the Microsoft SSO login endpoint
    window.location.href = "/api/auth/entra/login";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} autoFocus />
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
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Remember me</FormLabel>
                <FormDescription>
                  Keep me signed in on this device
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
        
        {/* Microsoft SSO Button - only show if enabled */}
        {microsoftAuthStatus?.enabled && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleMicrosoftLogin}
            >
              <FaMicrosoft className="mr-2 h-4 w-4" />
              Microsoft
            </Button>
          </>
        )}
      </form>
    </Form>
  );
};

const RegisterForm = () => {
  const { registerMutation } = useAuth();
  const extendedInsertUserSchema = insertUserSchema
    .extend({
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });

  type RegisterFormValues = z.infer<typeof extendedInsertUserSchema>;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(extendedInsertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "user", // Default role
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    // Remove confirmPassword before sending to the API
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Choose a username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Your email address" {...field} />
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
                <Input type="password" placeholder="Create a password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
            </>
          ) : (
            "Register"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { user } = useAuth();

  // For debugging purposes, if the user is logged in, we'll show the debug info first
  // instead of redirecting immediately
  if (user) {
    // After 5 seconds, we'll redirect to home page
    setTimeout(() => {
      window.location.href = "/";
    }, 5000);
    
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Redirecting to dashboard in 5 seconds...
        </h2>
        {/* Import our debug component */}
        {/* <UserRoleDebug /> */}
        <div className="w-full max-w-md mx-auto mt-4 p-4 border rounded-md bg-white shadow-sm">
          <h3 className="text-lg font-medium">User Role Debug</h3>
          <div className="mt-2 space-y-2">
            <div><strong>Username:</strong> {user.username}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{user.role}</span></div>
            <details>
              <summary className="cursor-pointer text-sm text-gray-500">View full user object</summary>
              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex h-screen">
      <div className="flex items-center justify-center w-full p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login"
                ? "Login to access your account"
                : "Register to get started with BlueEarth Capital"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger 
                  value="login" 
                  className="text-center w-full"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="text-center w-full"
                >
                  Register
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="pt-2">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register" className="pt-2">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {activeTab === "login" ? (
                <>
                  Don't have an account?{" "}
                  <Button variant="link" className="p-0 text-[#1E2A40] hover:underline" onClick={() => setActiveTab("register")}>
                    Register
                  </Button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Button variant="link" className="p-0 text-[#1E2A40] hover:underline" onClick={() => setActiveTab("login")}>
                    Login
                  </Button>
                </>
              )}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}