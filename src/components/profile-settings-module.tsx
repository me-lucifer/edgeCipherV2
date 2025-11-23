
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Link2, Lock, Trash2, Shield, CreditCard, Mail, Bot, User, Bell } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ProfileSettingsModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  displayName: z.string().min(1, "Display name is required"),
  timezone: z.string(),
  preferredSession: z.string(),
});

const preferencesSchema = z.object({
  showAdvancedMetrics: z.boolean(),
  enableBeginnerTooltips: z.boolean(),
});

const fullSettingsSchema = profileSchema.merge(preferencesSchema);
type SettingsFormValues = z.infer<typeof fullSettingsSchema>;

const timezones = ["UTC-8 (PST)", "UTC-5 (EST)", "UTC (GMT)", "UTC+1 (CET)", "UTC+8 (SGT)"];
const sessions = ["London", "New York", "Asia", "All"];

function ProfileTab() {
  const { toast } = useToast();
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(fullSettingsSchema),
    defaultValues: () => {
      if (typeof window !== "undefined") {
        const profile = JSON.parse(localStorage.getItem("ec_profile") || "{}");
        const prefs = JSON.parse(localStorage.getItem("ec_prefs") || "{}");
        return {
          firstName: profile.firstName || "John",
          lastName: profile.lastName || "Doe",
          displayName: profile.displayName || "The Determinist",
          timezone: profile.timezone || "UTC-5 (EST)",
          preferredSession: profile.preferredSession || "New York",
          showAdvancedMetrics: prefs.showAdvancedMetrics || false,
          enableBeginnerTooltips: prefs.enableBeginnerTooltips || true,
        };
      }
      return { showAdvancedMetrics: false, enableBeginnerTooltips: true };
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    const profileData = {
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: data.displayName,
      timezone: data.timezone,
      preferredSession: data.preferredSession,
    };
    const prefsData = {
      showAdvancedMetrics: data.showAdvancedMetrics,
      enableBeginnerTooltips: data.enableBeginnerTooltips,
    };

    localStorage.setItem("ec_profile", JSON.stringify(profileData));
    localStorage.setItem("ec_prefs", JSON.stringify(prefsData));

    toast({
      title: "Settings saved",
      description: "Your profile and preferences have been updated.",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="bg-muted/30 border-border/50">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Manage your personal and display details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="displayName" render={({ field }) => (
              <FormItem><FormLabel>Display Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input readOnly value="youremail@example.com (prototype)" className="bg-muted" />
            </FormItem>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-border/50">
          <CardHeader>
            <CardTitle>Trading Preferences</CardTitle>
            <CardDescription>Customize your trading environment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="timezone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger></FormControl>
                    <SelectContent>{timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="preferredSession" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Trading Session</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger></FormControl>
                    <SelectContent>{sessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-border/50">
          <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="showAdvancedMetrics" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                <div className="space-y-0.5"><FormLabel>Show Advanced Metrics</FormLabel><p className="text-xs text-muted-foreground">Display metrics like Sharpe Ratio and Sortino Ratio in analytics.</p></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="enableBeginnerTooltips" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                <div className="space-y-0.5"><FormLabel>Enable Beginner Tooltips</FormLabel><p className="text-xs text-muted-foreground">Show helpful info tooltips on complex trading terms.</p></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
}

const brokerSchema = z.object({
    apiKey: z.string().min(1, "API Key is required."),
    apiSecret: z.string().min(1, "API Secret is required."),
});

function BrokerTab() {
    const { toast } = useToast();
    const [connectionStatus, setConnectionStatus] = useState({
        isConnected: false,
        brokerName: "",
        apiKey: "",
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            updateConnectionStatus();
        }
    }, []);

    const updateConnectionStatus = () => {
        const isConnected = localStorage.getItem('ec_broker_connected') === 'true';
        const brokerName = localStorage.getItem('ec_broker_name') || "";
        const apiKey = localStorage.getItem('ec_api_key') || "";
        setConnectionStatus({ isConnected, brokerName, apiKey });
    };

    const form = useForm<z.infer<typeof brokerSchema>>({
        resolver: zodResolver(brokerSchema),
        defaultValues: { apiKey: "", apiSecret: "" },
    });

    const handleConnect = (values: z.infer<typeof brokerSchema>) => {
        localStorage.setItem("ec_broker_connected", "true");
        localStorage.setItem("ec_broker_name", "Delta");
        localStorage.setItem("ec_api_key", values.apiKey);
        localStorage.setItem("ec_api_secret", values.apiSecret);
        updateConnectionStatus();
        toast({ title: "Broker Connected", description: "Delta Exchange has been successfully connected." });
        form.reset();
    };

    const handleDisconnect = () => {
        localStorage.setItem("ec_broker_connected", "false");
        localStorage.removeItem("ec_broker_name");
        localStorage.removeItem("ec_api_key");
        localStorage.removeItem("ec_api_secret");
        updateConnectionStatus();
        toast({ title: "Broker Disconnected", variant: "destructive" });
    };
    
    if (connectionStatus.isConnected) {
        return (
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle>Broker Connection</CardTitle>
                    <CardDescription>Your account is currently connected to {connectionStatus.brokerName}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Alert variant="default" className="bg-green-500/10 border-green-500/20 text-green-300">
                        <AlertTitle>Connected to {connectionStatus.brokerName}</AlertTitle>
                        <AlertDescription>
                            API Key: {connectionStatus.apiKey.slice(0, 4)}...{connectionStatus.apiKey.slice(-4)}
                        </AlertDescription>
                    </Alert>
                    <div className="flex gap-2 pt-4">
                        <Button variant="destructive" onClick={handleDisconnect}><Trash2 className="mr-2 h-4 w-4" /> Disconnect</Button>
                        <Button variant="outline" disabled>Update Keys (Prototype)</Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle>Connect a Broker</CardTitle>
                    <CardDescription>Connect your broker to automatically sync your trades and positions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleConnect)} className="space-y-4">
                            <FormField control={form.control} name="apiKey" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>API Key</FormLabel>
                                    <FormControl><Input placeholder="Your read-only API Key" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="apiSecret" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>API Secret</FormLabel>
                                    <FormControl><Input type="password" placeholder="••••••••••••••••" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" className="w-full">
                                <Link2 className="mr-2 h-4 w-4" /> Connect Delta (Prototype)
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <Alert>
                <Lock className="h-4 w-4" />
                <AlertTitle>Your Security is Critical</AlertTitle>
                <AlertDescription>
                    EdgeCipher only requires <strong>read-only</strong> API keys and will never have access to your funds or the ability to trade on your behalf.
                </AlertDescription>
            </Alert>
        </div>
    );
}

const notificationsSchema = z.object({
  arjunAlerts: z.boolean().default(true),
  dailySummary: z.boolean().default(true),
  riskBreach: z.boolean().default(true),
  communityMentions: z.boolean().default(false),
  maxEmails: z.string().default("3"),
});

function NotificationsTab() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof notificationsSchema>>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: () => {
      if (typeof window !== "undefined") {
        return JSON.parse(localStorage.getItem("ec_notifications_prefs") || "{}");
      }
      return {};
    },
  });

  const onSubmit = (data: z.infer<typeof notificationsSchema>) => {
    localStorage.setItem("ec_notifications_prefs", JSON.stringify(data));
    toast({ title: "Notification settings saved." });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="bg-muted/30 border-border/50">
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>Manage how often we email you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="arjunAlerts" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                <div className="space-y-0.5"><FormLabel className="flex items-center gap-2"><Bot />Arjun's Weekly Insights</FormLabel></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="dailySummary" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                <div className="space-y-0.5"><FormLabel className="flex items-center gap-2"><Mail />Daily Summary Email</FormLabel></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="communityMentions" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                <div className="space-y-0.5"><FormLabel className="flex items-center gap-2"><User />Community Mentions</FormLabel></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-border/50">
          <CardHeader>
            <CardTitle>In-App Notifications</CardTitle>
            <CardDescription>Real-time alerts while you trade.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField control={form.control} name="riskBreach" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                <div className="space-y-0.5"><FormLabel className="flex items-center gap-2"><Bell />Risk Breach Notifications</FormLabel><p className="text-xs text-muted-foreground">Get an alert when you are about to break one of your risk rules.</p></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button type="submit">Save Notifications</Button>
        </div>
      </form>
    </Form>
  );
}

const passwordSchema = z.object({
    oldPassword: z.string().min(1, "Old password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

function SecurityTab() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (data: z.infer<typeof passwordSchema>) => {
    toast({ title: "Password changed (prototype)", description: "In a real app, your password would be updated." });
    form.reset();
  };
  
  return (
    <div className="space-y-8">
      <Card className="bg-muted/30 border-border/50">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="oldPassword" render={({ field }) => (
                <FormItem><FormLabel>Old Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="newPassword" render={({ field }) => (
                <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end">
                <Button type="submit">Change Password</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
       <Card className="bg-muted/30 border-border/50">
          <CardHeader><CardTitle>Two-Factor Authentication (2FA)</CardTitle></CardHeader>
          <CardContent>
            <Alert variant="default" className="bg-muted">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Coming Soon</AlertTitle>
              <AlertDescription>
                2FA will be available in a future update to further secure your account.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertTitle>Security Best Practices</AlertTitle>
        <AlertDescription>
          Never share your password or API keys with anyone. EdgeCipher staff will never ask for them. Use read-only API keys where possible.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function BillingTab() {
  return (
    <Card className="bg-muted/30 border-border/50">
      <CardHeader>
        <CardTitle>Billing &amp; Subscription</CardTitle>
        <CardDescription>Manage your plan and view payment history.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 bg-muted rounded-lg border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-xl font-bold text-foreground">Pro Trial (Prototype)</p>
            </div>
            <Button disabled>Manage Plan</Button>
          </div>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">This is a placeholder for the billing management area.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProfileSettingsModule({ onSetModule }: ProfileSettingsModuleProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your account and customize your experience.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="broker"><Link2 className="mr-2 h-4 w-4" />Broker</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4" />Billing</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile"><ProfileTab /></TabsContent>
          <TabsContent value="broker"><BrokerTab /></TabsContent>
          <TabsContent value="notifications"><NotificationsTab /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
          <TabsContent value="billing"><BillingTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
