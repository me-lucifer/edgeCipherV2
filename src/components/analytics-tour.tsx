
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { HelpCircle, X, ArrowRight, ArrowLeft, Bot, Target, TrendingUp, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

interface HighlightBoxProps {
    targetId: string;
    isOpen: boolean;
}

const HighlightBox: React.FC<HighlightBoxProps> = ({ targetId, isOpen }) => {
    const [style, setStyle] = useState({});

    useEffect(() => {
        const calculatePosition = () => {
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                setStyle({
                    position: 'absolute',
                    top: `${rect.top + window.scrollY}px`,
                    left: `${rect.left + window.scrollX}px`,
                    width: `${rect.width}px`,
                    height: `${rect.height}px`,
                });
            }
        };

        if (isOpen) {
            calculatePosition();
            const resizeObserver = new ResizeObserver(calculatePosition);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                resizeObserver.observe(targetElement);
            }
            window.addEventListener('resize', calculatePosition);
            window.addEventListener('scroll', calculatePosition);

            return () => {
                if (targetElement) {
                    resizeObserver.unobserve(targetElement);
                }
                window.removeEventListener('resize', calculatePosition);
                window.removeEventListener('scroll', calculatePosition);
            }
        }
    }, [targetId, isOpen]);

    return (
        <div style={style} className="transition-all duration-300 pointer-events-none">
            <div className="relative h-full w-full rounded-lg border-2 border-dashed border-primary shadow-[0_0_20px_theme(colors.primary/0.4)] transition-all duration-300" />
        </div>
    );
};

const tourSteps = [
    {
        targetId: 'analytics-quality-badge',
        title: "1. High-Level Summary",
        description: "Start here to understand your overall trading quality. 'Disciplined' is the goal, 'Emotional' means you're breaking rules.",
        position: 'right'
    },
    {
        targetId: 'equity',
        title: "2. Equity Curve with Behaviour Markers",
        description: "See exactly how events like 'Revenge Trading' or 'Moved SL' impact your account balance in real-time.",
        position: 'right'
    },
    {
        targetId: 'discipline-scores',
        title: "3. Behaviour Scores",
        description: "Arjun quantifies your psychology into three core scores. This is your psychological fingerprint as a trader.",
        position: 'right'
    },
    {
        targetId: 'loss-drivers',
        title: "4. Top Loss Drivers",
        description: "This table shows which specific mistakes are costing you the most money. Click on a row to see the exact trades.",
        position: 'top'
    },
    {
        targetId: 'analytics-guardrails-button',
        title: "5. Discipline Guardrails",
        description: "Turn these insights into action. This button opens a dialog to set up real-time warnings in your Trade Planning module.",
        position: 'top'
    },
    {
        targetId: 'analytics-discuss-arjun',
        title: "6. Discuss with Arjun",
        description: "The final step in the loop. Click here to open a chat with Arjun, pre-filled with context about your analytics, to create a growth plan.",
        position: 'left'
    },
];

export function AnalyticsTour({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    const handleClose = () => {
        onOpenChange(false);
        setCurrentStep(0);
    }
    
    useEffect(() => {
        const targetId = tourSteps[currentStep].targetId;
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
    }, [currentStep]);


    if (!isOpen) return null;

    const step = tourSteps[currentStep];

    return (
        <>
            <div 
                className="fixed inset-0 z-[99] bg-background/80 backdrop-blur-sm animate-in fade-in"
                onClick={handleClose}
            />
            
            <div className="fixed inset-0 z-[100] pointer-events-none">
                <HighlightBox targetId={step.targetId} isOpen={isOpen} />
            </div>

            <Card className={cn(
                "fixed z-[101] w-full max-w-sm bg-muted/90 backdrop-blur-lg border-border/50 animate-in fade-in-50",
                step.position === 'right' && "left-4 top-1/2 -translate-y-1/2",
                step.position === 'left' && "right-4 top-1/2 -translate-y-1/2",
                step.position === 'top' && "top-4 left-1/2 -translate-x-1/2",
                step.position === 'bottom' && "bottom-4 left-1/2 -translate-x-1/2",
            )}>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                           <HelpCircle className="h-5 w-5 text-primary" />
                           Analytics Tour
                        </span>
                         <Button variant="ghost" size="icon" onClick={handleClose} className="-mr-2" aria-label="Close tour">
                            <X className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Badge variant="secondary" className="mb-2">Step {currentStep + 1} of {tourSteps.length}</Badge>
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <div className="flex items-center gap-2">
                            {tourSteps.map((_, i) => (
                                <button key={i} onClick={() => setCurrentStep(i)} className={cn("h-2 w-2 rounded-full", currentStep === i ? "bg-primary" : "bg-muted-foreground/50")} />
                            ))}
                        </div>
                        <Button onClick={handleNext}>
                            {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
