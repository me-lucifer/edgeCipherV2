

      "use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Bot, LineChart, Gauge, TrendingUp, TrendingDown, Info, AlertTriangle, SlidersHorizontal, Flame, Droplets, Newspaper, Sparkles, ArrowRight, X, BarChartHorizontal, Timer, Calendar, ChevronRight, User, BookOpen, BarChart as BarChartIcon, Scale, PlayCircle, LayoutDashboard, FileText, ShieldAlert, Check, ShieldCheck } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CryptoVixModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const zoneData: { zone: VixZone, range: string, color: string, behavior: string[], actions: { sl: string, size: string, leverage: string}, commonMistake: string }[] = [
    { 
        zone: "Extremely Calm", 
        range: "0-20", 
        color: "border-green-500/30", 
        behavior: ["Choppy, low-volume price action.", "Breakouts are less likely to follow through."], 
        actions: { sl: "Standard", size: "Standard", leverage: "Standard" },
        commonMistake: "Forcing trades out of boredom, leading to overtrading in a poor environment."
    },
    { 
        zone: "Normal", 
        range: "21-40", 
        color: "border-green-500/30", 
        behavior: ["Healthy trends can form.", "Pullbacks are generally reliable."], 
        actions: { sl: "Standard", size: "Standard", leverage: "Standard" },
        commonMistake: "Deviating from the plan due to overconfidence or minor drawdown."
    },
    { 
        zone: "Volatile", 
        range: "41-60", 
        color: "border-yellow-500/30", 
        behavior: ["Moves are faster and more erratic.", "Increased risk of stop-hunts due to larger wicks."], 
        actions: { sl: "Widen slightly (1.25x)", size: "Reduce (25-50%)", leverage: "Reduce (≤ 20x)" },
        commonMistake: "Failing to reduce size, leading to larger-than-expected losses on normal-looking setups."
    },
    { 
        zone: "High Volatility", 
        range: "61-80", 
        color: "border-orange-500/30", 
        behavior: ["High risk of cascading liquidations.", "Violent price swings in both directions are common."], 
        actions: { sl: "Significantly wider or use volatility stops", size: "Minimal (75%+ reduction)", leverage: "Minimal (≤ 10x)" },
        commonMistake: "Trying to 'catch a falling knife' or predict a bottom/top. The pros are waiting."
    },
    { 
        zone: "Extreme", 
        range: "81-100", 
        color: "border-red-500/30", 
        behavior: ["Market is in a state of panic or euphoria.", "Rational analysis often fails; moves are liquidation-driven."], 
        actions: { sl: "No new positions", size: "No new positions", leverage: "No new positions" },
        commonMistake: "Participating at all. The only goal here is capital preservation."
    },
];

type PersonaType = "Impulsive Sprinter" | "Fearful Analyst" | "Disciplined Scalper" | "Beginner";
type VixAction = {
    label: string;
    module?: string;
    context?: any;
}
type VixAdvice = { interpretation: string; rule: string; actions: VixAction[] };

const postureSuggestions: Record<VixZone, Record<PersonaType, VixAdvice>> = {
    "Extremely Calm": {
        "Impulsive Sprinter": { interpretation: "Calm markets can feel slow, which may trigger your impulse to force trades. Patience is your primary edge today. Avoid chasing small moves and wait for your A+ setup. The goal is to avoid unforced errors and preserve mental capital for when real opportunities arise.", rule: "Do not invent setups; wait for the market to present a clear opportunity.", actions: [{label: "Stick to high-probability setups"}, {label: "Respect range boundaries"}, {label: "Use this quiet time for journal review", module: "tradeJournal"}] },
        "Fearful Analyst": { interpretation: "These low-stress conditions are perfect for building confidence. Use this time to observe and plan without pressure. The goal is to build conviction in your analysis before you risk capital. Practice identifying key levels and formulating trade ideas without the fear of immediate execution.", rule: "Focus on planning and analysis, not forced execution.", actions: [{label: "Build confidence by paper trading setups"}, {label: "Identify clear range levels", module: "chart"}, {label: "Plan entries/exits without emotional pressure", module: 'tradePlanning'}] },
        "Disciplined Scalper": { interpretation: "Range-bound strategies often perform well in these conditions. Your discipline is key to avoid over-leveraging on small moves. Trust your system and execute your plan, but be quick to cut trades that don't show immediate follow-through. Chop can erode small gains quickly.", rule: "Execute your plan, but protect your capital from choppy price action.", actions: [{label: "Focus on clear S/R flips"}, {label: "Take profits at defined levels"}, {label: "Monitor for signs of increasing volatility"}] },
        "Beginner": { interpretation: "This is the ideal environment to study market structure without the high risk of volatile swings. Watch how price reacts at key levels and practice formulating plans without executing. Your main goal today is to observe and learn, not to trade. The knowledge gained now will be invaluable in more active markets.", rule: "Today is for learning and observation, not for aggressive trading.", actions: [{label: "Practice identifying support and resistance", module: "chart"}, {label: "Observe how price reacts at key levels"}, {label: "Formulate a simple trade plan without executing", module: "tradePlanning"}] },
    },
    "Normal": {
        "Impulsive Sprinter": { interpretation: "Normal conditions can still trigger impatience. Your biggest risk is deviating from your plan. The goal is consistent execution, not hitting a home run. Stick to your rules, respect your stops, and ensure each trade is journaled before considering the next. This builds the habit of discipline.", rule: "Follow your plan without exception; no adding to losers or revenge trading.", actions: [{label: "One trade at a time"}, {label: "Respect your stop-loss, no exceptions"}, {label: "Complete journal before your next trade", module: "tradeJournal"}] },
        "Fearful Analyst": { interpretation: "The market is providing good conditions for well-planned trades. Your analysis is likely sound; now is the time to trust it. Hesitation can be as costly as a bad entry. Execute your plan with the confidence that you've done the prep work. Start with a smaller size if needed to overcome the initial fear.", rule: "Trust your analysis and execute your A+ setups with confidence.", actions: [{label: "Trust the analysis you did in calmer times"}, {label: "Use a pre-flight checklist before entering"}, {label: "Start with a smaller-than-normal position size"}] },
        "Disciplined Scalper": { interpretation: "These are your prime conditions. The market has direction but isn't overly chaotic. Your edge is sharpest now. Focus on disciplined execution of your best setups. Don't get complacent; stick to your profit-taking rules and monitor for any signs of a shift in market volatility that could invalidate your approach.", rule: "Execute your A+ setups without hesitation and adhere to your rules.", actions: [{label: "Execute A+ setups cleanly"}, {label: "Adhere strictly to your profit-taking rules"}, {label: "Monitor for signs of increasing volatility"}] },
        "Beginner": { interpretation: "This is a good environment to practice. Focus on executing one or two simple setups with very small, controlled position sizes. The goal is to learn the process of planning, executing, and journaling a trade from start to finish. The P&L is secondary to building good habits.", rule: "Practice disciplined execution with a minimal position size.", actions: [{label: "Focus on one or two simple setups"}, {label: "Practice setting entry, stop, and profit orders", module: "tradePlanning"}, {label: "Journal every action and emotion immediately", module: "tradeJournal"}] },
    },
    "Volatile": {
        "Impulsive Sprinter": { interpretation: "This is a danger zone for you. Volatility can feel like a constant stream of opportunities, but it's where your impulses are most costly. Your number one job is defense. Reduce your size significantly and be extremely selective. If you don't have a crystal-clear A+ setup, the best trade is no trade at all.", rule: "Your first priority is capital protection, not profit.", actions: [{label: "Cut position size by 50%", module: 'tradePlanning', context: { safeMode: true } }, {label: "Wait for crystal-clear A+ setups"}, {label: "Set a hard stop on number of trades", module: 'riskCenter'}] },
        "Fearful Analyst": { interpretation: "Analysis is difficult in choppy, volatile markets. It is perfectly acceptable to sit out and wait for clearer conditions. Don't feel pressured to trade; protecting your mental capital and avoiding bad experiences is key. A flat day is a winning day in these conditions.", rule: "If you are not 100% confident in a setup, the best trade is no trade.", actions: [{label: "If unsure, stay flat"}, {label: "Drastically reduce size if you see a perfect setup"}, {label: "Watch price action without pressure", module: 'chart'}] },
        "Disciplined Scalper": { interpretation: "Your strategy is at high risk in these conditions. Wider wicks and increased slippage can easily stop you out of otherwise good trades. You must adapt by widening stops, reducing size, or waiting for the market to normalize. Your discipline is best shown by not forcing a strategy that doesn't fit the environment.", rule: "Adapt your parameters for volatility or wait for calmer conditions.", actions: [{label: "Widen stops slightly to avoid getting wicked out"}, {label: "Reduce position size significantly", module: 'tradePlanning', context: { safeMode: true } }, {label: "Focus on setups with very clear invalidation"}] },
        "Beginner": { interpretation: "This is a 'sit on your hands' day. Watching the chaos from the sidelines is the most valuable lesson. You cannot predict these moves, and trying to will likely result in losses. This is a live demonstration of why risk management is the most important skill in trading. Observe, learn, and preserve your capital.", rule: "Observe the market, do not participate.", actions: [{label: "Watch how price interacts with key levels", module: 'chart'}, {label: "Notice how quickly moves can reverse"}, {label: "See this as a live lesson in risk management"}] },
    },
    "High Volatility": {
        "Impulsive Sprinter": { interpretation: "This is a 'red alert' for your persona. The market is erratic, and your impulse to trade is at its most dangerous. The risk of significant loss is extremely high. Trying to trade in these conditions is gambling, not trading. Protect the capital you've worked hard to build by not participating.", rule: "Your only job today is to protect your capital by not trading.", actions: [{label: "Close the charts for a few hours"}, {label: "Read your trading plan instead", module: 'strategyManagement'}, {label: "A flat day is a winning day in these conditions"}] },
        "Fearful Analyst": { interpretation: "Your analysis is unreliable in these conditions. The market is driven by liquidations and fear, not fundamentals or clean technicals. Protect your capital and your mindset by staying flat. Trying to find a perfect entry here will only lead to frustration and losses. The pros are waiting on the sidelines, and so should you.", rule: "Stay flat. Pros are waiting, and so should you.", actions: [{label: "Do not feel pressure to trade"}, {label: "This is a good time for high-level review", module: 'analytics'}, {label: "Study how 'black swan' events unfold"}] },
        "Disciplined Scalper": { interpretation: "Your edge does not exist in these market conditions. The noise is too high, and risk is not definable. Your discipline is best expressed by not participating until the market normalizes. Any trade taken now is a gamble, not an execution of a well-defined edge. Preserve your capital for when conditions favor your strategy again.", rule: "Cash is the strongest position right now. Preserve your capital.", actions: [{label: "Preserve capital; opportunity will come later"}, {label: "Avoid the temptation to catch falling knives"}, {label: "Review your rules for high-volatility", module: 'strategyManagement'}] },
        "Beginner": { interpretation: "This is the environment where new traders lose their accounts. Do not trade. Your only job is to watch from a distance and understand that the best action is no action. Survival is the only goal on days like this. This experience, viewed from the safety of the sidelines, will be more valuable than any trade you could attempt.", rule: "Do not trade. Your goal is to survive to trade another day.", actions: [{label: "Observe the chaos from the sidelines"}, {label: "Understand that you cannot predict these moves"}, {label: "Learn that sometimes the best action is no action"}] },
    },
    "Extreme": {
        "Impulsive Sprinter": { interpretation: "Catastrophic risk is present. Your account is in extreme danger if you trade. Close your platform and walk away. The only winning move is not to play. This is non-negotiable for your persona. Any attempt to trade now is a direct path to significant financial and psychological damage.", rule: "DO NOT TRADE. The only trade that matters is protecting your account.", actions: [{label: "Seriously, close your trading platform"}, {label: "Go for a walk. Do not look at the charts."}, {label: "Protecting your capital is the only goal."}] },
        "Fearful Analyst": { interpretation: "The market is completely irrational. Your analysis does not apply. Do not attempt to find a bottom or top. Confirm all positions are closed or protected and wait for sanity to return. Your fear is justified today; it is a rational response to an irrational market. Trust it and stay flat.", rule: "Stay flat. This is a spectator sport right now.", actions: [{label: "Confirm all open positions are closed or protected"}, {label: "Read a book on trading psychology"}, {label: "Wait for volatility to return to normal levels"}] },
        "Disciplined Scalper": { interpretation: "There is no edge here. The market is in a state of cascading liquidations. Any position taken is a gamble, not a trade. Your discipline requires you to stay flat and protect your capital. This is not the environment for your strategy. Acknowledging that and stepping aside is the highest form of discipline.", rule: "Stay flat. There is no trading edge in a liquidation cascade.", actions: [{label: "Stay flat and protect your capital"}, {label: "Wait for volatility to return to normal levels"}, {label: "This is a day for risk managers, not traders"}] },
        "Beginner": { interpretation: "This is a 'black swan' event. Do not participate under any circumstances. Watching this from the sidelines is one of the most valuable lessons in risk management you will ever get. This is the kind of day that ends trading careers. Your goal is to ensure it doesn't end yours before it begins.", rule: "DO NOT TRADE. DANGER.", actions: [{label: "Watch from a distance to learn"}, {label: "Understand that this is not a trading environment"}, {label: "The goal is to survive to trade another day"}] },
    }
};

const learningVideos = {
    highVol: [
        { title: "Trading in High Volatility: A Guide to Capital Protection", tag: "Risk Management", href: "#" },
        { title: "The Psychology of a Losing Streak", tag: "Psychology", href: "#" },
        { title: "Why Your Stop Loss is Your Best Friend", tag: "Discipline", href: "#" },
    ],
    lowVol: [
        { title: "How to Build a Testable Trading Strategy", tag: "Strategy", href: "#" },
        { title: "Anatomy of an A+ Setup", tag: "Execution", href: "#" },
        { title: "Journaling 101: Turning Trades into Data", tag: "Journaling", href: "#" },
    ],
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
    const [events, setEvents] = useState<{ id: string; time: Date; description: string; severity: 'High' | 'Medium' | 'Low', action?: { label: string, module: string, context?: any } }[]>([]);

    useEffect(() => {
        const regimeShiftInfo: Record<string, boolean> = {
            'Normal_Volatile': true,
            'Volatile_High Volatility': true,
            'High Volatility_Extreme': true,
            'Volatile_Normal': true,
        };

        const generatedEvents: typeof events = [];
        let largestSpike = { value: 0, time: new Date() };
        let lastShiftTime = new Date(0);

        for (let i = 1; i < chartData.length; i++) {
            const prev = chartData[i - 1];
            const current = chartData[i];
            const prevZone = getVixZoneFromValue(prev.value);
            const currentZone = getVixZoneFromValue(current.value);

            const now = new Date();
            const time = i === chartData.length - 1 ? now : new Date(now.getTime() - (chartData.length - 1 - i) * 4 * 60 * 60 * 1000);

            if (prevZone !== currentZone && time.getTime() - lastShiftTime.getTime() > 60 * 60 * 1000) {
                 const shiftKey = `${prevZone}_${currentZone}`;
                 if(regimeShiftInfo[shiftKey]) {
                    generatedEvents.push({
                        id: `shift-${i}`,
                        time,
                        description: `Regime Shift: ${prevZone} → ${currentZone}`,
                        severity: (currentZone === 'Extreme' || currentZone === 'High Volatility') ? 'High' : 'Medium',
                        action: { label: 'Open Risk Center', module: 'riskCenter' }
                    });
                    lastShiftTime = time;
                 }
            }

            if (current.spike === 'up') {
                const diff = current.value - chartData[i - 2].value;
                if (diff > largestSpike.value) {
                    largestSpike = { value: diff, time: time };
                }
            }
        }

        if (largestSpike.value > 20) {
            generatedEvents.push({
                id: `spike-${largestSpike.time.getTime()}`,
                time: largestSpike.time,
                description: `Large volatility spike: +${largestSpike.value.toFixed(0)} points.`,
                severity: 'High',
                action: { label: 'Open Analytics', module: 'analytics' }
            });
        }
        
        const seenAlerts: string[] = JSON.parse(sessionStorage.getItem('ec_vix_alerts_seen') || '[]');
        
        setEvents(generatedEvents
          .sort((a,b) => b.time.getTime() - a.time.getTime())
          .filter(event => !seenAlerts.includes(event.id))
          .slice(0, 5)
        );

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

const ParameterAdjustmentsCard = ({ zone }: { zone: VixZone }) => {
    const guidance = {
        "Extremely Calm": { sl: 'Standard', size: 'Standard', leverage: 'Standard' },
        Normal: { sl: 'Standard', size: 'Standard', leverage: 'Standard' },
        Volatile: { sl: 'Consider widening slightly', size: 'Reduce by 25-50%', leverage: '≤ 20x recommended' },
        "High Volatility": { sl: 'Significantly wider', size: 'Reduce by 50%+', leverage: '≤ 10x recommended' },
        Extreme: { sl: 'No new positions', size: 'No new positions', leverage: 'No new positions' },
    }[zone];

    const AdjustmentRow = ({ label, value, colorClass }: { label: string, value: string, colorClass: string }) => (
        <div className="flex justify-between items-center text-sm p-3 bg-muted rounded-md border">
            <p className="text-muted-foreground font-medium">{label}</p>
            <p className={cn("font-semibold text-right", colorClass)}>{value}</p>
        </div>
    );

    let color = "text-green-300";
    if (zone === "Volatile") color = "text-yellow-300";
    if (zone === "High Volatility" || zone === "Extreme") color = "text-red-300";

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="h-5 w-5" /> Parameter Adjustments
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <AdjustmentRow label="Stop Loss" value={guidance.sl} colorClass={color} />
                <AdjustmentRow label="Position Size" value={guidance.size} colorClass={color} />
                <AdjustmentRow label="Leverage" value={guidance.leverage} colorClass={color} />
            </CardContent>
        </Card>
    );
};

const PerformanceByVixZoneCard = ({ onSetModule }: { onSetModule: (module: any, context?: any) => void }) => {
    const mockPerformance = [
        { zone: "Calm", trades: 40, winRate: 65, avgRR: 1.8, mistakes: 3 },
        { zone: "Normal", trades: 70, winRate: 52, avgRR: 1.5, mistakes: 8 },
        { zone: "Volatile", trades: 20, winRate: 35, avgRR: 0.9, mistakes: 8 },
        { zone: "Extreme", trades: 3, winRate: 15, avgRR: -0.5, mistakes: 2 },
    ];

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChartIcon className="h-5 w-5" />Your Performance by VIX</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Zone</TableHead>
                            <TableHead>Win %</TableHead>
                            <TableHead>Avg. R:R</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockPerformance.map(p => (
                            <TableRow key={p.zone}>
                                <TableCell className="font-semibold">{p.zone}</TableCell>
                                <TableCell className={cn(p.winRate < 40 && 'text-red-400')}>{p.winRate}%</TableCell>
                                <TableCell className={cn('font-mono', p.avgRR < 1 && 'text-red-400', p.avgRR > 1.5 && 'text-green-400')}>{p.avgRR.toFixed(1)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button
                    variant="link"
                    className="p-0 h-auto mt-4"
                    onClick={() => onSetModule('analytics', { tab: 'by-behaviour' })}
                >
                    Open full VIX breakdown in Analytics <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
};

function LearningStrip({ zone, onVideoClick }: { zone: VixZone; onVideoClick: () => void; }) {
    const videoThumbnail = PlaceHolderImages.find(p => p.id === 'video-thumbnail');
    const videos = zone === 'High Volatility' || zone === 'Extreme' ? learningVideos.highVol : learningVideos.lowVol;
    const title = zone === 'High Volatility' || zone === 'Extreme'
        ? "Defensive Trading Resources"
        : "Strategy & Execution Resources";

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Recommended learning based on current market conditions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Carousel opts={{ align: "start" }} className="w-full">
                    <CarouselContent className="-ml-4">
                        {videos.map((video, index) => (
                            <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                <a href={video.href} onClick={(e) => { e.preventDefault(); onVideoClick(); }} className="block group">
                                    <Card className="h-full bg-muted/30 border-border/50 overflow-hidden transform-gpu transition-all hover:bg-muted/50 hover:border-primary/30 hover:-translate-y-1">
                                        <div className="relative aspect-video">
                                            {videoThumbnail && (
                                                <Image src={videoThumbnail.imageUrl} alt={video.title} fill style={{objectFit: 'cover'}} className="transition-transform duration-300 group-hover:scale-105" data-ai-hint={videoThumbnail.imageHint} />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <PlayCircle className="h-12 w-12 text-white/70 transition-transform duration-300 group-hover:scale-110 group-hover:text-white" />
                                            </div>
                                        </div>
                                        <CardContent className="p-4">
                                            <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary">{video.tag}</Badge>
                                            <p className="font-semibold text-foreground text-left text-sm">{video.title}</p>
                                        </CardContent>
                                    </Card>
                                </a>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="ml-12" />
                    <CarouselNext className="mr-12" />
                </Carousel>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                    (Prototype links. In a real app, these would link to curated YouTube videos.)
                </p>
            </CardContent>
        </Card>
    );
}

function VixGauge({ value, zone }: { value: number, zone: VixZone }) {
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
                    (zone === 'Extremely Calm' || zone === 'Normal') && 'text-green-300',
                    zone === 'Volatile' && 'text-yellow-300',
                    zone === 'High Volatility' && 'text-orange-300',
                    zone === 'Extreme' && 'text-red-300'
                )}>{zone}</p>
            </div>
        </div>
    );
};

function HowVixIsUsed({ onSetModule }: { onSetModule: (module: any, context?: any) => void }) {
    const usedBy = [
        { id: "dashboard", icon: LayoutDashboard, title: "Dashboard", description: "Provides at-a-glance market context for your day." },
        { id: "riskCenter", icon: ShieldAlert, title: "Risk Center", description: "A primary input for your daily trading decision." },
        { id: "tradePlanning", icon: FileText, title: "Trade Planning", description: "Triggers guardrails and influences rule validation." },
        { id: "analytics", icon: BarChartIcon, title: "Analytics", description: "Helps you understand how you perform in different volatility regimes." },
    ];

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle>How EdgeCipher Uses the EdgeCipher Crypto VIX (0–100)</CardTitle>
                <CardDescription>
                    The VIX is a core signal that connects multiple modules to help you adapt to changing market conditions.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
                {usedBy.map(item => (
                    <Card
                        key={item.id}
                        className="bg-muted/50 border-border/50 cursor-pointer hover:border-primary/40 hover:bg-muted"
                        onClick={() => onSetModule(item.id)}
                    >
                        <CardHeader className="flex-row items-center gap-4">
                            <item.icon className="h-6 w-6 text-primary flex-shrink-0" />
                            <div>
                                <CardTitle className="text-base">{item.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <p className="text-xs text-muted-foreground">{item.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
}

function VixPlaybook() {
    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle>The VIX Zone Playbook</CardTitle>
                <CardDescription>
                    Actionable guidance for each volatility regime.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {zoneData.map((zone) => (
                        <Card key={zone.zone} className={cn("bg-muted/50 border-2", zone.color)}>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <span>{zone.zone}</span>
                                    <span className="font-mono text-base text-muted-foreground">{zone.range}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Market Behavior</h4>
                                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                        {zone.behavior.map((b, i) => <li key={i}>{b}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Recommended Actions</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs"><ShieldCheck className="h-4 w-4 text-green-400" /><span>SL: {zone.actions.sl}</span></div>
                                        <div className="flex items-center gap-2 text-xs"><Scale className="h-4 w-4 text-yellow-400" /><span>Size: {zone.actions.size}</span></div>
                                        <div className="flex items-center gap-2 text-xs"><TrendingUp className="h-4 w-4 text-blue-400" /><span>Leverage: {zone.actions.leverage}</span></div>
                                    </div>
                                </div>
                                 <Alert variant="destructive" className="p-3">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle className="text-xs font-semibold">Common Mistake</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        {zone.commonMistake}
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function CryptoVixModule({ onSetModule }: CryptoVixModuleProps) {
    const { vixState, isLoading, updateVixValue, generateChoppyDay } = useVixState();
    const [timeRange, setTimeRange] = useState<'24H' | '7D'>('24H');
    const [persona, setPersona] = useState<PersonaType | null>(null);
    const [sensitivity, setSensitivity] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
    const [showVideoModal, setShowVideoModal] = useState(false);


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

            const storedSensitivity = localStorage.getItem("ec_risk_sensitivity");
            if (storedSensitivity) {
                setSensitivity(storedSensitivity as any);
            }
        }
    }, []);

    const handlePersonaChange = (newPersona: PersonaType) => {
        setPersona(newPersona);
        if (typeof window !== "undefined") {
            localStorage.setItem("ec_prototype_persona", newPersona);
        }
    };
    
    const handleSensitivityChange = (newSensitivity: 'conservative' | 'balanced' | 'aggressive') => {
        setSensitivity(newSensitivity);
        if(typeof window !== "undefined") {
            localStorage.setItem("ec_risk_sensitivity", newSensitivity);
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">EdgeCipher Crypto VIX (0–100)</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                    A proprietary score for crypto futures market conditions. Not the stock market VIX.
                </p>
            </div>
            
            <VixPlaybook />

            <HowVixIsUsed onSetModule={onSetModule} />

            {isExtremeZone ? (
                <Card className="bg-red-950/80 border-2 border-red-500/50 text-center py-12">
                    <CardHeader>
                        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto" />
                        <CardTitle className="text-4xl text-red-300 mt-4">Extreme Volatility: Do Not Trade</CardTitle>
                        <CardDescription className="text-red-300/80 text-base">
                            Arjun's analysis is now focused on capital protection, not profit generation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-6">
                        <h4 className="font-semibold text-foreground mb-4">Recommended Actions:</h4>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20" onClick={() => onSetModule('tradeJournal')}>
                                <BookOpen className="mr-2 h-4 w-4" /> Open Journal
                            </Button>
                             <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20" onClick={() => onSetModule('analytics')}>
                                <BarChartIcon className="mr-2 h-4 w-4" /> Review Analytics
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
                        <KeyEventsTimeline chartData={chartData} onSetModule={onSetModule} />
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
                                                        Arjun uses this to adjust coaching and risk recommendations.
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>This is a proprietary score. Not the stock market VIX.</p>
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
                                </div>
                            </CardContent>
                        </Card>
                        <div className="grid md:grid-cols-2 gap-8">
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
                                            <div className="flex justify-between items-center flex-wrap gap-2">
                                                 <p className="font-semibold text-primary/90">{persona}</p>
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
                                            <p className="text-sm text-primary/90 italic">"{posture.interpretation}"</p>
                                            <p className="text-sm"><strong>Today's rule:</strong> {posture.rule}</p>

                                            <div className="flex flex-wrap gap-2 pt-2">
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
                                <CardFooter className="border-t pt-4">
                                    <div className="w-full space-y-2">
                                        <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                            <Info className="h-3 w-3" />
                                            My VIX Tolerance (Prototype)
                                        </Label>
                                        <Select value={sensitivity} onValueChange={handleSensitivityChange as any}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="conservative">Conservative</SelectItem>
                                                <SelectItem value="balanced">Balanced</SelectItem>
                                                <SelectItem value="aggressive">Aggressive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground/80">Adjusts the VIX thresholds for 'Yellow' and 'Red' alerts in the Risk Center.</p>
                                    </div>
                                </CardFooter>
                                </Card>
                            <ParameterAdjustmentsCard zone={currentZone} />
                        </div>

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
                                            <XAxis dataKey={chartKey} tick={{fontSize: 12}} className="fill-muted-foreground" />
                                            <YAxis domain={[0, 100]} tick={{fontSize: 12}} className="fill-muted-foreground" />
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

                        {driverTrendData && (
                            <Card className="bg-muted/30 border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        Driver Trends (Prototype)
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                     <p className="max-w-xs font-normal">
                                                        <span className="font-semibold">Simplified Formula (Prototype):</span>
                                                        <br />
                                                        <span className="font-mono text-xs">VIX = 0.4*BTC_vol + 0.4*ETH_vol + 0.1*Funding + 0.1*Liquidations</span>
                                                        <br />
                                                        <span className="text-xs italic mt-2 block">Backend-calculated in production.</span>
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </CardTitle>
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
                        <LearningStrip zone={currentZone} onVideoClick={() => setShowVideoModal(true)} />
                    </div>
                    
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-24">
                        <VixSimulationControls vixState={vixState} updateVixValue={updateVixValue} generateChoppyDay={generateChoppyDay} />
                        <PerformanceByVixZoneCard onSetModule={onSetModule} />
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
             <AlertDialog open={showVideoModal} onOpenChange={setShowVideoModal}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Prototype Video</AlertDialogTitle>
                    <AlertDialogDescription>
                      This is a prototype. In the live product, this would play the real explainer video.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setShowVideoModal(false)}>Close</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
