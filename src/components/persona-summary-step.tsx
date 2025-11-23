
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { CheckCircle, BarChart, Activity, ShieldAlert, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonaSummaryStepProps {
  onComplete: () => void;
  onBack: () => void;
}

interface Persona {
    primaryPersonaName?: string;
    riskScore?: number;
    emotionScore?: number;
    disciplineScore?: number;
    hasHistoryAnalysis?: boolean;
}

function ScoreGauge({ label, value, colorClass }: { label: string; value: number; colorClass: string; }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span className="text-sm font-bold text-foreground">{value}</span>
            </div>
            <Progress value={value} indicatorClassName={colorClass} />
        </div>
    )
}

export function PersonaSummaryStep({ onComplete, onBack }: PersonaSummaryStepProps) {
    const [persona, setPersona] = useState<Persona>({});

    useEffect(() => {
        if (typeof window !== "undefined") {
            const personaData = localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base");
            if (personaData) {
                setPersona(JSON.parse(personaData));
            }
        }
    }, []);

    const strengths = ["Quick to spot opportunities", "Comfortable with market volatility", "Can be decisive"];
    const watchOuts = ["Prone to FOMO and revenge trading", "May oversize positions when confident", "Can break rules during losing streaks"];
    const growthPlan = [
        "Limit yourself to 5 trades per day.",
        "Only trade your best A+ setup for the next 2 weeks.",
        "Complete a daily journal review for at least 10 days.",
        "Avoid trading for 1 hour after a big win or loss.",
    ];

    return (
        <div className="space-y-8">
            <p className="text-muted-foreground">
                Based on your questionnaire {persona.hasHistoryAnalysis && "and trade history"}, here's your initial trader persona. Arjun will use this to provide tailored coaching.
            </p>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left side: Persona scores */}
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-2xl text-primary">{persona.primaryPersonaName || "The Determined Trader"}</CardTitle>
                        <CardDescription>Your baseline trading identity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ScoreGauge label="Risk Profile" value={persona.riskScore || 68} colorClass="bg-red-500" />
                        <ScoreGauge label="Emotional Control" value={persona.emotionScore || 45} colorClass="bg-yellow-500" />
                        <ScoreGauge label="Discipline Index" value={persona.disciplineScore || 55} colorClass="bg-blue-500" />

                        <div className="grid grid-cols-2 gap-6 pt-4 text-sm">
                            <div>
                                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Activity className="h-4 w-4 text-green-500" />Strengths</h4>
                                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                                    {strengths.map((s,i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-500" />Watch-outs</h4>
                                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                                     {watchOuts.map((w,i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right side: Growth plan */}
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle>Initial Growth Plan</CardTitle>
                        <CardDescription>Arjun's first recommendations to build consistency.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {growthPlan.map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckCircle className="h-3 w-3" />
                                    </div>
                                    <span className="text-muted-foreground text-sm">{item}</span>
                                </li>
                            ))}
                        </ul>
                         <p className="text-xs text-muted-foreground/80 mt-6 text-center">
                            This plan is a preview. The full dashboard will provide detailed tracking and adaptive goals.
                         </p>
                    </CardContent>
                </Card>
            </div>


            <div className="flex justify-between items-center pt-8">
                <Button variant="ghost" onClick={onBack}>
                    Back
                </Button>
                <Button onClick={onComplete}>
                    Finish & Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// We need to extend the Progress component to allow passing a class for the indicator.
// This is a workaround because we cannot modify the original component file.
const progressIndicatorVariants: Record<string, string> = {
    'bg-red-500': 'bg-red-500',
    'bg-yellow-500': 'bg-yellow-500',
    'bg-blue-500': 'bg-blue-500',
};

const CustomProgress = React.forwardRef<
  React.ElementRef<typeof Progress>,
  React.ComponentPropsWithoutRef<typeof Progress> & { indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
CustomProgress.displayName = 'Progress';

// Import ProgressPrimitive to make the custom progress component work
import * as ProgressPrimitive from "@radix-ui/react-progress";
