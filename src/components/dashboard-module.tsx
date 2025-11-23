
"use client";

import { useAuth } from "@/context/auth-provider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Bot, FileText, Gauge, BarChart as BarChartIcon, ArrowRight, TrendingUp, TrendingDown, BookOpen, Link, ArrowRightCircle, Lightbulb, Info, Newspaper, HelpCircle, CheckCircle, Sparkles, LineChart as LineChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "./ui/dialog";
import { Skeleton } from "./ui/skeleton";
import { useEventLog } from "@/context/event-log-provider";
import { ScrollArea } from "./ui/scroll-area";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";

interface Persona {
    primaryPersonaName?: string;
    riskScore?: number;
    disciplineScore?: number;
}

export type DemoScenario = "normal" | "high_vol" | "drawdown" | "no_positions";

const features = [
    { id: 'tradePlanning', icon: FileText, title: "Plan new trade" },
    { id: 'tradeJournal', icon: BookOpen, title: "Open Journal" },
    { id: 'aiCoaching', icon: Sparkles, title: "Open AI Coaching" },
];

const openPositions = [
    { symbol: 'BTC-PERP', direction: 'Long', size: '0.5', entry: 68500.0, last: 68969.5, pnl: 234.50, risk: 'Medium' },
    { symbol: 'ETH-PERP', direction: 'Short', size: '12', entry: 3605.0, last: 3597.65, pnl: -88.12, risk: 'Low' },
]

const newsItems = [
    { headline: "Fed hints at slower rate hikes, crypto market rallies", sentiment: "Bullish", summary: "The market reacted positively to the recent announcement." },
    { headline: "Major exchange announces new security upgrades after hack", sentiment: "Neutral", summary: "The exchange aims to restore user confidence with the move." },
    { headline: "Regulatory uncertainty in Asia spooks investors", sentiment: "Bearish", summary: "New draft regulations have caused a sell-off in regional markets." },
]

const growthPlanItems = [
    "Limit yourself to 5 trades per day.",
    "Only trade your best A+ setup for the next 2 weeks.",
    "Complete a daily journal review for at least 10 days.",
];

const newUserGrowthPlanItems = [
    "Connect your broker or start logging trades manually.",
    "Draft your initial trading plan.",
    "Watch the 'Intro to Journaling' video (coming soon).",
];

function PnlDisplay({ value, animateKey }: { value: number, animateKey: number }) {
    const isPositive = value >= 0;
    return (
        <div key={animateKey} className={cn(
            "flex items-center font-semibold font-mono animate-metric-pulse",
            isPositive ? 'text-green-400' : 'text-red-400'
        )}>
            {isPositive ? <TrendingUp className="mr-2 h-4 w-4" /> : <TrendingDown className="mr-2 h-4 w-4" />}
            <span>{isPositive ? '+' : ''}${value.toFixed(2)}</span>
        </div>
    );
}

const getArjunMessage = ({ disciplineScore = 50, performanceState = 'stable' }: { disciplineScore?: number, performanceState?: string }) => {
    if (performanceState === 'drawdown' && disciplineScore < 50) {
        return {
            message: "You’re in a drawdown and discipline has been slipping. Today, focus on following your rules, not making back losses.",
            reason: "This insight combines your recent negative performance ('drawdown') with your 'Impulsive Sprinter' persona's lower discipline score, suggesting a high risk of revenge trading."
        };
    }
    if (performanceState === 'hot_streak') {
        return {
            message: "You're on a hot streak. Protect your capital and don't get overconfident. Stick to the plan.",
            reason: "A winning streak can often lead to overconfidence (a common trait for your persona). Arjun is reminding you to protect your recent gains by sticking to your strategy."
        };
    }
    return {
        message: "Your performance has been stable recently. Keep following the plan and avoid unnecessary experimentation.",
        reason: "With stable performance and normal market conditions, the focus is on consistency. Arjun is encouraging you to continue executing your plan without deviation."
    };
};

const getTradeDecision = ({
  vixZone,
  performanceState,
  disciplineScore,
  hasHistory,
}: {
  vixZone: string;
  performanceState: string;
  disciplineScore: number;
  hasHistory: boolean;
}) => {
  if (!hasHistory) {
     return {
      status: "Focus",
      message: "Focus on learning and building your plan before risking capital.",
      chipColor: "bg-blue-500/20 text-blue-400",
      glowColor: "shadow-[0_0_10px_rgba(59,130,246,0.3)]",
    };
  }

  if (vixZone === "Extreme" && disciplineScore < 50) {
    return {
      status: "Red",
      message: "Volatility is extreme and your discipline score is low. Consider reviewing instead of trading.",
      chipColor: "bg-red-500/20 text-red-400",
      glowColor: "shadow-[0_0_10px_rgba(239,68,68,0.3)]",
    };
  }
  if (performanceState === "drawdown" && disciplineScore < 40) {
    return {
      status: "Red",
      message: "You're in a deep drawdown with low discipline. Today is a high-risk day for you.",
      chipColor: "bg-red-500/20 text-red-400",
      glowColor: "shadow-[0_0_10px_rgba(239,68,68,0.3)]",
    };
  }

  if (vixZone === "Elevated" || performanceState === "drawdown") {
    return {
      status: "Amber",
      message: "Keep risk small and stick strictly to your A+ setups.",
      chipColor: "bg-amber-500/20 text-amber-400",
      glowColor: "shadow-[0_0_10px_rgba(245,158,11,0.3)]",
    };
  }
  if (performanceState === "hot_streak" && disciplineScore > 70) {
     return {
      status: "Amber",
      message: "You're on a hot streak, which can lead to overconfidence. Protect your capital.",
      chipColor: "bg-amber-500/20 text-amber-400",
      glowColor: "shadow-[0_0_10px_rgba(245,158,11,0.3)]",
    };
  }

  return {
    status: "Green",
    message: "Market is normal and your discipline is solid. Follow your plan.",
    chipColor: "bg-green-500/20 text-green-400",
    glowColor: "shadow-[0_0_10px_rgba(34,197,94,0.3)]",
  };
};

function TradeDecisionStrip({ vixZone, performanceState, disciplineScore, hasHistory, animateKey }: { vixZone: string, performanceState: string, disciplineScore: number, hasHistory: boolean, animateKey: number }) {

    const decision = getTradeDecision({
        vixZone: vixZone,
        performanceState: performanceState, 
        disciplineScore: disciplineScore,
        hasHistory: hasHistory,
    });

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardContent key={animateKey} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-metric-pulse">
                <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Should I trade today?</h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <div className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold transition-all",
                        decision.chipColor,
                        decision.glowColor
                    )}>
                        {decision.status}
                    </div>
                    <p className="text-sm text-muted-foreground">{decision.message}</p>
                </div>
            </CardContent>
        </Card>
    );
}

type TimeRange = 'today' | '7d' | '30d';

function StreakStatus({ streak, onSetModule }: { streak: { winning: number, losing: number }, onSetModule: (module: any, context?: any) => void; }) {
    if (streak.winning > 0) {
        const message = `Arjun, I'm on a ${streak.winning}-day winning streak. How do I avoid overconfidence?`;
        return (
            <Badge 
                onClick={() => onSetModule('aiCoaching', { initialMessage: message })}
                className="cursor-pointer bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30"
            >
                Winning streak: {streak.winning} day(s)
            </Badge>
        );
    }
    if (streak.losing > 0) {
        const message = `Arjun, I'm on a ${streak.losing}-day losing streak. How should I adjust?`;
        return (
            <Badge 
                onClick={() => onSetModule('aiCoaching', { initialMessage: message })}
                className="cursor-pointer bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
            >
                Losing streak: {streak.losing} day(s)
            </Badge>
        );
    }
    return (
        <Badge variant="secondary">
            No active streak.
        </Badge>
    );
}


function PerformanceSummary({ dailyPnl7d, dailyPnl30d, performanceState, hasHistory, streak, onSetModule, animateKey }: { dailyPnl7d: number[], dailyPnl30d: number[], performanceState: string, hasHistory: boolean, streak: { winning: number, losing: number }, onSetModule: (module: any, context?: any) => void, animateKey: number }) {
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');

    const getArjunPerformanceView = () => {
        if (performanceState === "drawdown") {
            return "You’re in a drawdown, reduce size and focus on A+ setups.";
        }
        if (performanceState === "hot_streak") {
            return "Excellent work this week. Stay focused and protect your capital.";
        }
        return "Stable performance recently.";
    }

    if (!hasHistory) {
         return (
            <Card id="demo-highlight-3" className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                    <CardDescription>No trading history found yet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-6 text-center border-2 border-dashed border-border/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-foreground">Getting Started</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            After a few days of trading, Arjun will show performance patterns here.
                        </p>
                    </div>
                     <ul className="space-y-3 pt-2">
                        {[
                            { text: "Connect your broker or start logging trades." },
                            { text: "Use the Journal to log both trades and emotions." },
                            { text: "Check your Growth Plan for today's focus." },
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-1" />
                                <span className="text-muted-foreground text-sm">{item.text}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        );
    }

    const dataForRange = {
        'today': [dailyPnl7d[dailyPnl7d.length - 1]],
        '7d': dailyPnl7d,
        '30d': dailyPnl30d,
    }[timeRange];

    const totalPnl = dataForRange.reduce((acc, pnl) => acc + pnl, 0);
    const wins = dataForRange.filter(pnl => pnl > 0).length;
    const losses = dataForRange.filter(pnl => pnl < 0).length;
    const winLossLabel = timeRange === 'today' ? (totalPnl > 0 ? '1W / 0L' : (totalPnl < 0 ? '0W / 1L' : '0W / 0L')) : `${wins}W / ${losses}L`;

    const pnlChartData = dataForRange.map((pnl, i) => ({
      day: `Day ${i + 1}`,
      pnl: pnl,
      fill: pnl >= 0 ? "var(--color-positive)" : "var(--color-negative)",
    }));
    
    const pnlChartConfig = {
      pnl: {
        label: "PnL",
      },
      positive: {
        label: "Positive",
        color: "hsl(var(--chart-2))",
      },
      negative: {
        label: "Negative",
        color: "hsl(var(--chart-5))",
      },
    } satisfies ChartConfig

    return (
        <Card id="demo-highlight-3" className="bg-muted/30 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Performance Summary</CardTitle>
                    <Button variant="link" className="px-0 h-auto text-xs text-muted-foreground hover:text-primary" onClick={() => onSetModule('analytics')}>
                        View details <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                </div>
                 <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                    {(['today', '7d', '30d'] as TimeRange[]).map(range => (
                        <Button
                            key={range}
                            size="sm"
                            variant={timeRange === range ? 'secondary' : 'ghost'}
                            onClick={() => setTimeRange(range)}
                            className="rounded-full h-8 px-3 text-xs"
                        >
                            {range === 'today' ? 'Today' : (range === '7d' ? '7D' : '30D')}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-base">Realized PnL</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PnlDisplay value={totalPnl} animateKey={animateKey} />
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-base">Win/Loss</CardTitle>
                        </CardHeader>
                        <CardContent key={animateKey} className="animate-metric-pulse">
                            <p className="text-lg font-semibold font-mono">{winLossLabel}</p>
                            <p className="text-xs text-muted-foreground">(Based on days)</p>
                        </CardContent>
                    </Card>
                </div>
                 <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base">
                            {timeRange === 'today' ? 'Today\'s' : timeRange === '7d' ? '7-Day' : '30-Day'} PnL
                        </CardTitle>
                    </CardHeader>
                    <CardContent key={animateKey} className="animate-metric-pulse">
                        <ChartContainer config={pnlChartConfig} className="h-20 w-full">
                            <BarChart accessibilityLayer data={pnlChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <XAxis dataKey="day" hide />
                                <YAxis domain={['dataMin', 'dataMax']} hide />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent 
                                        hideIndicator 
                                        labelFormatter={(value, payload) => payload?.[0]?.payload.day}
                                        formatter={(value) => `$${Number(value).toFixed(2)}`} 
                                    />}
                                />
                                <Bar dataKey="pnl" radius={2} />
                            </BarChart>
                        </ChartContainer>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mt-4">
                            <p>
                                <span className="font-semibold text-foreground">Arjun's view:</span> {getArjunPerformanceView()}
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="text-xs h-auto p-0 ml-1 text-primary/80 hover:text-primary"
                                    onClick={() => onSetModule('aiCoaching', { initialMessage: "Let's review my performance over the last " + timeRange })}
                                >
                                    Discuss
                                </Button>
                            </p>
                             <StreakStatus streak={streak} onSetModule={onSetModule} />
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}

function NewsSnapshot({ onSetModule }: { onSetModule: (module: any) => void }) {
    return (
         <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    News Snapshot
                </CardTitle>
                 <CardDescription>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                               <span className="flex items-center gap-1 cursor-help">
                                    Headlines can trigger sharp moves. Use them as context.
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">Don’t chase every story. Use news as additional context for your planned trades.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {newsItems.map((item, index) => (
                        <div key={index} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-foreground text-sm pr-4">{item.headline}</p>
                                <Badge variant="secondary" className={cn(
                                    'text-xs',
                                    item.sentiment === 'Bullish' && 'bg-green-500/20 text-green-400 border-green-500/30',
                                    item.sentiment === 'Bearish' && 'bg-red-500/20 text-red-400 border-red-500/30'
                                )}>{item.sentiment}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>
                        </div>
                    ))}
                </div>
                 <Button variant="link" className="px-0 mt-4 text-primary/90 hover:text-primary" onClick={() => onSetModule('news')}>
                    Open full News module <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    )
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-start">
                <Card className="w-full bg-muted/20 border-border/50">
                    <CardContent className="p-6 grid md:grid-cols-3 gap-6 items-center">
                        <div className="md:col-span-2 space-y-2">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-5 w-1/2" />
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg border border-dashed border-primary/20 space-y-2">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Skeleton className="h-16 w-full" />

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-40 w-full" />
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
                    </Card>
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="bg-muted/30 border-border/50">
                            <CardHeader><Skeleton className="h-5 w-1/2" /></CardHeader>
                            <CardContent><Skeleton className="h-16 w-full" /></CardContent>
                        </Card>
                        <Card className="bg-muted/30 border-border/50">
                            <CardHeader><Skeleton className="h-5 w-1/2" /></CardHeader>
                            <CardContent className="space-y-3">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <div className="space-y-8">
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

interface DashboardModuleProps {
    onSetModule: (module: any, context?: any) => void;
    isLoading: boolean;
}

export function DashboardModule({ onSetModule, isLoading }: DashboardModuleProps) {
    const { addLog } = useEventLog();
    const [scenario, setScenario] = useState<DemoScenario>('normal');
    const [isWhyModalOpen, setWhyModalOpen] = useState(false);
    const [animateKey, setAnimateKey] = useState(0);
    
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedScenario = localStorage.getItem('ec_demo_scenario') as DemoScenario;
            if (savedScenario) {
                setScenario(savedScenario);
            }
            
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === 'ec_demo_scenario') {
                    const newScenario = e.newValue as DemoScenario;
                    setScenario(newScenario);
                    addLog(`Demo scenario switched to: ${newScenario}`);
                    setAnimateKey(k => k + 1);
                }
            };
    
            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
        }
    }, [addLog]);

    const useDashboardMockData = (currentScenario: DemoScenario) => {
        const [data, setData] = useState<any>(null);

        useEffect(() => {
            if (typeof window !== "undefined") {
                const personaData = JSON.parse(localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base") || "{}");
                
                let brokerConnected = localStorage.getItem('ec_broker_connected') === 'true';
                if (currentScenario === 'no_positions') {
                    brokerConnected = false;
                }
                const brokerName = localStorage.getItem('ec_broker_name') || "";

                let vixValue = 45;
                if (currentScenario === 'high_vol') vixValue = 82;

                const getVixZone = (vix: number) => {
                    if (vix > 75) return "Extreme";
                    if (vix > 50) return "Elevated";
                    if (vix > 25) return "Normal";
                    return "Calm";
                }

                let dailyPnl7d = [120, -80, 250, -40, 0, 180, -60];
                if (currentScenario === 'drawdown') {
                    dailyPnl7d = [50, -150, -280, 80, -90, -400, -210];
                }
                
                let hasHistory = currentScenario !== 'no_positions';

                if (currentScenario === 'no_positions') {
                    dailyPnl7d = [0, 0, 0, 0, 0, 0, 0];
                }

                const dailyPnl30d = hasHistory
                    ? [...Array.from({ length: 23 }, () => (Math.random() - 0.45) * 300), ...dailyPnl7d]
                    : Array(30).fill(0);

                const total7d = dailyPnl7d.reduce((a, b) => a + b, 0);
                const lastThreeDays = dailyPnl7d.slice(-3);
                
                let performanceState = "stable";
                if (hasHistory) {
                    if (total7d < 0 && lastThreeDays.filter(p => p < 0).length >= 2) {
                        performanceState = "drawdown";
                    } else if (lastThreeDays.every(p => p > 0)) {
                        performanceState = "hot_streak";
                    }
                }
                
                const calculateStreak = (pnl: number[]) => {
                    let winning = 0;
                    let losing = 0;
                    if (pnl.length === 0) return { winning, losing };

                    if (pnl[pnl.length - 1] > 0) {
                        for (let i = pnl.length - 1; i >= 0; i--) {
                            if (pnl[i] > 0) winning++;
                            else break;
                        }
                    } else if (pnl[pnl.length - 1] < 0) {
                        for (let i = pnl.length - 1; i >= 0; i--) {
                            if (pnl[i] < 0) losing++;
                            else break;
                        }
                    }
                    return { winning, losing };
                }

                const streak = calculateStreak(dailyPnl7d.filter(p => p !== 0));

                const startingEquity = 10000;
                const equityCurve = dailyPnl30d.reduce((acc: any[], pnl, i) => {
                    const prevEquity = i > 0 ? acc[i - 1].equity : startingEquity;
                    acc.push({ day: `Day ${i + 1}`, equity: prevEquity + pnl });
                    return acc;
                }, []);
                
                setData({
                    persona: {
                        primaryPersonaName: personaData.primaryPersonaName || 'Trader',
                        riskScore: personaData.riskScore || 50,
                        disciplineScore: currentScenario === 'drawdown' ? 35 : (personaData.disciplineScore || 65),
                        emotionScore: personaData.emotionScore || 50,
                    },
                    connection: {
                        brokerConnected,
                        brokerName,
                    },
                    market: {
                        vixValue,
                        vixZone: getVixZone(vixValue),
                    },
                    performance: {
                        dailyPnl7d,
                        dailyPnl30d,
                        performanceState,
                        hasHistory,
                        equityCurve,
                        streak,
                    },
                    positions: brokerConnected && hasHistory ? openPositions : [],
                    growthPlanToday: hasHistory ? growthPlanItems : newUserGrowthPlanItems,
                });
            }
        }, [currentScenario]);

        return data;
    }

    const data = useDashboardMockData(scenario);
    
    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (!data) {
        return null;
    }

    const { persona: personaData, connection, market, performance, positions, growthPlanToday } = data;

    const arjunInsight = getArjunMessage({
        disciplineScore: personaData.disciplineScore,
        performanceState: performance.performanceState
    });

    const equityChartConfig = {
      equity: {
        label: "Equity",
        color: "hsl(var(--primary))",
      },
    } satisfies ChartConfig;

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <Card id="demo-highlight-1" className="w-full bg-muted/20 border-border/50">
                <CardContent className="p-6 grid md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Welcome, {personaData.primaryPersonaName?.split(' ')[0] || 'Trader'}.
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Persona: <span className="font-semibold text-primary">{personaData.primaryPersonaName || 'The Determined Trader'}</span>
                        </p>
                    </div>
                    <div key={animateKey} className="bg-muted/50 p-4 rounded-lg border border-dashed border-primary/20 relative animate-metric-pulse">
                         <div className="font-semibold text-foreground flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary" />
                            Arjun's Daily Insight
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <div className="mt-2 italic">
                                "{arjunInsight.message}"
                            </div>
                            <Button variant="link" size="sm" className="text-xs h-auto p-0 mt-2 text-muted-foreground hover:text-primary" onClick={() => setWhyModalOpen(true)}>
                                Why?
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Dialog open={isWhyModalOpen} onOpenChange={setWhyModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><HelpCircle /> How Arjun generates insights</DialogTitle>
                    <DialogDescription>
                        Arjun's daily message is created by combining three key data points about you and the market.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted border border-border/50">
                        <p className="font-semibold text-foreground">Your Persona</p>
                        <p className="text-muted-foreground">Your <span className="text-primary font-medium">{personaData.primaryPersonaName}</span> persona has a discipline score of <span className="text-foreground font-medium">{personaData.disciplineScore}</span>, making you prone to certain biases.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted border border-border/50">
                        <p className="font-semibold text-foreground">Your Recent Performance</p>
                        <p className="text-muted-foreground">You are currently in a <span className="text-primary font-medium">{performance.performanceState}</span> state, which affects your likely mindset today.</p>
                    </div>
                     <div className="p-3 rounded-lg bg-muted border border-border/50">
                        <p className="font-semibold text-foreground">Market Volatility</p>
                        <p className="text-muted-foreground">The Crypto VIX is in the <span className="text-primary font-medium">{market.vixZone}</span> zone, indicating current market risk.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                         <p className="font-semibold text-foreground">Today's Conclusion</p>
                         <p className="text-primary/90">{arjunInsight.reason}</p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button>Got it</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <TradeDecisionStrip 
            vixZone={market.vixZone} 
            performanceState={performance.performanceState}
            disciplineScore={personaData.disciplineScore}
            hasHistory={performance.hasHistory}
            animateKey={animateKey}
        />
        
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card id="demo-highlight-2" className="bg-muted/30 border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                         <CardTitle>Account Snapshot</CardTitle>
                         {connection.brokerConnected && <Badge variant="secondary">{connection.brokerName} (Connected)</Badge>}
                    </CardHeader>
                    <CardContent>
                        {connection.brokerConnected ? (
                            <div className="space-y-6">
                                <div key={animateKey} className="p-4 bg-muted/50 rounded-lg animate-metric-pulse">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Balance</p>
                                            <p className="font-semibold text-foreground font-mono">$12,345.67</p>
                                        </div>
                                        <div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="cursor-help">
                                                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                                                Available Margin <Info className="h-3 w-3" />
                                                            </p>
                                                            <p className="font-semibold text-foreground font-mono">$8,765.43</p>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Funds free to open new positions.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="cursor-help">
                                                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                                                Unrealized P&L <Info className="h-3 w-3" />
                                                            </p>
                                                            <PnlDisplay value={146.38} animateKey={animateKey} />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Profit or loss on open positions that is not locked in yet.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                         <div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="cursor-help">
                                                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                                                Margin Used <Info className="h-3 w-3" />
                                                            </p>
                                                            <p className="font-semibold text-foreground font-mono">15.2%</p>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>The percentage of your capital used for open positions.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </div>
                                {positions.length > 0 ? (
                                    <>
                                        <ScrollArea className="w-full whitespace-nowrap">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Symbol</TableHead>
                                                        <TableHead>Direction</TableHead>
                                                        <TableHead>Size</TableHead>
                                                        <TableHead>Entry</TableHead>
                                                        <TableHead>PnL</TableHead>
                                                        <TableHead>Risk</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {positions.map((pos: any) => (
                                                        <TableRow key={pos.symbol}>
                                                            <TableCell className="font-mono">{pos.symbol}</TableCell>
                                                            <TableCell className={cn(pos.direction === 'Long' ? 'text-green-400' : 'text-red-400')}>{pos.direction}</TableCell>
                                                            <TableCell className="font-mono">{pos.size}</TableCell>
                                                            <TableCell className="font-mono">{pos.entry.toFixed(2)}</TableCell>
                                                            <TableCell><PnlDisplay value={pos.pnl} animateKey={animateKey} /></TableCell>
                                                            <TableCell><Badge variant={pos.risk === 'Low' ? 'secondary' : 'default'} className={cn(
                                                                'text-xs',
                                                                pos.risk === 'Medium' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                                                                pos.risk === 'High' && 'bg-red-500/20 text-red-400 border-red-500/30',
                                                                pos.risk === 'Low' && 'bg-green-500/20 text-green-400 border-green-500/30'
                                                            )}>{pos.risk}</Badge></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                        <div className="flex items-center justify-between mt-4">
                                            <Button variant="link" className="px-0 text-primary/90 hover:text-primary" onClick={() => onSetModule('tradeJournal')}>
                                                View all open positions <ArrowRight className="ml-1 h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="link" 
                                                size="sm" 
                                                className="text-xs h-auto p-0 text-primary/80 hover:text-primary"
                                                onClick={() => onSetModule('aiCoaching', { initialMessage: "Let's discuss my open positions." })}
                                            >
                                                Discuss with Arjun
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-lg">
                                        <h3 className="text-lg font-semibold text-foreground">No open positions</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">When you have open trades, they will appear here.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-lg">
                                <Link className="h-8 w-8 text-muted-foreground mx-auto" />
                                <h3 className="mt-4 text-lg font-semibold text-foreground">No broker connected</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Connect your broker to see live account data and open positions.</p>
                                <Button className="mt-4" onClick={() => onSetModule('settings')}>Connect Broker</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <PerformanceSummary 
                    dailyPnl7d={performance.dailyPnl7d}
                    dailyPnl30d={performance.dailyPnl30d}
                    performanceState={performance.performanceState}
                    hasHistory={performance.hasHistory}
                    streak={performance.streak}
                    onSetModule={onSetModule}
                    animateKey={animateKey}
                />

                <div id="demo-highlight-4" className="grid md:grid-cols-2 gap-8">
                     <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                             <CardTitle className="text-base flex items-center gap-2">
                                <Gauge className="h-5 w-5" />
                                Crypto VIX
                            </CardTitle>
                             <CardDescription>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                           <span className="flex items-center gap-1 cursor-help">
                                                An index showing current market volatility (0-100).
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Higher VIX means larger price swings and more risk.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardDescription>
                        </CardHeader>
                        <CardContent key={animateKey} className="animate-metric-pulse">
                             <p className="text-3xl font-bold font-mono">{market.vixValue} <span className="text-base font-normal text-muted-foreground">/ 100</span></p>
                             <p className={cn("text-sm font-semibold", market.vixZone === 'Extreme' || market.vixZone === 'Elevated' ? 'text-amber-400' : 'text-muted-foreground')}>{market.vixZone} Volatility Zone</p>
                             <Button variant="link" className="px-0 h-auto text-xs text-muted-foreground hover:text-primary mt-2" onClick={() => onSetModule('riskCenter')}>
                                Open Risk Center <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </CardContent>
                    </Card>
                    <NewsSnapshot onSetModule={onSetModule} />
                </div>
            </div>

            <div id="demo-highlight-5" className="lg:col-span-1 space-y-8">
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {features.map(feature => (
                            <Button key={feature.id} variant="outline" className="w-full justify-start" onClick={() => onSetModule(feature.id as any)}>
                                <feature.icon className="mr-2 h-4 w-4" />
                                {feature.title}
                                <ArrowRightCircle className="ml-auto h-4 w-4 text-muted-foreground" />
                            </Button>
                        ))}
                    </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Today's Focus</CardTitle>
                        <CardDescription>From your initial growth plan.</CardDescription>
                    </CardHeader>
                    <CardContent key={animateKey} className="animate-metric-pulse">
                         <ul className="space-y-3">
                            {growthPlanToday.slice(0,3).map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-1" />
                                    <span className="text-muted-foreground text-sm">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <Button variant="link" className="px-0 mt-2 text-primary/90 hover:text-primary" onClick={() => onSetModule('settings')}>
                            View full plan <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Equity curve (30 days)</CardTitle>
                        <CardDescription>Visual view of your recent balance swings.</CardDescription>
                    </CardHeader>
                    <CardContent key={animateKey} className="animate-metric-pulse">
                        {performance.hasHistory ? (
                          <ChartContainer config={equityChartConfig} className="h-40 w-full">
                            <ResponsiveContainer>
                              <LineChart data={performance.equityCurve} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                                <XAxis dataKey="day" hide />
                                <YAxis 
                                  domain={['dataMin', 'dataMax']}
                                  tickFormatter={(value) => `$${Number(value/1000).toFixed(0)}k`}
                                />
                                <ChartTooltip 
                                    cursor={{strokeDasharray: '3 3'}}
                                    content={<ChartTooltipContent 
                                        formatter={(value) => `$${Number(value).toFixed(2)}`}
                                    />} 
                                />
                                <Line type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        ) : (
                          <div className="h-40 w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border/50">
                              <LineChartIcon className="h-12 w-12 text-muted-foreground/50" />
                              <p className="text-sm text-muted-foreground ml-4">No data yet</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-4">
                            Green slopes mean your equity is growing. Flat or choppy zones are where discipline matters most.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

    