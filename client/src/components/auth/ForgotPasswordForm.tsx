import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

const formSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Check your email",
        description: "If that email exists in our system, a password reset link has been sent.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    forgotPasswordMutation.mutate(data);
  }

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Reset Link Sent</h3>
        <p className="text-center text-muted-foreground">
          If that email exists in our system, a password reset link has been sent.
          Please check your email and follow the instructions to reset your password.
        </p>
        <p className="text-center text-muted-foreground text-sm">
          Don't see the email? Check your spam folder or try again.
        </p>
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => setIsSuccess(false)}
          >
            Try Again
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter your email address"
                    type="email"
                    autoComplete="email"
                    disabled={forgotPasswordMutation.isPending}
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
          disabled={forgotPasswordMutation.isPending}
        >
          {forgotPasswordMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Send Reset Link
        </Button>
      </form>
    </Form>
  );
}