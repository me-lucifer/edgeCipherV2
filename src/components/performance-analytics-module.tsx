
      "use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon, Brain, Calendar, Filter, AlertCircle, Info, TrendingUp, TrendingDown, Users, DollarSign, Target, Gauge, Zap, Award, ArrowRight, XCircle, CheckCircle, Circle, Bot, AlertTriangle, Clipboard, Star, Activity, BookOpen, BarChartHorizontal, Database, View, Flag, Presentation, ChevronsUpDown, Copy } from "lucide-react";
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


const SectionCard: React.FC<{id?: string, title: React.ReactNode, description: string, icon: React.ElementType, children: React.ReactNode, headerContent?: React.ReactNode, onExport?: () => void}> = ({ id, title, description, icon: Icon, children, headerContent, onExport }) => (
    <Card id={id} className="bg-muted/30 border-border/50 scroll-mt-40 animate-in fade-in-50 duration-500">
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
    <Card className={cn("bg-muted/50 border-border/50 animate-metric-pulse", onClick && "cursor-pointer hover:bg-muted hover:border-primary/20 transition-all")} onClick={onClick}>
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
                <DialogDescription>
                    Your performance summarized into actionable insights for the period.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
                <div className="p-4 bg-muted rounded-lg border">
                    <SummaryRow label="Overall PnL" value={reportData.pnl} className={reportData.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'} />
                </div>
                <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Summary</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                        <li><strong className="text-green-400">This Period's Edge:</strong> {reportData.topImprovement}</li>
                        <li><strong className="text-red-400">This Period's Leak:</strong> {reportData.topWeakness}</li>
                        <li><strong className="text-primary">Next Period's Goal:</strong> {reportData.focus}</li>
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
            </div>
             <DialogFooter className="sm:justify-between gap-2">
                <DialogClose asChild><Button variant="ghost">Close</Button></DialogClose>
                <div className="flex gap-2">
                    <Button variant="outline" disabled>Download (soon)</Button>
                    <Button variant="outline" onClick={handleCopy}>
                        <Clipboard className="mr-2 h-4 w-4" /> Copy Summary
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


const ArjunInsightsSidebar = ({ analyticsData, onSetModule }: { analyticsData: any, onSetModule: PerformanceAnalyticsModuleProps['onSetModule'] }) => {
    const insights = useMemo(() => {
        if (!analyticsData || !analyticsData.current) return [];
        const data = analyticsData.current;
        const generatedInsights = [];

        if (data.winRate < 50) {
            generatedInsights.push("Your win rate is below 50%. Focus on improving your setup selection criteria.");
        } else {
            generatedInsights.push("Your win rate is stable. The key now is to maximize the size of your wins versus your losses.");
        }

        if (data.topLossDrivers && data.topLossDrivers.length > 0) {
            const topDriver = data.topLossDrivers[0];
            if (topDriver) {
                generatedInsights.push(`Your biggest financial drain is from trades tagged with "${topDriver.behavior}". This cost you ${topDriver.totalR.toFixed(1)}R.`);
            }
        }
        
        if (data.scores.disciplineScore < 70) {
            generatedInsights.push("Discipline score is low. This suggests you're not consistently following your own rules, which is a major profit leak.");
        }
        
        if (data.volatilityData.find((v: any) => v.vixZone === "Elevated" && v.avgPnL < 0)) {
            generatedInsights.push("Performance drops significantly in 'Elevated' volatility. Consider reducing size or sitting out during these periods.");
        }

        if (data.timingHeatmapData.sessions.find((s: any) => s.name === "London" && s.totalPnl < 0)) {
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
        <div className="flex flex-col items-center gap-2 animate-in fade-in-50 duration-500">
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
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="animate-in fade-in-50 duration-500">
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
            const pnl = entry.review?.pnl || 0;
            const equity = prevEquity + pnl;
            const hasMarker = entry.review?.mistakesTags && entry.review.mistakesTags !== "None (disciplined)";
            
            acc.push({
              date: entry.timestamps.executedAt,
              equity,
              marker: hasMarker ? { type: entry.review?.mistakesTags?.split(',')[0], color: "hsl(var(--chart-5))" } : null,
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
        { name: "Breakout", trades: Math.floor(random() * 50) + 20, winRate: 40 + Math.floor(random() * 20), avgR: 1.5 + random() * 0.5, pnl: 2000 + random() * 1000, topMistake: "Exited early" },
        { name: "Mean Reversion", trades: Math.floor(random() * 50) + 20, winRate: 60 + Math.floor(random() * 15), avgR: 0.8 + random() * 0.3, pnl: 1000 + random() * 500, topMistake: "Moved SL" },
        { name: "Trend Following", trades: Math.floor(random() * 30) + 15, winRate: 35 + Math.floor(random() * 15), avgR: 2.2 + random() * 0.8, pnl: 2500 + random() * 1500, topMistake: "Forced Entry" },
        { name: "Range Play", trades: Math.floor(random() * 20) + 10, winRate: 65 + Math.floor(random() * 10), avgR: 0.6 + random() * 0.2, pnl: -200 - random() * 500, topMistake: "Oversized risk" },
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
          totalTrades, winRate, lossRate, avgRR, totalPnL,
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

    const computeAnalytics = useCallback((entries: JournalEntry[], compareMode: boolean) => {
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
            setAnalyticsData(computeAnalytics(parsed, compareMode));
            setHasData(parsed.length > 0);
        } else {
            setHasData(false);
            setAnalyticsData(null);
        }
    }, [computeAnalytics, compareMode]);

    useEffect(() => {
        loadData();
    }, [loadData, compareMode]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const savedState = localStorage.getItem("ec_analytics_ui_state");
                if (savedState) {
                    const { activeTab, compareMode, timeRange, showBehaviorHotspots, hotspotMetric } = JSON.parse(savedState);
                    setActiveTab(activeTab || 'overview');
                    setCompareMode(compareMode || false);
                    setTimeRange(timeRange || '30d');
                    setShowBehaviorHotspots(showBehaviorHotspots || false);
                    setHotspotMetric(hotspotMetric || 'Revenge');
                }
            } catch (error) {
                console.error("Failed to parse analytics UI state from localStorage", error);
            }
             setIsRecoveryMode(localStorage.getItem('ec_recovery_mode') === 'true');
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const stateToSave = JSON.stringify({ activeTab, compareMode, timeRange, showBehaviorHotspots, hotspotMetric });
                localStorage.setItem("ec_analytics_ui_state", stateToSave);
            } catch (error) {
                console.error("Failed to save analytics UI state to localStorage", error);
            }
        }
    }, [activeTab, compareMode, timeRange, showBehaviorHotspots, hotspotMetric]);

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
            const stopLoss = direction === 'Long' ? entryPrice * (1 - (0.005 + random() * 0.01)) : entryPrice * (1 + (0.005 + random() * 0.01));
            
            const baseRR = 0.5 + random() * 2;
            const rewardPerUnit = Math.abs(entryPrice - stopLoss) * baseRR;
            const takeProfit = direction === 'Long' ? entryPrice + rewardPerUnit : entryPrice - rewardPerUnit;

            const winChance = isRevengeTrade ? 0.2 : vixZone === 'Elevated' ? 0.35 : 0.5;
            let isWin = random() < winChance;
            
            if (mistakes.includes("Moved SL")) isWin = false; // Moved SL often results in a loss
            if (mistakes.includes("Revenge")) isWin = random() < 0.15; // Revenge trading rarely works
            
            const pnlMultiplier = isWin ? baseRR : -1;
            
            let randomFactor = 1 + (random() - 0.5) * 0.2;
            if (mistakes.includes("Moved SL")) randomFactor = 1.5 + random() * 0.5; // Bigger loss if SL is moved

            const pnl = Math.abs(entryPrice - stopLoss) * pnlMultiplier * randomFactor * 5; // *5 for contract size mock

            if (isWin) {
                consecutiveLosses = 0;
                lastResult = 'win';
            } else {
                consecutiveLosses++;
                lastResult = 'loss';
            }

            const journalingSkipped = lastResult === 'loss' && random() < 0.4;
            
            const entry: JournalEntry = {
                id: `demo-${i}`,
                status: journalingSkipped ? 'pending' : 'completed',
                timestamps: {
                    plannedAt: date.toISOString(),
                    executedAt: date.toISOString(),
                    closedAt: new Date(date.getTime() + 60000 * (15 + random() * 120)).toISOString()
                },
                technical: {
                    instrument: instruments[Math.floor(random() * instruments.length)],
                    direction,
                    strategy,
                    entryPrice,
                    stopLoss,
                    takeProfit,
                    leverage: 20,
                    positionSize: 0.1 + random(),
                    riskPercent: 0.5 + random() * 1.5,
                    rrRatio: baseRR
                },
                planning: {
                    planNotes: "Generated demo trade.",
                    mindset: isRevengeTrade ? "Anxious, need to make it back" : "Calm and focused"
                },
                review: {
                    pnl,
                    exitPrice: isWin ? takeProfit : stopLoss,
                    emotionsTags: emotions.join(','),
                    mistakesTags: mistakes.join(','),
                    learningNotes: "This is a generated learning note for a demo trade.",
                    newsContextTags: "No special context",
                },
                meta: {
                    journalingCompletedAt: journalingSkipped ? undefined : new Date(date.getTime() + 60000 * (150 + random() * 60)).toISOString()
                }
            };
            entries.push(entry);
        }

        localStorage.setItem("ec_journal_entries", JSON.stringify(entries));
        toast({
            title: "Demo Dataset Generated",
            description: "A realistic story of a trader has been created. The analytics are now visible.",
        });
        loadData();
    };

    const dataSources = [
      { name: "Broker (Delta)", status: "Simulated", description: "Trade history, PnL, positions." },
      { name: "Trade Planning", status: "Partial", description: "Planned vs. actual entries/exits." },
      { name: "Journal", status: "Live", description: "Emotions & mistakes tags, notes." },
      { name: "Arjun Events", status: "Simulated", description: "Alerts and rule breaches." },
      { name: "Strategy Management", status: "Prototype", description: "List of defined strategies." },
    ];

    const handleExport = (title: string, data: any) => {
        let summary = `### ${title} Snapshot\n\n`;
        if (title === 'Equity Curve') {
            summary += `Total PnL (${timeRange}): $${analyticsData?.current?.totalPnL.toFixed(2)}\n`;
            summary += `Total Trades: ${analyticsData?.current?.totalTrades}\n`;
        } else if (title === 'Behaviour Analytics') {
            summary += `Discipline Score: ${data.disciplineScore}\n`;
            summary += `Emotional Control: ${100 - data.emotionalScore}\n`;
            summary += `Consistency: ${data.consistencyScore}\n`;
        } else if (title === 'Psychological Patterns') {
            data.forEach((item: any) => {
                summary += `- ${item.axis}: ${item.value.toFixed(0)} (Count: ${item.count}, Impact: ${item.impact})\n`;
            });
        }
        setExportData({ title, summary });
    };

    const thresholdInsights = useMemo(() => {
        if (!analyticsData || !analyticsData.current) return [];
        return [
            { id: "warnAfterLosses", status: "warn", text: "After 2 consecutive losses, your win rate drops to 14%." },
            { id: "warnOnHighRisk", status: "warn", text: "After 2 wins, you oversized risk in 28% of cases." },
            { id: "warnOnHighVIX", status: "warn", text: "When VIX is Elevated, your SL moved rate doubles." },
            { id: "info", status: "info", text: "When journaling is skipped, next-trade loss rate increases." },
        ];
    }, [analyticsData]);

    const handleApplyThresholdGuardrails = () => {
        const currentGuardrails = JSON.parse(localStorage.getItem("ec_guardrails") || "{}");
        const newGuardrails = {
            ...currentGuardrails,
            warnOnHighRisk: true,
            warnOnHighVIX: true,
            warnAfterLosses: true,
        };
        localStorage.setItem("ec_guardrails", JSON.stringify(newGuardrails));
        toast({
            title: "Guardrails Applied",
            description: "Recommended guardrails have been activated in your Trade Planning module.",
        });
    };
    
    const handleApplyGrowthPlan = (tasks: string[]) => {
        localStorage.setItem('ec_growth_plan_today', JSON.stringify(tasks));
        toast({
            title: "Growth Plan Applied!",
            description: "Your 'Today's Focus' on the dashboard has been updated."
        });
    };

    if (!hasData) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
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

    if (!analyticsData || !analyticsData.current) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 mt-4">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        );
    };
    const currentData = analyticsData.current;
    const previousData = analyticsData.previous;

    const qualityConfig = {
        Disciplined: { label: "Disciplined", color: "bg-green-500/20 text-green-300 border-green-500/30", icon: Award },
        Mixed: { label: "Mixed", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: AlertCircle },
        Emotional: { label: "Emotional", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: Zap },
    }[currentData.quality] || { label: "Mixed", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: AlertCircle };
    const QualityIcon = qualityConfig.icon;

    const askArjunAboutStrategy = (strategyName: string) => {
        const prompt = `Arjun, can we dive into my "${strategyName}" strategy? It seems to be my most profitable one, but I'd like to know how to improve its execution.`;
        onSetModule('aiCoaching', { initialMessage: prompt });
    };

    const discussPsychology = () => {
        const topIssues = currentData.radarChartData.filter((d: any) => d.value > 60).map((p: any) => p.axis).join(' and ');
        if (!topIssues) {
            onSetModule('aiCoaching', { initialMessage: "Arjun, let's discuss my psychological profile. What are my biggest strengths and weaknesses based on my data?" });
            return;
        }
        const prompt = `Arjun, my analytics show my biggest psychological issues are ${topIssues}. Can you help me create a plan to work on these?`;
        onSetModule('aiCoaching', { initialMessage: prompt });
    };

    const handleCellClick = (emotion: string, result: string) => {
        setSelectedBehavior({ behavior: `${emotion} & ${result}`, trades: currentData.topLossDrivers[0]?.trades || [] });
    };
    
    const equityChartConfig = {
      equity: { label: "Equity", color: "hsl(var(--chart-2))" }
    };
    
    const eventTypeIcon: Record<string, React.ElementType> = {
        'Moved SL': Flag,
        'Revenge': Bot,
        'Forced Entry': AlertTriangle,
        'default': Info,
    };
    
    const EmptyState = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full p-4 border-2 border-dashed rounded-lg min-h-[200px]">
            <Icon className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-xs">{description}</p>
        </div>
    );
    
    const adherenceData = currentData.planAdherence;
    const adherenceTotal = adherenceData.followedPlan + adherenceData.minorDeviations + adherenceData.majorViolations;
    const followedPct = adherenceTotal > 0 ? (adherenceData.followedPlan / adherenceTotal) * 100 : 0;
    const minorPct = adherenceTotal > 0 ? (adherenceData.minorDeviations / adherenceTotal) * 100 : 0;
    const majorPct = adherenceTotal > 0 ? (adherenceData.majorViolations / adherenceTotal) * 100 : 0;

    const hotspotMetricKey = {
      "Revenge": "revenge",
      "FOMO": "fomo",
      "Moved SL": "slMoved",
      "Overtraded": "overtraded"
    }[hotspotMetric] as "revenge" | "fomo" | "slMoved" | "overtraded";

    return (
        <>
            <GrowthPlanDialog isOpen={isGrowthPlanDialogOpen} onOpenChange={setIsGrowthPlanDialogOpen} onApply={handleApplyGrowthPlan} />
            <Drawer open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DrawerContent>
                    {selectedEvent && (
                        <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
                            <DrawerHeader>
                                <DrawerTitle className="text-2xl">Event Details</DrawerTitle>
                                <DrawerDescription>
                                    Details for the trade event on {new Date(selectedEvent.timestamps.executedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
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
            <div className="space-y-8">
                 <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Performance Analytics</h1>
                        <p className="text-muted-foreground">The backbone of self-awareness — performance, discipline, and psychology in one place.</p>
                    </div>
                     <div className="flex items-center gap-2">
                        {isRecoveryMode && <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Recovery Mode ON</Badge>}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setIsDataSourcesOpen(true)}>
                                        <Database className="mr-2 h-4 w-4" />
                                        Data Sources
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>See where this data comes from.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
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
                        <Separator orientation="vertical" className="h-6 hidden lg:block" />
                        <div className="flex items-center space-x-2">
                            <Switch id="compare-mode" checked={compareMode} onCheckedChange={setCompareMode} />
                            <Label htmlFor="compare-mode" className="text-xs">Compare period</Label>
                        </div>
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
                                        <MetricCard title="Total Trades" value={String(currentData.totalTrades)} hint="+5% vs last period" delta={compareMode && previousData ? currentData.totalTrades - previousData.totalTrades : undefined} onClick={() => onSetModule('tradeJournal', { filters: { timeRange: timeRange } })}/>
                                        <MetricCard title="Win Rate" value={`${currentData.winRate.toFixed(1)}%`} hint="-2% vs last period" delta={compareMode && previousData ? currentData.winRate - previousData.winRate : undefined} deltaUnit="%" />
                                        <MetricCard title="Loss Rate" value={`${currentData.lossRate.toFixed(1)}%`} hint="+2% vs last period" delta={compareMode && previousData ? currentData.lossRate - previousData.lossRate : undefined} deltaUnit="%" />
                                        <MetricCard title="Average R:R" value={String(currentData.avgRR.toFixed(2))} hint="Target: >1.5" delta={compareMode && previousData ? currentData.avgRR - previousData.avgRR : undefined} />
                                        <MetricCard title="Total PnL" value={`$${currentData.totalPnL.toFixed(2)}`} hint="+12% vs last period" delta={compareMode && previousData ? currentData.totalPnL - previousData.totalPnL : undefined} />
                                        <MetricCard title="Best Condition" value={currentData.bestCondition} hint="NY session / Normal VIX" />
                                    </div>
                                </SectionCard>

                                <SectionCard
                                    id="equity"
                                    title="Equity Curve"
                                    description="Your account balance over time, with markers for key psychological events."
                                    icon={TrendingUp}
                                    onExport={() => handleExport('Equity Curve', analyticsData?.current)}
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
                                    <div className="h-[350px]">
                                    {currentData.mockEquityData.length > 0 ? (
                                        <ChartContainer config={equityChartConfig} className="h-full w-full">
                                            <LineChart data={currentData.mockEquityData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                                <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent />} />
                                                <Line type="monotone" dataKey="equity" stroke="hsl(var(--color-equity))" strokeWidth={2} isAnimationActive={false} dot={
                                                    (props: any) => {
                                                        const { cx, cy, payload } = props;
                                                        if (showBehaviorLayer && payload.marker) {
                                                            const { key, ...rest } = props;
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
                                                        const { key, ...rest } = props;
                                                        return <Dot key={`dot-empty-${key}-${props.index}`} {...rest} r={0} />;
                                                    }
                                                } />
                                            </LineChart>
                                        </ChartContainer>
                                    ) : (
                                            <EmptyState icon={TrendingUp} title="No Equity Data" description="Your equity curve will appear here once you have trades." />
                                    )}
                                    </div>
                                </SectionCard>

                                <SectionCard
                                id="timeline"
                                title="Behaviour Events Timeline"
                                description="A narrative view of your recent trading decisions, linked to your journal."
                                icon={BookOpen}
                                >
                                    {currentData.topEvents.length > 0 ? (
                                    <div className="space-y-4">
                                        {currentData.topEvents.slice(0, 5).map((event: any, i: number) => {
                                            const EventIcon = eventTypeIcon[event.label] || eventTypeIcon.default;
                                            return (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border/50 transition-colors hover:bg-muted">
                                                    <div className="flex items-center gap-3">
                                                        <EventIcon className="h-5 w-5 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-semibold text-foreground text-sm">{event.label} <span className="text-muted-foreground font-normal">on {event.instrument}</span></p>
                                                            <p className={cn("text-xs font-mono", event.impact >= 0 ? "text-green-400" : "text-red-400")}>
                                                                Result: {event.impact > 0 ? '+' : ''}${event.impact.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(event)}>
                                                        View Journal <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    ) : (
                                        <EmptyState icon={BookOpen} title="No Behavioral Events" description="Mistakes and significant emotional trades will be flagged here." />
                                    )}
                                </SectionCard>

                            </div>
                            <div className="lg:col-span-1 space-y-8">
                                <ArjunInsightsSidebar analyticsData={analyticsData} onSetModule={onSetModule} />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="behaviour" className="mt-6 space-y-8">
                        <SectionCard 
                            id="discipline" 
                            title="Behaviour Analytics" 
                            description="Where you lose your edge isn’t price — it’s behaviour." 
                            icon={Activity}
                            onExport={() => handleExport('Behaviour Analytics', analyticsData?.current?.scores)}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <ScoreGauge score={currentData.scores.disciplineScore} label="Discipline" interpretation={currentData.scores.disciplineScore > 75 ? "Strong" : currentData.scores.disciplineScore > 50 ? "Mixed" : "Leaky"} delta={compareMode && previousData ? currentData.scores.disciplineScore - previousData.scores.disciplineScore : undefined} />
                                <ScoreGauge score={100 - currentData.scores.emotionalScore} label="Emotional Control" interpretation={currentData.scores.emotionalScore < 30 ? "Calm" : currentData.scores.emotionalScore < 60 ? "Reactive" : "Volatile"} delta={compareMode && previousData ? (100 - currentData.scores.emotionalScore) - (100 - previousData.scores.emotionalScore) : undefined} />
                                <ScoreGauge score={currentData.scores.consistencyScore} label="Consistency" interpretation={currentData.scores.consistencyScore > 75 ? "Stable" : currentData.scores.consistencyScore > 50 ? "Inconsistent" : "Chaotic"} delta={compareMode && previousData ? currentData.scores.consistencyScore - previousData.scores.consistencyScore : undefined} />
                            </div>
                        </SectionCard>
                        
                        <SectionCard
                            id="plan-adherence"
                            title="Planned vs. Actual Discipline"
                            description="This is where professionalism lives: planning is meaningless without adherence."
                            icon={Target}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="space-y-4">
                                    <MetricCard title="Plan Adherence" value={`${adherenceData.adherenceRate.toFixed(0)}%`} hint="Trades that followed the plan exactly." />
                                    <MetricCard title="Override Count" value={adherenceData.majorViolations} hint="Times you justified breaking a rule." />
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-foreground">Trade Breakdown</h4>
                                    <div className="w-full h-8 flex rounded-full overflow-hidden border">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild><div className="bg-green-500 h-full" style={{ width: `${followedPct}%` }} /></TooltipTrigger>
                                                <TooltipContent>{`Followed Plan: ${adherenceData.followedPlan} trades (${followedPct.toFixed(0)}%)`}</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild><div className="bg-amber-500 h-full" style={{ width: `${minorPct}%` }} /></TooltipTrigger>
                                                <TooltipContent>{`Minor Deviations: ${adherenceData.minorDeviations} trades (${minorPct.toFixed(0)}%)`}</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild><div className="bg-red-500 h-full" style={{ width: `${majorPct}%` }} /></TooltipTrigger>
                                                <TooltipContent>{`Major Violations: ${adherenceData.majorViolations} trades (${majorPct.toFixed(0)}%)`}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Followed Plan</div>
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Minor Deviations</div>
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Major Violations</div>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                        
                        <SectionCard
                            id="discipline-breakdown"
                            title="Discipline Breakdown"
                            description="Your most common rule violations and their financial impact."
                            icon={Zap}
                        >
                            {currentData.disciplineBreakdown.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Violation</TableHead>
                                            <TableHead>Frequency</TableHead>
                                            <TableHead>Avg. R Impact</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentData.disciplineBreakdown.map((item: any) => (
                                            <TableRow key={item.violation}>
                                                <TableCell className="font-medium text-foreground">{item.violation}</TableCell>
                                                <TableCell>{item.frequency} times</TableCell>
                                                <TableCell className={cn("font-mono", item.avgR < 0 ? "text-red-400" : "text-green-400")}>{item.avgR.toFixed(1)}R</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedBehavior({ behavior: item.violation, trades: item.trades })}>
                                                        View Examples
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <EmptyState icon={Zap} title="No Violations Logged" description="This table will populate as you tag mistakes in your journal." />
                            )}
                            <Separator className="my-6" />
                            <Dialog open={isGuardrailDialogOpen} onOpenChange={setIsGuardrailDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline"><Bot className="mr-2 h-4 w-4"/>Apply Discipline Guardrails (Prototype)</Button>
                                </DialogTrigger>
                                <GuardrailDialog />
                            </Dialog>
                        </SectionCard>

                         <SectionCard
                            id="discipline-volatility"
                            title="Discipline under Volatility"
                            description="How your adherence to rules changes when the market is chaotic."
                            icon={Activity}
                        >
                             {currentData.disciplineByVolatility && currentData.disciplineByVolatility.length > 0 ? (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>VIX Zone</TableHead>
                                                <TableHead>Plan Adherence</TableHead>
                                                <TableHead>SL Moved %</TableHead>
                                                <TableHead>Revenge Trades</TableHead>
                                                <TableHead>Avg. R</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {currentData.disciplineByVolatility.map((row: any) => (
                                                <TableRow key={row.vixZone}>
                                                    <TableCell className="font-medium">{row.vixZone}</TableCell>
                                                    <TableCell className={cn("font-mono", row.planAdherence < 70 && "text-amber-400")}>{row.planAdherence}%</TableCell>
                                                    <TableCell className={cn("font-mono", row.slMovedPct > 15 && "text-red-400")}>{row.slMovedPct}%</TableCell>
                                                    <TableCell className={cn("font-mono", row.revengeCount > 1 && "text-red-400")}>{row.revengeCount}</TableCell>
                                                    <TableCell className={cn("font-mono", row.avgR < 0 ? "text-red-400" : "text-green-400")}>{row.avgR.toFixed(1)}R</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {currentData.disciplineByVolatility.find((r:any) => (r.vixZone === 'Elevated' || r.vixZone === 'Extreme') && r.planAdherence < 70) && (
                                        <Alert variant="default" className="mt-4 bg-amber-950/30 border-amber-500/20 text-amber-300">
                                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                                            <AlertTitle className="text-amber-400">Warning: Discipline Deteriorates in High Volatility</AlertTitle>
                                            <AlertDescription>
                                                Your data shows a significant drop in plan adherence during volatile periods. This is a common but costly profit leak.
                                                <Button variant="link" size="sm" className="p-0 h-auto ml-2 text-amber-300" onClick={() => setIsGuardrailDialogOpen(true)}>Set a high-VIX guardrail →</Button>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </>
                             ) : (
                                <EmptyState icon={Activity} title="Not Enough Data" description="This view requires more trades across different volatility zones." />
                             )}
                        </SectionCard>

                        <SectionCard
                            id="thresholds"
                            title="Threshold Alerts"
                            description="Patterns Arjun is watching for in your trading sequences."
                            icon={Zap}
                        >
                            <div className="space-y-3">
                                {thresholdInsights.map(insight => (
                                    <Alert key={insight.id} variant="default" className={cn(
                                        insight.status === 'warn' ? "bg-amber-950/40 border-amber-500/20 text-amber-300" : "bg-muted/50 border-border/50",
                                    )}>
                                        <AlertTriangle className={cn("h-4 w-4", insight.status === 'warn' ? 'text-amber-400' : 'text-blue-400')} />
                                        <AlertDescription className="text-sm">{insight.text}</AlertDescription>
                                    </Alert>
                                ))}
                            </div>
                            <Button variant="outline" className="mt-6" onClick={handleApplyThresholdGuardrails}>
                                <Bot className="mr-2 h-4 w-4" /> Turn on Recommended Guardrails
                            </Button>
                        </SectionCard>

                        <SectionCard 
                            id="psychology" 
                            title="Psychological Patterns" 
                            description="The emotions and biases that drive your decisions." 
                            icon={Brain}
                            onExport={() => handleExport('Psychological Patterns', analyticsData?.current?.radarChartData)}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="h-80 w-full">
                                    <RadarChart data={currentData.radarChartData} onSetModule={onSetModule} />
                                </div>
                                <div className="space-y-4">
                                    <Card className="bg-muted/50">
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Bot className="h-5 w-5 text-primary" /> Pattern Notes
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                                <li>Your <strong className="text-foreground">Revenge</strong> and <strong className="text-foreground">FOMO</strong> scores are high, indicating emotional decision-making.</li>
                                                <li>Your <strong className="text-foreground">SL Discipline</strong> is low, suggesting you're not respecting your own exit plans.</li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-muted/50 flex flex-col items-center justify-center text-center p-6">
                                        <h3 className="font-semibold text-foreground">Turn these insights into action.</h3>
                                        <p className="text-sm text-muted-foreground mt-1 mb-4">Discuss your profile with Arjun to build a personalized growth plan.</p>
                                        <Button onClick={discussPsychology}>
                                            Discuss Patterns with Arjun <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Card>
                                </div>
                            </div>
                        </SectionCard>
                        <SectionCard id="loss-drivers" title="Top Loss Drivers" description="The specific behaviours that are costing you the most money, ranked by total impact." icon={Zap}>
                            {currentData.topLossDrivers.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Behaviour</TableHead>
                                            <TableHead>Occurrences</TableHead>
                                            <TableHead>Avg. R Impact</TableHead>
                                            <TableHead>Total R Impact</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentData.topLossDrivers.map((driver: any) => (
                                            <TableRow key={driver.behavior} className="cursor-pointer hover:bg-muted" onClick={() => setSelectedBehavior(driver)}>
                                                <TableCell><Badge variant="destructive">{driver.behavior}</Badge></TableCell>
                                                <TableCell>{driver.occurrences}</TableCell>
                                                <TableCell className="font-mono text-red-400">{driver.avgR.toFixed(2)}R</TableCell>
                                                <TableCell className="font-mono text-red-400">{driver.totalR.toFixed(2)}R</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <EmptyState icon={Zap} title="No Loss Drivers Identified" description="This section will highlight which mistakes cost you the most." />
                            )}
                        </SectionCard>
                        <SectionCard id="emotion-matrix" title="Emotion × Result Matrix" description="Where do your emotions lead you? See which feelings correlate with wins and losses." icon={Brain}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-center text-xs border-separate border-spacing-1">
                                    <thead>
                                        <tr>
                                            <th className="p-2 text-left">Emotion</th>
                                            {currentData.emotionResultMatrixData.results.map((result: string) => (
                                                <th key={result} className="p-2 font-normal text-muted-foreground">{result}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentData.emotionResultMatrixData.emotions.map((emotion: string, rowIndex: number) => (
                                            <tr key={emotion}>
                                                <td className="font-semibold text-foreground text-left p-2">{emotion}</td>
                                                {currentData.emotionResultMatrixData.data[rowIndex].map((count: number, colIndex: number) => {
                                                    const opacity = count > 0 ? Math.min(1, (count / currentData.emotionResultMatrixData.maxCount) * 0.9 + 0.1) : 0;
                                                    const result = currentData.emotionResultMatrixData.results[colIndex];
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
                                                            className="p-3 rounded-md font-mono text-white cursor-pointer transition-all hover:ring-2 hover:ring-primary"
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
                        <TradesInFocusPanel 
                            behavior={selectedBehavior}
                            onClear={() => setSelectedBehavior(null)}
                            onOpenJournal={(journalId) => onSetModule('tradeJournal', { draftId: journalId })}
                        />
                         <Card className="bg-muted/30 border-border/50 text-center">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-foreground">Turn insights into action.</h3>
                                <p className="text-sm text-muted-foreground mt-1 mb-4">Generate a personalized growth plan based on these analytics.</p>
                                <Button onClick={() => setIsGrowthPlanDialogOpen(true)}>
                                    <Bot className="mr-2 h-4 w-4" />
                                    Generate Growth Plan (Prototype)
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="strategies" className="mt-6 space-y-8">
                        <SectionCard id="strategy" title="Strategy Analytics" description="Which of your strategies are performing best, and where they leak money." icon={BookOpen}>
                        {currentData.mockStrategyData.length > 0 ? (
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
                                        {currentData.mockStrategyData.map((strategy: any) => (
                                            <TableRow key={strategy.name} className="transition-colors hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedStrategy(strategy)}>
                                                <TableCell className="font-medium">{strategy.name}</TableCell>
                                                <TableCell>{strategy.trades}</TableCell>
                                                <TableCell>{strategy.winRate}%</TableCell>
                                                <TableCell className={cn(strategy.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                                                    {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toLocaleString()}
                                                </TableCell>
                                                <TableCell><Badge variant="destructive">{strategy.topMistake}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={(e) => {e.stopPropagation(); onSetModule('tradeJournal', { filters: { strategy: strategy.name }})}}>
                                                        <View className="mr-2 h-3 w-3" />
                                                        View trades
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                        ) : (
                                <EmptyState icon={BookOpen} title="No Strategies Found" description="Define strategies in Strategy Management and tag your trades." />
                        )}
                        </SectionCard>
                        
                        <SectionCard id="timing" 
                            title="Timing Analytics" 
                            description="When you trade best (and worst)." 
                            icon={Calendar} 
                            headerContent={
                                <div className="flex flex-wrap items-center gap-4">
                                     <div className="flex items-center gap-2">
                                        <Label htmlFor="behavior-hotspots" className="text-sm">Behaviour Hotspots</Label>
                                        <Switch
                                            id="behavior-hotspots"
                                            checked={showBehaviorHotspots}
                                            onCheckedChange={setShowBehaviorHotspots}
                                        />
                                    </div>
                                    {showBehaviorHotspots && (
                                        <div className="flex items-center gap-2">
                                            <Select value={hotspotMetric} onValueChange={(v) => setHotspotMetric(v as any)}>
                                                <SelectTrigger className="w-[150px] h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Revenge">Revenge</SelectItem>
                                                    <SelectItem value="FOMO">FOMO</SelectItem>
                                                    <SelectItem value="Moved SL">Moved SL</SelectItem>
                                                    <SelectItem value="Overtraded">Overtraded</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            }>
                            <div className="grid md:grid-cols-3 gap-6 animate-in fade-in-50 duration-500">
                                <div className="md:col-span-2">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-center text-xs border-separate border-spacing-1">
                                            <thead>
                                                <tr>
                                                    <th className="p-2">Session</th>
                                                    {currentData.timingHeatmapData.timeBlocks.map((block: string) => (
                                                        <th key={block} className="p-2 font-normal text-muted-foreground">{block}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentData.timingHeatmapData.sessions.map((session: any) => (
                                                    <tr key={session.name}>
                                                        <td className="font-semibold text-foreground text-left p-2">{session.name}</td>
                                                        {currentData.timingHeatmapData.timeBlocks.map((block: string) => {
                                                            const cellData = session.blocks.find((b: any) => b.time === block);
                                                            if (!cellData) {
                                                                return <td key={block} className="p-2 bg-muted/30 rounded-md" />;
                                                            }
                                                            
                                                            let opacity = 0;
                                                            let bgColor = 'rgba(100, 116, 139, 0.15)';
                                                            let cellText, hintText;

                                                            if (showBehaviorHotspots) {
                                                                const behaviorCount = cellData[hotspotMetricKey] || 0;
                                                                const maxBehaviorCount = 5; // mock max for scaling
                                                                opacity = behaviorCount > 0 ? Math.min(1, (behaviorCount / maxBehaviorCount) * 0.9 + 0.1) : 0;
                                                                bgColor = `rgba(239, 68, 68, ${opacity})`; // Red scale for mistakes
                                                                cellText = `${behaviorCount}`;
                                                                hintText = `Trades: ${cellData.trades}`;
                                                            } else {
                                                                const maxTrades = 30; // Mock max for opacity scaling
                                                                opacity = Math.min(1, (cellData.trades / maxTrades) * 0.9 + 0.1);
                                                                bgColor = cellData.pnl > 0 ? `rgba(34, 197, 94, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
                                                                cellText = `${cellData.pnl > 0 ? '+' : ''}${cellData.pnl.toFixed(0)}`;
                                                                hintText = `n=${cellData.trades}`;
                                                            }
                                                            
                                                            return (
                                                                <td key={block} style={{ backgroundColor: bgColor }} className="p-2 rounded-md">
                                                                    <TooltipProvider><Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="font-mono text-white cursor-pointer" onClick={() => onSetModule('tradeJournal', {})}>
                                                                                <p>{cellText}</p>
                                                                                <p className="text-white/60 text-[10px]">{hintText}</p>
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Session: {session.name} ({block})</p>
                                                                            <p>Trades: {cellData.trades}</p>
                                                                            <p>Total PnL: ${cellData.pnl.toFixed(2)}</p>
                                                                            {showBehaviorHotspots && <p>{hotspotMetric}: {cellData[hotspotMetricKey] || 0}</p>}
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
                                    <div className="flex justify-end items-center gap-4 text-xs text-muted-foreground mt-4">
                                        <span>{showBehaviorHotspots ? "Low density" : "Fewer trades"}</span>
                                        <div className="flex gap-1">
                                            <div className="w-4 h-4 rounded bg-primary/20" />
                                            <div className="w-4 h-4 rounded bg-primary/40" />
                                            <div className="w-4 h-4 rounded bg-primary/60" />
                                            <div className="w-4 h-4 rounded bg-primary/80" />
                                            <div className="w-4 h-4 rounded bg-primary" />
                                        </div>
                                        <span>{showBehaviorHotspots ? "High density" : "More trades"}</span>
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
                        
                        <SectionCard id="volatility" title="Volatility Analytics" description="How you perform in different market conditions." icon={Zap}
                            headerContent={
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">View by:</p>
                                    <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                                        {(['winRate', 'avgPnL', 'mistakes'] as const).map(v => (
                                            <Button
                                                key={v}
                                                size="sm"
                                                variant={volatilityView === v ? 'secondary' : 'ghost'}
                                                onClick={() => setVolatilityView(v)}
                                                className="rounded-full h-7 px-3 text-xs capitalize"
                                            >
                                                {v === 'avgPnL' ? 'Avg PnL' : v === 'winRate' ? 'Win Rate' : 'Mistakes'}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            }
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in-50 duration-500">
                                {currentData.volatilityData.map((d: any) => {
                                    const mistakeDensity = d.trades > 0 ? (d.mistakesCount / d.trades) * 100 : 0;
                                    const isWinRateActive = volatilityView === 'winRate';
                                    const isAvgPnlActive = volatilityView === 'avgPnL';
                                    const isMistakesActive = volatilityView === 'mistakes';

                                    return (
                                        <Card key={d.vixZone} className="bg-muted/50 transition-all hover:bg-muted">
                                            <CardHeader className="pb-4">
                                                <CardTitle className="text-base">{d.vixZone}</CardTitle>
                                                <CardDescription className="text-xs">{d.trades} trades</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className={cn("p-2 rounded-md transition-colors", isWinRateActive ? "bg-primary/10" : "bg-muted")}>
                                                    <p className="text-xs text-muted-foreground">Win Rate</p>
                                                    <p className={cn("text-lg font-bold font-mono", isWinRateActive && "text-primary")}>{d.winRate}%</p>
                                                </div>
                                                <div className={cn("p-2 rounded-md transition-colors", isAvgPnlActive ? "bg-primary/10" : "bg-muted")}>
                                                    <p className="text-xs text-muted-foreground">Avg. PnL</p>
                                                    <p className={cn("text-lg font-bold font-mono", d.avgPnL >= 0 ? (isAvgPnlActive ? 'text-primary' : 'text-green-400') : (isAvgPnlActive ? 'text-destructive' : 'text-red-400'))}>${d.avgPnL.toFixed(2)}</p>
                                                </div>
                                                <div className={cn("p-2 rounded-md transition-colors", isMistakesActive ? "bg-primary/10" : "bg-muted")}>
                                                    <p className="text-xs text-muted-foreground">Mistakes</p>
                                                    <p className={cn("text-lg font-bold font-mono", isMistakesActive && "text-primary")}>{d.mistakesCount}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Mistake Density</Label>
                                                    <Progress value={mistakeDensity} indicatorClassName="bg-amber-500" className="h-2 mt-1" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </SectionCard>
                    </TabsContent>
                    <TabsContent value="reports" className="mt-6 space-y-8">
                        <SectionCard 
                            id="reports" 
                            title="Weekly & Monthly Reports" 
                            description="Your performance summarized into actionable report cards." 
                            icon={Award}
                        >
                            <div className="grid md:grid-cols-2 gap-8">
                                <Dialog>
                                    <Card className="bg-muted/50 transition-all hover:bg-muted">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Weekly Report</CardTitle>
                                            <CardDescription>Your performance summary for last week.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <p className="text-sm"><strong className="text-green-400">This Week's Edge:</strong> Reduced revenge trading.</p>
                                            <p className="text-sm"><strong className="text-red-400">This Week's Leak:</strong> Still exiting winners early.</p>
                                            <p className="text-sm"><strong className="text-primary">Behavioural Goal:</strong> Try a partial TP to let trades run.</p>
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
                                    <Card className="bg-muted/50 transition-all hover:bg-muted">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Monthly Report</CardTitle>
                                            <CardDescription>Your performance summary for last month.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <p className="text-sm"><strong className="text-green-400">This Month's Edge:</strong> Sticking to A+ setups.</p>
                                            <p className="text-sm"><strong className="text-red-400">This Month's Leak:</strong> Performance in high VIX.</p>
                                            <p className="text-sm"><strong className="text-primary">Behavioural Goal:</strong> Reduce size when VIX is 'Elevated'.</p>
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
            </div>
            <Drawer open={isDataSourcesOpen} onOpenChange={setIsDataSourcesOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Data Sources</DrawerTitle>
                        <DrawerDescription>This analytics view is a synthesis of multiple data points.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4">
                        <div className="space-y-4">
                            {dataSources.map(source => (
                                <Card key={source.name} className="bg-muted/50">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-foreground">{source.name}</h4>
                                            <p className="text-xs text-muted-foreground">{source.description}</p>
                                        </div>
                                        <Badge variant={source.status === 'Live' ? 'default' : 'outline'}>{source.status}</Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
            <ExportDialog 
                isOpen={!!exportData}
                onOpenChange={(open) => !open && setExportData(null)}
                title={exportData?.title || ''}
                summaryText={exportData?.summary || ''}
            />
        </>
    );
}

    