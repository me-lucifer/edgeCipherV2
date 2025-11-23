
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { AlertCircle } from "lucide-react";

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

function PlaceholderTab({ title }: { title: string }) {
    return (
        <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-lg">
             <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">{title} Settings Coming Soon</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                This is a prototype. The full version will have settings for {title.toLowerCase()}.
            </p>
        </div>
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
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="broker">Broker</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile"><ProfileTab /></TabsContent>
          <TabsContent value="broker"><PlaceholderTab title="Broker Connections" /></TabsContent>
          <TabsContent value="notifications"><PlaceholderTab title="Notifications" /></TabsContent>
          <TabsContent value="security"><PlaceholderTab title="Security" /></TabsContent>
          <TabsContent value="billing"><PlaceholderTab title="Billing" /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
