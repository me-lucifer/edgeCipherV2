
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { HelpCircle, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

interface HighlightBoxProps {
    targetId: string;
    isOpen: boolean;
}

const HighlightBox: React.FC<HighlightBoxProps> = ({ targetId, isOpen }) => {
    const [style, setStyle] = useState<React.CSSProperties>({});

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
            } else {
                setStyle({ display: 'none' });
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
        targetId: 'intel-brief-card',
        title: "1. Market Mood & Volatility Risk",
        description: "Check the overall market sentiment and volatility derived from the news feed.",
    },
    {
        targetId: 'high-impact-filter',
        title: "2. Filter for High Impact News",
        description: "Focus on what matters. This toggle filters the feed to show only high-impact stories.",
    },
    {
        targetId: 'story-cluster-card',
        title: "3. Open a High-Impact Story",
        description: "Story Clusters group related articles. Click on one to see the details and analysis.",
    },
    {
        targetId: 'arjun-insight-drawer',
        title: "4. Read Arjun's Insight",
        description: "Arjun explains what this news means for you based on your persona and suggests a course of action.",
    },
    {
        targetId: 'risk-window-warning-toggle',
        title: "5. Activate a Risk Window",
        description: "Activate this to create a temporary 'risk window', which will add a warning to your Trade Planning module.",
    },
    {
        targetId: 'risk-center-link-in-tour',
        title: "6. See the Impact on Your Risk",
        description: "An active risk window affects your overall risk assessment. Click to see how it looks in the Risk Center.",
    },
];

export function NewsTour({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
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
        } else {
            console.warn(`Tour element with id "${targetId}" not found.`);
        }
    }, [currentStep]);


    if (!isOpen) return null;

    const step = tourSteps[currentStep];

    const getCardPosition = () => {
        const targetElement = document.getElementById(step.targetId);
        if (!targetElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        
        const rect = targetElement.getBoundingClientRect();
        const cardHeight = 250; // Approximate card height
        const cardWidth = 384; // sm: max-w-sm
        const gap = 16;
        
        let top = rect.top + rect.height / 2 - cardHeight / 2;
        let left = rect.left + rect.width / 2 - cardWidth / 2;

        // Prefer positioning below
        if (window.innerHeight - rect.bottom > cardHeight + gap) {
            top = rect.bottom + gap;
        }
        // Then above
        else if (rect.top > cardHeight + gap) {
            top = rect.top - cardHeight - gap;
        }
        // Then right
        else if (window.innerWidth - rect.right > cardWidth + gap) {
            left = rect.right + gap;
            top = rect.top + rect.height / 2 - cardHeight / 2;
        }
        // Fallback to left
        else {
            left = rect.left - cardWidth - gap;
            top = rect.top + rect.height / 2 - cardHeight / 2;
        }

        return {
            top: `max(1rem, ${Math.round(top)}px)`,
            left: `max(1rem, min(calc(100vw - 25rem), ${Math.round(left)}px))`,
        };
    };

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
                style={{ ...getCardPosition(), transition: 'top 0.3s, left 0.3s' }}
            >
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                           <HelpCircle className="h-5 w-5 text-primary" />
                           News Intel Tour
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
