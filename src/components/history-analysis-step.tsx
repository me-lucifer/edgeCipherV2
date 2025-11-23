
"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "./ui/alert";

interface HistoryAnalysisStepProps {
  onComplete: () => void;
}

const analysisStages = [
    "Fetching trades and orders from Delta...",
    "Cleaning data and aggregating PnL...",
    "Analyzing your behaviour patterns...",
    "Finalizing your profile..."
];

export function HistoryAnalysisStep({ onComplete }: HistoryAnalysisStepProps) {
    const [progress, setProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const totalDuration = 4000; // 4 seconds total
        const intervalTime = 50; // update every 50ms
        const progressIncrement = (intervalTime / totalDuration) * 100;
        const stageInterval = totalDuration / analysisStages.length;

        const interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + progressIncrement;
                if (newProgress >= 100) {
                    clearInterval(interval);
                    setIsComplete(true);
                    return 100;
                }

                setCurrentStage(Math.floor(newProgress / (100 / analysisStages.length)));
                return newProgress;
            });
        }, intervalTime);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isComplete) {
            // Merge persona data
            if (typeof window !== "undefined") {
                const basePersona = JSON.parse(localStorage.getItem("ec_persona_base") || "{}");
                const finalPersona = {
                    ...basePersona,
                    hasHistoryAnalysis: true,
                };
                localStorage.setItem("ec_persona_final", JSON.stringify(finalPersona));
            }
        }
    }, [isComplete]);


    const renderStage = (index: number, text: string) => {
        const isActive = index === currentStage;
        const isDone = index < currentStage || isComplete;
        
        return (
            <div key={index} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                    <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all",
                        isDone ? "bg-primary border-primary text-primary-foreground" : "",
                        isActive ? "border-primary text-primary" : "border-border text-muted-foreground",
                    )}>
                        {isDone ? <CheckCircle className="h-5 w-5" /> : (isActive ? <Loader2 className="h-5 w-5 animate-spin" /> : index + 1)}
                    </div>
                     {index < analysisStages.length - 1 && <div className={cn("w-px h-8 transition-colors", isDone ? "bg-primary" : "bg-border")} />}
                </div>
                <div>
                    <p className={cn("font-semibold transition-colors", (isActive || isDone) ? "text-foreground" : "text-muted-foreground")}>
                        {text}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {index === 0 && "Fetching up to 12 months of trade history."}
                        {index === 1 && "Calculating win rates, R:R, and other key metrics."}
                        {index === 2 && "Identifying patterns like revenge trading and FOMO entries."}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <p className="text-muted-foreground">
                Arjun is now analyzing your connected trade history to build a complete picture of your trading persona. This may take a few moments.
            </p>

            <div className="space-y-4">
                <Progress value={progress} />
                <div className="space-y-2">
                    {analysisStages.map((stage, index) => renderStage(index, stage))}
                </div>
            </div>

            {isComplete && (
                <div className="animate-in fade-in-50 duration-500 space-y-6">
                    <Card className="bg-muted/50 border-primary/20">
                        <CardHeader>
                            <CardTitle>Initial Analysis Complete</CardTitle>
                            <CardDescription>Here's a sample of what Arjun found (prototype data):</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="font-medium text-foreground">Win Rate:</div><div className="text-muted-foreground">42%</div>
                                <div className="font-medium text-foreground">Average R:R:</div><div className="text-muted-foreground">1.3</div>
                                <div className="font-medium text-foreground">Max Drawdown:</div><div className="text-muted-foreground">28%</div>
                                <div className="font-medium text-foreground">Most Active Session:</div><div className="text-muted-foreground">London + NY Overlap</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Alert variant="default" className="bg-muted/30 border-border/50">
                        <AlertDescription className="text-center text-muted-foreground">
                            In the real product, these stats would be computed from your actual trading data.
                        </AlertDescription>
                    </Alert>

                     <div className="flex justify-end pt-4">
                        <Button onClick={onComplete}>
                            Continue to Persona summary
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
