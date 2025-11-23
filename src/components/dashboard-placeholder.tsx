
"use client";

import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

interface DashboardPlaceholderProps {
  onBack: () => void;
}

export function DashboardPlaceholder({ onBack }: DashboardPlaceholderProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-center p-4">
      <div className="max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Dashboard Placeholder
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          In the real product, this is where the logged-in trading interface, analytics, AI coaching, and risk center would live.
        </p>
        <Button onClick={onBack} className="mt-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Landing Page (Prototype)
        </Button>
      </div>
    </div>
  );
}
