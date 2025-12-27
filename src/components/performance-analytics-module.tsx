

      "use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon, Brain, Calendar, Filter, AlertCircle, Info, TrendingUp, TrendingDown, Users, DollarSign, Target, Gauge, Zap, Award, ArrowRight, XCircle, CheckCircle, Circle, Bot, AlertTriangle, Clipboard, Star, Activity, BookOpen, BarChartHorizontal, Database, View, Flag, Presentation, ChevronsUpDown, Copy, MoreHorizontal, ShieldCheck } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "./ui/dialog";
import { Separator } from "./ui/separator";
import type { JournalEntry } from "./trade-journal-module";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Skeleton } from "./ui/skeleton";
import { HelpCircle, ChevronUp } from "lucide-react";
import { AnalyticsTour } from "./analytics-tour";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";


interface PerformanceAnalyticsModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

// Seeded random number generator for deterministic mock data
function seededRandom(seed: number) {
  let state = seed;
  return function() {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}


const SectionCard: React.FC<{id?: string, title: React.ReactNode, description: string, icon: React.ElementType, children: React.ReactNode, headerContent?: React.ReactNode, onExport?: () => void, className?: string}> = ({ id, title, description, icon: Icon, children, headerContent, onExport, className }) => (
    <Card id={id} className={cn("bg-muted/30 border-border/50 scroll-mt-40 motion-reduce:animate-none", className)}>
        <CardHeader>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-3"><Icon className="h-6 w-6 text-primary" /> {title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {headerContent}
                    {onExport && (
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExport}>
                                        <Presentation className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Export snapshot (prototype)</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const DeltaIndicator = ({ delta, unit = "" }: { delta: number; unit?: string }) => {
    if (delta === 0) return null;
    const isPositive = delta > 0;
    return (
        <span className={cn(
            "text-xs font-mono flex items-center ml-2",
            isPositive ? "text-green-400" : "text-red-400"
        )}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? '+' : ''}{delta.toFixed(1)}{unit}
        </span>
    );
};

const MetricCard = ({ title, value, hint, delta, deltaUnit, onClick }: { title: string; value: string | React.ReactNode; hint: string, delta?: number, deltaUnit?: string, onClick?: () => void }) => (
    <Card className={cn("bg-muted/50 border-border/50 motion-reduce:animate-none", onClick && "cursor-pointer hover:bg-muted hover:border-primary/20 transition-all")} onClick={onClick}>
        <CardHeader className="pb-2">
            <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-baseline">
                <p className="text-3xl font-bold font-mono">{value}</p>
                {delta !== undefined && <DeltaIndicator delta={delta} unit={deltaUnit} />}
            </div>
            <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
    </Card>
);

type ReportType = 'Weekly' | 'Monthly';

function ReportDialog({ reportType }: { reportType: ReportType }) {
    const { toast } = useToast();
    const reportData = {
        'Weekly': {
            pnl: "+$850.25",
            winRate: "55%",
            discipline: { journalingRate: "92%", slMovedPct: "8%" },
            psychology: { topEmotion: "FOMO", topMistake: "Exited early" },
            bestCondition: "NY Session / Normal VIX",
            worstCondition: "London Open / High VIX",
            recommendations: [
                "Try a partial take-profit to let winners run.",
                "Review trades where you exited early; what was the trigger?",
                "Avoid trading the first 30 mins of London if feeling anxious.",
            ]
        },
        'Monthly': {
            pnl: "+$6,430.80",
            winRate: "49%",
            discipline: { journalingRate: "85%", slMovedPct: "18%" },
            psychology: { topEmotion: "Anxiety", topMistake: "Moved SL" },
            bestCondition: "Trend following strategies",
            worstCondition: "Range plays in high volatility",
            recommendations: [
                "Reduce size by 50% when VIX is 'Elevated' or higher.",
                "Review all trades where you moved your stop loss.",
                "Focus on your 'Breakout' strategy, as it's your most profitable.",
            ]
        }
    }[reportType];

    const generateReportText = (short = false) => {
        const title = `### ${reportType} Trading Report ###`;
        const performance = `**Performance:** PnL ${reportData.pnl} | Win Rate ${reportData.winRate}`;
        if (short) {
            return `${title}\n${performance}\n**Focus:** ${reportData.recommendations[0]}`;
        }
        return `
${title}

**Performance Summary**
- Overall PnL: ${reportData.pnl}
- Win Rate: ${reportData.winRate}

**Discipline Summary**
- Journaling Rate: ${reportData.discipline.journalingRate}
- Stop Loss Moved: ${reportData.discipline.slMovedPct} of trades

**Psychology Summary**
- Top Emotion: ${reportData.psychology.topEmotion}
- Top Mistake: ${reportData.psychology.topMistake}

**Conditions**
- Best: ${reportData.bestCondition}
- Worst: ${reportData.worstCondition}

**Recommended Next Actions**
${reportData.recommendations.map(r => `- ${r}`).join('\n')}
        `.trim();
    };

    const handleCopy = (short: boolean) => {
        const textToCopy = generateReportText(short);
        navigator.clipboard.writeText(textToCopy);
        toast({ title: short ? "Short summary copied" : "Full report copied" });
    }

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{reportType} Report Card</DialogTitle>
                <DialogDescription>
                    Your performance summarized into actionable insights for the period.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                <div className="p-4 bg-muted rounded-lg border grid grid-cols-2 gap-4">
                    <SummaryRow label="Overall PnL" value={reportData.pnl} className={reportData.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'} />
                    <SummaryRow label="Win Rate" value={reportData.winRate} />
                </div>
                 <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Discipline Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard title="Journaling Rate" value={reportData.discipline.journalingRate} hint="Completed journals" />
                        <MetricCard title="SL Moved" value={reportData.discipline.slMovedPct} hint="Trades with moved stops" />
                    </div>
                </div>
                <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Psychology Summary</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <MetricCard title="Top Emotion" value={reportData.psychology.topEmotion} hint="Most tagged emotion" />
                        <MetricCard title="Top Mistake" value={<Badge variant="destructive">{reportData.psychology.topMistake}</Badge>} hint="Costliest mistake" />
                    </div>
                </div>
                <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Conditions</h4>
                    <Card className="bg-muted/50">
                        <CardContent className="p-4 space-y-2">
                            <SummaryRow label="Best Condition" value={reportData.bestCondition} />
                            <SummaryRow label="Worst Condition" value={reportData.worstCondition} />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-4">
                     <h4 className="font-semibold text-foreground">Recommended Next Actions</h4>
                     <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                        {reportData.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                </div>
            </div>
             <DialogFooter className="sm:justify-between gap-2 border-t pt-4">
                <DialogClose asChild><Button variant="ghost">Close</Button></DialogClose>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleCopy(true)}>
                        <Clipboard className="mr-2 h-4 w-4" /> Copy Short Summary
                    </Button>
                    <Button variant="outline" onClick={() => handleCopy(false)}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Full Report
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
}

const SummaryRow = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
    <div className="flex justify-between items-center text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className={cn("font-semibold font-mono text-foreground", className)}>{value}</p>
    </div>
);


const PinnedInsightsCard = ({ analyticsData, onSetModule, onApplyGuardrails }: { analyticsData: any, onSetModule: PerformanceAnalyticsModuleProps['onSetModule'], onApplyGuardrails: () => void }) => {
    const insights = useMemo(() => {
        if (!analyticsData || !analyticsData.current) return [];
        const data = analyticsData.current;
        const generatedInsights = [];

        if (data.winRate < 50) {
            generatedInsights.push({
                text: "Your win rate is below 50%. Focus on improving your setup selection criteria.",
                cta: "Discuss with Arjun",
                action: () => onSetModule('aiCoaching', { initialMessage: "My win rate is low, how can I improve my setup selection?" })
            });
        }

        if (data.topLossDrivers && data.topLossDrivers.length > 0) {
            const topDriver = data.topLossDrivers[0];
            if (topDriver) {
                generatedInsights.push({
                    text: `Your biggest profit leak is from trades tagged with "${topDriver.behavior}". This cost you ${topDriver.totalR.toFixed(1)}R.`,
                    cta: "View these trades",
                    action: () => onSetModule('tradeJournal', { filters: { mistake: topDriver.behavior } })
                });
            }
        }
        
        if (data.scores.disciplineScore < 70) {
            generatedInsights.push({
                text: "Your discipline score is low. This suggests you're not consistently following your own rules.",
                cta: "Set a Guardrail",
                action: onApplyGuardrails
            });
        }
        
        if (data.volatilityData.find((v: any) => v.vixZone === "Elevated" && v.avgPnL < 0)) {
            generatedInsights.push({
                text: "Performance drops significantly in 'Elevated' volatility. Consider reducing size or sitting out during these periods.",
                cta: "Set a VIX guardrail",
                action: onApplyGuardrails
            });
        }

        if (data.timingHeatmapData.sessions.find((s: any) => s.name === "London" && s.totalPnl < 0)) {
            generatedInsights.push({
                text: "The London session appears to be your most challenging time to trade. Review journal entries from this period.",
                cta: "Review London trades",
                action: () => onSetModule('tradeJournal', {})
            });
        }

        return generatedInsights.slice(0, 3);

    }, [analyticsData, onSetModule, onApplyGuardrails]);

    if (insights.length === 0) return null;

    const handleDiscussAll = () => {
        const prompt = `Arjun, my analytics dashboard highlighted these key takeaways for me. Can we create a plan to address them?\n\n- ${insights.map(i => i.text).join('\n- ')}`;
        onSetModule('aiCoaching', { initialMessage: prompt });
    }

    return (
        <SectionCard
            id="analytics-discuss-arjun"
            title="Your 3 Key Takeaways"
            description="Arjun's analysis of your most important patterns."
            icon={Bot}
        >
            <ul className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
                {insights.map((insight, i) => (
                    <li key={i}>
                        <span className="text-foreground">{insight.text}</span>
                        <Button variant="link" size="sm" className="p-0 h-auto ml-1 text-primary/80 hover:text-primary" onClick={insight.action}>
                            {insight.cta}
                        </Button>
                    </li>
                ))}
            </ul>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleDiscussAll}>
                    <Bot className="mr-2 h-4 w-4" /> Discuss All with Arjun
                </Button>
                 <Button variant="outline" size="sm" onClick={onApplyGuardrails}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Enable Recommended Guardrails
                </Button>
            </div>
        </SectionCard>
    );
};

const GuardrailDialog = () => {
    const { toast } = useToast();
    const [guardrails, setGuardrails] = useState({
        warnOnLowRR: true,
        warnOnHighRisk: true,
        warnOnHighVIX: false,
        warnAfterLosses: false,
    });

    useEffect(() => {
        const saved = localStorage.getItem("ec_guardrails");
        if (saved) {
            setGuardrails(JSON.parse(saved));
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem("ec_guardrails", JSON.stringify(guardrails));
        toast({ title: "Guardrails updated", description: "Your trade planning module will now use these settings." });
    }

    const GuardrailSwitch = ({ id, label, description }: { id: keyof typeof guardrails, label: string, description: string }) => (
        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
            <div className="space-y-0.5">
                <Label htmlFor={id}>{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch
                id={id}
                checked={guardrails[id]}
                onCheckedChange={(checked) => setGuardrails(prev => ({ ...prev, [id]: checked }))}
            />
        </div>
    );

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Discipline Guardrails (Prototype)</DialogTitle>
                <DialogDescription>
                    Set up real-time warnings in the Trade Planning module based on your analytics.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <GuardrailSwitch id="warnOnLowRR" label="Warn if R:R is below 1.5" description="Get an alert if a trade's potential reward doesn't justify its risk." />
                <GuardrailSwitch id="warnOnHighRisk" label="Warn if risk is over 2%" description="Get a warning before you plan a trade that risks too much of your capital." />
                <GuardrailSwitch id="warnOnHighVIX" label="Warn in Elevated/Extreme VIX" description="Nudge yourself to be more cautious when the market is volatile." />
                <GuardrailSwitch id="warnAfterLosses" label="Warn after 2 consecutive losses" description="A 'cool-down' alert to prevent revenge trading after a losing streak." />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <DialogClose asChild><Button onClick={handleSave}>Save Guardrails</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    );
};

function ScoreGauge({ score, label, interpretation, delta }: { score: number; label: string; interpretation: string; delta?: number; }) {
    const getArc = (value: number, radius: number) => {
        const x = 50 - radius * Math.cos(value * Math.PI);
        const y = 50 + radius * Math.sin(value * Math.PI);
        return `${x},${y}`;
    };

    const percentage = score / 100;
    const endAngle = percentage;
    const largeArcFlag = endAngle > 0.5 ? 1 : 0;
    
    const colorClasses = {
        bad: "text-red-500",
        medium: "text-amber-500",
        good: "text-green-500"
    };
    
    const interpretationColor = score < 40 ? colorClasses.bad : score < 70 ? colorClasses.medium : colorClasses.good;

    return (
        <div className="flex flex-col items-center gap-2 motion-reduce:animate-none">
            <svg viewBox="0 0 100 60" className="w-full h-auto">
                <path
                    d={`M ${getArc(0, 40)} A 40,40 0 1,1 ${getArc(1, 40)}`}
                    stroke="hsl(var(--border))"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d={`M ${getArc(0, 40)} A 40,40 0 ${largeArcFlag},1 ${getArc(endAngle, 40)}`}
                    stroke="currentColor"
                    className={interpretationColor}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    style={{ transition: 'all 0.5s ease-in-out' }}
                />
                <text x="50" y="40" textAnchor="middle" className="text-3xl font-bold fill-current text-foreground">
                    {score}
                </text>
                 <text x="50" y="55" textAnchor="middle" className="text-sm font-medium fill-current text-muted-foreground">
                    {label}
                </text>
            </svg>
            <div className="flex items-baseline">
                <p className={cn("text-sm font-semibold", interpretationColor)}>{interpretation}</p>
                {delta !== undefined && <DeltaIndicator delta={delta} />}
            </div>
        </div>
    );
}

const RadarChart = ({ data, onSetModule }: { data: { axis: string, value: number, count: number, impact: string }[], onSetModule: PerformanceAnalyticsModuleProps['onSetModule'] }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full p-4 border-2 border-dashed rounded-lg">
                <Brain className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <h4 className="font-semibold text-foreground">Not enough data</h4>
                <p className="text-xs">Tag emotions and mistakes in your journal to build your psychological profile.</p>
            </div>
        );
    }

    const size = 300;
    const center = size / 2;
    const numLevels = 4;
    const radius = size * 0.4;

    const points = data.map((item, i) => {
        const angle = (i / data.length) * 2 * Math.PI - Math.PI / 2;
        const value = item.value / 100;
        const x = center + radius * value * Math.cos(angle);
        const y = center + radius * value * Math.sin(angle);
        return `${x},${y}`;
    });
    const pathData = points.join(' ');

    const handleDiscussPattern = (axis: string) => {
        const prompt = `Arjun, my psychological radar chart shows a high score for "${axis}". Can we work on this?`;
        onSetModule('aiCoaching', { initialMessage: prompt });
    };

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="motion-reduce:animate-none">
            {/* Background Webs */}
            {[...Array(numLevels)].map((_, levelIndex) => {
                const levelRadius = radius * ((levelIndex + 1) / numLevels);
                const webPoints = data.map((_, i) => {
                    const angle = (i / data.length) * 2 * Math.PI - Math.PI / 2;
                    const x = center + levelRadius * Math.cos(angle);
                    const y = center + levelRadius * Math.sin(angle);
                    return `${x},${y}`;
                }).join(' ');
                return <polygon key={levelIndex} points={webPoints} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />;
            })}

            {/* Radial Lines */}
            {data.map((_, i) => {
                const angle = (i / data.length) * 2 * Math.PI - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" />;
            })}

            {/* Data Polygon */}
            <polygon points={pathData} fill="hsla(var(--primary-hsl), 0.2)" stroke="hsl(var(--primary))" strokeWidth="2" />

            {/* Points on Data Polygon */}
            {points.map((p, i) => {
                const [x, y] = p.split(',').map(Number);
                return <circle key={i} cx={x} cy={y} r="3" fill="hsl(var(--primary))" />;
            })}

            {/* Labels */}
            {data.map((item, i) => {
                const angle = (i / data.length) * 2 * Math.PI - Math.PI / 2;
                const labelRadius = radius * 1.15;
                const x = center + labelRadius * Math.cos(angle);
                const y = center + labelRadius * Math.sin(angle);
                return (
                    <TooltipProvider key={item.axis}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <text
                                    x={x}
                                    y={y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="text-xs fill-muted-foreground font-semibold cursor-pointer transition-all hover:fill-foreground"
                                    onClick={() => handleDiscussPattern(item.axis)}
                                >
                                    {item.axis}
                                </text>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-bold">{item.axis}</p>
                                <p>Count: {item.count}</p>
                                <p>Impact: {item.impact}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </svg>
    );
};

const TradesInFocusPanel = ({
  behavior,
  onClear,
  onOpenJournal,
}: {
  behavior: { behavior: string; trades: JournalEntry[] } | null;
  onClear: () => void;
  onOpenJournal: (journalId: string) => void;
}) => {
  return (
    <Collapsible open={!!behavior} onOpenChange={(isOpen) => !isOpen && onClear()} className="transition-all">
      <Card className="bg-muted/30 border-border/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <ChevronsUpDown className="h-4 w-4" />
                Trades in Focus
                {behavior && <Badge variant="secondary">{behavior.behavior}</Badge>}
              </CardTitle>
              {behavior && <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClear(); }}>Clear</Button>}
            </div>
            {!behavior && <CardDescription>Select a segment from the charts above to see the underlying trades.</CardDescription>}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {behavior?.trades && behavior.trades.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instrument</TableHead>
                    <TableHead>Result (R)</TableHead>
                    <TableHead>Emotions</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {behavior.trades.map((trade) => {
                    const pnl = trade.review?.pnl || 0;
                    const riskAmount = (trade.technical.riskPercent / 100) * 10000;
                    const rValue = riskAmount > 0 ? pnl / riskAmount : 0;
                    return (
                      <TableRow key={trade.id} className="transition-colors hover:bg-muted/50">
                        <TableCell>
                          {trade.technical.instrument} {trade.technical.direction}
                        </TableCell>
                        <TableCell className={cn("font-mono", rValue >= 0 ? "text-green-400" : "text-red-400")}>
                          {rValue.toFixed(1)}R
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(trade.review?.emotionsTags || "").split(',').filter(Boolean).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => onOpenJournal(trade.id)}>
                            Open Journal
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
                 <div className="text-center py-8">
                    <p className="text-muted-foreground">No trades found for this segment.</p>
                </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const ExportDialog = ({ isOpen, onOpenChange, title, summaryText }: { isOpen: boolean, onOpenChange: (open: boolean) => void, title: string, summaryText: string }) => {
    const { toast } = useToast();

    const handleCopy = () => {
        navigator.clipboard.writeText(summaryText);
        toast({ title: "Copied to clipboard" });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Export Snapshot: {title}</DialogTitle>
                    <DialogDescription>
                        Copy this summary to your clipboard or download it as an image (coming soon).
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4 p-4 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                    {summaryText}
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" disabled>Download as Image (soon)</Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                        <Button onClick={handleCopy}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Text
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

function GrowthPlanDialog({ isOpen, onOpenChange, onApply }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onApply: (tasks: string[]) => void }) {
    const growthPlanTasks = [
        "Cap trades/day at 3 for the next 7 days.",
        "Do not trade during Elevated/Extreme VIX periods.",
        "Journal every trade within 15 minutes of closing.",
        "Review your top 3 losing trades from this period with Arjun.",
        "Watch: 'Handling Volatility Without Emotion' video in resources.",
    ];

    const handleApply = () => {
        onApply(growthPlanTasks);
        onOpenChange(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generated Growth Plan</DialogTitle>
                    <DialogDescription>
                        Here are Arjun's recommended focus tasks for the next 7 days based on your analytics.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                    {growthPlanTasks.map((task, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-muted/50 border">
                            <Bot className="h-4 w-4 text-primary mt-1" />
                            <span className="text-sm text-muted-foreground">{task}</span>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleApply}>
                        Apply to Dashboard's "Today's Focus"
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DemoNarrativePanel({ onScrollTo }: { onScrollTo: (id: string) => void }) {
    const steps = [
        { id: "analytics-quality-badge", label: "High-Level Summary", description: "Start here to see the big picture: PnL, Win Rate, and overall quality." },
        { id: "equity", label: "Equity Curve & Events", description: "See how specific behavioral mistakes directly impacted your account balance." },
        { id: "loss-drivers", label: "Top Loss Drivers", description: "Identify which specific mistakes are costing you the most money." },
        { id: "thresholds", label: "Threshold Alerts & Guardrails", description: "Turn these data-driven insights into real-time warnings for your next trade." },
    ];
    
    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Presentation className="h-5 w-5 text-primary" /> Presentation Narrative</CardTitle>
                <CardDescription>Follow this story to demonstrate the core value loop.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                                    {index + 1}
                                </div>
                                {index < steps.length - 1 && <div className="h-8 w-px bg-primary/30" />}
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground">{step.label}</h4>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => onScrollTo(step.id)}>
                                    Go to section
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

type SortKey = "name" | "pnl" | "winRate" | "mistakeRate";

const SortableHeader = ({
  sortKey,
  label,
  sortConfig,
  onSort,
}: {
  sortKey: SortKey;
  label: string;
  sortConfig: { key: SortKey; direction: 'ascending' | 'descending' };
  onSort: (key: SortKey) => void;
}) => {
  const isSorted = sortConfig.key === sortKey;
  return (
    <TableHead>
      <Button variant="ghost" onClick={() => onSort(sortKey)} className="-ml-4">
        {label}
        {isSorted && (
          <ChevronsUpDown
            className={cn(
              "ml-2 h-4 w-4 transform",
              sortConfig.direction === 'descending' && "rotate-180"
            )}
          />
        )}
      </Button>
    </TableHead>
  );
};

type DataQuality = "Simulated" | "Partial" | "Good";

function DataQualityIndicator({ onOpen }: { onOpen: () => void }) {
    const [quality, setQuality] = useState<DataQuality>("Simulated");
    
    useEffect(() => {
        const storedEntries = localStorage.getItem("ec_journal_entries");
        if (storedEntries) {
            const parsed = JSON.parse(storedEntries);
            if (parsed.length > 0 && parsed[0].id.startsWith("demo-")) {
                setQuality("Simulated");
            } else if (parsed.length > 0) {
                const taggedCount = parsed.filter((e: any) => e.review && e.review.emotionsTags && e.review.mistakesTags).length;
                if ((taggedCount / parsed.length) > 0.7) {
                    setQuality("Good");
                } else {
                    setQuality("Partial");
                }
            }
        }
    }, []);

    const config = {
        "Simulated": { label: "Data Quality: Simulated", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
        "Partial": { label: "Data Quality: Partial", className: "bg-orange-600/20 text-orange-400 border-orange-600/30" },
        "Good": { label: "Data Quality: Good", className: "bg-green-500/20 text-green-300 border-green-500/30" },
    }[quality];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge onClick={onOpen} className={cn("cursor-pointer", config.className)}>{config.label}</Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Click to see data source details</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

const DataStatusRow = ({ label, status, description }: { label: string, status: "Live" | "Simulated" | "Mock" | "Not connected", description: string }) => {
    const config = {
        "Live": { icon: CheckCircle, className: "text-green-400" },
        "Simulated": { icon: Zap, className: "text-amber-400" },
        "Mock": { icon: Circle, className: "text-blue-400" },
        "Not connected": { icon: XCircle, className: "text-red-400" }
    };
    const { icon: Icon, className } = config[status];
    return (
        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted border">
            <Icon className={cn("h-5 w-5 mt-1 flex-shrink-0", className)} />
            <div>
                <p className="font-semibold text-foreground">{label}: <span className={className}>{status}</span></p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    );
};


export function PerformanceAnalyticsModule({ onSetModule }: PerformanceAnalyticsModuleProps) {
    const [timeRange, setTimeRange] = useState("30d");
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedStrategy, setSelectedStrategy] = useState<(any) | null>(null);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [hasData, setHasData] = useState(true);
    const [selectedBehavior, setSelectedBehavior] = useState<{ behavior: string; trades: JournalEntry[] } | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<JournalEntry | null>(null);
    const [showBehaviorLayer, setShowBehaviorLayer] = useState(true);
    const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
    const [volatilityView, setVolatilityView] = useState<'winRate' | 'avgPnL' | 'mistakes'>('winRate');
    const [compareMode, setCompareMode] = useState(false);
    const [exportData, setExportData] = useState<{ title: string, summary: string } | null>(null);
    const [isGuardrailDialogOpen, setIsGuardrailDialogOpen] = useState(false);
    const [showBehaviorHotspots, setShowBehaviorHotspots] = useState(false);
    const [hotspotMetric, setHotspotMetric] = useState<"Revenge" | "FOMO" | "Moved SL" | "Overtraded">("Revenge");
    const { toast } = useToast();
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [isGrowthPlanDialogOpen, setIsGrowthPlanDialogOpen] = useState(false);
    const [isPresentationMode, setIsPresentationMode] = useState(false);
    const [isTourOpen, setIsTourOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'pnl', direction: 'descending' });

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    const computeAnalytics = useMemo(() => (entries: JournalEntry[], compareMode: boolean) => {
      let seed = 42; // default seed
      if (typeof window !== 'undefined') {
          const storedSeed = localStorage.getItem("ec_analytics_seed");
          if (storedSeed) {
              seed = parseInt(storedSeed, 10);
          } else {
              seed = Math.floor(Math.random() * 10000);
              localStorage.setItem("ec_analytics_seed", String(seed));
          }
      }
      
      const currentPeriodData = computeSinglePeriodAnalytics(entries, seededRandom(seed));

      if (compareMode) {
          const previousPeriodSeed = seed + 1; // Use a different seed for the previous period
          const mockPreviousPeriodEntries = entries.map(e => ({...e})); // shallow copy for mock
          const previousPeriodData = computeSinglePeriodAnalytics(mockPreviousPeriodEntries, seededRandom(previousPeriodSeed));
          return { current: currentPeriodData, previous: previousPeriodData };
      }

      return { current: currentPeriodData, previous: null };

    }, []);

    const [analyticsData, setAnalyticsData] = useState<ReturnType<typeof computeAnalytics> | null>(null);

    const loadData = useCallback(() => {
        const storedEntries = localStorage.getItem("ec_journal_entries");
        if (storedEntries) {
            const parsed = JSON.parse(storedEntries);
            setJournalEntries(parsed);
            
            let filteredEntries = parsed;
            if (debouncedSearchQuery) {
                 filteredEntries = parsed.filter((entry: JournalEntry) => 
                    entry.technical.instrument.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                    entry.review?.emotionalNotes?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
                );
            }

            setAnalyticsData(computeAnalytics(filteredEntries, compareMode));
            setHasData(parsed.length > 0);
        } else {
            setHasData(false);
            setAnalyticsData(null);
        }
    }, [computeAnalytics, compareMode, debouncedSearchQuery]);

    useEffect(() => {
        const handler = setTimeout(() => {
            loadData();
        }, 300);
        return () => clearTimeout(handler);
    }, [loadData, debouncedSearchQuery]);

    useEffect(() => {
        loadData();
    }, [loadData, compareMode]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const savedState = localStorage.getItem("ec_analytics_ui_state");
                if (savedState) {
                    const { activeTab, compareMode, timeRange, showBehaviorHotspots, hotspotMetric, isPresentationMode } = JSON.parse(savedState);
                    setActiveTab(activeTab || 'overview');
                    setCompareMode(compareMode || false);
                    setTimeRange(timeRange || '30d');
                    setShowBehaviorHotspots(showBehaviorHotspots || false);
                    setHotspotMetric(hotspotMetric || 'Revenge');
                    setIsPresentationMode(isPresentationMode || false);
                }
            } catch (error) {
                console.error("Failed to parse analytics UI state from localStorage", error);
            }
             setIsRecoveryMode(localStorage.getItem('ec_recovery_mode') === 'true');
            
            const tourSeen = localStorage.getItem('ec_analytics_tour_seen');
            if (!tourSeen) {
                setIsTourOpen(true);
                localStorage.setItem('ec_analytics_tour_seen', 'true');
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const stateToSave = JSON.stringify({ activeTab, compareMode, timeRange, showBehaviorHotspots, hotspotMetric, isPresentationMode });
                localStorage.setItem("ec_analytics_ui_state", stateToSave);
            } catch (error) {
                console.error("Failed to save analytics UI state to localStorage", error);
            }
        }
    }, [activeTab, compareMode, timeRange, showBehaviorHotspots, hotspotMetric, isPresentationMode]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    }

    const handleEventClick = (journalId: string | null) => {
        if (!journalId) return;
        const entry = journalEntries.find(e => e.id === journalId);
        if (entry) {
            setSelectedEvent(entry);
        }
    };
    
    const generateDemoData = () => {
        let seed = 42;
        if (typeof window !== 'undefined') {
            const storedSeed = localStorage.getItem("ec_analytics_seed");
            if (storedSeed) {
                seed = parseInt(storedSeed, 10);
            } else {
                seed = Math.floor(Math.random() * 10000);
                localStorage.setItem("ec_analytics_seed", String(seed));
            }
        }
        const random = seededRandom(seed);

        const strategies = ["Breakout Trend", "Mean Reversion", "Scalp Momentum", "Range Fade"];
        const instruments = ["BTC-PERP", "ETH-PERP", "SOL-PERP", "AVAX-PERP"];
        const directions: ("Long" | "Short")[] = ["Long", "Short"];
        const sessions = ["Asia", "London", "New York"];
        const emotionTags = ["FOMO", "Fear", "Anxious", "Revenge", "Calm", "Focused", "Confident", "Bored"];
        const mistakeTags = ["Moved SL", "Exited early", "Exited late", "Oversized risk", "Forced Entry", "None (disciplined)"];

        const numTrades = 60;
        const numDays = 30;
        let lastResult: 'win' | 'loss' = 'win';
        let consecutiveLosses = 0;

        const entries: JournalEntry[] = [];
        let runningPnl = 0;

        for (let i = 0; i < numTrades; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(random() * numDays));
            const strategy = strategies[Math.floor(random() * strategies.length)];
            const direction = directions[Math.floor(random() * directions.length)];
            
            const isRevengeTrade = consecutiveLosses >= 2 && random() < 0.6;
            const vixRoll = random();
            const vixZone = vixRoll < 0.6 ? 'Normal' : vixRoll < 0.9 ? 'Elevated' : 'Extreme';

            let emotions = ["Focused"];
            if (isRevengeTrade) emotions.push("Revenge");
            if (random() < 0.2) emotions.push(emotionTags[Math.floor(random() * emotionTags.length)]);

            let mistakes = [];
            if (vixZone === 'Elevated' && random() < 0.4) mistakes.push("Moved SL");
            if (isRevengeTrade) mistakes.push("Forced Entry");
            if (random() < 0.1) mistakes.push(mistakeTags[Math.floor(random() * mistakeTags.length)]);
            if (mistakes.length === 0 && random() < 0.7) mistakes.push("None (disciplined)");
            else if (mistakes.length === 0) mistakes.push("Exited early");

            const entryPrice = 50000 + random() * 20000;
            const riskPercent = 0.5 + random() * 2.5;
            const riskAmount = 10000 * (riskPercent / 100);

            const stopDistance = entryPrice * (0.005 + random() * 0.015);
            const stopLoss = direction === 'Long' ? entryPrice - stopDistance : entryPrice + stopDistance;

            const rrrRoll = random();
            let rrr = 1.5 + random();
            if (rrrRoll < 0.2) rrr = 0.8 + random() * 0.5; // low RRR

            const takeProfit = direction === 'Long' ? entryPrice + (stopDistance * rrr) : entryPrice - (stopDistance * rrr);

            let winRoll = random();
            if (mistakes.includes("Forced Entry")) winRoll += 0.3; // Lower win chance
            if (strategy === "Mean Reversion") winRoll -= 0.15; // Higher win chance
            if (isRevengeTrade) winRoll += 0.4;
            
            const isWin = winRoll < 0.55;

            let pnl;
            if (isWin) {
                pnl = riskAmount * rrr * (0.8 + random() * 0.4);
                lastResult = 'win';
                consecutiveLosses = 0;
            } else {
                pnl = -riskAmount * (0.9 + random() * 0.2);
                lastResult = 'loss';
                consecutiveLosses++;
            }
            if (isRevengeTrade) pnl = -riskAmount * (1 + random());

            runningPnl += pnl;

            entries.push({
                id: `demo-${i}`,
                tradeId: `DEMO-${1000 + i}`,
                status: 'completed',
                timestamps: {
                    plannedAt: date.toISOString(),
                    executedAt: date.toISOString(),
                    closedAt: new Date(date.getTime() + (1000 * 60 * (30 + random() * 120))).toISOString(),
                },
                technical: {
                    instrument: instruments[Math.floor(random() * instruments.length)],
                    direction,
                    entryPrice,
                    stopLoss,
                    takeProfit,
                    leverage: [10, 20, 50][Math.floor(random() * 3)],
                    positionSize: riskAmount / stopDistance,
                    riskPercent: riskPercent,
                    rrRatio: rrr,
                    strategy,
                },
                planning: {
                    planNotes: "Demo generated trade plan.",
                    mindset: "Neutral"
                },
                review: {
                    pnl,
                    exitPrice: isWin ? takeProfit : stopLoss,
                    emotionsTags: [...new Set(emotions)].join(','),
                    mistakesTags: [...new Set(mistakes)].join(','),
                    learningNotes: "This is a demo-generated learning note."
                },
                meta: {
                    journalingCompletedAt: new Date(date.getTime() + (1000 * 60 * (150 + random() * 60))).toISOString(),
                    ruleAdherenceSummary: {
                        followedEntryRules: random() < 0.8,
                        movedSL: mistakes.includes("Moved SL"),
                        exitedEarly: mistakes.includes("Exited early"),
                        rrBelowMin: rrr < 1.5,
                    }
                }
            });
        }
        localStorage.setItem("ec_journal_entries", JSON.stringify(entries));
        loadData();
        toast({ title: "Demo Data Generated", description: `${numTrades} realistic trades have been added to your journal.` });
    };

    const clearDemoData = () => {
        localStorage.removeItem("ec_journal_entries");
        localStorage.removeItem("ec_analytics_seed");
        loadData();
        toast({ title: "Demo Data Cleared", variant: "destructive" });
    }

    const sortedStrategies = useMemo(() => {
        if (!analyticsData?.current?.mockStrategyData) return [];
        const sortableStrategies = [...analyticsData.current.mockStrategyData];
        sortableStrategies.sort((a, b) => {
            if (sortConfig.key === 'name') {
                return a.name.localeCompare(b.name) * (sortConfig.direction === 'ascending' ? 1 : -1);
            }
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableStrategies;
    }, [analyticsData, sortConfig]);

    const handleSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        // Default PnL to descending, Mistake Rate to ascending
        if (key !== sortConfig.key) {
            if (key === 'pnl') direction = 'descending';
            if (key === 'mistakeRate') direction = 'ascending';
        }

        setSortConfig({ key, direction });
    };
    
    const handleApplyGuardrails = () => {
        setIsGuardrailDialogOpen(true);
    };

    const handleApplyGrowthPlan = (tasks: string[]) => {
        localStorage.setItem("ec_growth_plan_today", JSON.stringify(tasks));
        toast({
            title: "Growth Plan Applied",
            description: "Your 'Today's Focus' on the dashboard has been updated.",
        });
    }
    
    const handleScrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    
    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg min-h-[60vh]">
                <BarChartIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-2xl font-bold">No Analytics Data</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                    To unlock these insights, you need to complete some journal entries. This data powers all of Arjun's analysis.
                </p>
                <div className="mt-6 flex gap-4">
                    <Button onClick={generateDemoData}><Zap className="mr-2 h-4 w-4" /> Generate Demo Dataset</Button>
                    <Button variant="outline" onClick={() => onSetModule('tradeJournal')}><BookOpen className="mr-2 h-4 w-4" /> Go to Journal</Button>
                </div>
            </div>
        )
    }

    if (!analyticsData?.current) {
        return <p>Loading...</p>; // Or a skeleton loader
    }

    const { current: currentData, previous: previousData } = analyticsData;
    const { wins, losses, totalTrades, winRate, lossRate, avgRR, totalPnL, quality, scores, discipline, topLossDrivers, mockEquityData, topEvents, mockStrategyData, timingHeatmapData, volatilityData, emotionResultMatrixData, radarChartData, planAdherence, disciplineBreakdown, disciplineByVolatility, bestCondition } = currentData;
    
    const equityChartData = mockEquityData.map((d: any, i: number) => ({
      ...d,
      previousEquity: previousData?.mockEquityData[i]?.equity,
    }));
    
    const getDelta = (current: number, previous?: number) => previous !== undefined ? current - previous : 0;
    
    const getHeatmapColor = (pnl: number) => {
        if (pnl > 500) return 'bg-green-500/60';
        if (pnl > 0) return 'bg-green-500/30';
        if (pnl < -500) return 'bg-red-500/60';
        if (pnl < 0) return 'bg-red-500/30';
        return 'bg-muted/50';
    };

    const getBehaviorHeatmapStyle = (block: any, metric: typeof hotspotMetric) => {
        const metricKey = {
            'Revenge': 'revenge',
            'FOMO': 'fomo',
            'Moved SL': 'slMoved',
            'Overtraded': 'overtraded',
        }[metric];

        const count = block[metricKey];
        if (count === 0) return { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' };
        
        const opacity = Math.min(1, 0.2 + count / 5);
        return {
            background: `hsla(var(--destructive-hsl), ${opacity})`,
            color: `hsl(var(--destructive-foreground))`,
        };
    };

    const handleExport = (title: string, data: any) => {
      const summaryText = `
Analytics Snapshot: ${title}
-----------------------------
Data as of: ${new Date().toLocaleString()}
Period: Last ${timeRange}
-----------------------------
${JSON.stringify(data, null, 2)}
      `.trim();
      setExportData({ title, summary: summaryText });
    };

    return (
        <div className="space-y-8">
            <AnalyticsTour isOpen={isTourOpen} onOpenChange={setIsTourOpen} />
            <ExportDialog isOpen={!!exportData} onOpenChange={(open) => !open && setExportData(null)} title={exportData?.title || ""} summaryText={exportData?.summary || ""} />
             <Dialog open={isGuardrailDialogOpen} onOpenChange={setIsGuardrailDialogOpen}>
                <GuardrailDialog />
            </Dialog>
             <Dialog open={isGrowthPlanDialogOpen} onOpenChange={setIsGrowthPlanDialogOpen}>
                <GrowthPlanDialog isOpen={isGrowthPlanDialogOpen} onOpenChange={setIsGrowthPlanDialogOpen} onApply={handleApplyGrowthPlan} />
            </Dialog>

            <Drawer open={isDataSourcesOpen} onOpenChange={setIsDataSourcesOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>About Your Analytics Data</DrawerTitle>
                        <DrawerDescription>This prototype uses a mix of real and simulated data.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                        <DataStatusRow 
                            label="Journal Tags"
                            status="Live"
                            description="Emotions, mistakes, and strategies you tag in your journal directly power the behavioral analytics."
                        />
                         <DataStatusRow 
                            label="Trade PnL & Executions"
                            status="Simulated"
                            description="PnL, equity curves, and trade execution data are generated by a script to tell a realistic story."
                        />
                         <DataStatusRow 
                            label="Broker Data (Account Balance)"
                            status="Not connected"
                            description="In the live product, this will come from your connected broker API for a complete financial picture."
                        />
                        <DataStatusRow 
                            label="Market Data (VIX)"
                            status="Simulated"
                            description="Volatility data is currently simulated based on the chosen demo scenario."
                        />
                    </div>
                </DrawerContent>
            </Drawer>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Performance Analytics</h1>
                    <p className="text-muted-foreground">Go beyond P&L to understand your true edge.</p>
                </div>
                <div className="flex items-center gap-2 self-start">
                    <DataQualityIndicator onOpen={() => setIsDataSourcesOpen(true)} />
                    <Button variant="outline" size="sm" onClick={() => setIsTourOpen(true)}>
                        <View className="mr-2 h-4 w-4" /> 2-Min Tour
                    </Button>
                     <Button variant="outline" size="sm" onClick={() => setIsPresentationMode(prev => !prev)}>
                        <Presentation className="mr-2 h-4 w-4" /> {isPresentationMode ? 'Exit' : 'Enter'} Demo Mode
                    </Button>
                    {isRecoveryMode && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Recovery Mode ON</Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Your Trade Planning has stricter risk limits active.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>

            {isPresentationMode && <DemoNarrativePanel onScrollTo={handleScrollTo} />}

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4", isPresentationMode && "hidden")}>
                    <TabsList className="grid w-full grid-cols-2 max-w-sm md:w-auto">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="by-behaviour">By Behaviour</TabsTrigger>
                    </TabsList>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                            {(['7d', '30d', '90d', 'all'] as const).map(range => (
                                <Button
                                    key={range}
                                    size="sm"
                                    variant={timeRange === range ? 'secondary' : 'ghost'}
                                    onClick={() => setTimeRange(range)}
                                    className="rounded-full h-8 px-3 text-xs w-full"
                                >
                                    {range.toUpperCase()}
                                </Button>
                            ))}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="compare-mode" checked={compareMode} onCheckedChange={setCompareMode} />
                            <Label htmlFor="compare-mode" className="text-sm">Compare</Label>
                        </div>
                        <Button variant="outline" size="sm" onClick={generateDemoData}><Zap className="mr-2 h-4 w-4"/> Regenerate Data</Button>
                        <Button variant="destructive" size="sm" onClick={clearDemoData}>Clear Data</Button>
                        
                        <Dialog open={isGuardrailDialogOpen} onOpenChange={setIsGuardrailDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" id="analytics-guardrails-button">
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Guardrails
                                </Button>
                            </DialogTrigger>
                            <GuardrailDialog />
                        </Dialog>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsDataSourcesOpen(true)}>
                                    <Database className="mr-2 h-4 w-4" /> Data Sources
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </div>
                </div>
                <TabsContent value="overview" className="mt-6 space-y-8">
                    <PinnedInsightsCard analyticsData={analyticsData} onSetModule={onSetModule} onApplyGuardrails={handleApplyGuardrails} />
                    {/* --- Overview Tab --- */}
                    <SectionCard
                        id="summary"
                        title="High-Level Summary"
                        description={`Your performance snapshot for the last ${timeRange}.`}
                        icon={BarChartIcon}
                        headerContent={
                             <Badge id="analytics-quality-badge" variant="outline" className={cn(
                                "text-base px-3 py-1",
                                quality === "Disciplined" && "bg-green-500/20 text-green-300 border-green-500/30",
                                quality === "Emotional" && "bg-red-500/20 text-red-300 border-red-500/30"
                            )}>
                                Quality: {quality}
                            </Badge>
                        }
                    >
                         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard title="Total PnL" value={`$${totalPnL.toFixed(2)}`} hint={`${totalTrades} trades`} delta={getDelta(totalPnL, previousData?.totalPnL)} deltaUnit="$" />
                            <MetricCard title="Win Rate" value={`${winRate.toFixed(0)}%`} hint={`${wins}W / ${losses}L`} delta={getDelta(winRate, previousData?.winRate)} deltaUnit="%" />
                            <MetricCard title="Avg. R:R" value={`${avgRR.toFixed(2)}`} hint="Avg win / Avg loss" delta={getDelta(avgRR, previousData?.avgRR)} />
                            <MetricCard title="Best Condition" value={bestCondition} hint="VIX Zone / Session" />
                        </div>
                    </SectionCard>
                    
                    <SectionCard
                        id="equity"
                        title="Behaviour Events Timeline"
                        description="See how specific events impacted your equity curve."
                        icon={Activity}
                        headerContent={
                            <div className="flex items-center space-x-2">
                                <Switch id="show-behavior-layer" checked={showBehaviorLayer} onCheckedChange={setShowBehaviorLayer} />
                                <Label htmlFor="show-behavior-layer" className="text-sm">Show events</Label>
                            </div>
                        }
                        onExport={() => handleExport("Equity Curve", { data: equityChartData })}
                    >
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <ChartContainer config={{}} className="h-64 w-full">
                                    <LineChart data={equityChartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString()} tick={{fontSize: 12}} />
                                        <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{fontSize: 12}} domain={['dataMin - 100', 'dataMax + 100']} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        {compareMode && <Line type="monotone" dataKey="previousEquity" stroke="hsl(var(--border))" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Previous Period" />}
                                        <Line type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Current Period" />
                                        {showBehaviorLayer && topEvents.map((event: any, index: number) => (
                                            <ReferenceDot
                                                key={index}
                                                x={event.date}
                                                y={equityChartData.find((d: any) => d.date === event.date)?.equity}
                                                r={5}
                                                fill={event.impact > 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))"}
                                                stroke="hsl(var(--background))"
                                                strokeWidth={2}
                                                isFront={true}
                                                tabIndex={0}
                                                aria-label={`Behavioral Event: ${event.label} on trade with PnL ${event.impact.toFixed(2)}. Press Enter to view details.`}
                                                className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full cursor-pointer motion-reduce:animate-none"
                                                onClick={() => handleEventClick(event.journalId)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleEventClick(event.journalId)}
                                            />
                                        ))}
                                    </LineChart>
                                </ChartContainer>
                            </div>
                            <div className="lg:col-span-1">
                                <h4 className="font-semibold text-foreground mb-3">Key Events</h4>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {topEvents.length > 0 ? topEvents.map((event: any, i: number) => (
                                        <Card key={i} className="bg-muted/50 border-border/50 p-3 cursor-pointer hover:bg-muted" onClick={() => handleEventClick(event.journalId)}>
                                            <div className="flex justify-between items-center text-sm">
                                                <Badge variant="destructive" className={cn("text-xs", event.impact > 0 && "bg-green-500/20 text-green-300 border-green-500/30")}>{event.label}</Badge>
                                                <p className={cn("font-mono font-semibold", event.impact > 0 ? "text-green-400" : "text-red-400")}>{event.impact > 0 ? '+' : ''}${event.impact.toFixed(2)}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{new Date(event.date).toLocaleDateString()} on {event.instrument}</p>
                                        </Card>
                                    )) : <p className="text-sm text-muted-foreground">No significant behavioral events in this period.</p>}
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                    
                    <SectionCard
                        id="loss-drivers"
                        title="Top Loss Drivers"
                        description="The specific behaviors and emotions costing you the most money."
                        icon={AlertCircle}
                    >
                        {topLossDrivers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Behavior Tag</TableHead>
                                        <TableHead>Occurrences</TableHead>
                                        <TableHead>Total Impact (R)</TableHead>
                                        <TableHead>Avg. Impact (R)</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topLossDrivers.slice(0, 5).map(driver => (
                                        <TableRow key={driver.behavior}>
                                            <TableCell>
                                                <Badge variant={driver.totalR > 0 ? 'secondary' : 'destructive'}>{driver.behavior}</Badge>
                                            </TableCell>
                                            <TableCell>{driver.occurrences}</TableCell>
                                            <TableCell className="font-mono text-red-400">{driver.totalR.toFixed(1)}R</TableCell>
                                            <TableCell className="font-mono text-red-400">{driver.avgR.toFixed(1)}R</TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setSelectedBehavior({ behavior: driver.behavior, trades: driver.trades })}>
                                                            <View className="mr-2 h-4 w-4" /> View Trades
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={handleApplyGuardrails}>
                                                            <ShieldCheck className="mr-2 h-4 w-4" /> Set Guardrail
                                                        </DropdownMenuItem>
                                                         <DropdownMenuItem onClick={() => onSetModule('aiCoaching', { initialMessage: `Arjun, my biggest loss driver is "${driver.behavior}". How can I fix this?` })}>
                                                            <Bot className="mr-2 h-4 w-4" /> Ask Arjun
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : <p className="text-sm text-muted-foreground">No significant loss drivers identified yet.</p>}
                    </SectionCard>

                    <TradesInFocusPanel 
                        behavior={selectedBehavior}
                        onClear={() => setSelectedBehavior(null)}
                        onOpenJournal={(journalId) => onSetModule('tradeJournal', { draftId: journalId })}
                    />
                </TabsContent>
                <TabsContent value="by-behaviour" className="mt-6 space-y-8">
                    <PinnedInsightsCard analyticsData={analyticsData} onSetModule={onSetModule} onApplyGuardrails={handleApplyGuardrails} />
                    <SectionCard
                        id="discipline-scores"
                        title="Behaviour Scores"
                        description="Your psychological fingerprint, quantified over time."
                        icon={Gauge}
                    >
                         <div className="grid md:grid-cols-3 gap-8">
                            <ScoreGauge score={scores.disciplineScore} delta={getDelta(scores.disciplineScore, previousData?.scores.disciplineScore)} label="Discipline" interpretation={scores.disciplineScore > 70 ? 'Consistent' : scores.disciplineScore > 40 ? 'Inconsistent' : 'Poor'} />
                            <ScoreGauge score={scores.emotionalScore} delta={getDelta(scores.emotionalScore, previousData?.scores.emotionalScore)} label="Emotional Control" interpretation={scores.emotionalScore < 30 ? 'Controlled' : scores.emotionalScore < 60 ? 'Reactive' : 'Impulsive'} />
                            <ScoreGauge score={scores.consistencyScore} delta={getDelta(scores.consistencyScore, previousData?.scores.consistencyScore)} label="Consistency" interpretation={scores.consistencyScore > 70 ? 'High' : 'Medium'} />
                         </div>
                    </SectionCard>
                    
                    <SectionCard
                        id="psych-profile"
                        title="Psychological Profile"
                        description="Your primary behavioral tendencies visualized."
                        icon={Brain}
                    >
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="h-80">
                                <RadarChart data={radarChartData} onSetModule={onSetModule} />
                            </div>
                            <div className="space-y-4">
                                <h4 className="font-semibold text-foreground">What this means:</h4>
                                <p className="text-sm text-muted-foreground">
                                    This radar chart shows your most frequent behaviors. Areas that are further from the center represent stronger tendencies. Your profile shows a high tendency for <strong className="text-primary">{radarChartData[0]?.axis || "FOMO"}</strong> and low <strong className="text-primary">{radarChartData[5]?.axis || "Discipline"}</strong>.
                                </p>
                                <Button variant="outline" onClick={() => onSetModule('aiCoaching', { initialMessage: "Arjun, let's break down my psychological profile."})}>
                                    <Bot className="mr-2 h-4 w-4" /> Discuss with Arjun
                                </Button>
                            </div>
                        </div>
                    </SectionCard>
                    
                    <SectionCard
                        id="thresholds"
                        title="Threshold Alerts"
                        description="Key behavioral patterns Arjun is watching for you."
                        icon={Flag}
                    >
                         <div className="space-y-3">
                             <Alert variant="default" className="bg-amber-950/40 border-amber-500/20 text-amber-300">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                <AlertTitle className="text-amber-400">After 2 consecutive losses, your win rate drops to 14%.</AlertTitle>
                            </Alert>
                             <Alert variant="default" className="bg-amber-950/40 border-amber-500/20 text-amber-300">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                <AlertTitle className="text-amber-400">When VIX is 'Elevated', your 'Moved SL' rate doubles.</AlertTitle>
                            </Alert>
                             <Alert variant="default" className="bg-amber-950/40 border-amber-500/20 text-amber-300">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                <AlertTitle className="text-amber-400">After a win > 3R, you oversize risk on the next trade 28% of the time.</AlertTitle>
                            </Alert>
                             <Alert variant="default" className="bg-green-950/50 border-green-500/20 text-green-300">
                                 <CheckCircle className="h-4 w-4 text-green-400" />
                                <AlertTitle className="text-green-400">When you journal within 15 minutes, your next-day loss rate decreases.</AlertTitle>
                            </Alert>
                        </div>
                         <div className="mt-6 flex justify-end">
                            <Button onClick={handleApplyGuardrails}>
                                <ShieldCheck className="mr-2 h-4 w-4" /> Turn on Recommended Guardrails
                            </Button>
                        </div>
                    </SectionCard>

                    <SectionCard
                        id="plan-adherence"
                        title="Plan Adherence"
                        description="How well are you following your own rules?"
                        icon={Award}
                    >
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <MetricCard title="Adherence Rate" value={`${planAdherence.adherenceRate.toFixed(0)}%`} hint="Trades that followed plan exactly" />
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Followed plan: {planAdherence.followedPlan} trades</p>
                                    <p className="text-sm text-muted-foreground">Minor deviations: {planAdherence.minorDeviations} trades</p>
                                    <p className="text-sm text-muted-foreground">Major violations: {planAdherence.majorViolations} trades</p>
                                </div>
                            </div>
                             <ChartContainer config={{}} className="h-64">
                                <BarChart
                                    data={[
                                        { name: 'Followed Plan', value: planAdherence.followedPlan, fill: 'hsl(var(--chart-2))' },
                                        { name: 'Minor Deviations', value: planAdherence.minorDeviations, fill: 'hsl(var(--chart-4))' },
                                        { name: 'Major Violations', value: planAdherence.majorViolations, fill: 'hsl(var(--chart-5))' },
                                    ]}
                                    layout="vertical"
                                    margin={{ left: 20 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" hide />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
                                    <Bar dataKey="value" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </SectionCard>
                </TabsContent>
            </Tabs>
            <Drawer open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DrawerContent>
                    {selectedEvent && (
                        <div className="mx-auto w-full max-w-lg p-4">
                             <DrawerHeader>
                                <DrawerTitle>Trade Details</DrawerTitle>
                                <DrawerDescription>
                                    A snapshot of the trade associated with this event.
                                </DrawerDescription>
                            </DrawerHeader>
                            <div className="p-4">
                                {/* Simplified view for the drawer */}
                                <p><strong>Instrument:</strong> {selectedEvent.technical.instrument}</p>
                                <p><strong>Direction:</strong> {selectedEvent.technical.direction}</p>
                                <p><strong>PnL:</strong> ${selectedEvent.review?.pnl.toFixed(2)}</p>
                                <p><strong>Mistake:</strong> {selectedEvent.review?.mistakesTags}</p>
                                <Button className="mt-4 w-full" onClick={() => { setSelectedEvent(null); onSetModule('tradeJournal', { draftId: selectedEvent.id })}}>
                                    Open Full Journal Entry
                                </Button>
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}

const computeSinglePeriodAnalytics = (entries: JournalEntry[], random: () => number) => {
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
    const fearCount = emotionTags.filter(t => t === 'Fear').length;
    
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

    const mockEquityData = entries.reduce((acc: any[], entry, i) => {
        const prevEquity = acc.length > 0 ? acc[acc.length - 1].equity : 10000;
        let pnl = entry.review?.pnl || 0;

        const isRevenge = (entry.review?.mistakesTags || "").includes("Revenge");
        const isDisciplined = (entry.review?.mistakesTags || "").includes("None (disciplined)");
        
        if (isRevenge && pnl >= 0) {
            pnl = -Math.abs(pnl) * 1.5; // Ensure revenge trades are mostly losses
        } else if (isDisciplined && pnl < 0) {
            pnl = Math.abs(pnl) * 0.5; // Disciplined losses are smaller
        }


        const equity = prevEquity + pnl;
        const hasMarker = entry.review?.mistakesTags && entry.review.mistakesTags !== "None (disciplined)";
        
        acc.push({
          date: entry.timestamps.executedAt,
          equity,
          marker: hasMarker ? { type: entry.review?.mistakesTags?.split(',')[0], color: "hsl(var(--chart-5))", pnl: entry.review?.pnl } : null,
          journalId: entry.id,
        });
        return acc;
      }, []);
    
    const topEvents = entries.filter(e => e.review?.mistakesTags && e.review.mistakesTags !== "None (disciplined)")
      .map(e => ({
          date: e.timestamps.executedAt,
          label: e.review!.mistakesTags!.split(',')[0],
          impact: e.review!.pnl,
          instrument: e.technical.instrument,
          journalId: e.id,
      }))
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    const mockStrategyData = [
      { name: "Breakout", trades: Math.floor(random() * 50) + 20, winRate: 40 + Math.floor(random() * 20), mistakeRate: 20 + Math.floor(random() * 10), avgR: 1.5 + random() * 0.5, pnl: 2000 + random() * 1000, topMistake: "Exited early", emotionMix: [{emotion: 'FOMO', percentage: 25}, {emotion: 'Confident', percentage: 40}] },
      { name: "Mean Reversion", trades: Math.floor(random() * 50) + 20, winRate: 60 + Math.floor(random() * 15), mistakeRate: 10 + Math.floor(random() * 5), avgR: 0.8 + random() * 0.3, pnl: 1000 + random() * 500, topMistake: "Moved SL", emotionMix: [{emotion: 'Anxious', percentage: 30}, {emotion: 'Calm', percentage: 50}] },
      { name: "Trend Following", trades: Math.floor(random() * 30) + 15, winRate: 35 + Math.floor(random() * 15), mistakeRate: 30 + Math.floor(random() * 15), avgR: 2.2 + random() * 0.8, pnl: 2500 + random() * 1500, topMistake: "Forced Entry", emotionMix: [{emotion: 'Confident', percentage: 45}, {emotion: 'Greed', percentage: 20}] },
      { name: "Range Play", trades: Math.floor(random() * 20) + 10, winRate: 65 + Math.floor(random() * 10), mistakeRate: 40 + Math.floor(random() * 20), avgR: 0.6 + random() * 0.2, pnl: -200 - random() * 500, topMistake: "Oversized risk", emotionMix: [{emotion: 'Bored', percentage: 40}, {emotion: 'Hope', percentage: 30}] },
    ];

    const timingHeatmapData = {
        sessions: [
            { name: "Asia", totalPnl: 600 + random() * 400, blocks: [ { time: "00-04", pnl: 100 + random() * 200, trades: 5 + Math.floor(random() * 10), fomo: 1, revenge: 0, slMoved: 0, overtraded: 0 }, { time: "04-08", pnl: 400 + random() * 300, trades: 10 + Math.floor(random() * 10), fomo: 0, revenge: 0, slMoved: 1, overtraded: 0 } ] },
            { name: "London", totalPnl: -1000 - random() * 500, blocks: [ { time: "08-12", pnl: -1000 - random() * 500, trades: 20 + Math.floor(random() * 10), fomo: 3, revenge: 2, slMoved: 4, overtraded: 1 } ] },
            { name: "New York", totalPnl: 3000 + random() * 1000, blocks: [ { time: "12-16", pnl: 1800 + random() * 500, trades: 25 + Math.floor(random() * 10), fomo: 2, revenge: 1, slMoved: 2, overtraded: 2 }, { time: "16-20", pnl: 1200 + random() * 500, trades: 15 + Math.floor(random() * 10), fomo: 0, revenge: 0, slMoved: 0, overtraded: 0 } ] },
        ],
        timeBlocks: ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"],
    };

    const volatilityData = [
        { vixZone: "Calm", trades: 40 + Math.floor(random() * 20), winRate: 55 + Math.floor(random() * 10), mistakesCount: 3 + Math.floor(random() * 5), avgPnL: 1200 + random() * 500 },
        { vixZone: "Normal", trades: 70 + Math.floor(random() * 20), winRate: 50 + Math.floor(random() * 10), mistakesCount: 8 + Math.floor(random() * 8), avgPnL: 2000 + random() * 500 },
        { vixZone: "Elevated", trades: 20 + Math.floor(random() * 10), winRate: 35 + Math.floor(random() * 10), mistakesCount: 8 + Math.floor(random() * 5), avgPnL: -600 - random() * 400 },
        { vixZone: "Extreme", trades: 3 + Math.floor(random() * 5), winRate: 15 + Math.floor(random() * 10), mistakesCount: 2 + Math.floor(random() * 3), avgPnL: -1200 - random() * 500 },
    ];
    
    const emotionResultMatrixData = {
        emotions: ["FOMO", "Fear", "Anxious", "Revenge", "Calm", "Focused"],
        results: ["Big Loss (≤-2R)", "Loss (-2R to 0)", "Win (0 to +2R)", "Big Win (≥+2R)"],
        data: Array.from({ length: 6 }, () => Array.from({ length: 4 }, () => Math.floor(random() * 15))),
        maxCount: 15,
    };

    const normalize = (val: number, max: number) => Math.min(100, Math.max(0, (val / max) * 100));

    const radarChartData = [
      { axis: "FOMO", value: normalize(fomoCount, 10), count: fomoCount, impact: "-1.2R" },
      { axis: "Revenge", value: normalize(revengeCount, 5), count: revengeCount, impact: "-2.5R" },
      { axis: "Fear", value: normalize(fearCount, 15), count: fearCount, impact: "-0.8R" },
      { axis: "Overconfidence", value: normalize(overconfidenceCount, 8), count: overconfidenceCount, impact: "-0.5R" },
      { axis: "Overtrading", value: normalize(overtradedCount, 10), count: overtradedCount, impact: "-1.1R" },
      { axis: "SL Discipline", value: 100 - normalize(slMovedCount, 8), count: slMovedCount, impact: "-3.2R" },
    ];
    
    const followedPlan = completedEntries.filter(e => e.review?.mistakesTags === "None (disciplined)").length;
    const minorDeviations = completedEntries.filter(e => e.review?.mistakesTags?.includes("Exited early")).length;
    const majorViolations = completedEntries.length - followedPlan - minorDeviations;
    
    const planAdherence = {
      followedPlan,
      minorDeviations,
      majorViolations,
      adherenceRate: totalTrades > 0 ? (followedPlan / totalTrades) * 100 : 0
    };

    const disciplineBreakdown = [
      { violation: "Moved SL", frequency: slMovedCount, avgR: -1.8, trades: [] },
      { violation: "Risk oversized", frequency: 5, avgR: -2.2, trades: [] },
      { violation: "R:R below minimum", frequency: 12, avgR: -0.4, trades: [] },
      { violation: "Traded in high VIX", frequency: 8, avgR: -1.1, trades: [] },
      { violation: "Skipped journal", frequency: 2, avgR: 0, trades: [] },
    ];

    const disciplineByVolatility = [
      { vixZone: "Calm", planAdherence: 90, slMovedPct: 5, revengeCount: 0, avgR: 0.8 },
      { vixZone: "Normal", planAdherence: 85, slMovedPct: 10, revengeCount: 1, avgR: 0.6 },
      { vixZone: "Elevated", planAdherence: 60, slMovedPct: 25, revengeCount: 3, avgR: -0.9 },
      { vixZone: "Extreme", planAdherence: 40, slMovedPct: 40, revengeCount: 2, avgR: -1.8 },
    ];

    return {
        totalTrades, wins, losses, winRate, lossRate, avgRR, totalPnL,
        bestCondition: "Normal VIX / NY Session", quality,
        discipline: { slRespectedPct: 100 - slMovedPct, slMovedPct, slRemovedPct: 3, tpExitedEarlyPct: 25, avgRiskPct: 1.1, riskOverLimitPct: 15 },
        scores: { disciplineScore, emotionalScore, consistencyScore },
        topLossDrivers,
        mockEquityData, topEvents, mockStrategyData, timingHeatmapData, volatilityData,
        emotionResultMatrixData,
        radarChartData,
        planAdherence,
        disciplineBreakdown,
        disciplineByVolatility,
    };
  }
