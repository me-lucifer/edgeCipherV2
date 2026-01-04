
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bot, LineChart, Gauge, TrendingUp, TrendingDown, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, ComposedChart, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";

interface CryptoVixModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const zoneData = [
    { zone: "Calm (<25)", days: 10, color: "bg-green-500", impact: "Slow markets, fewer opportunities." },
    { zone: "Normal (25-50)", days: 15, color: "bg-blue-500", impact: "Standard conditions, good for most strategies." },
    { zone: "Elevated (50-75)", days: 4, color: "bg-yellow-500", impact: "Increased chop, risk of stop-hunts." },
    { zone: "Extreme (>75)", days: 1, color: "bg-red-500", impact: "High risk of erratic moves and liquidations." },
];

const mockVixHistory = [
    { day: "30d ago", value: 35 }, { day: "25d ago", value: 45 }, { day: "20d ago", value: 25 },
    { day: "15d ago", value: 55 }, { day: "10d ago", value: 78 }, { day: "5d ago", value: 65 },
    { day: "Today", value: 58 },
];

const adaptationStrategies = {
    Calm: { title: "Patience is Key", strategy: "Setups take longer to play out. Avoid forcing trades in slow markets. Focus on clear range-bound plays if available." },
    Normal: { title: "Standard Operating Procedure", strategy: "Your primary strategies should perform well. Focus on disciplined execution of your A+ setups." },
    Elevated: { title: "Capital Preservation", strategy: "Consider reducing position size by 50%. Widen stop-losses to avoid getting shaken out by volatility. Be highly selective." },
    Extreme: { title: "Defense First", strategy: "The riskiest time to trade. Many pros sit out entirely. If you must trade, use minimum size and wait for very clear confirmation." }
};


export function CryptoVixModule({ onSetModule }: CryptoVixModuleProps) {
    const currentVix = 58;
    const currentZone = "Elevated";
    const adaptation = adaptationStrategies[currentZone as keyof typeof adaptationStrategies];
    
    const askArjun = () => {
        onSetModule('aiCoaching', { initialMessage: "How should I adapt my trading to the current volatility?" });
    }

    const VixGauge = ({ value, zone }: { value: number, zone: string }) => {
        const colorConfig: Record<string, string> = {
            Calm: 'hsl(var(--chart-2))',
            Normal: 'hsl(var(--chart-1))',
            Elevated: 'hsl(var(--chart-4))',
            Extreme: 'hsl(var(--chart-5))',
        };
        
        const color = colorConfig[zone] || 'hsl(var(--foreground))';
        const conicGradient = `conic-gradient(${color} 0deg, ${color} calc(${value} * 3.6deg), hsl(var(--muted)) calc(${value} * 3.6deg), hsl(var(--muted)) 360deg)`;

        return (
            <div 
                className="relative flex items-center justify-center w-48 h-48 rounded-full"
                style={{ background: conicGradient }}
            >
                 <div className="absolute w-[85%] h-[85%] bg-muted/80 backdrop-blur-sm rounded-full" />
                 <div className="relative flex flex-col items-center justify-center z-10">
                    <p className="text-5xl font-bold font-mono text-foreground">{value}</p>
                    <p className="font-semibold" style={{ color }}>{zone}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Crypto VIX</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                    A proprietary 0–100 volatility score for crypto futures market conditions.
                </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>Volatility Barometer</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="flex items-center justify-center">
                                <VixGauge value={currentVix} zone={currentZone} />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Current State: {currentVix} ({currentZone})</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Markets are showing elevated chop and larger price swings than usual. Risk is heightened.</p>
                                </div>
                                <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-500/20">
                                    <h4 className="font-semibold text-amber-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Recommended Posture: {adaptation.title}</h4>
                                    <p className="text-sm text-amber-300/80 mt-1">{adaptation.strategy}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                     <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>30-Day Volatility History</CardTitle>
                            <CardDescription>How today's volatility compares to the recent past.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ChartContainer config={{value: {color: "hsl(var(--primary))"}}} className="h-64 w-full">
                                <ResponsiveContainer>
                                    <ComposedChart data={mockVixHistory}>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50"/>
                                        <XAxis dataKey="day" tick={{fontSize: 12}} />
                                        <YAxis domain={[0, 100]} tick={{fontSize: 12}}/>
                                        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                                        <ReferenceLine y={25} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" />
                                        <ReferenceLine y={50} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" />
                                        <ReferenceLine y={75} stroke="hsl(var(--chart-5))" strokeDasharray="3 3" />
                                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="VIX" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-8 sticky top-24">
                    <Card className="bg-muted/30 border-border/50">
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Understanding the Zones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Zone</TableHead>
                                        <TableHead>Typical Impact</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {zoneData.map(d => (
                                        <TableRow key={d.zone}>
                                            <TableCell className="flex items-center gap-2 text-sm">
                                                <div className={cn("w-2 h-2 rounded-full", d.color)} />
                                                {d.zone}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{d.impact}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> Ask Arjun</CardTitle>
                        </CardHeader>
                         <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Get personalized advice on how your current strategies and risk profile should adapt to today's volatility.</p>
                             <Button variant="outline" className="w-full" onClick={askArjun}>
                                Ask Arjun how to adapt
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

