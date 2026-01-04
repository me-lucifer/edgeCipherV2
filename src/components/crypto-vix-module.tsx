
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bot, LineChart, Gauge, TrendingUp, TrendingDown, Info, AlertTriangle, SlidersHorizontal, Flame, Droplets, Newspaper, Sparkles, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, ComposedChart, ReferenceLine, ReferenceDot } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { useVixState, type VixState, type VixZone } from "@/hooks/use-vix-state";
import { Skeleton } from "./ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";


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

const postureSuggestions: Record<VixZone, { title: string, actions: string[] }> = {
    "Extremely Calm": { title: "Be patient", actions: ["Wait for A+ setups", "Respect ranges", "Avoid forcing trades"] },
    "Normal": { title: "Execute plan", actions: ["Stick to your strategy", "Normal size OK", "Journal consistently"] },
    "Volatile": { title: "Trade defensively", actions: ["Reduce size", "Widen stops slightly", "Confirm entries"] },
    "High Volatility": { title: "Extreme caution", actions: ["Cut size >40%", "Wait for clear signals", "Avoid overtrading"] },
    "Extreme": { title: "No new trades", actions: ["Protect capital", "Close risky positions", "Review, don't trade"] },
};

const regimeShiftInfo: Record<string, { meaning: string, action: string }> = {
    "Normal_Volatile": { meaning: "Market chop is increasing.", action: "Consider reducing leverage." },
    "Volatile_High Volatility": { meaning: "Risk of erratic moves is now high.", action: "Switch to defense-first mindset." },
    "High Volatility_Extreme": { meaning: "Dangerous conditions detected.", action: "Avoid taking new positions." },
    "Extreme_High Volatility": { meaning: "Volatility is decreasing but still very high.", action: "Wait for further confirmation before trading." },
    "High Volatility_Volatile": { meaning: "Conditions are improving but still risky.", action: "Can consider A+ setups with small size." },
    "Volatile_Normal": { meaning: "The market is calming down.", action: "Can slowly return to normal sizing." },
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

function RegimeShiftBanner({ previous, current, onDismiss }: { previous: VixZone; current: VixZone; onDismiss: () => void; }) {
    const shiftKey = `${previous}_${current}`;
    const info = regimeShiftInfo[shiftKey];

    if (!info) return null;
    
    const isWorsening = ["Normal_Volatile", "Volatile_High Volatility", "High Volatility_Extreme"].includes(shiftKey);

    return (
        <Alert variant={isWorsening ? "destructive" : "default"} className={cn(isWorsening ? "bg-amber-950/70 border-amber-500/30 text-amber-300" : "bg-blue-950/70 border-blue-500/30 text-blue-300")}>
            <AlertTriangle className={cn("h-4 w-4", isWorsening ? "text-amber-400" : "text-blue-400")} />
            <div className="flex justify-between items-start">
                <div>
                    <AlertTitle className={cn(isWorsening ? "text-amber-400" : "text-blue-400")}>
                        Regime Shift: {previous} → {current}
                    </AlertTitle>
                    <AlertDescription className="mt-1">
                        <strong>What it means:</strong> {info.meaning} <br />
                        <strong>Suggested action:</strong> {info.action}
                    </AlertDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1" onClick={onDismiss}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </Alert>
    )
}

const HeatStrip = ({ data }: { data: { value: number }[] }) => {
    const getBlockColor = (value: number) => {
        if (value <= 20) return 'bg-green-500/50';
        if (value <= 40) return 'bg-green-500/70';
        if (value <= 60) return 'bg-yellow-500/70';
        if (value <= 80) return 'bg-orange-500/70';
        return 'bg-red-500/70';
    };
    
    return (
        <div className="flex w-full gap-px rounded-md overflow-hidden">
            {data.map((point, index) => (
                 <TooltipProvider key={index}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex-1 h-3" style={{ backgroundColor: getBlockColor(point.value).replace('bg-', '').replace('/50', '').replace('/70', '') }}></div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>VIX: {point.value}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
        </div>
    )
}

export function CryptoVixModule({ onSetModule }: CryptoVixModuleProps) {
    const { vixState, isLoading, updateVixValue } = useVixState();
    const [timeRange, setTimeRange] = useState<'24H' | '7D'>('24H');
    const [regimeShift, setRegimeShift] = useState<{ previous: VixZone, current: VixZone } | null>(null);

    const askArjun = () => {
        if (!vixState) return;
        onSetModule('aiCoaching', { initialMessage: `How should I adapt my trading to the current volatility of ${vixState.value} (${vixState.zoneLabel})?` });
    }

    const chartData = useMemo(() => {
        if (!vixState) return [];
        const data = timeRange === '24H' ? vixState.series.series24h : vixState.series.series7d;
        
        return data.map((point, index, arr) => {
            let spike = null;
            if (index >= 2) {
                const diff = point.value - arr[index - 2].value;
                if (diff > 15) spike = "up";
                if (diff < -15) spike = "down";
            }
            return { ...point, spike };
        });
    }, [vixState, timeRange]);
    
    useEffect(() => {
        if (!vixState || chartData.length < 2) return;

        const currentPoint = chartData[chartData.length - 1];
        const previousPoint = chartData[chartData.length - 2];
        
        const getVixZone = (value: number): VixZone => {
            if (value <= 20) return "Extremely Calm";
            if (value <= 40) return "Normal";
            if (value <= 60) return "Volatile";
            if (value <= 80) return "High Volatility";
            return "Extreme";
        };

        const currentZone = getVixZone(currentPoint.value);
        const previousZone = getVixZone(previousPoint.value);
        
        if (currentZone !== previousZone) {
            const shiftKey = `${previousZone}_${currentZone}`;
            const lastShownShift = localStorage.getItem("ec_last_regime_shift");
            if (lastShownShift !== shiftKey) {
                setRegimeShift({ previous: previousZone, current: currentZone });
                localStorage.setItem("ec_last_regime_shift", shiftKey);
            }
        } else {
             setRegimeShift(null); // Clear if no shift
        }
    }, [vixState, chartData]);

    const handleDismissRegimeShift = () => {
        setRegimeShift(null);
    };

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
    
    const { value: currentVix, zoneLabel: currentZone, updatedAt, components, series } = vixState;
    const posture = postureSuggestions[currentZone] || postureSuggestions.Normal;

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
        if (value > 55) return "text-orange-500";
        if (value > 40) return "text-yellow-500";
        return "text-green-500";
    }

    const newsSentiment = components.newsSentiment > 60 ? "Greed" : components.newsSentiment < 40 ? "Fear" : "Neutral";
    const newsSentimentColor = newsSentiment === "Fear" ? "text-red-500" : newsSentiment === "Greed" ? "text-green-500" : "text-yellow-500";
    
    const chartKey = timeRange === '24H' ? 'hour' : 'day';

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
                             <div className="flex flex-col items-center justify-center">
                                <VixGauge value={currentVix} zone={currentZone} />
                                <div className="text-center mt-4">
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <p className="text-xs text-muted-foreground italic flex items-center gap-1.5 cursor-help">
                                                    <Bot className="h-3 w-3" />
                                                    Arjun uses Crypto VIX to adjust coaching strictness and risk recommendations.
                                                </p>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>This is a proprietary EdgeCipher volatility score (not stock market VIX).</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                           <Card className="bg-muted/50 border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Suggested Posture: {posture.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground">Arjun recommends these adjustments based on current conditions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {posture.actions.map((action, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">{action}</Badge>
                                        ))}
                                    </div>
                                    <div className="pt-2">
                                        <Button variant="link" size="sm" className="p-0 h-auto text-primary/90" onClick={askArjun}>
                                            Discuss this with Arjun <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                           </Card>
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
                    
                    {regimeShift && (
                        <RegimeShiftBanner 
                            previous={regimeShift.previous} 
                            current={regimeShift.current} 
                            onDismiss={handleDismissRegimeShift} 
                        />
                    )}

                     <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                             <div className="flex items-center justify-between">
                                <CardTitle>{timeRange === '24H' ? '24-Hour' : '7-Day'} Volatility Trend</CardTitle>
                                <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                                    <Button
                                        size="sm"
                                        variant={timeRange === '24H' ? 'secondary' : 'ghost'}
                                        onClick={() => setTimeRange('24H')}
                                        className="rounded-full h-8 px-3 text-xs"
                                    >
                                        24H
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={timeRange === '7D' ? 'secondary' : 'ghost'}
                                        onClick={() => setTimeRange('7D')}
                                        className="rounded-full h-8 px-3 text-xs"
                                    >
                                        7D
                                    </Button>
                                </div>
                            </div>
                            <CardDescription>How today's volatility compares to the recent past.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ChartContainer config={{value: {color: "hsl(var(--primary))"}}} className="h-64 w-full">
                                <ResponsiveContainer>
                                    <ComposedChart data={chartData}>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50"/>
                                        <XAxis dataKey={chartKey} tick={{fontSize: 12}} />
                                        <YAxis domain={[0, 100]} tick={{fontSize: 12}}/>
                                        <ChartTooltip content={<ChartTooltipContent indicator="line" formatter={(value, name, props) => {
                                            if (props.payload.spike === 'up') return "Volatility Spike"
                                            if (props.payload.spike === 'down') return "Volatility Cooldown"
                                            return `${value}`
                                        }} />} />
                                        <ReferenceLine y={20} stroke="hsl(var(--chart-2))" strokeOpacity={0.5} strokeDasharray="3 3" />
                                        <ReferenceLine y={40} stroke="hsl(var(--chart-2))" strokeOpacity={0.5} strokeDasharray="3 3" />
                                        <ReferenceLine y={60} stroke="hsl(var(--chart-4))" strokeOpacity={0.5} strokeDasharray="3 3" />
                                        <ReferenceLine y={80} stroke="hsl(var(--chart-5))" strokeOpacity={0.5} strokeDasharray="3 3" />
                                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="VIX" />
                                         {chartData.map((point, index) => {
                                            if (point.spike) {
                                                return (
                                                    <ReferenceDot
                                                        key={index}
                                                        x={point[chartKey as keyof typeof point]}
                                                        y={point.value}
                                                        r={5}
                                                        fill={point.spike === 'up' ? "hsl(var(--chart-5))" : "hsl(var(--chart-2))"}
                                                        stroke="hsl(var(--background))"
                                                        strokeWidth={2}
                                                        isFront={true}
                                                    />
                                                );
                                            }
                                            return null;
                                        })}
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex flex-col items-start gap-4">
                           <p className="text-xs text-muted-foreground">This chart shows the daily closing VIX value over the past {timeRange === '7D' ? '7 days' : '24 hours'}.</p>
                           {timeRange === '24H' && <HeatStrip data={series.series24h} />}
                        </CardFooter>
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
