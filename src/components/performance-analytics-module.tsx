
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon, Brain, Calendar, Filter, AlertCircle, Info, TrendingUp, TrendingDown, Users, DollarSign, Target, Gauge, Zap, Award, ArrowRight, XCircle, CheckCircle, Circle, Bot, AlertTriangle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Line, LineChart, ResponsiveContainer, ReferenceDot, Dot } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Progress } from "./ui/progress";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";

interface PerformanceAnalyticsModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const mockEquityData = [
  { date: "2024-01-01", equity: 10000, marker: null },
  { date: "2024-01-02", equity: 10150, marker: null },
  { date: "2024-01-03", equity: 10100, marker: { type: "Revenge trade", color: "hsl(var(--chart-5))" } },
  { date: "2024-01-04", equity: 10300, marker: null },
  { date: "2024-01-05", equity: 10250, marker: { type: "SL moved", color: "hsl(var(--chart-3))" } },
  { date: "2024-01-06", equity: 10500, marker: null },
  { date: "2024-01-07", equity: 10450, marker: null },
  { date: "2024-01-08", equity: 10600, marker: null },
];

const topEvents = [
    { date: "2024-01-05", label: "SL moved on ETH short", impact: -0.5, journalId: "completed-2" },
    { date: "2024-01-03", label: "Revenge trade on BTC", impact: -1.2, journalId: "completed-2" },
];


const mockStrategyData = [
    { name: "Breakout", trades: 45, winRate: 55, avgR: 1.8, pnl: 2500, topMistake: "Exited early" },
    { name: "Mean Reversion", trades: 60, winRate: 65, avgR: 0.9, pnl: 1200, topMistake: "Moved SL" },
    { name: "Trend Following", trades: 30, winRate: 40, avgR: 2.5, pnl: 3000, topMistake: "Forced Entry" },
    { name: "Range Play", trades: 25, winRate: 70, avgR: 0.7, pnl: -500, topMistake: "Oversized risk" },
];

const timingHeatmapData = {
    sessions: [
        { name: "Asia", totalPnl: 800, blocks: [ { time: "00-04", pnl: 200, trades: 10 }, { time: "04-08", pnl: 600, trades: 15 } ] },
        { name: "London", totalPnl: -1200, blocks: [ { time: "08-12", pnl: -1200, trades: 25 } ] },
        { name: "New York", totalPnl: 3400, blocks: [ { time: "12-16", pnl: 2000, trades: 30 }, { time: "16-20", pnl: 1400, trades: 20 } ] },
    ],
    timeBlocks: ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"],
};

const volatilityData = [
    { vixZone: "Calm", trades: 50, winRate: 60, mistakesCount: 5, avgPnL: 1500 },
    { vixZone: "Normal", trades: 80, winRate: 55, mistakesCount: 12, avgPnL: 2200 },
    { vixZone: "Elevated", trades: 25, winRate: 40, mistakesCount: 10, avgPnL: -800 },
    { vixZone: "Extreme", trades: 5, winRate: 20, mistakesCount: 4, avgPnL: -1500 },
];

const psychologicalPatterns = [
    { name: "FOMO", count: 12, avgPnL: -1800, colorCode: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    { name: "Revenge Trading", count: 8, avgPnL: -2500, colorCode: "bg-red-500/20 text-red-300 border-red-500/30" },
    { name: "Overconfidence", count: 5, avgPnL: -900, colorCode: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    { name: "Hesitation", count: 15, avgPnL: 500, colorCode: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
];

const arjunPatternNotes = [
    "Accuracy drops significantly after 2 consecutive losses.",
    "You tend to exit trades early more often during periods of elevated VIX.",
    "FOMO-tagged trades appear most frequently during the first hour of the NY session.",
];


const equityChartConfig = {
  equity: { label: "Equity", color: "hsl(var(--chart-2))" }
};
const pnlChartConfig = {
  pnl: { label: "PnL" },
  positive: { label: "Positive", color: "hsl(var(--chart-2))" },
  negative: { label: "Negative", color: "hsl(var(--chart-5))" },
};


const jumpNavLinks = [
    { id: "summary", label: "Summary", icon: Users },
    { id: "equity", label: "Equity", icon: TrendingUp },
    { id: "discipline", label: "Discipline", icon: Target },
    { id: "strategy", label: "Strategy", icon: Brain },
    { id: "timing", label: "Timing", icon: Calendar },
    { id: "volatility", label: "Volatility", icon: Zap },
    { id: "psychology", label: "Psychology", icon: Brain },
];

const handleScrollTo = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
        const headerOffset = 160; // For sticky headers
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
};

const SectionCard: React.FC<{id: string, title: React.ReactNode, description: string, icon: React.ElementType, children: React.ReactNode}> = ({ id, title, description, icon: Icon, children }) => (
    <Card id={id} className="bg-muted/30 border-border/50 scroll-mt-40">
        <CardHeader>
            <CardTitle className="flex items-center gap-3"><Icon className="h-6 w-6 text-primary" /> {title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const MetricCard = ({ title, value, hint }: { title: string; value: string; hint: string }) => (
    <Card className="bg-muted/30 border-border/50">
        <CardHeader className="pb-2">
            <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
    </Card>
);


export function PerformanceAnalyticsModule({ onSetModule }: PerformanceAnalyticsModuleProps) {
    const [timeRange, setTimeRange] = useState("30d");
    const [activeSection, setActiveSection] = useState("summary");
    const [selectedStrategy, setSelectedStrategy] = useState<(typeof mockStrategyData)[0] | null>(null);


    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: "-160px 0px -70% 0px" }
        );
    
        const sections = jumpNavLinks.map(link => document.getElementById(link.id)).filter(el => el);
        sections.forEach((section) => observer.observe(section!));
    
        return () => {
            sections.forEach((section) => observer.unobserve(section!));
        };
    }, []);
    
    // Mock data based on filters - Phase 1
    const analyticsData = {
        totalTrades: 160,
        winRate: 48.2,
        lossRate: 51.8,
        avgRR: 1.35,
        totalPnL: 6400,
        bestCondition: "Normal VIX / NY Session",
        quality: "Mixed",
        hasHistory: true, // For controlling empty states
        discipline: {
            slRespectedPct: 85,
            slMovedPct: 12,
            slRemovedPct: 3,
            tpExitedEarlyPct: 25,
            avgRiskPct: 1.1,
            riskOverLimitPct: 15,
        }
    };

    const qualityConfig = {
        Disciplined: { label: "Disciplined", color: "bg-green-500/20 text-green-300 border-green-500/30", icon: Award },
        Mixed: { label: "Mixed", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: AlertCircle },
        Emotional: { label: "Emotional", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: Zap },
    }[analyticsData.quality] || { label: "Mixed", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: AlertCircle };
    const QualityIcon = qualityConfig.icon;

    const askArjunAboutStrategy = (strategyName: string) => {
        const prompt = `Arjun, can we dive into my "${strategyName}" strategy? It seems to be my most profitable one, but I'd like to know how to improve its execution.`;
        onSetModule('aiCoaching', { initialMessage: prompt });
    };

    const discussPsychology = () => {
        const topIssues = psychologicalPatterns.slice(0, 2).map(p => p.name).join(' and ');
        const prompt = `Arjun, my analytics show my biggest psychological issues are ${topIssues}. Can you help me create a plan to work on these?`;
        onSetModule('aiCoaching', { initialMessage: prompt });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Performance Analytics</h1>
                <p className="text-muted-foreground">The backbone of self-awareness — performance, discipline, and psychology in one place.</p>
            </div>
            
            <Card className="bg-muted/30 border-border/50 sticky top-[88px] z-20 backdrop-blur-sm">
                <CardContent className="p-2 flex flex-wrap items-center gap-x-4 gap-y-3">
                     <div className="flex items-center gap-1 rounded-full bg-muted p-1 border">
                        {(['7d', '30d', '90d', 'All'] as const).map(range => (
                            <Button key={range} size="sm" variant={timeRange === range ? 'secondary' : 'ghost'} onClick={() => setTimeRange(range)} className="rounded-full h-7 px-3 text-xs">
                                {range.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                    <Select><SelectTrigger className="w-full sm:w-[180px] h-9 text-xs"><SelectValue placeholder="All strategies" /></SelectTrigger><SelectContent><SelectItem value="all">All strategies</SelectItem></SelectContent></Select>
                    <Select><SelectTrigger className="w-full sm:w-[180px] h-9 text-xs"><SelectValue placeholder="All VIX zones" /></SelectTrigger><SelectContent><SelectItem value="all">All VIX zones</SelectItem></SelectContent></Select>
                    <Select><SelectTrigger className="w-full sm:w-[180px] h-9 text-xs"><SelectValue placeholder="All sessions" /></SelectTrigger><SelectContent><SelectItem value="all">All sessions</SelectItem></SelectContent></Select>
                    <div className="flex items-center space-x-2"><Switch id="include-pending" /><Label htmlFor="include-pending" className="text-xs">Include pending</Label></div>
                </CardContent>
            </Card>

            <div className="sticky top-[152px] z-20 bg-background/80 backdrop-blur-md py-2 border-b border-border/50 -mx-8 px-8 mb-8">
                 <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2">
                    {jumpNavLinks.map(link => (
                        <Button key={link.id} variant={activeSection === link.id ? "secondary" : "ghost"} size="sm" onClick={(e) => handleScrollTo(e, link.id)} className="whitespace-nowrap">
                            <link.icon className="mr-2 h-4 w-4" /> {link.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                <SectionCard 
                    id="summary" 
                    title={
                        <div className="flex items-center gap-4">
                            <span>High-Level Summary</span>
                            <Badge className={qualityConfig.color}>
                                <QualityIcon className="mr-2 h-4 w-4" />
                                {qualityConfig.label}
                            </Badge>
                        </div>
                    }
                    description="Your core metrics at a glance for the selected period." 
                    icon={DollarSign}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MetricCard title="Total Trades" value={String(analyticsData.totalTrades)} hint="+5% vs last period" />
                        <MetricCard title="Win Rate" value={`${analyticsData.winRate}%`} hint="-2% vs last period" />
                        <MetricCard title="Loss Rate" value={`${analyticsData.lossRate}%`} hint="+2% vs last period" />
                        <MetricCard title="Average R:R" value={String(analyticsData.avgRR)} hint="Target: >1.5" />
                        <MetricCard title="Total PnL" value={`$${analyticsData.totalPnL.toFixed(2)}`} hint="+12% vs last period" />
                        <MetricCard title="Best Condition" value={analyticsData.bestCondition} hint="NY session / Normal VIX" />
                    </div>
                </SectionCard>

                <SectionCard id="equity" title="Equity Curve" description="Your account balance over time, with markers for key psychological events." icon={TrendingUp}>
                    {analyticsData.hasHistory ? (
                         <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <ChartContainer config={equityChartConfig} className="h-[300px] w-full">
                                    <LineChart data={mockEquityData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                        <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent />} />
                                        <Line type="monotone" dataKey="equity" stroke="hsl(var(--color-equity))" strokeWidth={2} dot={
                                            (props: any) => {
                                                const { key, ...rest } = props;
                                                if (props.payload.marker) {
                                                    return (
                                                        <TooltipProvider key={key}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Dot {...rest} r={5} fill={props.payload.marker.color} stroke="hsl(var(--background))" strokeWidth={2} />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{props.payload.marker.type}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )
                                                }
                                                return <Dot key={key} {...rest} r={0} />;
                                            }
                                        } />
                                    </LineChart>
                                </ChartContainer>
                            </div>
                            <div className="lg:col-span-1">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Top Events on Chart</h3>
                                <div className="space-y-3">
                                    {topEvents.map((event, i) => (
                                        <Card key={i} className="bg-muted/50">
                                            <CardContent className="p-3">
                                                <p className="text-sm font-semibold">{event.label}</p>
                                                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                                                    <span>{event.date}</span>
                                                    <span className="font-mono text-red-400">{event.impact.toFixed(1)}R impact</span>
                                                </div>
                                                <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-xs" onClick={() => onSetModule('tradeJournal', { draftId: event.journalId })}>Open journal entry <ArrowRight className="ml-1 h-3 w-3"/></Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>Once you execute and journal trades, your equity curve will appear here.</p>
                        </div>
                    )}
                </SectionCard>
                
                <SectionCard id="discipline" title="Risk & Discipline Analytics" description="How well you are following your own rules." icon={Target}>
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="bg-muted/50 border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base">Stop Loss Behavior</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Respected</span><span>{analyticsData.discipline.slRespectedPct}%</span></div>
                                    <Progress value={analyticsData.discipline.slRespectedPct} indicatorClassName="bg-green-500" className="h-2 mt-1" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Moved</span><span>{analyticsData.discipline.slMovedPct}%</span></div>
                                    <Progress value={analyticsData.discipline.slMovedPct} indicatorClassName="bg-amber-500" className="h-2 mt-1" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Removed</span><span>{analyticsData.discipline.slRemovedPct}%</span></div>
                                    <Progress value={analyticsData.discipline.slRemovedPct} indicatorClassName="bg-red-500" className="h-2 mt-1" />
                                </div>
                                <Alert variant="default" className="mt-4 bg-amber-500/10 border-amber-500/20 text-amber-300">
                                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                                    <AlertDescription className="text-xs">
                                        Your biggest drawdowns correlate with moving stop losses.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/50 border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base">Take Profit Behavior</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-background/50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Exited early %</p>
                                    <p className="text-2xl font-bold font-mono">{analyticsData.discipline.tpExitedEarlyPct}%</p>
                                </div>
                                <p className="text-xs text-muted-foreground">Consider defining partial TP rules to let winners run (coming in Phase 2).</p>
                            </CardContent>
                        </Card>
                         <Card className="bg-muted/50 border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base">Risk Compliance</CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-4">
                                <div className="p-4 bg-background/50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Avg. risk per trade</p>
                                    <p className="text-2xl font-bold font-mono">{analyticsData.discipline.avgRiskPct.toFixed(2)}%</p>
                                </div>
                                <div className="p-4 bg-background/50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">% of trades over limit</p>
                                    <p className="text-2xl font-bold font-mono">{analyticsData.discipline.riskOverLimitPct}%</p>
                                </div>
                                {analyticsData.discipline.riskOverLimitPct > 10 && (
                                     <Badge variant="destructive" className="gap-1.5"><XCircle className="h-3 w-3" /> Risk Leakage Detected</Badge>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </SectionCard>

                <SectionCard id="strategy" title="Strategy Analytics" description="Which of your strategies are performing best, and where they leak money." icon={Brain}>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Strategy</TableHead>
                                <TableHead>Trades</TableHead>
                                <TableHead>Win %</TableHead>
                                <TableHead>Total PnL ($)</TableHead>
                                <TableHead>Top Mistake</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockStrategyData.map((strategy) => (
                                <TableRow key={strategy.name}>
                                    <TableCell className="font-medium">{strategy.name}</TableCell>
                                    <TableCell>{strategy.trades}</TableCell>
                                    <TableCell>{strategy.winRate}%</TableCell>
                                    <TableCell className={cn(strategy.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                                        {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toLocaleString()}
                                    </TableCell>
                                    <TableCell><Badge variant="destructive">{strategy.topMistake}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedStrategy(strategy)}>
                                            Open <ArrowRight className="ml-2 h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </SectionCard>
                
                <SectionCard id="timing" title="Timing Analytics" description="When you trade best (and worst)." icon={Calendar}>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                             <div className="overflow-x-auto">
                                <table className="w-full text-center text-xs border-separate border-spacing-1">
                                    <thead>
                                        <tr>
                                            <th className="p-2">Session</th>
                                            {timingHeatmapData.timeBlocks.map(block => (
                                                <th key={block} className="p-2 font-normal text-muted-foreground">{block}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timingHeatmapData.sessions.map(session => (
                                            <tr key={session.name}>
                                                <td className="font-semibold text-foreground text-left p-2">{session.name}</td>
                                                {timingHeatmapData.timeBlocks.map(block => {
                                                    const cellData = session.blocks.find(b => b.time === block);
                                                    if (!cellData) {
                                                        return <td key={block} className="p-2 bg-muted/30 rounded-md" />;
                                                    }
                                                    const opacity = Math.min(1, (cellData.trades / 30) * 0.9 + 0.1);
                                                    const bgColor = cellData.pnl > 0 ? `rgba(34, 197, 94, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
                                                    return (
                                                        <td key={block} style={{ backgroundColor: bgColor }} className="p-2 rounded-md">
                                                            <TooltipProvider><Tooltip>
                                                                <TooltipTrigger>
                                                                    <div className="font-mono text-white">
                                                                        {cellData.pnl > 0 ? '+' : ''}{cellData.pnl}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Trades: {cellData.trades}</p>
                                                                    <p>PnL: ${cellData.pnl}</p>
                                                                </TooltipContent>
                                                            </Tooltip></TooltipProvider>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <Card className="bg-muted/50 h-full">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-primary" /> Arjun's Insight
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        You lose most of your PnL during the <strong className="text-foreground">London session open (08-12 block)</strong>. It seems you're getting caught in fakeouts.
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        <strong className="text-primary">Actionable advice:</strong> Consider avoiding the first hour of the London session, or reduce your size by 50% during that period for the next week.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </SectionCard>
                
                <SectionCard id="volatility" title="Volatility Analytics" description="How you perform in different market conditions." icon={Zap}>
                     <Table>
                        <TableHeader><TableRow><TableHead>VIX Zone</TableHead><TableHead>Trades</TableHead><TableHead>Win Rate</TableHead><TableHead>Mistakes</TableHead><TableHead>Avg. PnL</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {volatilityData.map(d => (
                                <TableRow key={d.vixZone}>
                                    <TableCell>{d.vixZone}</TableCell>
                                    <TableCell>{d.trades}</TableCell>
                                    <TableCell>{d.winRate}%</TableCell>
                                    <TableCell>{d.mistakesCount}</TableCell>
                                    <TableCell className={cn(d.avgPnL >= 0 ? "text-green-400" : "text-red-400")}>${d.avgPnL.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </SectionCard>

                 <SectionCard id="psychology" title="Psychological Patterns" description="The emotions and biases that drive your decisions." icon={Brain}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {psychologicalPatterns.map(pattern => (
                             <Card key={pattern.name} className={cn("border", pattern.colorCode)}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{pattern.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold font-mono">{pattern.count}</p>
                                    <p className="text-xs text-muted-foreground">instances</p>
                                    <p className="text-sm font-semibold font-mono mt-2 text-red-400">
                                        ${pattern.avgPnL.toLocaleString()} impact
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="mt-6 grid lg:grid-cols-2 gap-6">
                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-primary" /> Pattern Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                    {arjunPatternNotes.map((note, i) => <li key={i}>{note}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                         <Card className="bg-muted/50 flex flex-col items-center justify-center text-center p-6">
                            <h3 className="font-semibold text-foreground">Turn these insights into action.</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">Discuss your top two issues with Arjun to build a personalized growth plan.</p>
                            <Button onClick={discussPsychology}>
                                Discuss Patterns with Arjun <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Card>
                    </div>
                </SectionCard>
            </div>
            <Drawer open={!!selectedStrategy} onOpenChange={(open) => !open && setSelectedStrategy(null)}>
                <DrawerContent>
                    {selectedStrategy && (
                        <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
                            <DrawerHeader>
                                <DrawerTitle className="text-2xl">{selectedStrategy.name} Drilldown</DrawerTitle>
                                <DrawerDescription>Deep dive into your most profitable strategy.</DrawerDescription>
                            </DrawerHeader>
                            <div className="px-4 py-6 space-y-6">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <MetricCard title="Win Rate" value={`${selectedStrategy.winRate}%`} hint="" />
                                    <MetricCard title="Avg. R:R" value={String(selectedStrategy.avgR)} hint="" />
                                    <MetricCard title="Total PnL" value={`$${selectedStrategy.pnl}`} hint="" />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-foreground">Common Emotions</h4>
                                        <div className="flex gap-2 mt-2">
                                            <Badge variant="outline">Focused</Badge>
                                            <Badge variant="outline">Calm</Badge>
                                            <Badge variant="outline" className="border-amber-500/50 text-amber-400">Overconfidence</Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">Common Mistakes</h4>
                                         <div className="flex gap-2 mt-2">
                                            <Badge variant="destructive">Exited early</Badge>
                                            <Badge variant="destructive">Forced Entry</Badge>
                                        </div>
                                    </div>
                                </div>
                                <Button className="w-full" onClick={() => askArjunAboutStrategy(selectedStrategy.name)}>
                                    Ask Arjun to improve this strategy
                                </Button>
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}
