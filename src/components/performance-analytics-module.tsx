
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon, Brain, Calendar, Filter, AlertCircle, Info, TrendingUp, TrendingDown, Users, DollarSign, Target, Gauge, Zap, Award } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Line, LineChart, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface PerformanceAnalyticsModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const mockEquityData = [
  { date: "2024-01-01", equity: 10000 },
  { date: "2024-01-02", equity: 10150 },
  { date: "2024-01-03", equity: 10100 },
  { date: "2024-01-04", equity: 10300 },
  { date: "2024-01-05", equity: 10250 },
  { date: "2024-01-06", equity: 10500 },
  { date: "2024-01-07", equity: 10450 },
  { date: "2024-01-08", equity: 10600 },
];

const mockStrategyData = [
    { name: "Breakout", trades: 45, winRate: 55, avgR: 1.8, pnl: 2500, topMistake: "Exited early" },
    { name: "Mean Reversion", trades: 60, winRate: 65, avgR: 0.9, pnl: 1200, topMistake: "Moved SL" },
    { name: "Trend Following", trades: 30, winRate: 40, avgR: 2.5, pnl: 3000, topMistake: "Forced Entry" },
    { name: "Range Play", trades: 25, winRate: 70, avgR: 0.7, pnl: -500, topMistake: "Oversized risk" },
];

const timingHeatmapData = [
    { session: "Asia", winRate: 55, pnl: 800 },
    { session: "London", winRate: 45, pnl: -1200 },
    { session: "New York", winRate: 60, pnl: 3400 },
];

const volatilityData = [
    { vixZone: "Calm", trades: 50, winRate: 60, mistakesCount: 5, avgPnL: 1500 },
    { vixZone: "Normal", trades: 80, winRate: 55, mistakesCount: 12, avgPnL: 2200 },
    { vixZone: "Elevated", trades: 25, winRate: 40, mistakesCount: 10, avgPnL: -800 },
    { vixZone: "Extreme", trades: 5, winRate: 20, mistakesCount: 4, avgPnL: -1500 },
];

const psychologicalPatterns = [
    { name: "FOMO", count: 12, avgPnL: -1800, colorCode: "bg-amber-500" },
    { name: "Revenge Trading", count: 8, avgPnL: -2500, colorCode: "bg-red-500" },
    { name: "Overconfidence", count: 5, avgPnL: -900, colorCode: "bg-purple-500" },
    { name: "Hesitation", count: 15, avgPnL: 500, colorCode: "bg-blue-500" },
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
        quality: "Mixed"
    };

    const qualityConfig = {
        Disciplined: { label: "Disciplined", color: "bg-green-500/20 text-green-300 border-green-500/30", icon: Award },
        Mixed: { label: "Mixed", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: AlertCircle },
        Emotional: { label: "Emotional", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: Zap },
    }[analyticsData.quality] || { label: "Mixed", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: AlertCircle };
    const QualityIcon = qualityConfig.icon;

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

                <SectionCard id="equity" title="Equity Curve" description="Your account balance over the selected period." icon={TrendingUp}>
                    <ChartContainer config={equityChartConfig} className="h-[300px] w-full">
                        <LineChart data={mockEquityData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                            <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="equity" stroke="hsl(var(--color-equity))" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                </SectionCard>
                
                <SectionCard id="discipline" title="Risk & Discipline Analytics" description="How well you are following your own rules." icon={Target}>
                    <p className="text-muted-foreground text-center p-8 border-2 border-dashed rounded-lg">Discipline metrics will appear here.</p>
                </SectionCard>

                <SectionCard id="strategy" title="Strategy Analytics" description="Which of your strategies are performing best." icon={Brain}>
                    <ChartContainer config={pnlChartConfig} className="h-[400px] w-full">
                        <BarChart layout="vertical" data={mockStrategyData} margin={{ left: 20 }}>
                            <CartesianGrid horizontal={false} />
                            <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} />
                            <XAxis dataKey="pnl" type="number" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="pnl" radius={4}>
                                {mockStrategyData.map((entry) => ( <div key={entry.name} fill={entry.pnl > 0 ? "var(--color-positive)" : "var(--color-negative)"} /> ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </SectionCard>
                
                <SectionCard id="timing" title="Timing Analytics" description="When you trade best (and worst)." icon={Calendar}>
                    <p className="text-muted-foreground text-center p-8 border-2 border-dashed rounded-lg">Timing heatmap will appear here.</p>
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {psychologicalPatterns.map(p => (
                            <Card key={p.name} className="bg-muted/50 border-border/50 text-center">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{p.name}</CardTitle>
                                    <CardDescription>{p.count} trades</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-mono text-lg font-semibold text-red-400">${p.avgPnL.toFixed(0)}</p>
                                    <p className="text-xs text-muted-foreground">Avg. PnL</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}

    