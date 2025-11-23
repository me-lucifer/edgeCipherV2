
"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, Bot, FileText, Gauge, BarChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface DashboardPlaceholderProps {
  onBack: () => void;
}

interface Persona {
    primaryPersonaName?: string;
}

const features = [
    { icon: FileText, title: "Trade Planning", description: "Define your rules and setups for disciplined execution." },
    { icon: Bot, title: "AI Coaching", description: "Personalized feedback on your trading patterns and psychology." },
    { icon: Gauge, title: "Risk Center", description: "Monitor your exposure and key metrics like max drawdown." },
    { icon: BarChart, title: "Performance Analytics", description: "Go beyond P&L to understand your true trading performance." }
];

export function DashboardPlaceholder({ onBack }: DashboardPlaceholderProps) {
    const [persona, setPersona] = useState<Persona>({});

    useEffect(() => {
        if (typeof window !== "undefined") {
            const personaData = localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base");
            if (personaData) {
                setPersona(JSON.parse(personaData));
            }
        }
    }, []);


  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full">
        <Card className="w-full bg-muted/20 border-border/50 text-center">
            <CardHeader>
                <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                    Welcome, {persona.primaryPersonaName || 'Trader'}.
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground mt-2">
                    Arjun is ready to help. In the full product, this is your mission control.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Here you would see a snapshot of your balance and P&L, Arjun’s message of the day, and quick links to the core features of EdgeCipher.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                    {features.map(feature => (
                        <Card key={feature.title} className="bg-muted/30 border-border/50 hover:bg-muted/50 transition-colors">
                            <CardHeader className="flex-row items-center gap-4 space-y-0 p-4">
                                <feature.icon className="h-6 w-6 text-primary flex-shrink-0" />
                                <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
                 <Button onClick={onBack} className="mt-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Exit to Landing Page (Prototype)
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
