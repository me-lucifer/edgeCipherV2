
      "use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, Pencil, ShieldAlert, BarChart, Info, CheckCircle, XCircle, AlertTriangle, Gauge, Calendar, Zap, Sun, Moon, Waves, User, ArrowRight, RefreshCw, SlidersHorizontal, TrendingUp, Sparkles, Droplets, TrendingDown, BookOpen, Layers, Settings, ShieldCheck, MoreHorizontal, Copy, Edit, Archive, Trash2, Scale, HeartPulse, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEventLog } from "@/context/event-log-provider";
import { ScrollArea } from "./ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRiskState, type RiskState, type VixZone, type RiskDecision } from "@/hooks/use-risk-state";
import { Skeleton } from "./ui/skeleton";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";
import { Slider } from "./ui/slider";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { format } from 'date-fns';


interface RiskCenterModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

type RiskRule = {
    id: 'maxRiskPerTrade' | 'maxDailyLoss' | 'maxTradesPerDay' | 'maxConsecutiveLosses';
    label: string;
    value: number;
    unit: '%' | 'R' | 'trades';
    description: string;
};

const defaultRules: RiskRule[] = [
    { id: 'maxRiskPerTrade', label: "Max risk per trade", value: 1, unit: '%', description: "The maximum percentage of your account to risk on a single trade." },
    { id: 'maxDailyLoss', label: "Max daily loss", value: 3, unit: '%', description: "Your 'circuit breaker'. If your account is down this much, you stop for the day." },
    { id: 'maxTradesPerDay', label: "Max trades per day", value: 5, unit: 'trades', description: "Helps prevent overtrading and decision fatigue." },
    { id: 'maxConsecutiveLosses', label: "Max consecutive losses", value: 3, unit: 'trades', description: "A hard stop to prevent a losing streak from becoming a blown account." },
];

const mockPositions = [
    { symbol: 'BTC-PERP', direction: 'Long', size: 0.5, pnl: 234.50, leverage: 10, risk: 'Medium' },
    { symbol: 'ETH-PERP', direction: 'Short', size: 12, pnl: -88.12, leverage: 50, risk: 'High' },
    { symbol: 'SOL-PERP', direction: 'Long', size: 100, pnl: 45.20, leverage: 5, risk: 'Low' },
];

function TradeDecisionBar({ decision }: { decision: RiskState['decision'] | null }) {
    const [isWhyOpen, setIsWhyOpen] = useState(false);
    
    if (!decision) return <Skeleton className="h-20 w-full" />;

    const decisionConfig = {
        green: { status: "OK to trade", icon: CheckCircle, className: "border-green-500/30 text-green-400" },
        yellow: { status: "Trade only A+ setups", icon: AlertTriangle, className: "border-amber-500/30 text-amber-400" },
        red: { status: "Don't trade", icon: XCircle, className: "border-red-500/30 text-red-400" },
    };

    const config = decisionConfig[decision.level];
    const Icon = config.icon;

    const blocks = decision.reasons.filter(reason => {
        const lowerReason = reason.toLowerCase();
        return lowerReason.includes('exceeded') || lowerReason.includes('cooldown') || lowerReason.includes('extreme') || lowerReason.includes('critical') || lowerReason.includes('excessive');
    });
    const warnings = decision.reasons.filter(reason => !blocks.includes(reason));

    return (
        <>
            <Drawer open={isWhyOpen} onOpenChange={setIsWhyOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle className="flex items-center gap-2"><HardHat /> Firewall Status</DrawerTitle>
                        <DrawerDescription>These are the currently active rules affecting your trading decision.</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4 grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h3 className="font-semibold text-destructive flex items-center gap-2"><XCircle /> Execution Blocks ({blocks.length})</h3>
                            {blocks.length > 0 ? (
                                <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                                    {blocks.map((reason, i) => <li key={i}>{reason}</li>)}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No blocking rules active.</p>
                            )}
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-semibold text-amber-400 flex items-center gap-2"><AlertTriangle /> Active Warnings ({warnings.length})</h3>
                             {warnings.length > 0 ? (
                                <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                                    {warnings.map((reason, i) => <li key={i}>{reason}</li>)}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No warnings active.</p>
                            )}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
            <Card className={cn("border-2", config.className)}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-full", config.className.replace('border-', 'bg-').replace('/30', '/20'))}>
                            <Icon className={cn("h-6 w-6", config.className.replace('border-', 'text-'))} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Today's Trading Decision: <span className={cn("font-bold", config.className.replace('border-', 'text-'))}>{config.status}</span></h3>
                            <p className="text-sm text-muted-foreground">{decision.message}</p>
                        </div>
                    </div>
                    <Button variant="link" onClick={() => setIsWhyOpen(true)}>Firewall Status</Button>
                </CardContent>
            </Card>
        </>
    );
}

function MarketRiskCard({ marketRisk, onSetModule }: { marketRisk: RiskState['marketRisk'], onSetModule: (module: any) => void }) {
    const { vixValue, vixZone } = marketRisk;
    
    const handleSliderChange = (value: number[]) => {
        const newVix = value[0];
        localStorage.setItem("ec_vix_override", String(newVix));
        // The useRiskState hook will automatically pick up this change and update the state
    };

    const zoneInfo = {
        Calm: { color: 'green', impact: 'Markets are quiet. Setups may take longer to play out; be patient.' },
        Normal: { color: 'blue', impact: 'Standard conditions. Follow your plan as designed.' },
        Elevated: { color: 'amber', impact: 'Expect whipsaws and spikes. Consider reducing size.' },
        Extreme: { color: 'red', impact: 'High risk of erratic moves. Many pros sit out.' }
    };
    
    const { color, impact } = zoneInfo[vixZone] || zoneInfo.Normal;
    const colorClass = `hsl(var(--chart-${color === 'green' ? 2 : color === 'blue' ? 1 : color === 'amber' ? 4 : 5}))`;
    const conicGradient = `conic-gradient(
        ${colorClass} 0deg,
        ${colorClass} calc(${vixValue} * 1.8deg),
        hsl(var(--muted)) calc(${vixValue} * 1.8deg),
        hsl(var(--muted)) 180deg
    )`;

    // Mocked conditions based on VIX for demo purposes
    const fundingRateStatus = vixZone === 'Extreme' ? 'High' : 'Neutral';
    const newsSentimentStatus = vixZone === 'Extreme' ? 'Fear' : vixZone === 'Elevated' ? 'Mixed' : 'Neutral';


    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Market Risk
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground/80 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">The Crypto VIX is an indicator of current market volatility (0-100). Higher values mean larger price swings and more risk.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 items-center">
                <div 
                    className="relative flex items-center justify-center w-full h-24 overflow-hidden rounded-t-full bg-muted"
                >
                    <div 
                        className="absolute top-0 left-0 w-full h-full rounded-t-full"
                        style={{ background: conicGradient }}
                    />
                    <div className="absolute w-[85%] h-[85%] bg-muted/80 backdrop-blur-sm rounded-t-full" />
                     <div className="relative flex flex-col items-center justify-center z-10 -mt-2">
                        <p className="text-4xl font-bold text-foreground">{vixValue}</p>
                        <Badge className={cn("text-base", 
                            vixZone === "Extreme" && "bg-red-500/20 text-red-300 border-red-500/30",
                            vixZone === "Elevated" && "bg-amber-500/20 text-amber-300 border-amber-500/30",
                            vixZone === "Normal" && "bg-blue-500/20 text-blue-300 border-blue-500/30",
                            vixZone === "Calm" && "bg-green-500/20 text-green-300 border-green-500/30"
                        )}>{vixZone}</Badge>
                    </div>
                </div>
                <div className="space-y-3">
                   <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Impact:</span> {impact}</p>
                   <Button variant="link" className="p-0 h-auto" onClick={() => onSetModule('cryptoVix')}>
                       Open Crypto VIX Module <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                </div>
            </CardContent>
            <Separator className="my-4" />
            <CardContent>
                <h4 className="font-semibold text-foreground mb-3 text-sm">Today's Conditions</h4>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn(
                        "text-xs",
                        vixZone === 'Extreme' || vixZone === 'Elevated' ? 'border-amber-500/50 text-amber-400' : 'border-border'
                    )}>
                        <Sparkles className="mr-1.5 h-3 w-3" />
                        Volatility: {vixZone}
                    </Badge>
                     <Badge variant="outline" className={cn(
                        "text-xs",
                        fundingRateStatus === 'High' ? 'border-red-500/50 text-red-400' : 'border-border'
                    )}>
                        <Droplets className="mr-1.5 h-3 w-3" />
                        Funding: {fundingRateStatus} (prototype)
                    </Badge>
                    <Badge variant="outline" className={cn(
                        "text-xs",
                        newsSentimentStatus === 'Fear' ? 'border-red-500/50 text-red-400' : 
                        newsSentimentStatus === 'Mixed' ? 'border-amber-500/50 text-amber-400' : 'border-border'
                    )}>
                        <TrendingUp className="mr-1.5 h-3 w-3" />
                        News Sentiment: {newsSentimentStatus} (prototype)
                    </Badge>
                </div>
            </CardContent>
            <CardFooter className="border-t pt-4 mt-4">
                <div className="w-full space-y-3">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2"><SlidersHorizontal className="h-3 w-3" /> Simulate VIX (Prototype)</Label>
                    <Slider
                        defaultValue={[vixValue]}
                        max={100}
                        step={1}
                        onValueChange={handleSliderChange}
                    />
                </div>
            </CardFooter>
        </Card>
    );
}

const DeltaIndicator = ({ delta, unit = "" }: { delta: number; unit?: string }) => {
    if (delta === 0) return null;
    const isPositive = delta > 0;
    return (
        <span className={cn(
            "text-xs font-mono flex items-center ml-2",
            isPositive ? "text-green-400" : "text-red-400"
        )}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? '+' : ''}{delta.toFixed(0)}{unit}
        </span>
    );
};

const ScoreGauge = ({ score, label, interpretation, delta, colorClass }: { score: number; label: string; interpretation: string; delta?: number; colorClass: string; }) => {
    const conicGradient = `conic-gradient(
        ${colorClass} 0deg,
        ${colorClass} calc(${score} * 1.8deg),
        hsl(var(--muted)) calc(${score} * 1.8deg),
        hsl(var(--muted)) 180deg
    )`;

    return (
        <div className="flex flex-col items-center gap-2 text-center">
            <div 
                className="relative flex items-center justify-center w-32 h-16 overflow-hidden rounded-t-full bg-muted"
            >
                <div 
                    className="absolute top-0 left-0 w-full h-full rounded-t-full"
                    style={{ background: conicGradient }}
                />
                <div className="absolute w-[85%] h-[85%] bg-muted/80 backdrop-blur-sm rounded-t-full" />
                 <div className="relative flex flex-col items-center justify-center z-10 -mt-2">
                    <p className="text-3xl font-bold text-foreground">{score}</p>
                </div>
            </div>
            <p className="text-sm font-medium text-foreground -mt-3">{label}</p>
            <div className="flex items-baseline h-4">
                 <p className="text-xs font-semibold" style={{ color: colorClass }}>{interpretation}</p>
                {delta !== undefined && <DeltaIndicator delta={delta} />}
            </div>
        </div>
    );
};

function RevengeRiskCard({ revengeRiskIndex, revengeRiskLevel }: { revengeRiskIndex: number, revengeRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical' }) {
    const levelConfig = {
        Low: { color: "hsl(var(--chart-2))", suggestion: "No signs of revenge trading. Stick to the plan." },
        Medium: { color: "hsl(var(--chart-1))", suggestion: "Slight elevation. Be mindful of emotional entries." },
        High: { color: "hsl(var(--chart-4))", suggestion: "Risk is high. A losing streak or rule override was detected." },
        Critical: { color: "hsl(var(--chart-5))", suggestion: "Risk is critical. Consider a cooldown before taking another trade." },
    };

    const config = levelConfig[revengeRiskLevel];
    
    return (
        <Card className={cn("bg-muted/30 border-border/50", (revengeRiskLevel === 'High' || revengeRiskLevel === 'Critical') && 'border-amber-500/30')}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5" /> Revenge Risk Index
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                 <ScoreGauge 
                    score={revengeRiskIndex} 
                    label="Revenge Risk" 
                    interpretation={revengeRiskLevel}
                    colorClass={config.color}
                />
                <p className="text-xs text-center text-muted-foreground">{config.suggestion}</p>
                {(revengeRiskLevel === 'High' || revengeRiskLevel === 'Critical') && (
                    <Button variant="outline" size="sm" className="mt-2">Enable Recovery Mode</Button>
                )}
            </CardContent>
        </Card>
    );
}

function PersonalRiskCard({ personalRisk, onSetModule }: { personalRisk: RiskState['personalRisk'], onSetModule: (module: any) => void }) {
    const { disciplineScore, disciplineScoreDelta, emotionalScore, emotionalScoreDelta, consistencyScore, consistencyScoreDelta } = personalRisk;

    const getInterpretation = (score: number, type: 'discipline' | 'emotion' | 'consistency') => {
        if (type === 'discipline') {
            if (score > 75) return 'Consistent';
            if (score > 50) return 'Inconsistent';
            return 'Poor';
        }
        if (type === 'emotion') {
            if (score > 75) return 'Impulsive';
            if (score > 50) return 'Reactive';
            return 'Controlled';
        }
        if (type === 'consistency') {
            if (score > 75) return 'High';
            if (score > 50) return 'Medium';
            return 'Low';
        }
        return '';
    }
    
    const getColor = (score: number, type: 'discipline' | 'emotion' | 'consistency') => {
        if (type === 'discipline' || type === 'consistency') {
            if (score > 75) return 'hsl(var(--chart-2))';
            if (score > 50) return 'hsl(var(--chart-4))';
            return 'hsl(var(--chart-5))';
        }
        if (type === 'emotion') {
            if (score > 75) return 'hsl(var(--chart-5))';
            if (score > 50) return 'hsl(var(--chart-4))';
            return 'hsl(var(--chart-2))';
        }
        return 'hsl(var(--foreground))';
    };


    return (
         <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Your Risk Posture</CardTitle>
                <CardDescription>A snapshot of your psychological state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-around">
                     <ScoreGauge 
                        score={disciplineScore} 
                        label="Discipline" 
                        interpretation={getInterpretation(disciplineScore, 'discipline')}
                        delta={disciplineScoreDelta}
                        colorClass={getColor(disciplineScore, 'discipline')}
                    />
                    <ScoreGauge 
                        score={emotionalScore} 
                        label="Emotional Control" 
                        interpretation={getInterpretation(emotionalScore, 'emotion')}
                        delta={emotionalScoreDelta}
                        colorClass={getColor(emotionalScore, 'emotion')}
                    />
                </div>
                 <Button variant="link" className="p-0 h-auto w-full justify-center" onClick={() => onSetModule('analytics')}>
                    Open Performance Analytics <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
}

function TodaysLimitsCard({ limits, onSetModule }: { limits: RiskState['todaysLimits'], onSetModule: (module: any) => void }) {
    
    const StatusRow = ({ label, value, valueClass, tooltipText }: { label: string; value: React.ReactNode; valueClass?: string, tooltipText?: string }) => (
        <div className="flex justify-between items-center text-sm">
            <div className="text-muted-foreground flex items-center gap-2">
                <span>{label}</span>
                {tooltipText && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground/80 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{tooltipText}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            <p className={cn("font-mono font-semibold text-foreground", valueClass)}>{value}</p>
        </div>
    );
    
    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Today's Limits</CardTitle>
                <CardDescription>Hard constraints from your active strategy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Strategy Rules</h4>
                    <div className="space-y-2">
                        <StatusRow label="Max risk / trade" value={`${limits.riskPerTradePct.toFixed(2)}%`} tooltipText="The maximum percentage of your account to risk on a single trade." />
                        <StatusRow label="Max daily trades" value={limits.maxTrades} />
                        <StatusRow label="Max daily loss" value={`${limits.maxDailyLossPct}%`} />
                        <StatusRow label="Leverage cap" value={`${limits.leverageCap}x`} />
                        <StatusRow label="Cooldown rule" value={limits.cooldownActive ? "ON" : "OFF"} valueClass={limits.cooldownActive ? "text-amber-400" : ""} tooltipText="A mandatory break from trading after a set number of consecutive losses to prevent revenge trading." />
                    </div>
                </div>
                <Separator />
                 <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Live Status</h4>
                    <div className="space-y-2">
                        <StatusRow label="Trades executed" value={`${limits.tradesExecuted} / ${limits.maxTrades}`} valueClass={limits.tradesExecuted >= limits.maxTrades ? "text-red-400" : ""} />
                        <StatusRow label="Current loss streak" value={limits.lossStreak} valueClass={limits.lossStreak >= 2 ? "text-amber-400" : ""} />
                        <StatusRow label="Cooldown active" value={limits.cooldownActive ? "Yes" : "No"} valueClass={limits.cooldownActive ? "text-red-400" : ""} />
                         <StatusRow label="Recovery Mode" value={limits.recoveryMode ? "ON" : "OFF"} valueClass={limits.recoveryMode ? "text-amber-400" : ""} />
                    </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                     <Button variant="outline" size="sm" onClick={() => onSetModule('strategyManagement')}>
                        <BookOpen className="mr-2 h-4 w-4" /> Open Strategy Rules
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onSetModule('tradePlanning')}>
                        <Zap className="mr-2 h-4 w-4" /> Open Trade Planning
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function RiskControlsCard() {
    const [controls, setControls] = useState({
        warnOnLowRR: true,
        warnOnHighRisk: true,
        warnOnHighVIX: false,
        cooldownAfterLosses: true,
    });
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);

    const { refresh } = useRiskState(); // To trigger a re-computation

    useEffect(() => {
        // Load initial state from localStorage
        const guardrails = JSON.parse(localStorage.getItem("ec_guardrails") || "{}");
        const recoveryMode = localStorage.getItem("ec_recovery_mode") === 'true';
        setControls(prev => ({ ...prev, ...guardrails }));
        setIsRecoveryMode(recoveryMode);
    }, []);

    const handleGuardrailChange = (key: keyof typeof controls, value: boolean) => {
        const newControls = { ...controls, [key]: value };
        setControls(newControls);
        localStorage.setItem("ec_guardrails", JSON.stringify(newControls));
        refresh(); // Manually trigger state re-computation
    };

    const handleRecoveryModeChange = (value: boolean) => {
        setIsRecoveryMode(value);
        localStorage.setItem("ec_recovery_mode", String(value));
        refresh();
    };

    const ControlSwitch = ({ id, label, description }: { id: keyof typeof controls, label: string, description: string }) => (
        <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <Label htmlFor={id} className="text-sm">{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch
                id={id}
                checked={controls[id]}
                onCheckedChange={(checked) => handleGuardrailChange(id, checked)}
            />
        </div>
    );
    
    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Risk Controls</CardTitle>
                <CardDescription>Toggle real-time guardrails.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ControlSwitch id="warnOnHighRisk" label="Warn if risk > strategy" description="Alerts if trade risk % exceeds strategy default." />
                <ControlSwitch id="warnOnHighVIX" label="Warn in high VIX" description="Alerts when trading in Elevated/Extreme VIX." />
                <ControlSwitch id="cooldownAfterLosses" label="Stop after 2 losses" description="Enforces a daily cooldown after 2 losses." />
                
                <Separator />
                
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="recovery-mode" className="text-sm text-amber-400">Recovery Mode</Label>
                        <p className="text-xs text-muted-foreground">Enforces stricter global risk limits.</p>
                    </div>
                    <Switch
                        id="recovery-mode"
                        checked={isRecoveryMode}
                        onCheckedChange={handleRecoveryModeChange}
                        className="data-[state=checked]:bg-amber-500"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function ExposureSnapshotCard({ onSetModule }: { onSetModule: (module: any) => void }) {
    const [brokerConnected, setBrokerConnected] = useState(false);
    const [positions, setPositions] = useState<any[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const connected = localStorage.getItem('ec_broker_connected') === 'true';
            setBrokerConnected(connected);
            if (connected) {
                // In a real app, you'd fetch this. For now, use mock.
                setPositions(mockPositions);
            }
        }
    }, []);

    const hasHighRisk = positions.some(p => p.risk === 'High');

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Exposure Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
                {!brokerConnected ? (
                    <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-foreground">No Broker Connected</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Connect your broker to see your live exposure and open positions.
                        </p>
                        <Button className="mt-4" onClick={() => onSetModule('settings')}>Go to Broker Integration</Button>
                    </div>
                ) : positions.length === 0 ? (
                     <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-foreground">No Open Positions</h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {hasHighRisk && (
                            <Alert variant="destructive">
                                <Bot className="h-4 w-4" />
                                <AlertTitle>Arjun's Warning</AlertTitle>
                                <AlertDescription>
                                    One or more of your open positions has a high-risk rating. Review your SL and position size.
                                </AlertDescription>
                            </Alert>
                        )}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Symbol</TableHead>
                                    <TableHead>PnL</TableHead>
                                    <TableHead>Risk</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {positions.map(pos => (
                                    <TableRow key={pos.symbol}>
                                        <TableCell>
                                            <div className="font-semibold">{pos.symbol}</div>
                                            <div className={cn("text-xs", pos.direction === 'Long' ? 'text-green-400' : 'text-red-400')}>{pos.direction}</div>
                                        </TableCell>
                                        <TableCell className={cn("font-mono", pos.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                                            {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                pos.risk === "High" && "border-red-500/50 text-red-400",
                                                pos.risk === "Medium" && "border-amber-500/50 text-amber-400"
                                            )}>{pos.risk}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ArjunRiskAlerts({ onSetModule }: { onSetModule: (module: any, context?: any) => void }) {
    const { riskState } = useRiskState();

    const alerts = useMemo(() => {
        if (!riskState) return [];

        const generatedAlerts = riskState.decision.reasons.map(reason => {
            if (reason.toLowerCase().includes('leverage')) {
                return {
                    severity: 'red' as 'red',
                    title: 'High Leverage Detected',
                    suggestion: "High leverage + high volatility increases liquidation probability. Review open positions.",
                    action: { label: 'Review Exposure', module: 'riskCenter' }
                };
            }
             if (reason.toLowerCase().includes('cooldown')) {
                return {
                    severity: 'red' as 'red',
                    title: `You're on a ${riskState.todaysLimits.lossStreak}-trade losing streak`,
                    suggestion: "This is a critical moment for your discipline. Pause trading and review these losses to understand the pattern.",
                    action: { label: 'Go to Journal', module: 'tradeJournal' }
                };
            }
            if (reason.toLowerCase().includes('discipline score')) {
                return {
                    severity: 'warn' as 'warn',
                    title: 'Your discipline score is low',
                    suggestion: "This indicates recent rule-breaking. Focus on following your plan to the letter on your next trade.",
                    action: { label: 'Review Analytics', module: 'analytics' }
                };
            }
            if (reason.toLowerCase().includes('volatility')) {
                 return {
                    severity: 'warn' as 'warn',
                    title: `Market volatility is '${riskState.marketRisk.vixZone}'`,
                    suggestion: "Risk of sharp, unpredictable moves is high. Consider if any trade is truly an A+ setup right now.",
                    action: { label: 'Go to Trade Planning', module: 'tradePlanning' }
                };
            }
            return null;
        }).filter((alert): alert is NonNullable<typeof alert> => alert !== null);
        
        if (generatedAlerts.length === 0) {
            return [{
                severity: 'info' as 'info',
                title: 'No critical alerts',
                suggestion: 'All systems are currently within your defined risk parameters. Focus on executing your plan.',
                action: { label: 'Plan next trade', module: 'tradePlanning' }
            }];
        }
        return generatedAlerts;
    }, [riskState]);

    const handlePlanSafeTrade = () => {
        onSetModule('tradePlanning', {
            planContext: { instrument: 'BTC-PERP', source: 'riskCenter', safeMode: true }
        });
    };

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Arjun Risk Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {alerts.map((alert, index) => (
                    <div key={index} className={cn("p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", 
                        alert.severity === 'red' && 'bg-red-950/40 border-red-500/20',
                        alert.severity === 'warn' && 'bg-amber-950/40 border-amber-500/20',
                        alert.severity === 'info' && 'bg-blue-950/40 border-blue-500/20'
                    )}>
                        <div className="flex-1">
                            <h4 className={cn("font-semibold flex items-center gap-2", 
                                alert.severity === 'red' && 'text-red-400',
                                alert.severity === 'warn' && 'text-amber-400',
                                alert.severity === 'info' && 'text-blue-400'
                            )}>
                                {alert.severity === 'red' && <XCircle />}
                                {alert.severity === 'warn' && <AlertTriangle />}
                                {alert.severity === 'info' && <Info />}
                                {alert.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                <span className="font-semibold text-foreground">What to do now:</span> {alert.suggestion}
                            </p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-background/20 border-border/50 whitespace-nowrap"
                            onClick={() => onSetModule(alert.action.module, alert.action.context)}
                        >
                            {alert.action.label} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <div className="pt-4 border-t border-border/50 text-center">
                    <Button onClick={handlePlanSafeTrade}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Plan a trade (Safe Mode)
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        This pre-selects a conservative strategy and reduced risk.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function RiskBudgetCard({ limits, decision, refreshState }: { limits: RiskState['todaysLimits'], decision: RiskState['decision'] | null, refreshState: () => void }) {
    const [simulatedLossR, setSimulatedLossR] = useState<number | null>(null);
    const [assumedCapital, setAssumedCapital] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("ec_assumed_capital") || "10000";
        }
        return "10000";
    });

    useEffect(() => {
        const handleStorage = () => {
            const stored = localStorage.getItem("ec_assumed_capital");
            if (stored) setAssumedCapital(stored);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAssumedCapital(e.target.value);
    };

    const handleCapitalBlur = () => {
        localStorage.setItem("ec_assumed_capital", assumedCapital);
        refreshState(); // Trigger a full re-computation
    };

    const { maxDailyLossPct, dailyBudgetRemaining, maxSafeTradesRemaining, riskPerTradePct } = limits;
    const accountCapital = parseFloat(assumedCapital) || 10000;
    const maxDailyLossValue = accountCapital * (maxDailyLossPct / 100);
    const currentDrawdown = maxDailyLossValue - dailyBudgetRemaining;
    
    const progress = maxDailyLossValue > 0 ? (currentDrawdown / maxDailyLossValue) * 100 : 0;
    
    // Simulation logic
    const riskPerR = accountCapital * (riskPerTradePct / 100);
    const simulatedLoss = simulatedLossR !== null ? riskPerR * simulatedLossR : 0;
    const budgetAfterLoss = dailyBudgetRemaining - simulatedLoss;
    
    const getSimulatedDecisionLevel = (): RiskDecision['level'] => {
        if (!decision) return 'green';
        if (budgetAfterLoss <= 0) return 'red';
        if (decision.level === 'red') return 'red';
        if (simulatedLossR !== null && simulatedLossR > 1) return 'yellow';
        return decision.level;
    }

    const simulatedDecisionLevel = getSimulatedDecisionLevel();
    const isBrokerConnected = typeof window !== 'undefined' ? localStorage.getItem('ec_broker_connected') === 'true' : false;

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> Risk Budget (Today)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>$0</span>
                        <span>Max Daily Loss: ${maxDailyLossValue.toFixed(0)}</span>
                    </div>
                    <Progress value={progress} indicatorClassName="bg-destructive" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Current drawdown: ${currentDrawdown.toFixed(0)}</span>
                    </div>
                </div>

                <div className="p-3 rounded-lg bg-muted border space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget Remaining:</span>
                        <span className="font-mono font-semibold text-foreground">${dailyBudgetRemaining.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Max Safe Trades:</span>
                        <span className="font-mono font-semibold text-foreground">{maxSafeTradesRemaining} <span className="text-xs text-muted-foreground">(at {riskPerTradePct}% risk)</span></span>
                    </div>
                </div>
            </CardContent>
            <Separator />
            <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="assumed-capital" className="text-sm font-semibold text-foreground">Assumed Capital</Label>
                    <Input
                        id="assumed-capital"
                        type="number"
                        value={assumedCapital}
                        onChange={handleCapitalChange}
                        onBlur={handleCapitalBlur}
                        disabled={isBrokerConnected}
                    />
                    {!isBrokerConnected && (
                         <p className="text-xs text-muted-foreground">Using assumed capital (prototype). Connect broker for live balance.</p>
                    )}
                </div>
                <Separator />
                <div className="space-y-3">
                    <Label className="font-semibold text-foreground">Simulate Next Trade</Label>
                    <Select onValueChange={(v) => setSimulatedLossR(parseFloat(v))}>
                        <SelectTrigger>
                            <SelectValue placeholder="If next trade loses..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0.5">-0.5R</SelectItem>
                            <SelectItem value="1">-1.0R</SelectItem>
                            <SelectItem value="2">-2.0R</SelectItem>
                        </SelectContent>
                    </Select>
                    {simulatedLossR !== null && (
                         <div className="p-3 rounded-lg bg-muted border space-y-2 animate-in fade-in">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Budget after loss:</span>
                                <span className="font-mono font-semibold text-foreground">${budgetAfterLoss.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-muted-foreground">Decision changes to:</span>
                                <Badge className={cn(
                                    simulatedDecisionLevel === 'red' && 'bg-red-500/20 text-red-300 border-red-500/30',
                                    simulatedDecisionLevel === 'yellow' && 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                                    simulatedDecisionLevel === 'green' && 'bg-green-500/20 text-green-300 border-green-500/30'
                                )}>{simulatedDecisionLevel.toUpperCase()}</Badge>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function RiskEventsTimeline({ events }: { events: RiskState['riskEventsToday'] }) {
    if (events.length === 0) {
        return (
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Today's Risk Events</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground text-sm py-8">No significant risk events logged for today yet.</p>
                </CardContent>
            </Card>
        );
    }
    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Today's Risk Events</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64 pr-4">
                    <div className="relative">
                        <div className="absolute left-3 top-0 bottom-0 w-px bg-border -z-10" />
                        <div className="space-y-6">
                            {events.map((event, index) => (
                                <div key={index} className="flex items-start gap-4">
                                    <div className="relative">
                                        <div className={cn("absolute top-1 left-3 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-background",
                                            event.level === 'red' && 'bg-red-500',
                                            event.level === 'yellow' && 'bg-amber-500',
                                            event.level === 'green' && 'bg-green-500'
                                        )} />
                                    </div>
                                    <div className="pl-6">
                                        <p className="text-xs text-muted-foreground">{event.time}</p>
                                        <p className="text-sm font-medium text-foreground">{event.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}


export function RiskCenterModule({ onSetModule }: RiskCenterModuleProps) {
    const { riskState, isLoading, refresh } = useRiskState();

    if (isLoading || !riskState) {
        return (
            <div className="space-y-8 animate-pulse">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-20 w-full" />
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    const { marketRisk, personalRisk, todaysLimits, decision, riskEventsToday } = riskState;


    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Risk Center</h1>
                     <p className="text-muted-foreground flex items-center gap-2">
                        A single view of market risk + your personal risk posture. Answer: Should I trade today?
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground/80 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">Risk Center aggregates data from your Strategy, Planning, Analytics, and VIX.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" /> Refresh State</Button>
            </div>
            
            <TradeDecisionBar decision={decision} />
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                   
                    <MarketRiskCard marketRisk={marketRisk} onSetModule={onSetModule} />

                    <RiskEventsTimeline events={riskEventsToday} />
                    
                    <ExposureSnapshotCard onSetModule={onSetModule} />
                </div>

                <div className="lg:col-span-1 space-y-8 sticky top-24">
                     <RevengeRiskCard revengeRiskIndex={personalRisk.revengeRiskIndex} revengeRiskLevel={personalRisk.revengeRiskLevel} />
                     <PersonalRiskCard personalRisk={personalRisk} onSetModule={onSetModule} />
                     <TodaysLimitsCard limits={todaysLimits} onSetModule={onSetModule} />
                     <RiskBudgetCard limits={todaysLimits} decision={decision} refreshState={refresh} />
                     <RiskControlsCard />
                </div>
            </div>
             <ArjunRiskAlerts onSetModule={onSetModule} />
        </div>
    );
}
