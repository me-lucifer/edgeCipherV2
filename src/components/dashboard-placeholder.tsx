
"use client";

import { useAuth } from "@/context/auth-provider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Bot, FileText, Gauge, BarChart, ArrowRight } from "lucide-react";

interface Persona {
    primaryPersonaName?: string;
}

const features = [
    { icon: FileText, title: "Trade Planning", description: "Define your rules and setups for disciplined execution." },
    { icon: Bot, title: "AI Coaching", description: "Personalized feedback on your trading patterns and psychology." },
    { icon: Gauge, title: "Risk Center", description: "Monitor your exposure and key metrics like max drawdown." },
    { icon: BarChart, title: "Performance Analytics", description: "Go beyond P&L to understand your true trading performance." }
];

export function DashboardPlaceholder() {
    const [persona, setPersona] = useState<Persona>({});
    const { logout } = useAuth();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const personaData = localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base");
            if (personaData) {
                setPersona(JSON.parse(personaData));
            }
        }
    }, []);


  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Card className="w-full bg-muted/20 border-border/50">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                    Welcome, {persona.primaryPersonaName || 'Trader'}.
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                    This is your mission control. In the full product, you'd see your live P&L, Arjun's message of the day, and a summary of your recent activity.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-12">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                    {features.map(feature => (
                        <Card key={feature.title} className="bg-muted/30 border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                     <div className="p-2 bg-primary/10 rounded-lg">
                                        <feature.icon className="h-6 w-6 text-primary flex-shrink-0" />
                                     </div>
                                     <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                                </div>
                            </CardHeader>
                            <CardContent>
                               <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </CardContent>
                             <div className="p-6 pt-0">
                                <p className="text-sm text-muted-foreground group-hover:text-primary flex items-center">
                                    Go to {feature.title} <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                                </p>
                             </div>
                        </Card>
                    ))}
                </div>

                 <Card className="bg-muted/30 border-dashed border-border/80">
                    <CardHeader>
                        <CardTitle>Arjun's Note</CardTitle>
                        <CardDescription>A daily insight from your AI mentor.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
                            "Remember, your P&L is a lagging indicator of your process. Today, let's focus on executing your A+ setup flawlessly, regardless of the outcome. One good trade."
                        </blockquote>
                    </CardContent>
                </Card>

            </CardContent>
        </Card>
    </div>
  );
}
