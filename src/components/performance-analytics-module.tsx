

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon, Brain, Calendar, Filter, AlertCircle, Info, TrendingUp, TrendingDown, Users, DollarSign, Target, Gauge, Zap, Award, ArrowRight, XCircle, CheckCircle, Circle, Bot, AlertTriangle, Clipboard, Star, Activity, BookOpen, BarChartHorizontal } from "lucide-react";
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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "./ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Separator } from "./ui/separator";
import type { JournalEntry } from "./trade-journal-module";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PerformanceAnalyticsModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const mockEquityData = [
  { date: "2024-01-01", equity: 10000, marker: null, journalId: null },
  { date: "2024-01-02", equity: 10150, marker: null, journalId: null },
  { date: "2024-01-03", equity: 10100, marker: { type: "Revenge trade", color: "hsl(var(--chart-5))" }, journalId: "completed-2" },
  { date: "2024-01-04", equity: 10300, marker: null, journalId: null },
  { date: "2024-01-05", equity: 10250, marker: { type: "Moved SL", color: "hsl(var(--chart-3))" }, journalId: "completed-2" },
  { date: "2024-01-06", equity: 10500, marker: null, journalId: null },
  { date: "2024-01-07", equity: 10450, marker: null, journalId: null },
  { date: "2024-01-08", equity: 10600, marker: null, journalId: null },
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

const emotionResultMatrixData = {
    emotions: ["FOMO", "Fear", "Anxious", "Revenge", "Calm", "Focused"],
    results: ["Big Loss (≤-2R)", "Loss (-2R to 0)", "Win (0 to +2R)", "Big Win (≥+2R)"],
    data: [
        [3, 8, 2, 0], // FOMO
        [1, 5, 4, 1], // Fear
        [2, 9, 6, 0], // Anxious
        [4, 4, 0, 0], // Revenge
        [0, 2, 10, 3], // Calm
        [0, 1, 15, 8], // Focused
    ],
    maxCount: 15,
};


const equityChartConfig = {
  equity: { label: "Equity", color: "hsl(var(--chart-2))" }
};

const SectionCard: React.FC<{id?: string, title: React.ReactNode, description: string, icon: React.ElementType, children: React.ReactNode, headerContent?: React.ReactNode}> = ({ id, title, description, icon: Icon, children, headerContent }) => (
    <Card id={id} className="bg-muted/30 border-border/50 scroll-mt-40">
        <CardHeader>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-3"><Icon className="h-6 w-6 text-primary" /> {title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                {headerContent}
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const MetricCard = ({ title, value, hint, onClick }: { title: string; value: string; hint: string, onClick?: () => void }) => (
    <Card className={cn("bg-muted/30 border-border/50", onClick && "cursor-pointer hover:bg-muted/50 hover:border-primary/20")} onClick={onClick}>
        <CardHeader className="pb-2">
            <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
    </Card>
);

type ReportType = 'Weekly' | 'Monthly';

function ReportDialog({ reportType }: { reportType: ReportType }) {
    const { toast } = useToast();
    const reportData = {
        'Weekly': {
            pnl: "+$850",
            topImprovement: "Reduced revenge trading after losses.",
            topWeakness: "Still exiting winning trades too early.",
            focus: "Try a partial take-profit to let winners run."
        },
        'Monthly': {
            pnl: "+$6,400",
            topImprovement: "Significant improvement in sticking to A+ setups.",
            topWeakness: "Performance drops in high volatility.",
            focus: "Reduce size by 50% when VIX is 'Elevated'."
        }
    }[reportType];

    const handleCopy = () => {
        const textToCopy = `
### ${reportType} Trading Report

**Overall PnL:** ${reportData.pnl}
**Top Improvement:** ${reportData.topImprovement}
**Top Weakness:** ${reportData.topWeakness}
**Recommended Focus:** ${reportData.focus}
        `;
        navigator.clipboard.writeText(textToCopy.trim());
        toast({ title: "Report copied to clipboard" });
    }

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{reportType} Report Card</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
                <div className="p-4 bg-muted rounded-lg border">
                    <SummaryRow label="Overall PnL" value={reportData.pnl} className={reportData.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'} />
                </div>
                <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Summary</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                        <li><strong className="text-green-400">Top Improvement:</strong> {reportData.topImprovement}</li>
                        <li><strong className="text-red-400">Top Weakness:</strong> {reportData.topWeakness}</li>
                        <li><strong className="text-primary">Recommended Focus:</strong> {reportData.focus}</li>
                    </ul>
                </div>
                <Separator />
                <div className="space-y-4">
                     <h4 className="font-semibold text-foreground">Chart Snapshots (Prototype)</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                            <BarChartIcon className="h-8 w-8 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground ml-2">[PnL by day]</p>
                        </div>
                         <div className="h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                             <TrendingUp className="h-8 w-8 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground ml-2">[Equity curve]</p>
                        </div>
                     </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" disabled>Download (soon)</Button>
                    <Button variant="outline" onClick={handleCopy}>
                        <Clipboard className="mr-2 h-4 w-4" /> Copy Summary
                    </Button>
                </div>
            </div>
        </DialogContent>
    );
}

const SummaryRow = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
    <div className="flex justify-between items-center text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className={cn("font-semibold font-mono text-foreground", className)}>{value}</p>
    </div>
);


const ArjunInsightsSidebar = ({ analyticsData, onSetModule }: { analyticsData: any, onSetModule: PerformanceAnalyticsModuleProps['onSetModule'] }) => {
    const insights = useMemo(() => {
        const generatedInsights = [];
        if (!analyticsData) return [];

        if (analyticsData.winRate < 50) {
            generatedInsights.push("Your win rate is below 50%. Focus on improving your setup selection criteria.");
        } else {
            generatedInsights.push("Your win rate is stable. The key now is to maximize the size of your wins versus your losses.");
        }

        if (analyticsData.topLossDrivers && analyticsData.topLossDrivers.length > 0) {
            const topDriver = analyticsData.topLossDrivers[0];
            if (topDriver) {
                generatedInsights.push(`Your biggest financial drain is from trades tagged with "${topDriver.behavior}". This cost you ${topDriver.totalR.toFixed(1)}R.`);
            }
        }
        
        if (analyticsData.scores.disciplineScore < 70) {
            generatedInsights.push("Discipline score is low. This suggests you're not consistently following your own rules, which is a major profit leak.");
        }
        
        if (volatilityData.find(v => v.vixZone === "Elevated" && v.avgPnL < 0)) {
            generatedInsights.push("Performance drops significantly in 'Elevated' volatility. Consider reducing size or sitting out during these periods.");
        }

        if (timingHeatmapData.sessions.find(s => s.name === "London" && s.totalPnl < 0)) {
            generatedInsights.push("The London session appears to be your most challenging time to trade. Review journal entries from this period.");
        }

        return generatedInsights.slice(0, 4);

    }, [analyticsData]);

    if (insights.length === 0) return null;

    const handleDiscuss = () => {
        const prompt = `Arjun, my dashboard analytics generated these insights for me. Can we discuss them?\n\n- ${insights.join('\n- ')}`;
        onSetModule('aiCoaching', { initialMessage: prompt });
    }

    return (
        <Card className="bg-muted/30 border-primary/20 sticky top-24">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Arjun's Insights</CardTitle>
                <CardDescription className="text-xs">Key patterns from your analytics data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
                    {insights.map((insight, i) => (
                        <li key={i}>{insight}</li>
                    ))}
                </ul>
                <Button variant="outline" className="w-full" onClick={handleDiscuss}>
                    Discuss these with Arjun
                </Button>
            </CardContent>
        </Card>
    );
};


export function PerformanceAnalyticsModule({ onSetModule }: PerformanceAnalyticsModuleProps) {
    const [timeRange, setTimeRange] = useState("30d");
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedStrategy, setSelectedStrategy] = useState<(typeof mockStrategyData)[0] | null>(null);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [hasData, setHasData] = useState(true);
    const [selectedBehavior, setSelectedBehavior] = useState<{ behavior: string; trades: JournalEntry[] } | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<JournalEntry | null>(null);
    const [showBehaviorLayer, setShowBehaviorLayer] = useState(true);
    const [activeDrilldown, setActiveDrilldown] = useState<string | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedTab = localStorage.getItem("ec_analytics_active_tab");
            if (savedTab) {
                setActiveTab(savedTab);
            }
        }
    }, []);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        localStorage.setItem("ec_analytics_active_tab", tab);
    }

    const computeAnalytics = useCallback((entries: JournalEntry[]) => {
      if (entries.length === 0) return null;

      const totalTrades = entries.length;
      const completedEntries = entries.filter(e => e.status === 'completed');
      const wins = completedEntries.filter(e => e.review && e.review.pnl > 0).length;
      const losses = completedEntries.filter(e => e.review && e.review.pnl < 0).length;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
      const lossRate = totalTrades > 0 ? (losses / totalTrades) * 100 : 0;
      const totalPnL = completedEntries.reduce((acc, e) => acc + (e.review?.pnl || 0), 0);

      const rValues = completedEntries.map(e => {
          if (!e.review || !e.technical || !e.technical.riskPercent) return 0;
          const riskAmount = (e.technical.riskPercent / 100) * 10000;
          return riskAmount > 0 ? e.review.pnl / riskAmount : 0;
      });
      const winningR = rValues.filter(r => r > 0);
      const losingR = rValues.filter(r => r < 0).map(Math.abs);
      const avgWinR = winningR.length > 0 ? winningR.reduce((a, b) => a + b, 0) / winningR.length : 0;
      const avgLossR = losingR.length > 0 ? losingR.reduce((a, b) => a + b, 0) / losingR.length : 0;
      const avgRR = avgLossR > 0 ? avgWinR / avgLossR : 0;

      const slMovedCount = completedEntries.filter(e => e.review?.mistakesTags?.includes("Moved SL")).length;
      const slMovedPct = completedEntries.length > 0 ? (slMovedCount / completedEntries.length) * 100 : 0;
      
      const overtradedCount = completedEntries.filter(e => e.review?.mistakesTags?.includes("Overtraded")).length;
      const overtradedPct = completedEntries.length > 0 ? (overtradedCount / completedEntries.length) * 100 : 0;
      
      const journalingCompletionRate = totalTrades > 0 ? (completedEntries.length / totalTrades) * 100 : 0;

      // Scoring logic
      let disciplineScore = 80;
      if (slMovedPct > 10) disciplineScore -= 10;
      if (overtradedPct > 5) disciplineScore -= 8;
      if (journalingCompletionRate < 70) disciplineScore -= 6;
      
      const emotionTags = completedEntries.flatMap(e => (e.review?.emotionsTags || "").split(','));
      const fomoCount = emotionTags.filter(t => t === 'FOMO').length;
      const revengeCount = emotionTags.filter(t => t === 'Revenge').length;
      const overconfidenceCount = emotionTags.filter(t => t === 'Overconfidence').length;
      
      let emotionalScore = 20; // Lower is better
      if (fomoCount / completedEntries.length > 0.1) emotionalScore += 10;
      if (revengeCount > 0) emotionalScore += 10;
      if (overconfidenceCount / completedEntries.length > 0.05) emotionalScore += 8;

      let consistencyScore = 60; // Mock

      let quality = "Mixed";
      if (disciplineScore > 80 && emotionalScore < 30) quality = "Disciplined";
      else if (disciplineScore < 60 || emotionalScore > 40) quality = "Emotional";

      const behaviorTags: Record<string, { occurrences: number; totalR: number; trades: JournalEntry[] }> = {};
      completedEntries.forEach((entry, idx) => {
        const tags = [...(entry.review?.emotionsTags?.split(',') || []), ...(entry.review?.mistakesTags?.split(',') || [])].filter(Boolean);
        const rValue = rValues[idx] || 0;
        
        tags.forEach(tag => {
            if (tag === 'None (disciplined)') return;
            if (!behaviorTags[tag]) {
                behaviorTags[tag] = { occurrences: 0, totalR: 0, trades: [] };
            }
            behaviorTags[tag].occurrences++;
            behaviorTags[tag].totalR += rValue;
            behaviorTags[tag].trades.push(entry);
        });
      });

      const topLossDrivers = Object.entries(behaviorTags)
        .filter(([, data]) => data.totalR < 0)
        .map(([behavior, data]) => ({
            behavior,
            occurrences: data.occurrences,
            avgR: data.totalR / data.occurrences,
            totalR: data.totalR,
            trades: data.trades,
        }))
        .sort((a, b) => a.totalR - b.totalR);

      return {
          totalTrades,
          winRate,
          lossRate,
          avgRR,
          totalPnL,
          bestCondition: "Normal VIX / NY Session", // Mock
          quality,
          discipline: {
              slRespectedPct: 100 - slMovedPct,
              slMovedPct: slMovedPct,
              slRemovedPct: 3, // Mock
              tpExitedEarlyPct: 25, // Mock
              avgRiskPct: 1.1, // Mock
              riskOverLimitPct: 15, // Mock
          },
          scores: {
              disciplineScore,
              emotionalScore,
              consistencyScore,
          },
          topLossDrivers,
      };
    }, []);

    const [analyticsData, setAnalyticsData] = useState<ReturnType<typeof computeAnalytics> | null>(null);

    const loadData = useCallback(() => {
        const storedEntries = localStorage.getItem("ec_journal_entries");
        if (storedEntries) {
            const parsed = JSON.parse(storedEntries);
            setJournalEntries(parsed);
            setAnalyticsData(computeAnalytics(parsed));
            setHasData(parsed.length > 0);
        } else {
            setHasData(false);
            setAnalyticsData(null);
        }
    }, [computeAnalytics]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleEventClick = (journalId: string | null) => {
        if (!journalId) return;
        const entry = journalEntries.find(e => e.id === journalId);
        if (entry) {
            setSelectedEvent(entry);
        }
    };
    
    const generateDemoData = () => {
        const mockJournalEntries: JournalEntry[] = [
            {
              id: 'demo-1',
              status: 'completed',
              timestamps: { plannedAt: new Date(Date.now() - 86400000 * 2).toISOString(), executedAt: new Date(Date.now() - 86400000 * 2).toISOString(), closedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
              technical: { instrument: 'BTC-PERP', direction: 'Long', entryPrice: 68500, stopLoss: 68000, takeProfit: 69500, leverage: 20, positionSize: 0.5, riskPercent: 1, rrRatio: 2, strategy: "BTC Trend Breakout" },
              planning: { planNotes: "Clean breakout above resistance. Good follow-through.", mindset: "Confident, Calm" },
              review: { pnl: 234.75, exitPrice: 68969.5, emotionalNotes: "Felt good, stuck to the plan.", emotionsTags: "Confident,Focused", mistakesTags: "None (disciplined)", learningNotes: "Trust the plan when the setup is clean.", newsContextTags: "Post-CPI" },
              meta: { journalingCompletedAt: new Date(Date.now() - 86400000 * 2).toISOString(), ruleAdherenceSummary: { followedEntryRules: true, movedSL: false, exitedEarly: false, rrBelowMin: false } }
            },
            {
              id: 'demo-2',
              status: 'completed',
              timestamps: { plannedAt: new Date(Date.now() - 86400000).toISOString(), executedAt: new Date(Date.now() - 86400000).toISOString(), closedAt: new Date(Date.now() - 86400000).toISOString() },
              technical: { instrument: 'ETH-PERP', direction: 'Short', entryPrice: 3605, stopLoss: 3625, leverage: 50, positionSize: 12, riskPercent: 2, rrRatio: 1, strategy: "London Reversal" },
              planning: { planNotes: "Fading what looks like a sweep of the high.", mindset: "Anxious" },
              review: { pnl: -240, exitPrice: 3625, emotionalNotes: "Market kept pushing, I felt like I was fighting a trend. Should have waited for more confirmation.", emotionsTags: "Anxious,Revenge,FOMO", mistakesTags: "Forced Entry,Moved SL", learningNotes: "Don't fight a strong trend, even if it looks like a sweep.", newsContextTags: "News-driven day" },
              meta: { journalingCompletedAt: new Date(Date.now() - 86400000).toISOString(), ruleAdherenceSummary: { followedEntryRules: false, movedSL: true, exitedEarly: false, rrBelowMin: true } }
            },
        ];
        localStorage.setItem("ec_journal_entries", JSON.stringify(mockJournalEntries));
        toast({
            title: "Demo Data Generated",
            description: "Mock journal entries have been created. The analytics are now visible.",
        });
        loadData();
    };

    if (!hasData) {
        return (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <BarChartIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No trade data yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    This module will light up once you have journal entries.
                </p>
                <Button className="mt-4" onClick={generateDemoData}>
                    Generate Demo Dataset
                </Button>
            </div>
        );
    }

    if (!analyticsData) return null;

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

    const handleCellClick = (emotion: string, result: string) => {
        toast({
            title: "Filter Action (Prototype)",
            description: `Filtering trades with emotion '${emotion}' and result '${result}'.`,
        });
    };

    const DrilldownContent = () => {
        if (!activeDrilldown) return null;

        if (activeDrilldown === 'discipline-score') {
            return (
                <div className="p-4">
                    <DrawerHeader>
                        <DrawerTitle>Discipline Score Drilldown</DrawerTitle>
                        <DrawerDescription>This score reflects how consistently you follow your own rules.</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 space-y-4">
                        <p className="text-sm">Your score of <span className="font-bold text-primary">{analyticsData.scores.disciplineScore}</span> is based on:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            <li>Stop Loss Adherence: {analyticsData.discipline.slRespectedPct.toFixed(0)}%</li>
                            <li>Trades Over Risk Limit: {analyticsData.discipline.riskOverLimitPct.toFixed(0)}%</li>
                            <li>Journaling Completion: {analyticsData.totalTrades > 0 ? (analyticsData.totalTrades / analyticsData.totalTrades * 100).toFixed(0) : 0}%</li>
                        </ul>
                         <Alert>
                            <AlertTriangle className="h-4 w-4"/>
                            <AlertTitle>Arjun's Note</AlertTitle>
                            <AlertDescription>
                                Moving your SL is a major leak. Even if it saves a trade sometimes, it builds a bad habit. Trust your initial analysis.
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            )
        }
        
        if (activeDrilldown.startsWith('loss-driver-')) {
            const behavior = activeDrilldown.replace('loss-driver-', '');
            const driver = analyticsData.topLossDrivers.find(d => d.behavior === behavior);
            if (!driver) return null;
            return (
                <div className="p-4">
                     <DrawerHeader>
                        <DrawerTitle>Loss Driver: "{driver.behavior}"</DrawerTitle>
                        <DrawerDescription>This behavior cost you {driver.totalR.toFixed(1)}R over {driver.occurrences} trades.</DrawerDescription>
                    </DrawerHeader>
                     <div className="px-4 space-y-4">
                        <Card className="bg-muted/50">
                            <CardHeader><CardTitle className="text-base">Trades with this tag</CardTitle></CardHeader>
                            <CardContent>
                                {driver.trades.map(trade => (
                                    <div key={trade.id} className="flex justify-between items-center text-sm p-2 border-b last:border-b-0">
                                        <span>{trade.technical.instrument} {trade.technical.direction}</span>
                                        <span className="font-mono text-red-400">${trade.review?.pnl.toFixed(2)}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                         <Alert>
                            <AlertTriangle className="h-4 w-4"/>
                            <AlertTitle>Arjun's Corrective Action</AlertTitle>
                            <AlertDescription>
                                For the next 5 trades, write down "I will not {driver.behavior.toLowerCase()}" before you enter. This builds conscious awareness.
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            )
        }

        return null;
    }

    return (
        <Drawer open={!!activeDrilldown} onOpenChange={(open) => !open && setActiveDrilldown(null)}>
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

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                        <TabsTrigger value="overview"><BarChartIcon className="mr-2 h-4 w-4" />Overview</TabsTrigger>
                        <TabsTrigger value="behaviour"><Activity className="mr-2 h-4 w-4" />Behaviour</TabsTrigger>
                        <TabsTrigger value="strategies"><BookOpen className="mr-2 h-4 w-4" />Strategies</TabsTrigger>
                        <TabsTrigger value="reports"><Award className="mr-2 h-4 w-4" />Reports</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="mt-6">
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
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
                                        <MetricCard title="Win Rate" value={`${analyticsData.winRate.toFixed(1)}%`} hint="-2% vs last period" />
                                        <MetricCard title="Loss Rate" value={`${analyticsData.lossRate.toFixed(1)}%`} hint="+2% vs last period" />
                                        <MetricCard title="Average R:R" value={String(analyticsData.avgRR.toFixed(2))} hint="Target: >1.5" />
                                        <MetricCard title="Total PnL" value={`$${analyticsData.totalPnL.toFixed(2)}`} hint="+12% vs last period" />
                                        <MetricCard title="Best Condition" value={analyticsData.bestCondition} hint="NY session / Normal VIX" />
                                    </div>
                                </SectionCard>

                                <SectionCard
                                    id="equity"
                                    title="Equity Curve"
                                    description="Your account balance over time, with markers for key psychological events."
                                    icon={TrendingUp}
                                    headerContent={
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="show-behavior-layer" className="text-sm">Show behaviour layer</Label>
                                            <Switch
                                                id="show-behavior-layer"
                                                checked={showBehaviorLayer}
                                                onCheckedChange={setShowBehaviorLayer}
                                            />
                                        </div>
                                    }
                                >
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
                                                            const { payload, cx, cy, key, ...rest } = props;
                                                            if (showBehaviorLayer && payload.marker) {
                                                                return (
                                                                    <TooltipProvider key={key}>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Dot {...rest} cx={cx} cy={cy} r={5} fill={payload.marker.color} stroke="hsl(var(--background))" strokeWidth={2} onClick={() => handleEventClick(payload.journalId)} className="cursor-pointer" />
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>{payload.marker.type}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )
                                                            }
                                                            const emptyKey = `dot-empty-${key}-${props.index}`;
                                                            const { key: _key, ...otherProps } = props;
                                                            return <Dot key={emptyKey} {...otherProps} r={0} />;
                                                        }
                                                    } />
                                                </LineChart>
                                            </ChartContainer>
                                        </div>
                                        {showBehaviorLayer && (
                                            <div className="lg:col-span-1">
                                                <h3 className="text-sm font-semibold text-foreground mb-3">Top Events on Chart</h3>
                                                <div className="space-y-3">
                                                    {topEvents.map((event, i) => (
                                                        <Card key={i} className="bg-muted/50 cursor-pointer hover:bg-muted" onClick={() => handleEventClick(event.journalId)}>
                                                            <CardContent className="p-3">
                                                                <p className="text-sm font-semibold">{event.label}</p>
                                                                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                                                                    <span>{event.date}</span>
                                                                    <span className="font-mono text-red-400">{event.impact.toFixed(1)}R impact</span>
                                                                </div>
                                                                <div className="text-xs text-primary/80 mt-2 flex items-center gap-1">Open details <ArrowRight className="h-3 w-3"/></div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </SectionCard>
                            </div>
                            <div className="lg:col-span-1 space-y-8">
                                <ArjunInsightsSidebar analyticsData={analyticsData} onSetModule={onSetModule} />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="behaviour" className="mt-6 space-y-8">
                        <Card className="bg-muted/30 border-border/50">
                            <CardHeader>
                                <CardTitle>Behaviour Analytics</CardTitle>
                                <CardDescription>Where you lose your edge isn’t price — it’s behaviour.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <MetricCard title="Discipline Score" value={String(analyticsData.scores.disciplineScore)} hint="How well you follow your rules." onClick={() => setActiveDrilldown('discipline-score')} />
                                <MetricCard title="Emotional Score" value={String(analyticsData.scores.emotionalScore)} hint="Frequency of emotional tags." />
                                <MetricCard title="Consistency Score" value={String(analyticsData.scores.consistencyScore)} hint="Journaling streak & performance variance." />
                            </CardContent>
                        </Card>
                        <SectionCard id="discipline" title="Risk & Discipline Analytics" description="How well you are following your own rules." icon={Target}>
                            <div className="grid md:grid-cols-3 gap-6">
                                <Card className="bg-muted/50 border-border/50">
                                    <CardHeader>
                                        <CardTitle className="text-base">Stop Loss Behavior</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Respected</span><span>{analyticsData.discipline.slRespectedPct.toFixed(0)}%</span></div>
                                            <Progress value={analyticsData.discipline.slRespectedPct} indicatorClassName="bg-green-500" className="h-2 mt-1" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Moved</span><span>{analyticsData.discipline.slMovedPct.toFixed(0)}%</span></div>
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
                        <SectionCard id="loss-drivers" title="Top Loss Drivers" description="The specific behaviours that are costing you the most money, ranked by total impact." icon={Zap}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Behaviour</TableHead>
                                        <TableHead>Occurrences</TableHead>
                                        <TableHead>Avg. R Impact</TableHead>
                                        <TableHead>Total R Impact</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analyticsData.topLossDrivers.map(driver => (
                                        <TableRow key={driver.behavior} className="cursor-pointer" onClick={() => { setSelectedBehavior(driver); setActiveDrilldown(`loss-driver-${driver.behavior}`)}}>
                                            <TableCell><Badge variant="destructive">{driver.behavior}</Badge></TableCell>
                                            <TableCell>{driver.occurrences}</TableCell>
                                            <TableCell className="font-mono text-red-400">{driver.avgR.toFixed(2)}R</TableCell>
                                            <TableCell className="font-mono text-red-400">{driver.totalR.toFixed(2)}R</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    Drilldown
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </SectionCard>
                        <SectionCard id="emotion-matrix" title="Emotion × Result Matrix" description="Where do your emotions lead you? See which feelings correlate with wins and losses." icon={Brain}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-center text-xs border-separate border-spacing-1">
                                    <thead>
                                        <tr>
                                            <th className="p-2 text-left">Emotion</th>
                                            {emotionResultMatrixData.results.map(result => (
                                                <th key={result} className="p-2 font-normal text-muted-foreground">{result}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {emotionResultMatrixData.emotions.map((emotion, rowIndex) => (
                                            <tr key={emotion}>
                                                <td className="font-semibold text-foreground text-left p-2">{emotion}</td>
                                                {emotionResultMatrixData.data[rowIndex].map((count, colIndex) => {
                                                    const opacity = count > 0 ? Math.min(1, (count / emotionResultMatrixData.maxCount) * 0.9 + 0.1) : 0;
                                                    const result = emotionResultMatrixData.results[colIndex];
                                                    const isLoss = result.includes("Loss");
                                                    const isWin = result.includes("Win");
                                                    
                                                    let bgColor = `rgba(100, 116, 139, ${opacity * 0.5})`; // Muted for zero
                                                    if (count > 0) {
                                                        if (isLoss) bgColor = `rgba(239, 68, 68, ${opacity})`; // Red
                                                        if (isWin) bgColor = `rgba(34, 197, 94, ${opacity})`; // Green
                                                    }

                                                    return (
                                                        <td
                                                            key={colIndex}
                                                            style={{ backgroundColor: bgColor }}
                                                            className="p-3 rounded-md font-mono text-white cursor-pointer hover:ring-2 hover:ring-primary"
                                                            onClick={() => handleCellClick(emotion, result)}
                                                        >
                                                            {count}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end items-center gap-4 text-xs text-muted-foreground mt-4">
                                <span>Fewer trades</span>
                                <div className="flex gap-1">
                                    <div className="w-4 h-4 rounded bg-primary/20" />
                                    <div className="w-4 h-4 rounded bg-primary/40" />
                                    <div className="w-4 h-4 rounded bg-primary/60" />
                                    <div className="w-4 h-4 rounded bg-primary/80" />
                                    <div className="w-4 h-4 rounded bg-primary" />
                                </div>
                                <span>More trades</span>
                            </div>
                        </SectionCard>
                    </TabsContent>
                    <TabsContent value="strategies" className="mt-6 space-y-8">
                        <SectionCard id="strategy" title="Strategy Analytics" description="Which of your strategies are performing best, and where they leak money." icon={BookOpen}>
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
                    </TabsContent>
                    <TabsContent value="reports" className="mt-6 space-y-8">
                        <SectionCard id="reports" title="Weekly & Monthly Reports" description="Your performance summarized into actionable report cards." icon={Award}>
                            <div className="grid md:grid-cols-2 gap-8">
                                <Dialog>
                                    <Card className="bg-muted/50">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Weekly Report</CardTitle>
                                            <CardDescription>Your performance summary for last week.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <p className="text-sm"><strong className="text-green-400">Top Improvement:</strong> Reduced revenge trading.</p>
                                            <p className="text-sm"><strong className="text-red-400">Top Weakness:</strong> Still exiting winners early.</p>
                                            <p className="text-sm"><strong className="text-primary">Focus:</strong> Try a partial TP to let trades run.</p>
                                        </CardContent>
                                        <CardContent>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full">View Full Report</Button>
                                            </DialogTrigger>
                                        </CardContent>
                                    </Card>
                                    <ReportDialog reportType="Weekly" />
                                </Dialog>

                                <Dialog>
                                    <Card className="bg-muted/50">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Monthly Report</CardTitle>
                                            <CardDescription>Your performance summary for last month.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <p className="text-sm"><strong className="text-green-400">Top Improvement:</strong> Sticking to A+ setups.</p>
                                            <p className="text-sm"><strong className="text-red-400">Top Weakness:</strong> Performance in high VIX.</p>
                                            <p className="text-sm"><strong className="text-primary">Focus:</strong> Reduce size when VIX is 'Elevated'.</p>
                                        </CardContent>
                                        <CardContent>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full">View Full Report</Button>
                                            </DialogTrigger>
                                        </CardContent>
                                    </Card>
                                    <ReportDialog reportType="Monthly" />
                                </Dialog>
                            </div>
                        </SectionCard>
                    </TabsContent>
                </Tabs>

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
                <DrawerContent>
                    <DrilldownContent />
                </DrawerContent>
                <Drawer open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                    <DrawerContent>
                        {selectedEvent && (
                            <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
                                <DrawerHeader>
                                    <DrawerTitle className="text-2xl">Event Details</DrawerTitle>
                                    <DrawerDescription>
                                        Details for the trade event on {new Date(selectedEvent.timestamps.executedAt).toLocaleDateString()}.
                                    </DrawerDescription>
                                </DrawerHeader>
                                <div className="px-4 py-6 space-y-4">
                                    <Card className="bg-muted/50">
                                        <CardContent className="p-4">
                                            <SummaryRow label="Instrument" value={`${selectedEvent.technical.instrument} ${selectedEvent.technical.direction}`} />
                                            <SummaryRow label="Result (PnL)" value={`$${selectedEvent.review?.pnl.toFixed(2)}`} className={cn(selectedEvent.review && selectedEvent.review.pnl >= 0 ? 'text-green-400' : 'text-red-400')} />
                                            <SummaryRow label="Mistakes" value={selectedEvent.review?.mistakesTags || "None"} />
                                            <SummaryRow label="Emotions" value={selectedEvent.review?.emotionsTags || "None"} />
                                        </CardContent>
                                    </Card>
                                    <Button className="w-full" onClick={() => { setSelectedEvent(null); onSetModule('tradeJournal', { draftId: selectedEvent.id }); }}>
                                        Open Full Journal Entry
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DrawerContent>
                </Drawer>
            </div>
        </Drawer>
    );
}
