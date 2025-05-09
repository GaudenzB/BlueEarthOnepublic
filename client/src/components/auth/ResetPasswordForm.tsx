import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ResetPasswordFormProps {
  token: string;
}

const formSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Password Reset Successfully",
        description: "Your password has been reset. You can now log in with your new password.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Invalid or expired reset token. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    resetPasswordMutation.mutate(data);
  }

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Password Reset Complete</h3>
        <p className="text-center text-muted-foreground">
          Your password has been reset successfully. You can now log in with your new password.
        </p>
        <div className="flex justify-center mt-6">
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter your new password"
                    type="password"
                    autoComplete="new-password"
                    disabled={resetPasswordMutation.isPending}
                  />
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
                  <Input
                    {...field}
                    placeholder="Confirm your new password"
                    type="password"
                    autoComplete="new-password"
                    disabled={resetPasswordMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button 
          type="submit" 
          className="w-full"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Reset Password
        </Button>
      </form>
    </Form>
  );
}