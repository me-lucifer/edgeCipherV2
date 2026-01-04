

      "use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Bot, LineChart, Gauge, TrendingUp, TrendingDown, Info, AlertTriangle, SlidersHorizontal, Flame, Droplets, Newspaper, Sparkles, ArrowRight, X, BarChartHorizontal, Timer, Calendar, ChevronRight } from "lucide-react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";


interface CryptoVixModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const zoneData: { zone: VixZone, range: string, color: string, impact: string, recommendation: string, behavior: string, actions: string[] }[] = [
    { zone: "Extremely Calm", range: "0-20", color: "bg-green-500", impact: "Low volatility, may lead to choppy price action.", recommendation: "Range-trading strategies may excel.", behavior: "Price action is often choppy and lacks clear direction. Breakouts tend to fail.", actions: ["Consider range-trading strategies.", "Be patient and wait for clear, high-probability setups."] },
    { zone: "Normal", range: "21-40", color: "bg-green-500", impact: "Standard market conditions, good for most strategies.", recommendation: "Follow your plan.", behavior: "Healthy trends can form. Pullbacks are generally reliable.", actions: ["Execute your standard trading plan.", "No special risk adjustments are typically needed."] },
    { zone: "Volatile", range: "41-60", color: "bg-yellow-500", impact: "Increased chop, risk of stop-hunts.", recommendation: "Consider reducing size.", behavior: "Moves are faster and more erratic. Wicks get larger, increasing the risk of being stopped out.", actions: ["Consider reducing position size by 25-50%.", "Widen stop-losses slightly to account for noise."] },
    { zone: "High Volatility", range: "61-80", color: "bg-orange-500", impact: "High risk of erratic moves and liquidations.", recommendation: "Defense-first. Minimum size.", behavior: "High risk of cascading liquidations and violent price swings in both directions.", actions: ["Drastically reduce size or avoid trading.", "Focus on capital preservation, not profit-making."] },
    { zone: "Extreme", range: "81-100", color: "bg-red-500", impact: "Dangerously unpredictable, 'black swan' risk.", recommendation: "Avoid taking new positions.", behavior: "Market is in a state of panic or euphoria. Rational analysis often fails.", actions: ["Strongly consider not trading at all.", "If you must trade, use minimal size and extremely wide stops."] },
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

function DriverTrendChart({ data, name, color }: { data: any[]; name: string; color: string; }) {
    return (
      <div className="flex items-center gap-4">
        <div className="w-32">
          <h4 className="font-semibold text-foreground text-sm">{name}</h4>
        </div>
        <div className="h-10 flex-1">
          <ChartContainer config={{ value: { color } }} className="h-full w-full">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    );
}

function getVixZoneFromValue(value: number): VixZone {
    if (value <= 20) return "Extremely Calm";
    if (value <= 40) return "Normal";
    if (value <= 60) return "Volatile";
    if (value <= 80) return "High Volatility";
    return "Extreme";
}

function KeyEventsTimeline({ chartData }: { chartData: { hour: string; day: string; value: number; spike: string | null }[] }) {
    const events = useMemo(() => {
        const generatedEvents: { time: Date, description: string, severity: 'High' | 'Medium' | 'Low' }[] = [];
        let largestSpike = { value: 0, time: new Date() };

        for (let i = 1; i < chartData.length; i++) {
            const prev = chartData[i - 1];
            const current = chartData[i];
            const prevZone = getVixZoneFromValue(prev.value);
            const currentZone = getVixZoneFromValue(current.value);

            const now = new Date();
            const time = i === chartData.length - 1 ? now : new Date(now.getTime() - (chartData.length - 1 - i) * 4 * 60 * 60 * 1000);

            if (prevZone !== currentZone) {
                generatedEvents.push({
                    time,
                    description: `VIX crossed into '${currentZone}' zone.`,
                    severity: (currentZone === 'Extreme' || currentZone === 'High Volatility') ? 'High' : 'Medium'
                });
            }

            if (current.spike === 'up') {
                const diff = current.value - chartData[i - 2].value;
                if (diff > largestSpike.value) {
                    largestSpike = { value: diff, time: time };
                }
            }
        }

        if (largestSpike.value > 0) {
            generatedEvents.push({
                time: largestSpike.time,
                description: `Largest volatility spike: +${largestSpike.value.toFixed(0)} points.`,
                severity: 'High'
            });
        }
        
        return generatedEvents.sort((a,b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

    }, [chartData]);
    
    if (events.length === 0) return null;

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Key Volatility Events (24H)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {events.map((event, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                                <div className={cn("mt-1 w-3 h-3 rounded-full",
                                    event.severity === 'High' && 'bg-red-500',
                                    event.severity === 'Medium' && 'bg-amber-500',
                                    event.severity === 'Low' && 'bg-blue-500'
                                )} />
                                {index < events.length - 1 && <div className="w-px h-12 bg-border mt-2" />}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(event.time, { addSuffix: true })}</p>
                                <p className="font-medium text-foreground text-sm">{event.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
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
        
        const currentZone = getVixZoneFromValue(currentPoint.value);
        const previousZone = getVixZoneFromValue(previousPoint.value);
        
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

     const driverTrendData = useMemo(() => {
        if (!vixState) return null;
        const series = timeRange === '24H' ? vixState.series.series24h : vixState.series.series7d;
        
        const generateDriverSeries = (factor: number, noise: number) => {
            return series.map(d => ({ ...d, value: Math.max(0, Math.min(100, (d.value * factor) + (Math.random() - 0.5) * noise)) }));
        };

        return {
            btcVol: generateDriverSeries(0.8, 10),
            ethVol: generateDriverSeries(0.9, 15),
            fundingPressure: generateDriverSeries(0.5, 20),
            liquidationSpike: generateDriverSeries(0.3, 30).map(d => d.value > 70 ? d.value : d.value / 2),
        };

    }, [vixState, timeRange]);
    
    const { series24h, series7d } = vixState?.series || { series24h: [], series7d: [] };
    const avg24h = series24h.length > 0 ? series24h.reduce((acc, p) => acc + p.value, 0) / series24h.length : 0;
    const avg7d = series7d.length > 0 ? series7d.reduce((acc, p) => acc + p.value, 0) / series7d.length : 0;
    const high24h = Math.max(...series24h.map(p => p.value));
    const low24h = Math.min(...series24h.map(p => p.value));

    const SummaryRow = ({ label, value, valueClass }: { label: string, value: React.ReactNode, valueClass?: string }) => (
        <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">{label}</p>
            <p className={cn("font-mono font-semibold text-foreground", valueClass)}>{value}</p>
        </div>
    );

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
                            <div className="space-y-4">
                                <Card className="bg-muted/50 border-border/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><Timer className="h-4 w-4" /> Current vs. Averages</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <SummaryRow label="Current VIX" value={currentVix.toFixed(1)} valueClass={currentVix > avg24h ? 'text-amber-400' : 'text-green-400'} />
                                        <SummaryRow label="24H Average" value={avg24h.toFixed(1)} />
                                        <SummaryRow label="7D Average" value={avg7d.toFixed(1)} />
                                        <SummaryRow label="24H Range" value={`${low24h.toFixed(1)} – ${high24h.toFixed(1)}`} />
                                    </CardContent>
                                </Card>
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
                            </div>
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
                        <CardFooter className="flex-col items-start gap-4">
                           <p className="text-xs text-muted-foreground">This chart shows the VIX value over the past {timeRange === '7D' ? '7 days' : '24 hours'}.</p>
                           {timeRange === '24H' && <HeatStrip data={vixState.series.series24h} />}
                        </CardFooter>
                    </Card>

                    <KeyEventsTimeline chartData={chartData} />

                    {driverTrendData && (
                        <Card className="bg-muted/30 border-border/50">
                            <CardHeader>
                                <CardTitle>Driver Trends (Prototype)</CardTitle>
                                <CardDescription>How each component of the VIX has behaved over the period.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <DriverTrendChart data={driverTrendData.btcVol} name="BTC Volatility" color="hsl(var(--chart-1))" />
                                <DriverTrendChart data={driverTrendData.ethVol} name="ETH Volatility" color="hsl(var(--chart-2))" />
                                <DriverTrendChart data={driverTrendData.fundingPressure} name="Funding Pressure" color="hsl(var(--chart-3))" />
                                <DriverTrendChart data={driverTrendData.liquidationSpike} name="Liquidation Spikes" color="hsl(var(--chart-5))" />
                            </CardContent>
                        </Card>
                    )}
                </div>
                
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-8 sticky top-24">
                    <VixSimulationControls vixState={vixState} updateVixValue={updateVixValue} />
                    <Card className="bg-muted/30 border-border/50">
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>How to Interpret Crypto VIX</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {zoneData.map(d => (
                                    <AccordionItem value={d.zone} key={d.zone}>
                                        <AccordionTrigger>
                                            <span className="flex items-center gap-3">
                                                <div className={cn("w-3 h-3 rounded-full", d.color)} />
                                                <span className="font-semibold">{d.zone} ({d.range})</span>
                                            </span>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-3 pt-2">
                                            <p className="text-sm text-muted-foreground italic">"{d.behavior}"</p>
                                            <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground">
                                                {d.actions.map((action, i) => <li key={i}>{action}</li>)}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
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
