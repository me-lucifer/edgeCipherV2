
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { HelpCircle, X, ArrowRight, Lightbulb, User, AreaChart, BarChart, BookOpen, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"


interface HighlightBoxProps {
    targetId: string;
    number: number;
    text: string;
    isOpen: boolean;
}

const HighlightBox: React.FC<HighlightBoxProps> = ({ targetId, number, text, isOpen }) => {
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
            window.addEventListener('resize', calculatePosition);
        }

        return () => window.removeEventListener('resize', calculatePosition);
    }, [targetId, isOpen]);

    return (
        <div style={style} className="transition-all duration-300">
            <div className="relative h-full w-full rounded-lg border-2 border-dashed border-primary shadow-[0_0_20px_theme(colors.primary/0.4)] transition-all duration-300">
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg border-4 border-background">
                    {number}
                </div>
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground text-xs font-semibold p-2 rounded-md hidden lg:block">
                    {text}
                </div>
            </div>
        </div>
    );
};

const helpSections = [
  { id: 'demo-highlight-1', number: 1, title: "User Header & Arjun's Insight" },
  { id: 'demo-highlight-2', number: 2, title: 'Account Snapshot' },
  { id: 'demo-highlight-3', number: 3, title: 'Performance Summary' },
  { id: 'demo-highlight-4', number: 4, title: 'Market Context' },
  { id: 'demo-highlight-5', number: 5, title: 'Quick Actions & Today\'s Focus' },
];

export function DashboardDemoHelper({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
    
    if (!isOpen) {
        return (
            <div className="fixed bottom-4 left-4 z-50">
                <Button onClick={() => onOpenChange(true)} variant="outline" size="icon">
                    <HelpCircle className="h-5 w-5" />
                </Button>
            </div>
        );
    }
    
    return (
        <>
            <div 
                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in"
                onClick={() => onOpenChange(false)}
            />
            
            <div className="fixed inset-0 z-50 pointer-events-none">
                {helpSections.map(section => (
                    <HighlightBox
                        key={section.id}
                        targetId={section.id}
                        number={section.number}
                        text={section.title}
                        isOpen={isOpen}
                    />
                ))}
            </div>

            <Card className="fixed top-1/2 right-4 -translate-y-1/2 z-50 w-full max-w-sm bg-muted/90 backdrop-blur-lg border-border/50 animate-in slide-in-from-right-12">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Dashboard Tour</span>
                         <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="-mr-2">
                            <X className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                    <CardDescription>A quick guide to your mission control.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>A trader's typical daily flow might look like this:</p>
                        <ol className="space-y-3">
                            <li className="flex items-start gap-3">
                                <span className="font-bold text-primary w-4 text-center">1.</span>
                                <span>Check <strong>Arjun's Insight</strong> for today's mental focus.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <span className="font-bold text-primary w-4 text-center">2.</span>
                                <span>Review your <strong>Account Snapshot</strong> for open positions and buying power.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <span className="font-bold text-primary w-4 text-center">3.</span>
                                <span>Look at your <strong>Performance Summary</strong> to see your recent P&L.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="font-bold text-primary w-4 text-center">4.</span>
                                <span>Check the <strong>Market Context</strong> (VIX & News) to understand today's risk environment.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <span className="font-bold text-primary w-4 text-center">5.</span>
                                <span>Use <strong>Quick Actions</strong> and your <strong>Growth Plan</strong> to guide your session.</span>
                            </li>
                        </ol>
                    </div>
                     <p className="text-xs text-muted-foreground/80 pt-4 text-center">
                        Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Shift</kbd> + <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">?</kbd> to toggle this view.
                    </p>
                </CardContent>
            </Card>
        </>
    );
}
