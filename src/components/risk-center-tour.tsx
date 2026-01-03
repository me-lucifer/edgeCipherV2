
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { HelpCircle, X, ArrowRight, ArrowLeft } from 'lucide-react';
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
                    transition: 'all 0.3s ease-in-out',
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
        <div style={style} className="pointer-events-none">
            <div className="relative h-full w-full rounded-lg border-2 border-dashed border-primary shadow-[0_0_20px_theme(colors.primary/0.4)]" />
        </div>
    );
};

const tourSteps = [
    {
        targetId: 'risk-decision-bar',
        title: "1. Should I trade now?",
        description: "This is your main decision summary, combining market risk and your personal state. Red means stop, Yellow means caution.",
        position: 'bottom'
    },
    {
        targetId: 'vix-gauge',
        title: "2. What is the market doing?",
        description: "The VIX gauge shows current market volatility. High volatility means bigger price swings and higher risk.",
        position: 'bottom'
    },
    {
        targetId: 'todays-limits',
        title: "3. What are my rules for today?",
        description: "These are the hard constraints from your active strategy, like max trades or max daily loss.",
        position: 'left'
    },
    {
        targetId: 'risk-budget',
        title: "4. How much capital can I risk?",
        description: "This shows your daily loss budget. Use the simulator to see how a loss would impact your budget *before* you trade.",
        position: 'left'
    },
    {
        targetId: 'revenge-risk',
        title: "5. How am I feeling?",
        description: "The Revenge Risk Index tracks your recent losses to warn you when you're likely to make emotional decisions.",
        position: 'left'
    },
    {
        targetId: 'arjun-alerts',
        title: "6. What should I focus on?",
        description: "Arjun analyzes all this data and gives you a simple, actionable handoff to your AI coach.",
        position: 'top'
    },
    {
        targetId: 'risk-controls',
        title: "7. How do I enforce discipline?",
        description: "Use these controls to enable 'Safe Mode' (Recovery Mode) or other guardrails that automatically enforce discipline in your Trade Planning.",
        position: 'left'
    },
];

export function RiskCenterTour({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
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

    const getCardPositionClass = () => {
        const targetElement = document.getElementById(step.targetId);
        if (!targetElement) return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
        
        const rect = targetElement.getBoundingClientRect();
        const cardHeight = 250; // Approximate card height
        const cardWidth = 384; // sm: max-w-sm
        const gap = 16;
        
        // Prefer positioning below
        if (window.innerHeight - rect.bottom > cardHeight + gap) {
            return `top-[${Math.round(rect.bottom + gap)}px] left-[${Math.round(rect.left + rect.width / 2 - cardWidth / 2)}px]`;
        }
        // Then above
        if (rect.top > cardHeight + gap) {
            return `top-[${Math.round(rect.top - cardHeight - gap)}px] left-[${Math.round(rect.left + rect.width / 2 - cardWidth / 2)}px]`;
        }
        // Then right
        if (window.innerWidth - rect.right > cardWidth + gap) {
            return `left-[${Math.round(rect.right + gap)}px] top-[${Math.round(rect.top + rect.height / 2 - cardHeight / 2)}px]`;
        }
        // Fallback to left
        return `left-[${Math.round(rect.left - cardWidth - gap)}px] top-[${Math.round(rect.top + rect.height / 2 - cardHeight / 2)}px]`;
    }

    return (
        <>
            <div 
                className="fixed inset-0 z-[99] bg-background/80 backdrop-blur-sm animate-in fade-in"
                onClick={handleClose}
            />
            
            <div className="fixed inset-0 z-[100] pointer-events-none">
                <HighlightBox targetId={step.targetId} isOpen={isOpen} />
            </div>

            <Card
                className="fixed z-[101] w-full max-w-sm bg-muted/90 backdrop-blur-lg border-border/50 animate-in fade-in-50"
                style={{
                    top: `max(1rem, ${getCardPositionClass().split('top-[').pop()?.split('px]')[0] || '50%'})`,
                    left: `max(1rem, min(calc(100vw - 25rem), ${getCardPositionClass().split('left-[').pop()?.split('px]')[0] || '50%'}))`,
                    transform: getCardPositionClass().includes('-translate') ? 'translate(-50%, -50%)' : '',
                    transition: 'top 0.3s, left 0.3s',
                }}
            >
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                           <HelpCircle className="h-5 w-5 text-primary" />
                           Risk Center Tour
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

