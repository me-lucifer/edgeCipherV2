
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bot, LineChart, Gauge, TrendingUp, TrendingDown, Info, AlertTriangle, SlidersHorizontal, Flame, Droplets, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, ComposedChart, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { useVixState, type VixState, type VixZone } from "@/hooks/use-vix-state";
import { Skeleton } from "./ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";

interface CryptoVixModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const zoneData: { zone: VixZone, range: string, color: string, impact: string, recommendation: string }[] = [
    { zone: "Extremely Calm", range: "0-20", color: "bg-green-500", impact: "Low volatility, may lead to choppy price action.", recommendation: "Range-trading strategies may excel." },
    { zone: "Normal", range: "21-40", color: "bg-green-500", impact: "Standard market conditions, good for most strategies.", recommendation: "Follow your plan." },
    { zone: "Volatile", range: "41-60", color: "bg-yellow-500", impact: "Increased chop, risk of stop-hunts.", recommendation: "Consider reducing size." },
    { zone: "High Volatility", range: "61-80", color: "bg-orange-500", impact: "High risk of erratic moves and liquidations.", recommendation: "Defense-first. Minimum size." },
    { zone: "Extreme", range: "81-100", color: "bg-red-500", impact: "Dangerously unpredictable, 'black swan' risk.", recommendation: "Avoid taking new positions." },
];

const mockVixHistory = [
    { day: "30d ago", value: 35 }, { day: "25d ago", value: 45 }, { day: "20d ago", value: 25 },
    { day: "15d ago", value: 55 }, { day: "10d ago", value: 78 }, { day: "5d ago", value: 65 },
    { day: "Today", value: 58 },
];

const adaptationStrategies: Record<VixZone, { title: string; strategy: string }> = {
    "Extremely Calm": { title: "Patience is Key", strategy: "Trends may be weak. Avoid forcing trades and consider range-bound strategies." },
    "Normal": { title: "Standard Operating Procedure", strategy: "Your primary strategies should perform well. Focus on disciplined execution of your A+ setups." },
    "Volatile": { title: "Capital Preservation", strategy: "Consider reducing position size. Widen stop-losses to avoid getting shaken out by volatility. Be highly selective." },
    "High Volatility": { title: "Defense First", strategy: "This is a risky time to trade. If you must trade, use minimum size and wait for very clear confirmation." },
    "Extreme": { title: "Maximum Caution", strategy: "Avoid taking new positions. Market conditions are dangerously unpredictable." },
};

function VixSimulationControls({ vixState, updateVixValue }: { vixState: VixState, updateVixValue: (value: number) => void }) {
    const presets = [
        { label: "Calm", value: 15 },
        { label: "Normal", value: 35 },
        { label: "Volatile", value: 55 },
        { label: "High Vol", value: 72 },
        { label: "Extreme", value: 90 },
    ];

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5"/>Simulate VIX (Prototype)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="vix-slider">Live Value: {vixState.value}</Label>
                    <Slider
                        id="vix-slider"
                        min={0}
                        max={100}
                        step={1}
                        value={[vixState.value]}
                        onValueChange={(value) => updateVixValue(value[0])}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {presets.map(p => (
                        <Button
                            key={p.label}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => updateVixValue(p.value)}
                        >
                            {p.label} ({p.value})
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function ScoreComponentCard({ icon: Icon, title, value, colorClass }: { icon: React.ElementType, title: string, value: number, colorClass: string }) {
    return (
        <Card className="bg-muted/50 text-center">
            <CardContent className="p-4">
                <Icon className={cn("h-5 w-5 mx-auto mb-2", colorClass)} />
                <p className="text-2xl font-bold font-mono text-foreground">{value.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{title}</p>
            </CardContent>
        </Card>
    );
}

export function CryptoVixModule({ onSetModule }: CryptoVixModuleProps) {
    const { vixState, isLoading, updateVixValue } = useVixState();

    const askArjun = () => {
        if (!vixState) return;
        onSetModule('aiCoaching', { initialMessage: `How should I adapt my trading to the current volatility of ${vixState.value} (${vixState.zoneLabel})?` });
    }
    
    if (isLoading || !vixState) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="text-center">
                    <Skeleton className="h-10 w-1/3 mx-auto" />
                    <Skeleton className="h-6 w-2/3 mx-auto mt-4" />
                </div>
                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-80 w-full" />
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    const { value: currentVix, zoneLabel: currentZone, updatedAt, components } = vixState;
    const adaptation = adaptationStrategies[currentZone];

    const VixGauge = ({ value, zone }: { value: number, zone: string }) => {
        const colorConfig: Record<string, string> = {
            "Extremely Calm": 'bg-green-500',
            "Normal": 'bg-green-500',
            "Volatile": 'bg-yellow-500',
            "High Volatility": 'bg-orange-500',
            "Extreme": 'bg-red-500',
        };
        
        const colorClass = colorConfig[zone] || 'bg-foreground';
        
        const conicGradient = `conic-gradient(var(--tw-gradient-from) 0deg, var(--tw-gradient-from) calc(${value} / 100 * 180deg), hsl(var(--muted)) calc(${value} / 100 * 180deg), hsl(var(--muted)) 180deg)`;

        return (
             <div 
                className={cn("relative flex items-center justify-center w-full h-48 rounded-t-full from-green-500 overflow-hidden", colorClass)}
                style={{ background: conicGradient }}
            >
                 <div className="absolute w-[85%] h-[85%] bg-muted/80 backdrop-blur-sm rounded-t-full top-auto bottom-0" />
                 <div className="relative flex flex-col items-center justify-center z-10 pt-12">
                    <p className="text-7xl font-bold font-mono text-foreground">{Math.round(value)}</p>
                    <p className={cn("font-semibold text-lg", 
                        (zone === 'Extremely Calm' || zone === 'Normal') && 'text-green-400',
                        zone === 'Volatile' && 'text-yellow-400',
                        zone === 'High Volatility' && 'text-orange-400',
                        zone === 'Extreme' && 'text-red-400',
                    )}>{zone}</p>
                </div>
            </div>
        );
    };
    
    const getComponentColor = (value: number) => {
      if (value > 75) return "text-red-500";
      if (value > 50) return "text-orange-500";
      if (value > 25) return "text-yellow-500";
      return "text-green-500";
    }

    const newsSentiment = components.newsSentiment > 60 ? "Greed" : components.newsSentiment < 40 ? "Fear" : "Neutral";
    const newsSentimentColor = newsSentiment === "Fear" ? "text-red-500" : newsSentiment === "Greed" ? "text-green-500" : "text-yellow-500";


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
                             <CardDescription>Updated: {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })} (prototype)</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="flex items-center justify-center">
                                <VixGauge value={currentVix} zone={currentZone} />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4"/>What it means:</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{adaptation.strategy}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>What's driving the score?</CardTitle>
                            <CardDescription>The VIX is a weighted average of several market factors.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <ScoreComponentCard icon={Flame} title="BTC Volatility" value={components.btcVol} colorClass={getComponentColor(components.btcVol)} />
                            <ScoreComponentCard icon={Flame} title="ETH Volatility" value={components.ethVol} colorClass={getComponentColor(components.ethVol)} />
                            <ScoreComponentCard icon={Droplets} title="Funding Pressure" value={components.fundingPressure} colorClass={getComponentColor(components.fundingPressure)} />
                            <ScoreComponentCard icon={AlertTriangle} title="Liquidation Spikes" value={components.liquidationSpike} colorClass={getComponentColor(components.liquidationSpike)} />
                            <Card className="bg-muted/50 text-center">
                                <CardContent className="p-4">
                                    <Newspaper className={cn("h-5 w-5 mx-auto mb-2", newsSentimentColor)} />
                                    <p className={cn("text-lg font-bold text-foreground", newsSentimentColor)}>{newsSentiment}</p>
                                    <p className="text-xs text-muted-foreground">News Sentiment</p>
                                </CardContent>
                            </Card>
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
                                        <ReferenceLine y={20} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" />
                                        <ReferenceLine y={40} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" />
                                        <ReferenceLine y={60} stroke="hsl(var(--chart-4))" strokeDasharray="3 3" />
                                        <ReferenceLine y={80} stroke="hsl(var(--chart-5))" strokeDasharray="3 3" />
                                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="VIX" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-8 sticky top-24">
                    <VixSimulationControls vixState={vixState} updateVixValue={updateVixValue} />
                    <Card className="bg-muted/30 border-border/50">
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Understanding the Zones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Zone</TableHead>
                                        <TableHead>Impact</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {zoneData.map(d => (
                                        <TableRow key={d.zone}>
                                            <TableCell className="text-sm">
                                                <span className="flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full", d.color)} />
                                                    {d.range}
                                                </span>
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
