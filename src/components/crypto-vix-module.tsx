

      "use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Bot, LineChart, Gauge, TrendingUp, TrendingDown, Info, AlertTriangle, SlidersHorizontal, Flame, Droplets, Newspaper, Sparkles, ArrowRight, X, BarChartHorizontal, Timer, Calendar, ChevronRight, User, BookOpen, BarChart } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";


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

type PersonaType = "Impulsive Sprinter" | "Fearful Analyst" | "Disciplined Scalper" | "Beginner";
type VixAction = {
    label: string;
    module?: string;
    context?: any;
}
type VixAdvice = { title: string; rule: string; actions: VixAction[] };

const postureSuggestions: Record<VixZone, Record<PersonaType, VixAdvice>> = {
    "Extremely Calm": {
        "Impulsive Sprinter": { title: "Patience is key", rule: "Wait for A+ setups; avoid forcing trades in chop.", actions: [{label: "Stick to high-probability setups"}, {label: "Respect range boundaries"}, {label: "Use this quiet time for journal review", module: "tradeJournal"}] },
        "Fearful Analyst": { title: "Observe and Plan", rule: "Use this low-stress time to plan future trades without pressure.", actions: [{label: "Build confidence by paper trading setups"}, {label: "Identify clear range levels", module: "chart"}, {label: "Plan entries/exits without emotional pressure", module: 'tradePlanning'}] },
        "Disciplined Scalper": { title: "Execute your plan", rule: "Your range-bound strategies may perform well now.", actions: [{label: "Focus on clear S/R flips"}, {label: "Take profits at defined levels"}, {label: "Monitor for signs of increasing volatility"}] },
        "Beginner": { title: "Learn the field", rule: "This is the best time to study market structure without high risk.", actions: [{label: "Practice identifying support and resistance", module: "chart"}, {label: "Observe how price reacts at key levels"}, {label: "Formulate a simple trade plan without executing", module: "tradePlanning"}] },
    },
    "Normal": {
        "Impulsive Sprinter": { title: "Follow the rules", rule: "Your biggest risk now is breaking your plan. Stick to it.", actions: [{label: "One trade at a time; no adding to losers"}, {label: "Respect your stop-loss, no exceptions"}, {label: "Complete journal before your next trade", module: "tradeJournal"}] },
        "Fearful Analyst": { title: "Trust your analysis", rule: "Conditions are favorable for well-planned trades. Execute your plan.", actions: [{label: "Trust the analysis you did in calmer times"}, {label: "Use a pre-flight checklist before entering"}, {label: "Start with a smaller-than-normal position size"}] },
        "Disciplined Scalper": { title: "Your prime time", rule: "Good conditions for your strategy. Execute with discipline.", actions: [{label: "Execute your A+ setups without hesitation"}, {label: "Adhere strictly to your profit-taking rules"}, {label: "Monitor for signs of increasing volatility"}] },
        "Beginner": { title: "Practice execution", rule: "Execute your plan with a very small, controlled position size.", actions: [{label: "Focus on one or two simple setups"}, {label: "Practice setting entry, stop, and profit orders", module: "tradePlanning"}, {label: "Journal every action and emotion immediately", module: "tradeJournal"}] },
    },
    "Volatile": {
        "Impulsive Sprinter": { title: "DEFENSE FIRST", rule: "Your #1 risk is overtrading & revenge. HALVE your size.", actions: [{label: "Cut position size by 50%", module: 'tradePlanning', context: { safeMode: true } }, {label: "Wait for crystal-clear A+ setups"}, {label: "Set a hard stop on number of trades for the day", module: 'riskCenter'}] },
        "Fearful Analyst": { title: "Sit out or size down", rule: "Analysis is difficult in chop. It's okay to wait.", actions: [{label: "If unsure, the best trade is no trade"}, {label: "Drastically reduce size if you see a perfect setup"}, {label: "Watch price action without the pressure to participate", module: 'chart'}] },
        "Disciplined Scalper": { title: "Extreme caution", rule: "Your strategy is high-risk now. Adapt or wait.", actions: [{label: "Widen stops slightly to avoid getting wicked out"}, {label: "Reduce position size significantly", module: 'tradePlanning', context: { safeMode: true } }, {label: "Focus only on setups with very clear invalidation"}] },
        "Beginner": { title: "Observe, don't trade", rule: "This is the worst environment for learning. Watch, don't touch.", actions: [{label: "Watch how price interacts with key levels without trading", module: 'chart'}, {label: "Notice how quickly moves can reverse"}, {label: "See this as a live lesson in risk management"}] },
    },
    "High Volatility": {
        "Impulsive Sprinter": { title: "STOP. HANDS OFF.", rule: "Do not trade. You are at maximum risk of blowing up.", actions: [{label: "Close the charts for a few hours"}, {label: "Read your trading plan instead of watching candles", module: 'strategyManagement'}, {label: "A flat day is a winning day in these conditions"}] },
        "Fearful Analyst": { title: "Stay flat", rule: "Analysis is unreliable now. Protect your capital and mindset.", actions: [{label: "Do not feel pressure to trade; pros are waiting too"}, {label: "This is a good time for high-level market review", module: 'analytics'}, {label: "Study how 'black swan' events unfold"}] },
        "Disciplined Scalper": { title: "Cash is a position", rule: "Your edge is gone. Wait for the market to normalize.", actions: [{label: "Preserve capital; your opportunity will come later"}, {label: "Avoid the temptation to catch falling knives"}, {label: "Review your rules for high-volatility environments", module: 'strategyManagement'}] },
        "Beginner": { title: "DO NOT TRADE", rule: "This is how beginners lose their accounts. Your only job is to watch.", actions: [{label: "Observe the chaos from the sidelines"}, {label: "Understand that you cannot predict these moves"}, {label: "Learn that sometimes the best action is no action"}] },
    },
    "Extreme": {
        "Impulsive Sprinter": { title: "STOP. WALK AWAY.", rule: "You are in extreme danger of catastrophic loss.", actions: [{label: "Seriously, close your trading platform"}, {label: "Go for a walk. Do not look at the charts."}, {label: "Protecting your capital is the only trade that matters"}] },
        "Fearful Analyst": { title: "Stay flat. Full stop.", rule: "The market is irrational. Your analysis does not apply.", actions: [{label: "Confirm all open positions are closed or protected"}, {label: "Read a book on trading psychology"}, {label: "This is a spectator sport right now"}] },
        "Disciplined Scalper": { title: "No edge here", rule: "Market is liquidating. There is no edge to be found.", actions: [{label: "Stay flat and protect your capital"}, {label: "Wait for volatility to return to normal levels"}, {label: "This is a day for risk managers, not traders"}] },
        "Beginner": { title: "DO NOT TRADE. DANGER.", rule: "This is a 'black swan' event. Do not participate.", actions: [{label: "Watch from a distance to learn"}, {label: "Understand that this is not a trading environment"}, {label: "The goal is to survive to trade another day"}] },
    }
};

const regimeShiftInfo: Record<string, { meaning: string, action: string }> = {
    "Normal_Volatile": { meaning: "Market chop is increasing.", action: "Consider reducing leverage." },
    "Volatile_High Volatility": { meaning: "Risk of erratic moves is now high.", action: "Switch to defense-first mindset." },
    "High Volatility_Extreme": { meaning: "Dangerous conditions detected.", action: "Avoid taking new positions." },
    "Extreme_High Volatility": { meaning: "Volatility is decreasing but still very high.", action: "Wait for further confirmation before trading." },
    "High Volatility_Volatile": { meaning: "Conditions are improving but still risky.", action: "Can consider A+ setups with small size." },
    "Volatile_Normal": { meaning: "The market is calming down.", action: "Can slowly return to normal sizing." },
};


function VixSimulationControls({ vixState, updateVixValue, generateChoppyDay }: { vixState: VixState, updateVixValue: (value: number) => void, generateChoppyDay: () => void }) {
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
                <div className="pt-2">
                    <Button variant="outline" className="w-full" onClick={generateChoppyDay}>
                        <Flame className="mr-2 h-4 w-4" />
                        Generate Choppy Day
                    </Button>
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

function KeyEventsTimeline({ chartData, onSetModule }: { chartData: { hour: string; day: string; value: number; spike: string | null }[], onSetModule: (module: any, context?: any) => void }) {
    const events = useMemo(() => {
        const generatedEvents: { time: Date; description: string; severity: 'High' | 'Medium' | 'Low', action?: { label: string, module: string, context?: any } }[] = [];
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
                    severity: (currentZone === 'Extreme' || currentZone === 'High Volatility') ? 'High' : 'Medium',
                    action: { label: 'Open Risk Center', module: 'riskCenter' }
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
                severity: 'High',
                action: { label: 'Open Analytics', module: 'analytics' }
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
                                {index < events.length - 1 && <div className="w-px h-16 bg-border mt-2" />}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(event.time, { addSuffix: true })}</p>
                                <p className="font-medium text-foreground text-sm">{event.description}</p>
                                {event.action && (
                                    <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => onSetModule(event.action!.module, event.action!.context)}>
                                        {event.action.label} <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function CryptoVixModule({ onSetModule }: CryptoVixModuleProps) {
    const { vixState, isLoading, updateVixValue, generateChoppyDay } = useVixState();
    const [timeRange, setTimeRange] = useState<'24H' | '7D'>('24H');
    const [regimeShift, setRegimeShift] = useState<{ previous: VixZone, current: VixZone } | null>(null);
    const [persona, setPersona] = useState<PersonaType | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedPersona = localStorage.getItem("ec_prototype_persona") || (localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base"));
            if (storedPersona) {
                try {
                    const parsed = JSON.parse(storedPersona);
                    setPersona(parsed.primaryPersonaName || 'Beginner');
                } catch {
                     setPersona(storedPersona as PersonaType);
                }
            } else {
                setPersona('Beginner');
            }
        }
    }, []);

    const handlePersonaChange = (newPersona: PersonaType) => {
        setPersona(newPersona);
        if (typeof window !== "undefined") {
            localStorage.setItem("ec_prototype_persona", newPersona);
        }
    };

    const askArjun = () => {
        if (!vixState) return;
        const currentPosture = persona ? postureSuggestions[vixState.zoneLabel]?.[persona] : null;
        const prompt = currentPosture
            ? `Arjun, volatility is ${vixState.zoneLabel}. You've suggested my rule for today is: "${currentPosture.rule}". Can we break that down further for my ${persona} persona?`
            : `How should I adapt my trading to the current volatility of ${vixState.value} (${vixState.zoneLabel})?`;
        onSetModule('aiCoaching', { initialMessage: prompt });
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
    const high24h = series24h.length > 0 ? Math.max(...series24h.map(p => p.value)) : 0;
    const low24h = series24h.length > 0 ? Math.min(...series24h.map(p => p.value)) : 0;

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
    const posture = persona ? postureSuggestions[currentZone]?.[persona] : null;
    const isStrictMode = currentVix >= 61;
    const isExtremeZone = currentZone === 'Extreme';
        
    const chartKey = timeRange === '24H' ? 'hour' : 'day';

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Crypto Volatility Index (VIX)</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                    A proprietary 0–100 score for crypto futures market conditions.
                </p>
            </div>
            
             {isExtremeZone ? (
                <Card className="bg-red-950/80 border-2 border-red-500/50 text-center py-12">
                    <CardHeader>
                        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto" />
                        <CardTitle className="text-4xl text-red-300 mt-4">Extreme Volatility: Do Not Trade</CardTitle>
                        <CardDescription className="text-red-300/80 text-base">
                            Market conditions are dangerously unpredictable. Arjun's analysis is now focused on capital protection, not profit generation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-6">
                        <h4 className="font-semibold text-foreground mb-4">Recommended Actions:</h4>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20" onClick={() => onSetModule('tradeJournal')}>
                                <BookOpen className="mr-2 h-4 w-4" /> Open Journal
                            </Button>
                             <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20" onClick={() => onSetModule('analytics')}>
                                <BarChart className="mr-2 h-4 w-4" /> Review Analytics
                            </Button>
                            <Button variant="ghost" className="text-muted-foreground" onClick={() => onSetModule('tradePlanning')}>
                                Plan for later (read-only)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {regimeShift && (
                            <RegimeShiftBanner 
                                previous={regimeShift.previous} 
                                current={regimeShift.current} 
                                onDismiss={handleDismissRegimeShift} 
                            />
                        )}
                        {isStrictMode && (
                             <Alert variant="destructive" className="bg-red-950/70 border-red-500/30 text-red-300">
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                                <AlertTitle className="text-red-400">
                                    Arjun is in Strict Mode
                                </AlertTitle>
                                <AlertDescription>
                                    Higher volatility → stricter risk and discipline enforcement.
                                </AlertDescription>
                            </Alert>
                        )}
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
                                   <Card className="bg-primary/10 border-primary/20">
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Sparkles className="h-5 w-5 text-primary" /> 
                                                Suggested Posture
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>In high VIX, Arjun prioritizes capital protection over growth.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </CardTitle>
                                             {!persona && (
                                                <CardDescription className="text-xs">Select a persona to get personalized advice.</CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {!persona ? (
                                                <Select onValueChange={(value) => handlePersonaChange(value as PersonaType)}>
                                                    <SelectTrigger className="w-[220px]">
                                                        <SelectValue placeholder="Select Persona (Prototype)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Impulsive Sprinter">Impulsive Sprinter</SelectItem>
                                                        <SelectItem value="Fearful Analyst">Fearful Analyst</SelectItem>
                                                        <SelectItem value="Disciplined Scalper">Disciplined Scalper</SelectItem>
                                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : posture ? (
                                                <>
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold text-primary">{posture.title}</p>
                                                        <Select value={persona} onValueChange={(value) => handlePersonaChange(value as PersonaType)}>
                                                            <SelectTrigger className="w-[180px] h-8 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Impulsive Sprinter">Impulsive Sprinter</SelectItem>
                                                                <SelectItem value="Fearful Analyst">Fearful Analyst</SelectItem>
                                                                <SelectItem value="Disciplined Scalper">Disciplined Scalper</SelectItem>
                                                                <SelectItem value="Beginner">Beginner</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <p className="text-sm text-primary/90 italic"><strong>Rule for today:</strong> "{posture.rule}"</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {posture.actions.map((action, i) => (
                                                            <Button key={i} variant="outline" size="sm" className="text-xs h-7" onClick={() => action.module && onSetModule(action.module, action.context)}>
                                                                {action.label}
                                                                {action.module && <ArrowRight className="ml-2 h-3 w-3" />}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                    <div className="pt-2">
                                                        <Button variant="link" size="sm" className="p-0 h-auto text-primary/90" onClick={askArjun}>
                                                            Discuss this with Arjun <ArrowRight className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : <p className="text-sm text-muted-foreground">Could not load suggestions.</p>}
                                        </CardContent>
                                   </Card>
                                </div>
                            </CardContent>
                        </Card>

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
                                                if (props.payload.spike === 'up') return <span className='font-semibold'>Volatility Spike</span>
                                                if (props.payload.spike === 'down') return <span className='font-semibold'>Volatility Cooldown</span>
                                                return <span className='font-mono'>{Number(value).toFixed(1)}</span>
                                            }} />} />
                                            <ReferenceLine y={20} stroke="hsl(var(--chart-2))" strokeOpacity={0.3} strokeDasharray="3 3" />
                                            <ReferenceLine y={40} stroke="hsl(var(--chart-2))" strokeOpacity={0.3} strokeDasharray="3 3" />
                                            <ReferenceLine y={60} stroke="hsl(var(--chart-4))" strokeOpacity={0.3} strokeDasharray="3 3" />
                                            <ReferenceLine y={80} stroke="hsl(var(--chart-5))" strokeOpacity={0.3} strokeDasharray="3 3" />
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

                        <KeyEventsTimeline chartData={chartData} onSetModule={onSetModule} />

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
                        <VixSimulationControls vixState={vixState} updateVixValue={updateVixValue} generateChoppyDay={generateChoppyDay} />
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
            )}
        </div>
    );
}

const VixGauge = ({ value, zone }: { value: number, zone: string }) => {
    const fromColor = 
        zone === 'Extremely Calm' || zone === 'Normal' ? 'hsl(var(--chart-2))' :
        zone === 'Volatile' ? 'hsl(var(--chart-4))' :
        zone === 'High Volatility' ? 'hsl(var(--chart-1))' :
        'hsl(var(--chart-5))';

    const conicGradient = `conic-gradient(${fromColor} 0deg, ${fromColor} calc(${value} / 100 * 180deg), hsl(var(--muted)) calc(${value} / 100 * 180deg), hsl(var(--muted)) 180deg)`;

    return (
        <div
            className="relative flex items-end justify-center w-full h-32 rounded-t-full overflow-hidden"
            style={{ background: conicGradient }}
        >
            <div className="absolute w-[85%] h-[85%] bg-muted/80 backdrop-blur-sm rounded-t-full top-auto bottom-0" />
            <div className="relative flex flex-col items-center justify-center z-10 pb-4">
                <p className="text-5xl font-bold font-mono text-foreground">{Math.round(value)}</p>
                <p className={cn("font-semibold text-lg",
                    (zone === 'Extremely Calm' || zone === 'Normal') && 'text-green-400',
                    zone === 'Volatile' && 'text-yellow-400',
                    zone === 'High Volatility' && 'text-orange-400',
                    zone === 'Extreme' && 'text-red-400'
                )}>{zone}</p>
            </div>
        </div>
    );
};
