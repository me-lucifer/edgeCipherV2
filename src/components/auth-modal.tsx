
"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "./ui/checkbox";
import { useAuth } from "@/context/auth-provider";
import { Info } from "lucide-react";

export type AuthModalTab = "login" | "signup";
type ModalView = AuthModalTab | "otp";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: AuthModalTab;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and privacy policy.",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const otpSchema = z.object({
    otp: z.string().length(6, "Code must be 6 digits."),
});


export function AuthModal({ isOpen, onOpenChange, defaultTab = "signup" }: AuthModalProps) {
  const { login } = useAuth();
  const [modalView, setModalView] = useState<ModalView>(defaultTab);
  const [pendingEmail, setPendingEmail] = useState("");
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", acceptTerms: false },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    console.log("Login submitted (Prototype):", values);
    // Prototype logic: Assume any login is for a user who needs to verify email.
    // In a real app, you'd get this status from an API.
    const isVerified = false; // Hardcoded for prototype to always show OTP on login

    if (!isVerified) {
        setPendingEmail(values.email);
        setModalView("otp");
    } else {
        // This branch is for a user who is already verified.
        // The main ViewManager will handle redirection to onboarding or dashboard.
        const onboardingComplete = localStorage.getItem('ec_onboarding_complete') === 'true';
        const step = (localStorage.getItem('ec_onboarding_step') as any) || 'welcome';
        login("demo-token", true, onboardingComplete, step);
        onOpenChange(false);
    }
  };

  const onSignupSubmit = (values: z.infer<typeof signupSchema>) => {
    console.log("Signup form submitted (Prototype):", values);
    setPendingEmail(values.email);
    setModalView("otp");
  };

  const onOtpSubmit = (values: z.infer<typeof otpSchema>) => {
      console.log("OTP submitted (Prototype):", values);
      if (values.otp === "123456") {
        login("demo-token", true, false, "welcome");
        onOpenChange(false);
      } else {
          otpForm.setError("otp", {
              type: "manual",
              message: "Incorrect code for prototype. Use 123456.",
          })
      }
  }

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
        // Reset view to default tab when closing
        loginForm.reset();
        signupForm.reset();
        otpForm.reset();
        setModalView(defaultTab);
    }
    onOpenChange(open);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {modalView === 'otp' ? (
             <>
                <DialogHeader className="mt-4">
                    <DialogTitle>Verify your email</DialogTitle>
                    <DialogDescription>
                        We’ve sent a 6-digit code to {pendingEmail}. For this prototype, please use <strong>123456</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Form {...otpForm}>
                        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                            <FormField
                                control={otpForm.control}
                                name="otp"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Verification Code</FormLabel>
                                    <FormControl>
                                    <Input placeholder="123456" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <p className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                                <Info className="h-3 w-3" />
                                In the real product, this code would be sent to your inbox.
                            </p>
                            <Button type="submit" className="w-full">Verify &amp; continue</Button>
                        </form>
                    </Form>
                </div>
            </>
        ) : (
            <Tabs defaultValue={defaultTab} value={modalView} onValueChange={(value) => setModalView(value as AuthModalTab)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Start Free</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                    <DialogHeader className="mt-4">
                    <DialogTitle>Login</DialogTitle>
                    <DialogDescription>
                        Access your EdgeCipher dashboard.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                    <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={loginForm.control}
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
                        <Button type="submit" className="w-full">Login</Button>
                         <p className="text-xs text-muted-foreground text-center pt-1">
                            Prototype: after login we send you into onboarding or the dashboard preview depending on your status.
                        </p>
                        </form>
                    </Form>
                    </div>
                </TabsContent>

                <TabsContent value="signup">
                    <DialogHeader className="mt-4">
                    <DialogTitle>Create your free account</DialogTitle>
                    <DialogDescription>
                        Start your journey to disciplined trading today.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                    <Form {...signupForm}>
                        <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                        <FormField
                            control={signupForm.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={signupForm.control}
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
                        <FormField
                            control={signupForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={signupForm.control}
                            name="acceptTerms"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                                <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                    I accept the <a href="#" className="underline hover:text-primary">Terms</a> and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
                                </FormLabel>
                                </div>
                            </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">Create free account</Button>
                        </form>
                    </Form>
                    </div>
                </TabsContent>
            </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

    