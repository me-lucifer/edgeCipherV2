

"use client";

import { useAuth } from "@/context/auth-provider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Bot, FileText, Gauge, BarChart, ArrowRight, TrendingUp, TrendingDown, BookOpen, Link, ArrowRightCircle, Lightbulb, Info, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface Persona {
    primaryPersonaName?: string;
    riskScore?: number;
    disciplineScore?: number;
}

const features = [
    { id: 'tradePlanning', icon: FileText, title: "Plan new trade" },
    { id: 'tradeJournal', icon: BookOpen, title: "Open Journal" },
    { id: 'aiCoaching', icon: Bot, title: "Open AI Coaching" },
];

const openPositions = [
    { symbol: 'BTC-PERP', direction: 'Long', size: '0.5', pnl: 234.50, risk: 'Medium' },
    { symbol: 'ETH-PERP', direction: 'Short', size: '12', pnl: -88.12, risk: 'Low' },
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

function PnlDisplay({ value }: { value: number }) {
    const isPositive = value >= 0;
    return (
        <div className={cn(
            "flex items-center font-semibold font-mono",
            isPositive ? 'text-green-400' : 'text-red-400'
        )}>
            {isPositive ? <TrendingUp className="mr-2 h-4 w-4" /> : <TrendingDown className="mr-2 h-4 w-4" />}
            <span>{isPositive ? '+' : ''}${value.toFixed(2)}</span>
        </div>
    );
}

// Mock data and helper for Arjun's message
const getArjunMessage = ({ disciplineScore = 50, performanceState = 'stable' }: { disciplineScore?: number, performanceState?: string }) => {
    if (performanceState === 'drawdown' && disciplineScore < 50) {
        return "You’re in a drawdown and discipline has been slipping. Today, focus on following your rules, not making back losses.";
    }
    if (performanceState === 'hot_streak') {
        return "You're on a hot streak. Protect your capital and don't get overconfident. Stick to the plan.";
    }
    return "Your performance has been stable recently. Keep following the plan and avoid unnecessary experimentation.";
};

// New helper function for the decision strip
const getTradeDecision = ({
  vixZone,
  performanceState,
  disciplineScore,
}: {
  vixZone: string;
  performanceState: string;
  disciplineScore: number;
}) => {
  // RED conditions
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

  // AMBER conditions
  if (vixZone === "Elevated" || performanceState === "drawdown") {
    return {
      status: "Amber",
      message: "Conditions are tricky. Keep risk small and stick strictly to your A+ setups.",
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

  // GREEN condition
  return {
    status: "Green",
    message: "Market is normal and your discipline is solid. Follow your plan.",
    chipColor: "bg-green-500/20 text-green-400",
    glowColor: "shadow-[0_0_10px_rgba(34,197,94,0.3)]",
  };
};

function TradeDecisionStrip() {
    // Mock data for the decision logic
    const mockVix = 75; // Elevated
    const getVixZone = (vix: number) => {
        if (vix > 80) return "Extreme";
        if (vix > 60) return "Elevated";
        if (vix > 30) return "Normal";
        return "Calm";
    }

    const [persona, setPersona] = useState<Persona>({});
     useEffect(() => {
        if (typeof window !== "undefined") {
            const personaData = localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base");
            if (personaData) {
                setPersona(JSON.parse(personaData));
            }
        }
    }, []);

    const decision = getTradeDecision({
        vixZone: getVixZone(mockVix),
        performanceState: "drawdown", // Mock state
        disciplineScore: persona.disciplineScore || 50,
    });

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                        {decision.status} – Trade with caution
                    </div>
                    <p className="text-sm text-muted-foreground">{decision.message}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function PerformanceSummary() {
    const mockDailyPnl = [120, -80, 250, -40, 0, 180, -60];
    const todayPnl = mockDailyPnl[mockDailyPnl.length - 1];
    const total7dPnl = mockDailyPnl.reduce((acc, pnl) => acc + pnl, 0);
    const wins = mockDailyPnl.filter(pnl => pnl > 0).length;
    const losses = mockDailyPnl.filter(pnl => pnl < 0).length;

    const getArjunPerformanceView = () => {
        const consecutiveLosses = mockDailyPnl.slice(-3).every(pnl => pnl < 0);
        if (consecutiveLosses && total7dPnl < 0) {
            return "You’re in a drawdown, reduce size and focus on A+ setups.";
        }
        if (total7dPnl > 500) {
            return "Excellent work this week. Stay focused.";
        }
        return "Stable performance recently.";
    }

    return (
        <>
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base">Today's Realized PnL</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PnlDisplay value={todayPnl} />
                    </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base">Today's Win/Loss</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold font-mono">{wins > 0 || losses > 0 ? `${wins}W / ${losses}L` : '0W / 0L'}</p>
                        <p className="text-xs text-muted-foreground">(Based on last 7 days)</p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base">Last 7 Days PnL</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PnlDisplay value={total7dPnl} />
                    </CardContent>
                </Card>
            </div>
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle className="text-base">7-Day PnL Sparkline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-20 w-full bg-muted rounded-md flex items-center justify-center border-2 border-dashed border-border/50">
                        <p className="text-sm text-muted-foreground">[Sparkline chart placeholder]</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        <span className="font-semibold text-foreground">Arjun's view:</span> {getArjunPerformanceView()}
                    </p>
                </CardContent>
            </Card>
        </>
    );
}

function NewsSnapshot({ onSetModule }: { onSetModule: (module: any) => void }) {
    return (
         <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    News Snapshot
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">Headlines can trigger sharp moves. Use them as context, but don’t chase every story.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {newsItems.map((item, index) => (
                        <div key={index} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-foreground text-sm pr-4">{item.headline}</p>
                                <Badge variant="secondary" className={cn(
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

interface DashboardModuleProps {
    onSetModule: (module: any) => void;
}

export function DashboardModule({ onSetModule }: DashboardModuleProps) {
    const [persona, setPersona] = useState<Persona>({});
    const [isBrokerConnected, setIsBrokerConnected] = useState(false);
    const { logout } = useAuth();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const personaData = localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base");
            if (personaData) {
                setPersona(JSON.parse(personaData));
            }
            setIsBrokerConnected(localStorage.getItem('ec_broker_connected') === 'true');
        }
    }, []);
    
    const mockPerformanceState = 'drawdown';
    const arjunMessage = getArjunMessage({
        disciplineScore: persona.disciplineScore,
        performanceState: mockPerformanceState
    });


  return (
    <div className="space-y-8">
        {/* User Header & Arjun Insight */}
        <Card className="w-full bg-muted/20 border-border/50">
            <CardContent className="p-6 grid md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Welcome, {persona.primaryPersonaName?.split(' ')[0] || 'Trader'}.
                    </h1>
                     <p className="text-muted-foreground mt-1">
                        Persona: <span className="font-semibold text-primary">{persona.primaryPersonaName || 'The Determined Trader'}</span>
                    </p>
                </div>
                 <div className="bg-muted/50 p-4 rounded-lg border border-dashed border-primary/20 relative">
                    <div className="text-sm text-muted-foreground">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                             <Bot className="h-4 w-4 text-primary" />
                             Arjun's Daily Insight
                        </div>
                        <div className="mt-2 italic">
                           "{arjunMessage}"
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <TradeDecisionStrip />
        
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-8">
                {/* Account & Positions Snapshot */}
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Account & Positions Snapshot</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isBrokerConnected ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Broker</p>
                                        <p className="font-semibold text-foreground">Delta</p>
                                    </div>
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
                                    <div>
                                         <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="cursor-help">
                                                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                                            Unrealized P&L <Info className="h-3 w-3" />
                                                        </p>
                                                        <PnlDisplay value={146.38} />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Profit or loss on open positions that is not locked in yet.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Symbol</TableHead>
                                            <TableHead>Direction</TableHead>
                                            <TableHead>Size</TableHead>
                                            <TableHead>PnL</TableHead>
                                            <TableHead>Risk</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {openPositions.map(pos => (
                                            <TableRow key={pos.symbol}>
                                                <TableCell className="font-mono">{pos.symbol}</TableCell>
                                                <TableCell className={cn(pos.direction === 'Long' ? 'text-green-400' : 'text-red-400')}>{pos.direction}</TableCell>
                                                <TableCell className="font-mono">{pos.size}</TableCell>
                                                <TableCell><PnlDisplay value={pos.pnl} /></TableCell>
                                                <TableCell><Badge variant={pos.risk === 'Low' ? 'secondary' : 'default'} className={cn(
                                                    pos.risk === 'Medium' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                                                    pos.risk === 'High' && 'bg-red-500/20 text-red-400 border-red-500/30',
                                                    pos.risk === 'Low' && 'bg-green-500/20 text-green-400 border-green-500/30'
                                                )}>{pos.risk}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
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

                {/* Performance Summary */}
                <PerformanceSummary />

                 {/* Market Context & Risk */}
                <div className="grid md:grid-cols-2 gap-8">
                     <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                             <CardTitle className="text-base flex items-center gap-2">
                                <Gauge className="h-5 w-5" />
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="flex items-center gap-1 cursor-help">
                                                Crypto VIX <Info className="h-3 w-3" />
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>An index showing current crypto market volatility (0-100).</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-3xl font-bold font-mono">78 <span className="text-base font-normal text-muted-foreground">/ 100</span></p>
                             <p className="text-sm text-amber-400 font-semibold">High Volatility Zone</p>
                             <p className="text-xs text-muted-foreground mt-2">Expect larger swings. Consider reducing size.</p>
                        </CardContent>
                    </Card>
                    <NewsSnapshot onSetModule={onSetModule} />
                </div>
            </div>

            {/* Right column */}
            <div className="space-y-8">
                 {/* Quick Actions */}
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {features.map(feature => (
                            <Button key={feature.id} variant="outline" className="w-full justify-start" onClick={() => onSetModule(feature.id)}>
                                <feature.icon className="mr-2 h-4 w-4" />
                                {feature.title}
                                <ArrowRightCircle className="ml-auto h-4 w-4 text-muted-foreground" />
                            </Button>
                        ))}
                    </CardContent>
                </Card>
                {/* Growth Plan */}
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Today's Focus</CardTitle>
                        <CardDescription>From your initial growth plan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ul className="space-y-3">
                            {growthPlanItems.slice(0,2).map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-1" />
                                    <span className="text-muted-foreground text-sm">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <Button variant="link" className="px-0 mt-2">View full plan</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );

    

    



    

