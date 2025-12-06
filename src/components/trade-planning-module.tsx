

"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Info, CheckCircle, Circle, AlertTriangle, FileText, ArrowRight, Gauge, ShieldCheck, XCircle, X, Lock, Loader2, Bookmark, Copy, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { DemoScenario } from "./dashboard-module";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useEventLog } from "@/context/event-log-provider";
import { Slider } from "./ui/slider";


interface TradePlanningModuleProps {
    onSetModule: (module: any, context?: any) => void;
    planContext?: {
        instrument: string;
        direction?: 'Long' | 'Short';
        origin: string;
    }
}

const planSchema = z.object({
    instrument: z.string().min(1, "Required."),
    direction: z.enum(["Long", "Short"]),
    entryType: z.enum(["Market", "Limit"]),
    entryPrice: z.coerce.number().positive("Must be > 0."),
    stopLoss: z.coerce.number().positive("Must be > 0."),
    takeProfit: z.coerce.number().optional(),
    leverage: z.coerce.number().min(1).max(100),
    accountCapital: z.coerce.number().positive("Must be > 0."),
    riskPercent: z.coerce.number().min(0.1).max(100),
    strategyId: z.string().min(1, "Required."),
    notes: z.string().optional(),
    justification: z.string().min(10, "Justification must be at least 10 characters.").optional(),
    mindset: z.string().optional(),
}).refine(data => {
    if (data.direction === 'Long' && data.entryPrice > 0 && data.stopLoss > 0) return data.stopLoss < data.entryPrice;
    return true;
}, {
    message: "For Longs, SL must be below Entry.",
    path: ["stopLoss"],
}).refine(data => {
    if (data.direction === 'Long' && data.entryPrice > 0 && data.takeProfit && data.takeProfit > 0) return data.takeProfit > data.entryPrice;
    return true;
}, {
    message: "For Longs, TP must be above Entry.",
    path: ["takeProfit"],
}).refine(data => {
    if (data.direction === 'Short' && data.entryPrice > 0 && data.stopLoss > 0) return data.stopLoss > data.entryPrice;
    return true;
}, {
    message: "For Shorts, SL must be above Entry.",
    path: ["stopLoss"],
}).refine(data => {
    if (data.direction === 'Short' && data.entryPrice > 0 && data.takeProfit && data.takeProfit > 0) return data.takeProfit < data.entryPrice;
    return true;
}, {
    message: "For Shorts, TP must be below Entry.",
    path: ["takeProfit"],
});


type PlanFormValues = z.infer<typeof planSchema>;

const mockStrategies = [
    { id: '1', name: "London Reversal" },
    { id: '2', name: "BTC Trend Breakout" },
];

const planTemplates: ({ id: string, name: string, values: Partial<PlanFormValues> })[] = [
    { id: 'blank', name: "Blank plan", values: {} },
    {
        id: 'btc_trend',
        name: "BTC – Intraday trend follow",
        values: {
            instrument: "BTC-PERP",
            direction: "Long",
            leverage: 20,
            riskPercent: 1,
            strategyId: "2",
            notes: "Looking for continuation after a period of consolidation. Entry on retest of breakout level.",
        }
    },
    {
        id: 'eth_scalp',
        name: "ETH – Mean reversion scalp",
        values: {
            instrument: "ETH-PERP",
            direction: "Short",
            leverage: 50,
            riskPercent: 0.5,
            strategyId: "1",
            notes: "Fading the extreme of the range during low volatility. Expecting a quick move back to the median.",
        }
    },
    { id: 'custom_soon', name: "Custom template 1 (soon)", values: {} },
];

type PlanStatusType = "incomplete" | "blocked" | "needs_attention" | "ok" | "overridden";
type TradePlanStep = "plan" | "review" | "execute";

const PlanStatus = ({ status, message }: { status: PlanStatusType, message: string }) => {
    const statusConfig = {
        incomplete: {
            label: "Incomplete",
            className: "bg-muted text-muted-foreground border-border",
            icon: Circle
        },
        blocked: {
            label: "Blocked by Rules",
            className: "bg-red-500/20 text-red-400 border-red-500/30",
            icon: XCircle,
        },
        needs_attention: {
            label: "Needs Attention",
            className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
            icon: AlertTriangle
        },
        ok: {
            label: "Structurally OK",
            className: "bg-green-500/20 text-green-400 border-green-500/30",
            icon: CheckCircle
        },
        overridden: {
            label: "Rules Overridden",
            className: "bg-orange-600/20 text-orange-400 border-orange-600/30",
            icon: AlertTriangle,
        }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", config.className.split(' ').filter(c => c.startsWith('text-'))[0])} />
                <Badge variant="secondary" className={cn("text-xs", config.className)}>{config.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{message}</p>
        </div>
    )
}

function MarketContext() {
    const [market, setMarket] = useState({ vixValue: 45, vixZone: 'Normal' });

    useEffect(() => {
        const scenario = localStorage.getItem('ec_demo_scenario') as DemoScenario | null;
        let vixValue = 45;
        if (scenario === 'high_vol') vixValue = 82;

        const getVixZone = (vix: number) => {
            if (vix > 75) return "Extreme";
            if (vix > 50) return "Elevated";
            if (vix > 25) return "Normal";
            return "Calm";
        }
        setMarket({ vixValue, vixZone: getVixZone(vixValue) });
    }, []);
    
    const isHighVol = market.vixZone === 'Extreme' || market.vixZone === 'Elevated';

    return (
        <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Market Context</h3>
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Gauge className="h-4 w-4" /> Crypto VIX</p>
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{market.vixValue}</span>
                        <Badge variant="secondary" className={cn(
                            'text-xs',
                            isHighVol ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'
                        )}>
                            {market.vixZone}
                        </Badge>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                    {isHighVol ? "Volatility is elevated – expect sharp swings." : "Volatility is normal – market is stable."}
                </p>
                
                <Separator />

                {isHighVol ? (
                    <Alert variant="default" className="p-3 bg-amber-500/10 border-amber-500/20 text-amber-300">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <AlertTitle className="text-xs font-semibold text-amber-400">Arjun's Note</AlertTitle>
                        <AlertDescription className="text-xs text-amber-300/80">
                            Consider smaller size & cleaner setups. High volatility makes it easier to get stopped out.
                        </AlertDescription>
                    </Alert>
                ) : (
                     <Alert variant="default" className="p-3 bg-green-500/10 border-green-500/20 text-green-300">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <AlertTitle className="text-xs font-semibold text-green-400">Arjun's Note</AlertTitle>
                        <AlertDescription className="text-xs text-green-300/80">
                            Conditions seem stable. Follow your plan.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    )
}

type RuleStatus = "PASS" | "WARN" | "FAIL" | "N/A";
type RuleCheck = { label: string; status: RuleStatus, note: string };

const getRuleChecks = (rrr: number, riskPercent: number): RuleCheck[] => {
    // In a real app, this data would come from context/props
    const vixZone = (localStorage.getItem('ec_demo_scenario') === 'high_vol') ? 'Elevated' : 'Normal';
    const performanceState = (localStorage.getItem('ec_demo_scenario') === 'drawdown') ? 'drawdown' : 'stable';

    return [
        {
            label: "R:R Ratio must be >= 1.5",
            status: !rrr || rrr === 0 ? "N/A" : rrr < 1.5 ? "WARN" : "PASS",
            note: "If your winners aren't meaningfully larger than your losers, you need a very high win rate just to break even. Aim for at least 1.5R."
        },
        {
            label: "Risk per trade <= 2%",
            status: !riskPercent ? "N/A" : riskPercent > 3 ? "FAIL" : riskPercent > 2 ? "WARN" : "PASS",
            note: "Risking a small percentage of your capital on any single trade is the #1 rule for survival. Large risk makes it easy to blow up an account on a bad day."
        },
        {
            label: "Trade only in Calm/Normal VIX",
            status: vixZone === "Extreme" ? "FAIL" : vixZone === "Elevated" ? "WARN" : "PASS",
            note: "This rule is based on your strategy's ideal conditions. Trading outside of the optimal volatility regime often leads to poor performance."
        },
        {
            label: "Avoid trading in a drawdown",
            status: performanceState === 'drawdown' ? "WARN" : "PASS",
            note: "When in a drawdown, your psychology is compromised. This rule recommends reducing size or taking a break to avoid revenge trading."
        }
    ];
};

const StatusBadge = ({ status }: { status: RuleStatus }) => {
    const config = {
        "PASS": "bg-green-500/20 text-green-400 border-green-500/30",
        "WARN": "bg-amber-500/20 text-amber-400 border-amber-500/30",
        "FAIL": "bg-red-500/20 text-red-400 border-red-500/30",
        "N/A": "bg-muted text-muted-foreground border-border",
    };
    return <Badge variant="secondary" className={cn("text-xs font-mono", config[status])}>{status}</Badge>;
}

function RuleChecks({ checks }: { checks: RuleCheck[] }) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Strategy Rule Checks</h3>
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-4">
                 <p className="text-xs text-muted-foreground">Your plan is checked against your saved rules and best practices.</p>
                {checks.map((check, i) => (
                     <TooltipProvider key={i}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-muted-foreground">{check.label}</p>
                                    <StatusBadge status={check.status} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{check.note}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    )
}

function DisciplineAlerts({ onSetModule }: { onSetModule: TradePlanningModuleProps['onSetModule'] }) {
  const [alerts, setAlerts] = useState<string[]>([]);
  const [initialPrompt, setInitialPrompt] = useState<string>("");

  useEffect(() => {
    const scenario = localStorage.getItem('ec_demo_scenario') as DemoScenario | null;
    const personaData = JSON.parse(localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base") || "{}");
    const personaName = personaData.primaryPersonaName || "The Determined Trader";
    const newAlerts = [];

    let prompt = "Arjun, let's talk about my current mindset. ";
    
    if (scenario === 'high_vol' && personaName.includes("Impulsive")) {
      newAlerts.push("Your persona tends to <span class='text-amber-400'>overtrade</span> in high volatility. Focus on A+ setups only.");
      prompt += "I'm in a high volatility market and I tend to be impulsive. How can I stay focused?";
    }

    if (scenario === 'drawdown') {
      newAlerts.push("You’re in a <span class='text-amber-400'>drawdown</span>. This trade should be part of a structured recovery plan, not a quick fix.");
       prompt += "I'm in a drawdown. How can I ensure this next trade is part of a recovery plan and not just chasing losses?";
    }
    
    if (newAlerts.length === 0) {
        newAlerts.push("Performance is <span class='text-green-400'>stable</span>. This is the time to focus on consistent execution of your plan.");
        prompt += "My performance has been stable. How do I maintain this consistency and avoid complacency?";
    }

    setAlerts(newAlerts);
    setInitialPrompt(prompt);
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Discipline & History Alerts</h3>
        <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3">
             <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                {alerts.map((alert, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: alert }} />
                ))}
            </ul>
             <Button 
                variant="link" 
                size="sm" 
                className="px-0 h-auto text-xs text-primary/80 hover:text-primary"
                onClick={() => onSetModule('aiCoaching', { initialMessage: initialPrompt })}
            >
                Discuss this with Arjun <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
        </div>
    </div>
  )
}

function PriceLadder({ direction, entryPrice, stopLoss, takeProfit }: { direction: "Long" | "Short", entryPrice?: number, stopLoss?: number, takeProfit?: number }) {
    if (!entryPrice || !stopLoss) {
        return null;
    }

    const isLong = direction === 'Long';
    const prices = [entryPrice, stopLoss];
    if (takeProfit) {
        prices.push(takeProfit);
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;

    if (range === 0) return null;

    const buffer = range * 0.1;
    const paddedMin = minPrice - buffer;
    const paddedMax = maxPrice + buffer;
    const paddedRange = paddedMax - paddedMin;

    const getPosition = (price: number) => {
        return ((price - paddedMin) / paddedRange) * 100;
    };
    
    const slDistPercent = ((Math.abs(entryPrice - stopLoss) / entryPrice) * 100).toFixed(2);
    const tpDistPercent = takeProfit ? ((Math.abs(takeProfit - entryPrice) / entryPrice) * 100).toFixed(2) : '0';

    const markers = [
        { price: entryPrice, label: "Entry", color: "bg-primary", dist: "" },
        { price: stopLoss, label: "SL", color: "bg-red-500", dist: `-${slDistPercent}%` },
    ];

    if (takeProfit) {
        markers.push({ price: takeProfit, label: "TP", color: "bg-green-500", dist: `+${tpDistPercent}%` });
    }

    return (
        <div className="relative h-40 w-full">
            {/* Center Line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border -translate-x-1/2" />
            
            {markers.map(({ price, label, color, dist }) => {
                const position = getPosition(price);
                const isEntry = label === 'Entry';
                const onLeft = label === 'SL' || (isLong && isEntry) || (!isLong && label === 'TP');

                return (
                     <div key={label} className="absolute w-full" style={{ bottom: `${position}%` }}>
                        <div className={cn("absolute flex items-center gap-2 -translate-y-1/2", onLeft ? 'right-1/2 mr-4' : 'left-1/2 ml-4')}>
                            {onLeft ? (
                                <>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-foreground">{label}</p>
                                        <p className="text-xs text-muted-foreground">{dist}</p>
                                    </div>
                                    <div className={cn("w-2 h-2 rounded-full", color)} />
                                </>
                            ) : (
                                 <>
                                    <div className={cn("w-2 h-2 rounded-full", color)} />
                                    <div className="text-left">
                                        <p className="text-xs font-semibold text-foreground">{label}</p>
                                        <p className="text-xs text-muted-foreground">{dist}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function PlanSummary({ control, setPlanStatus, onSetModule }: { control: any, setPlanStatus: (status: PlanStatusType) => void, onSetModule: TradePlanningModuleProps['onSetModule'] }) {
    const values = useWatch({ control }) as Partial<PlanFormValues>;
    const { instrument, direction, entryPrice, stopLoss, takeProfit, riskPercent, accountCapital, strategyId, notes, justification } = values;

    const [summary, setSummary] = useState({
        rrr: 0,
        positionSize: 0,
        potentialLoss: 0,
        potentialProfit: 0,
        distanceToSl: 0,
        distanceToSlPercent: 0,
        distanceToTp: 0,
        distanceToTpPercent: 0
    });
    
    const [localPlanStatus, setLocalPlanStatus] = useState<PlanStatusType>("incomplete");
    const [statusMessage, setStatusMessage] = useState("Fill in all required values to continue.");
    const [ruleChecks, setRuleChecks] = useState<RuleCheck[]>([]);

    useEffect(() => {
        // --- Calculations ---
        const isLong = direction === "Long";
        const numEntryPrice = Number(entryPrice);
        const numStopLoss = Number(stopLoss);
        const numTakeProfit = Number(takeProfit);

        const riskPerUnit = (numEntryPrice && numStopLoss) ? Math.abs(numEntryPrice - numStopLoss) : 0;
        const rewardPerUnit = (numTakeProfit && numEntryPrice) ? Math.abs(numTakeProfit - numEntryPrice) : 0;
        const rrr = (riskPerUnit > 0 && rewardPerUnit > 0) ? rewardPerUnit / riskPerUnit : 0;
        
        const potentialLoss = (accountCapital && riskPercent) ? (Number(accountCapital) * Number(riskPercent)) / 100 : 0;
        const positionSize = riskPerUnit > 0 ? potentialLoss / riskPerUnit : 0;
        const potentialProfit = potentialLoss * rrr;
        
        const distanceToSl = (numEntryPrice && numStopLoss) ? Math.abs(numEntryPrice - numStopLoss) : 0;
        const distanceToSlPercent = numEntryPrice > 0 ? (distanceToSl / numEntryPrice) * 100 : 0;
        const distanceToTp = (numTakeProfit && numEntryPrice) ? Math.abs(numTakeProfit - numEntryPrice) : 0;
        const distanceToTpPercent = (numEntryPrice && numTakeProfit) ? (distanceToTp / numEntryPrice) * 100 : 0;
        
        setSummary({ rrr, positionSize, potentialLoss, potentialProfit, distanceToSl, distanceToSlPercent, distanceToTp, distanceToTpPercent });
        
        // --- Rule Checks & Status Logic ---
        const currentChecks = getRuleChecks(rrr, riskPercent ? Number(riskPercent) : 0);
        setRuleChecks(currentChecks);

        const requiredFieldsSet = instrument && direction && numEntryPrice > 0 && numStopLoss > 0 && accountCapital && riskPercent && strategyId && notes && notes.length >= 10;
        let currentStatus: PlanStatusType = 'incomplete';
        let currentMessage = "Fill in all required values to continue.";

        if (!requiredFieldsSet) {
            currentStatus = 'incomplete';
            currentMessage = "Fill in all required values to continue.";
        } else {
            const hasFails = currentChecks.some(c => c.status === 'FAIL');
            const hasWarns = currentChecks.some(c => c.status === 'WARN');
            const structuralWarning = rrr > 0 && rrr < 1.0;

            if (hasFails) {
                if (justification && justification.length >= 10) {
                    currentStatus = "overridden";
                    currentMessage = "Rules overridden with justification. Proceed with extreme caution.";
                } else {
                    currentStatus = "blocked";
                    currentMessage = "One or more critical rules are failing. Add justification to override.";
                }
            } else if (hasWarns || structuralWarning) {
                currentStatus = "needs_attention";
                currentMessage = "This plan has warnings. Review the rule checks before proceeding.";
            } else {
                currentStatus = "ok";
                currentMessage = "This plan looks structurally sound. Review the checks before proceeding.";
            }
        }
        
        setPlanStatus(currentStatus);
        setLocalPlanStatus(currentStatus);
        setStatusMessage(currentMessage);

    }, [instrument, direction, entryPrice, stopLoss, takeProfit, riskPercent, accountCapital, strategyId, notes, justification, setPlanStatus]);

    const isLong = direction === "Long";
    const isSlSet = stopLoss && Number(stopLoss) > 0;
    const isTpSet = takeProfit && Number(takeProfit) > 0;
    const canCalcRisk = entryPrice && Number(entryPrice) > 0 && stopLoss && Number(stopLoss) > 0 && riskPercent && accountCapital;
    const hasFails = ruleChecks.some(c => c.status === 'FAIL');

    const SummaryRow = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
        <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">{label}</p>
            <p className={cn("font-semibold font-mono text-foreground", className)}>{value}</p>
        </div>
    );

    return (
        <Card className="bg-muted/30 border-primary/20">
            <CardHeader>
                <CardTitle>Plan summary & checks</CardTitle>
                <CardDescription>Live calculation based on your inputs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <PlanStatus status={localPlanStatus} message={statusMessage} />
                
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Numeric Summary</h3>
                    <div className="space-y-2">
                        <SummaryRow label="Pair / Direction" value={<span className={isLong ? 'text-green-400' : 'text-red-400'}>{instrument || '-'} {direction}</span>} />
                        <SummaryRow label="Entry Price" value={entryPrice && Number(entryPrice) > 0 ? Number(entryPrice).toFixed(4) : '-'} />
                        <SummaryRow label="Stop Loss" value={isSlSet ? Number(stopLoss).toFixed(4) : <span className="text-red-400">Not set</span>} />
                        <SummaryRow label="Take Profit" value={isTpSet ? Number(takeProfit).toFixed(4) : 'Not set'} />
                    </div>
                </div>

                <PriceLadder direction={direction as "Long" | "Short"} entryPrice={Number(entryPrice)} stopLoss={Number(stopLoss)} takeProfit={Number(takeProfit)} />
                
                <Separator />
                
                <div>
                     <h3 className="text-sm font-semibold text-foreground mb-3">Risk & Sizing</h3>
                    {canCalcRisk ? (
                        <div className="space-y-2">
                             <SummaryRow label="R:R Ratio" value={summary.rrr > 0 ? `${summary.rrr.toFixed(2)} : 1` : '-'} className={summary.rrr > 0 ? (summary.rrr < 1.5 ? 'text-amber-400' : 'text-green-400') : ''} />
                             <SummaryRow label="Position Size" value={summary.positionSize > 0 ? `${summary.positionSize.toFixed(4)} ${instrument?.replace('-PERP','').replace('USDT','')} ` : '-'} />
                             <SummaryRow label="Potential Loss" value={`-$${summary.potentialLoss > 0 ? summary.potentialLoss.toFixed(2) : '0.00'}`} className="text-red-400" />
                             <SummaryRow label="Potential Profit" value={`+$${summary.potentialProfit > 0 ? summary.potentialProfit.toFixed(2) : '0.00'}`} className="text-green-400" />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center">Enter Entry, SL & account details to calculate risk.</p>
                    )}
                </div>

                 <Separator />

                <MarketContext />
                
                <Separator />

                <RuleChecks checks={ruleChecks} />

                <Separator />

                <DisciplineAlerts onSetModule={onSetModule} />

                {hasFails && (
                    <>
                    <Separator />
                    <FormField
                        control={control}
                        name="justification"
                        render={({ field }) => (
                            <FormItem className="p-4 bg-red-950/50 border border-red-500/20 rounded-lg">
                                <FormLabel className="text-red-400">Justification to Override Rules</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Why is this trade worth making despite rule violations? This will be logged."
                                        className="bg-background/50 border-red-500/30 focus-visible:ring-red-500"
                                        {...field}
                                    />
                                </FormControl>
                                <p className="text-xs text-red-400/80">You are breaking your own rules. Explain why you want to proceed.</p>
                                <FormMessage className="text-red-400" />
                            </FormItem>
                        )}
                    />
                    </>
                )}
                
                {!isSlSet && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Stop Loss Required</AlertTitle>
                        <AlertDescription>The plan is invalid until a stop loss is defined.</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}

function WhatIfRiskSlider({ control, form }: { control: any; form: ReturnType<typeof useForm<PlanFormValues>> }) {
    const { entryPrice, stopLoss, accountCapital, riskPercent } = useWatch({ control }) as Partial<PlanFormValues>;
    const [whatIfRisk, setWhatIfRisk] = useState<number>(riskPercent || 1);

    useEffect(() => {
        setWhatIfRisk(riskPercent || 1);
    }, [riskPercent]);

    const numEntryPrice = Number(entryPrice);
    const numStopLoss = Number(stopLoss);
    const numAccountCapital = Number(accountCapital);

    const riskPerUnit = (numEntryPrice && numStopLoss) ? Math.abs(numEntryPrice - numStopLoss) : 0;
    
    const calculateSizing = (currentRisk: number) => {
        if (!numAccountCapital || !riskPerUnit) return { size: 0, loss: 0 };
        const potentialLoss = (numAccountCapital * currentRisk) / 100;
        const positionSize = riskPerUnit > 0 ? potentialLoss / riskPerUnit : 0;
        return { size: positionSize, loss: potentialLoss };
    };

    const whatIfSizing = calculateSizing(whatIfRisk);
    
    const handleApply = () => {
        form.setValue("riskPercent", whatIfRisk, { shouldValidate: true });
    };

    const handleReset = () => {
        setWhatIfRisk(riskPercent || 1);
    };

    if (!numEntryPrice || !numStopLoss || !numAccountCapital) return null;

    return (
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
             <h3 className="text-sm font-semibold text-muted-foreground">What-if Analysis: Risk</h3>
             <div>
                <Label>Adjust risk to see its impact</Label>
                <Slider
                    value={[whatIfRisk]}
                    onValueChange={(val) => setWhatIfRisk(val[0])}
                    min={0.25}
                    max={3}
                    step={0.25}
                    className="my-2"
                />
                 <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.25%</span>
                    <span>3%</span>
                </div>
            </div>
            <div className="p-3 bg-background/50 rounded-md text-sm">
                <p>At <span className="font-bold text-primary">{whatIfRisk}%</span> risk:</p>
                <ul className="text-xs text-muted-foreground mt-1">
                    <li>Position Size: <span className="font-mono">{whatIfSizing.size.toFixed(4)}</span></li>
                    <li>Dollar Risk: <span className="font-mono text-red-400">-${whatIfSizing.loss.toFixed(2)}</span></li>
                </ul>
            </div>
             <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleApply} className="w-full">
                    Apply {whatIfRisk}% to Plan
                </Button>
                <Button size="sm" variant="ghost" onClick={handleReset} className="w-full">
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Reset
                </Button>
            </div>
        </div>
    );
}

function PlanStep({ form, onSetModule, setPlanStatus, onApplyTemplate, planContext, isNewUser }: { form: any, onSetModule: any, setPlanStatus: any, onApplyTemplate: (templateId: string) => void, planContext?: TradePlanningModuleProps['planContext'], isNewUser: boolean }) {
    const entryType = useWatch({ control: form.control, name: 'entryType' });
    const [selectedTemplate, setSelectedTemplate] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("ec_trade_plan_last_template") || 'blank';
        }
        return 'blank';
    });

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        onApplyTemplate(templateId);
    };

    return (
         <div className="grid lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-2 bg-muted/30 border-border/50">
                <CardHeader className="flex-row items-start justify-between">
                    <CardTitle>Plan details</CardTitle>
                    {planContext && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            Context: From {planContext.origin}
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Template Selector */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2 border-b border-border/50">
                        <Label htmlFor="plan-template">Start from template</Label>
                        <Select onValueChange={handleTemplateChange} value={selectedTemplate}>
                            <SelectTrigger id="plan-template">
                                <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                                {planTemplates.map(template => (
                                    <SelectItem 
                                        key={template.id} 
                                        value={template.id}
                                        disabled={template.id === 'custom_soon'}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Copy className="h-4 w-4 text-muted-foreground" />
                                            <span>{template.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Group A */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground">Market & Direction</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="instrument" render={({ field }) => (
                                <FormItem><FormLabel>Trading Pair</FormLabel><FormControl><Input placeholder="e.g., BTC-PERP" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="direction" render={({ field }) => (
                                <FormItem><FormLabel>Direction</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex pt-2 gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Long" /></FormControl><FormLabel className="font-normal">Long</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Short" /></FormControl><FormLabel className="font-normal">Short</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="entryType" render={({ field }) => (
                                <FormItem><FormLabel>Entry Type</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex pt-2 gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Limit" /></FormControl><FormLabel className="font-normal">Limit</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Market" /></FormControl><FormLabel className="font-normal">Market</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    </div>

                    {/* Group B */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground">Risk Anchors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {entryType === 'Limit' ? (
                                <FormField control={form.control} name="entryPrice" render={({ field }) => (
                                    <FormItem><FormLabel>Entry Price</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            ) : (
                                <FormItem>
                                    <FormLabel>Current Price (from Delta)</FormLabel>
                                    <FormControl><Input readOnly value="68543.21 (mock)" className="bg-muted" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                            <div />
                            <FormField control={form.control} name="stopLoss" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Stop Loss Price (SL)*</FormLabel>
                                    <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="takeProfit" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Take Profit Price (TP)</FormLabel>
                                    <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                    </div>
                    
                    {/* Group C */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground">Account & Risk</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="accountCapital" render={({ field }) => (
                                <FormItem><FormLabel>Account Capital ($)</FormLabel><FormControl><Input type="number" placeholder="10000" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="riskPercent" render={({ field }) => (
                                <FormItem><FormLabel>Risk Per Trade (%)</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="leverage" render={({ field }) => (
                                <FormItem><FormLabel>Leverage</FormLabel><Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="5">5x</SelectItem><SelectItem value="10">10x</SelectItem><SelectItem value="20">20x</SelectItem><SelectItem value="50">50x</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                            )}/>
                        </div>
                        {isNewUser && (
                             <Alert variant="default" className="mt-4 bg-muted/50 border-border/50">
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                In the real product, this step would send orders to a testnet or paper trading account first, not a live one.
                                </AlertDescription>
                            </Alert>
                        )}
                        <Separator className="mt-4" />
                        <WhatIfRiskSlider control={form.control} form={form} />
                    </div>

                    <Separator />
                    
                    {/* Group D */}
                     <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground">Strategy & Reasoning</h3>
                        <FormField control={form.control} name="strategyId" render={({ field }) => (
                            <FormItem><FormLabel>Strategy</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select from your playbook"/></SelectTrigger></FormControl><SelectContent>{mockStrategies.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem><FormLabel>Trade Rationale*</FormLabel><FormControl><Textarea placeholder="Why are you taking this trade? What conditions must be true?" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-1 space-y-6 sticky top-24">
                <PlanSummary control={form.control} setPlanStatus={setPlanStatus} onSetModule={onSetModule} />
            </div>
        </div>
    );
}

function ReviewStep({ form, onSetModule, onSetStep, arjunFeedbackAccepted, setArjunFeedbackAccepted, planStatus }: { form: any, onSetModule: any, onSetStep: (step: TradePlanStep) => void; arjunFeedbackAccepted: boolean, setArjunFeedbackAccepted: (accepted: boolean) => void, planStatus: PlanStatusType }) {
    const values = form.getValues();
    const personaData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base") || "{}") : {};
    const market = typeof window !== 'undefined' ? { vixValue: localStorage.getItem('ec_demo_scenario') === 'high_vol' ? 82 : 45, vixZone: localStorage.getItem('ec_demo_scenario') === 'high_vol' ? 'Elevated' : 'Normal' } : { vixValue: 45, vixZone: 'Normal' };

    const { entryPrice, stopLoss, takeProfit } = useWatch({ control: form.control });

    const riskPerUnit = (entryPrice && stopLoss) ? Math.abs(entryPrice - stopLoss) : 0;
    const rewardPerUnit = (takeProfit && entryPrice) ? Math.abs(takeProfit - entryPrice) : 0;
    const rrr = (riskPerUnit > 0 && rewardPerUnit > 0) ? rewardPerUnit / riskPerUnit : 0;

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
             <PlanSnapshot form={form} onSetStep={onSetStep} />
             <Card className="bg-muted/30 border-primary/20 sticky top-24">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" />Review with Arjun</CardTitle>
                    <CardDescription>AI feedback and psychological checks.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div>
                        <p className="text-sm text-muted-foreground">
                            Based on your persona (<span className="font-semibold text-primary">{personaData.primaryPersonaName || 'The Determined Trader'}</span>), current market volatility (<span className="font-semibold text-primary">{market.vixZone}</span>), and this trade’s R:R of <span className="font-semibold text-primary">{rrr.toFixed(2)}</span>, here’s Arjun’s assessment.
                        </p>
                    </div>

                    <Separator />
                    
                    <div>
                        <h3 className="font-semibold text-foreground mb-3">Feedback</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm">
                                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">Your SL is tighter than your average for this setup. In <span className="text-amber-400">elevated volatility</span>, this increases the chance of being stopped out on noise.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">Your R:R of {rrr.toFixed(2)} is slightly below your preferred 1.5 target. This requires a higher win rate to be profitable.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">This trade aligns with your defined <span className="text-green-400">"London Reversal"</span> strategy, which is a positive sign for disciplined execution.</span>
                            </li>
                        </ul>
                    </div>

                    <Separator />

                     <FormField
                        control={form.control}
                        name="mindset"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>What is your mindset right now?</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Describe how you feel and what you’re worried about. e.g., 'Feeling a bit of FOMO, worried I'm late to this move...'"
                                        className="min-h-[80px]"
                                        {...field}
                                    />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">This will be saved with your journal entry for this trade.</p>
                            </FormItem>
                        )}
                    />

                    <Separator />
                    
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="accept-feedback" checked={arjunFeedbackAccepted} onCheckedChange={(checked) => setArjunFeedbackAccepted(checked as boolean)} />
                            <Label htmlFor="accept-feedback" className="text-sm font-normal text-muted-foreground">
                                I have read and accept Arjun’s feedback for this trade.
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground/80 pl-6">
                            In the real app, this confirmation would be stored with your trade and journal entry.
                        </p>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}

function ExecutionOptions({ form, onSetModule }: { form: any, onSetModule: (module: any, context?: any) => void }) {
    const [executionType, setExecutionType] = useState<"Market" | "Limit">("Market");
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<{ tradeId: string, draftId: string } | null>(null);
    const { addLog } = useEventLog();
    const { toast } = useToast();

    const values = form.getValues() as PlanFormValues;
    const { entryPrice, stopLoss, riskPercent, accountCapital, instrument } = values;

    const riskPerUnit = (entryPrice && stopLoss) ? Math.abs(entryPrice - stopLoss) : 0;
    const potentialLoss = (accountCapital && riskPercent) ? (accountCapital * riskPercent) / 100 : 0;
    const positionSize = riskPerUnit > 0 ? potentialLoss / riskPerUnit : 0;
    
    const handleExecute = () => {
        setIsExecuting(true);
        addLog("Executing trade plan (prototype)...");

        setTimeout(() => {
            const tradeId = `DELTA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const draftId = `draft-${Date.now()}`;
            
            // --- Auto-Journaling Logic ---
            const rrr = (() => {
                const rewardPerUnit = (values.takeProfit && values.entryPrice) ? Math.abs(values.takeProfit - values.entryPrice) : 0;
                return (riskPerUnit > 0 && rewardPerUnit > 0) ? rewardPerUnit / riskPerUnit : 0;
            })();
            const strategyName = mockStrategies.find(s => s.id === values.strategyId)?.name || "Unknown";

            const journalDraft = {
                id: draftId,
                datetime: new Date(),
                instrument: values.instrument,
                direction: values.direction,
                entryPrice: values.entryPrice,
                exitPrice: 0, // Not known at execution
                size: positionSize,
                pnl: 0, // Not known at execution
                rMultiple: rrr,
                setup: strategyName,
                emotions: values.mindset, // From review step
                notes: `Trade executed via plan. Rationale: ${values.notes}`,
                // --- New fields for full context ---
                plan: {
                    ...values,
                    takeProfit: values.takeProfit || 0,
                    notes: values.notes || "",
                    justification: values.justification || "",
                    mindset: values.mindset || ""
                },
                execution: {
                    tradeId: tradeId,
                    timestamp: new Date().toISOString(),
                    type: executionType
                }
            };
            
            const existingDrafts = JSON.parse(localStorage.getItem("ec_journal_drafts") || "[]");
            localStorage.setItem("ec_journal_drafts", JSON.stringify([journalDraft, ...existingDrafts]));
            
            addLog(`Trade executed with mock ID: ${tradeId}. Journal draft created: ${draftId}`);
            setExecutionResult({ tradeId, draftId });
            setIsExecuting(false);
        }, 800);
    }
    
    if (executionResult) {
        return (
            <Card className="bg-muted/30 border-green-500/20">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Execution Successful
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Your trade has been logged with mock ID: <br/>
                        <span className="font-mono text-primary">{executionResult.tradeId}</span>
                    </p>
                    <Separator />
                    <div className="space-y-3 pt-2">
                        <p className="text-sm font-semibold text-foreground">
                            A draft journal entry has been created.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Update it now with screenshots and final thoughts, or come back to it later from the Journal module.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                             <Button 
                                className="w-full"
                                onClick={() => onSetModule('tradeJournal', { draftId: executionResult.draftId })}
                            >
                                Open in Journal
                            </Button>
                             <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => {
                                    onSetModule('dashboard');
                                    toast({ title: "Execution saved", description: "Check your Performance stats later." });
                                }}
                            >
                                Back to Dashboard
                            </Button>
                        </div>
                         <Button variant="link" size="sm" className="text-xs text-muted-foreground h-auto p-0" onClick={() => onSetModule('tradeJournal')}>
                            <Bookmark className="mr-1 h-3 w-3" />
                            View all journal entries
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle>Execution options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">1. Execution Type</h3>
                    <RadioGroup value={executionType} onValueChange={(v) => setExecutionType(v as "Market" | "Limit")} className="space-y-2">
                        <Label className="flex items-center gap-2 p-3 rounded-md border bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary/30">
                            <RadioGroupItem value="Market" />
                            <span>Execute now (Market order)</span>
                        </Label>
                         <Label className="flex items-center gap-2 p-3 rounded-md border bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary/30">
                            <RadioGroupItem value="Limit" />
                            <span>Execute as Limit order</span>
                        </Label>
                    </RadioGroup>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">2. Preview</h3>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Order type:</span><span className="font-mono">{executionType}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Quantity:</span><span className="font-mono">{positionSize.toFixed(4)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Exchange:</span><span className="font-mono">Delta (mock)</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Estimated risk:</span><span className="font-mono">${potentialLoss.toFixed(2)}</span></div>
                    </div>
                     <Alert variant="default" className="mt-4 bg-muted/50 border-border/50">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            In this prototype, no real orders are sent to any exchange.
                        </AlertDescription>
                    </Alert>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">3. Execute</h3>
                    <Button className="w-full" size="lg" onClick={handleExecute} disabled={isExecuting}>
                        {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isExecuting ? 'Executing...' : 'Execute trade (Prototype)'}
                    </Button>
                </div>
                 
            </CardContent>
        </Card>
    );
}

function ExecuteStep({ form, onSetModule, onSetStep, planStatus }: { form: any, onSetModule: any, onSetStep: (step: TradePlanStep) => void; planStatus: PlanStatusType }) {
    return (
         <div className="grid lg:grid-cols-2 gap-8 items-start">
             <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Locked trade plan</CardTitle>
                    <CardDescription>Entry, SL and leverage are now locked for this execution step.</CardDescription>
                </CardHeader>
                <CardContent>
                     <PlanSnapshot form={form} onSetStep={onSetStep} />
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="link" className="text-xs text-muted-foreground p-0 h-auto mt-4">Cancel and return to planning</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Unlock Plan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will unlock the plan and discard this execution attempt (prototype). Are you sure?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Stay</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onSetStep('plan')}>Yes, unlock</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                     </AlertDialog>
                </CardContent>
            </Card>
            <ExecutionOptions form={form} onSetModule={onSetModule} />
        </div>
    );
}

const SummaryRow = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
    <div className="flex justify-between items-center text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className={cn("font-semibold font-mono text-foreground", className)}>{value}</p>
    </div>
);

const RuleCheckRow = ({ check }: { check: RuleCheck }) => {
    const Icon = {
        PASS: CheckCircle,
        WARN: AlertTriangle,
        FAIL: XCircle,
        "N/A": Circle
    }[check.status];

    const color = {
        PASS: 'text-green-400',
        WARN: 'text-amber-400',
        FAIL: 'text-red-400',
        "N/A": 'text-muted-foreground'
    }[check.status];

    return (
        <div className="flex items-center gap-2 text-sm">
            <Icon className={cn("h-4 w-4", color)} />
            <span className={cn(check.status === 'FAIL' && 'text-red-400', check.status === 'WARN' && 'text-amber-400')}>{check.label}</span>
        </div>
    );
};

function PlanSnapshot({ form, onSetStep }: { form: any; onSetStep: (step: TradePlanStep) => void }) {
    const values = form.getValues();
    const { instrument, direction, entryPrice, stopLoss, takeProfit, leverage, riskPercent } = values;

    // Recalculate summary for snapshot
    const riskPerUnit = (entryPrice && stopLoss) ? Math.abs(entryPrice - stopLoss) : 0;
    const rewardPerUnit = (takeProfit && entryPrice) ? Math.abs(takeProfit - entryPrice) : 0;
    const rrr = (riskPerUnit > 0 && rewardPerUnit > 0) ? rewardPerUnit / riskPerUnit : 0;
    
    const ruleChecks = getRuleChecks(rrr, riskPercent);

    return (
        <div className="space-y-6 p-4 border rounded-lg bg-muted/50">
            <div>
                <h2 className={cn("text-xl font-bold", direction === 'Long' ? 'text-green-400' : 'text-red-400')}>{instrument} &ndash; {direction}</h2>
            </div>
            <div className="space-y-2">
                <SummaryRow label="Entry Price" value={Number(entryPrice).toFixed(4)} />
                <SummaryRow label="Stop Loss" value={Number(stopLoss).toFixed(4)} />
                <SummaryRow label="Take Profit" value={takeProfit ? Number(takeProfit).toFixed(4) : 'Not Set'} />
                <SummaryRow label="Leverage" value={`${leverage}x`} />
            </div>
            <Separator />
            <div className="space-y-2">
                <SummaryRow label="R:R Ratio" value={rrr > 0 ? `${rrr.toFixed(2)} : 1` : '-'} className={rrr > 0 ? (rrr < 1.5 ? 'text-amber-400' : 'text-green-400') : ''} />
                <SummaryRow label="Risk %" value={`${riskPercent}%`} className={riskPercent > 2 ? 'text-red-400' : ''} />
            </div>
            <Separator />
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Rule Checklist</h3>
                <div className="space-y-3">
                    {ruleChecks.map((check, i) => (
                        <RuleCheckRow key={i} check={check} />
                    ))}
                </div>
            </div>

            <div className="pt-4">
                 <Button variant="link" className="p-0 h-auto text-primary" onClick={() => onSetStep('plan')}>
                    Edit Plan (Step 1)
                </Button>
            </div>
        </div>
    );
}

export function TradePlanningModule({ onSetModule, planContext }: TradePlanningModuleProps) {
    const { toast } = useToast();
    const [planStatus, setPlanStatus] = useState<PlanStatusType>("incomplete");
    const [showBanner, setShowBanner] = useState(true);
    const [currentStep, setCurrentStep] = useState<TradePlanStep>("plan");
    const [arjunFeedbackAccepted, setArjunFeedbackAccepted] = useState(false);
    const [showTemplateOverwriteDialog, setShowTemplateOverwriteDialog] = useState(false);
    const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
    const [isNewUser, setIsNewUser] = useState(false);

    const form = useForm<PlanFormValues>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            direction: "Long",
            entryType: "Limit",
            leverage: 10,
            accountCapital: 10000,
            riskPercent: 1,
            strategyId: '',
            instrument: "",
            notes: "",
            justification: "",
            entryPrice: 0,
            stopLoss: 0,
            takeProfit: 0,
            mindset: "",
        },
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const scenario = localStorage.getItem('ec_demo_scenario') as DemoScenario | null;
            setIsNewUser(scenario === 'no_positions');
            
            const draft = localStorage.getItem("ec_trade_plan_draft");
            if (draft) {
                try {
                    const parsedDraft = JSON.parse(draft);
                    form.reset(parsedDraft);
                     toast({
                        title: "Draft Loaded",
                        description: "Your previous trade plan draft has been loaded.",
                    });
                } catch(e) {
                    console.error("Could not parse trade plan draft:", e);
                }
            }

            if (planContext) {
              form.setValue('instrument', planContext.instrument);
              if (planContext.direction) {
                form.setValue('direction', planContext.direction);
              }
              toast({
                  title: "Context applied",
                  description: `Planning a trade for ${planContext.instrument} from the ${planContext.origin}.`,
              });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form, toast, planContext]);
    
    const applyTemplate = (templateId: string) => {
        const template = planTemplates.find(t => t.id === templateId);
        if (!template || template.id === 'custom_soon') return;

        const defaultValues = {
            direction: "Long", entryType: "Limit", leverage: 10, accountCapital: 10000,
            riskPercent: 1, strategyId: '', instrument: "", notes: "", justification: "",
            entryPrice: 0, stopLoss: 0, takeProfit: 0, mindset: ""
        };

        form.reset({
            ...defaultValues, // Reset to defaults first
            ...form.getValues(), // Keep existing values
            ...template.values, // Overwrite with template values
        });
        localStorage.setItem("ec_trade_plan_last_template", templateId);
        toast({ title: `Template applied: ${template.name}` });
        setShowTemplateOverwriteDialog(false);
        setPendingTemplateId(null);
    };

    const handleApplyTemplate = (templateId: string) => {
        if (form.formState.isDirty) {
            setPendingTemplateId(templateId);
            setShowTemplateOverwriteDialog(true);
        } else {
            applyTemplate(templateId);
        }
    };

    const justificationValue = useWatch({
        control: form.control,
        name: 'justification'
    });

    const onSubmit = (values: PlanFormValues) => {
        if (currentStep === 'plan') {
            setCurrentStep('review');
        } else if (currentStep === 'review') {
            setCurrentStep('execute');
        } else {
             // Execution logic is now inside ExecutionOptions
        }
    };

    const handleSaveDraft = () => {
        const values = form.getValues();
        localStorage.setItem("ec_trade_plan_draft", JSON.stringify(values));
        toast({
            title: "Plan saved as draft",
            description: "Your current trade plan has been saved locally.",
        });
    };

    const handleStepChange = (step: TradePlanStep) => {
        const stepOrder = ["plan", "review", "execute"];
        const currentIndex = stepOrder.indexOf(currentStep);
        const newIndex = stepOrder.indexOf(step);

        if (newIndex < currentIndex) {
            setCurrentStep(step);
            return;
        }

        if (step === 'review' && canProceedToReview) {
            setCurrentStep('review');
        }
        
        if (step === 'execute' && canProceedToExecution) {
            setCurrentStep('execute');
        }
    }

    const canProceedToReview = planStatus !== 'incomplete' && (planStatus !== 'blocked' || (justificationValue && justificationValue.length > 0));
    const canProceedToExecution = canProceedToReview && arjunFeedbackAccepted;
    
    const isProceedDisabled = currentStep === 'plan' ? !canProceedToReview :
                              currentStep === 'review' ? !canProceedToExecution :
                              false;
    
    const isBannerVisible = showBanner && (planStatus === 'blocked' || planStatus === 'overridden');

    const stepConfig = {
        plan: { label: "Plan", buttonText: isNewUser ? "Practice review (no real risk)" : "Proceed to Review (Step 2)", disabled: false },
        review: { label: "Review", buttonText: "Proceed to Execution (Step 3)", disabled: !canProceedToReview },
        execute: { label: "Execute", buttonText: "Execute (Prototype)", disabled: !canProceedToExecution },
    }
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Trade Planning</h1>
                    <p className="text-muted-foreground">The heart of disciplined trading inside EdgeCipher.</p>
                </div>
                <div className="flex items-center gap-2">
                    {(Object.keys(stepConfig) as TradePlanStep[]).map((step, index) => (
                        <Badge
                            key={step}
                            onClick={() => handleStepChange(step)}
                            variant={currentStep === step ? "default" : "outline"}
                            className={cn("cursor-pointer border-border/50", stepConfig[step as TradePlanStep].disabled && "opacity-50 cursor-not-allowed")}
                        >
                            Step {index + 1} &ndash; {stepConfig[step as TradePlanStep].label}
                        </Badge>
                    ))}
                </div>
            </div>
            
            {isBannerVisible && (
                 <Alert variant="destructive" className="bg-amber-950/60 border-amber-500/30 text-amber-300">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <AlertTitle className="text-amber-400">
                                {planStatus === 'overridden' ? "You are overriding your rules" : "Critical Rule Violation"}
                            </AlertTitle>
                            <AlertDescription>
                               {planStatus === 'overridden' 
                                 ? "This should be rare and done consciously. Your justification will be logged."
                                 : "Fix the issues highlighted in the summary card, or add a justification to proceed."}
                            </AlertDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowBanner(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </Alert>
            )}

             {isNewUser ? (
                <Alert variant="default" className="bg-blue-950/50 border-blue-500/30 text-blue-300">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertTitle className="text-blue-400">You're in Practice Mode</AlertTitle>
                    <AlertDescription>
                       You have no trading history connected. Use this module to create practice plans before risking real capital.
                    </AlertDescription>
                </Alert>
             ) : (
                <Alert variant="default" className="bg-muted/30 border-border/50">
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                        Every trade must start here. No plan = no trade. This checklist ensures you have a reason for every action.
                    </AlertDescription>
                </Alert>
             )}
            
            <AlertDialog open={showTemplateOverwriteDialog} onOpenChange={setShowTemplateOverwriteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apply Template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will overwrite your current plan values with the selected template. Are you sure?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingTemplateId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => pendingTemplateId && applyTemplate(pendingTemplateId)}>Yes, apply</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {currentStep === "plan" && <PlanStep form={form} onSetModule={onSetModule} setPlanStatus={setPlanStatus} onApplyTemplate={handleApplyTemplate} planContext={planContext} isNewUser={isNewUser} />}
                    {currentStep === "review" && <ReviewStep form={form} onSetModule={onSetModule} onSetStep={setCurrentStep} arjunFeedbackAccepted={arjunFeedbackAccepted} setArjunFeedbackAccepted={setArjunFeedbackAccepted} planStatus={planStatus} />}
                    {currentStep === "execute" && <ExecuteStep form={form} onSetModule={onSetModule} onSetStep={setCurrentStep} planStatus={planStatus} />}

                     <div className="mt-8 p-4 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">Step {Object.keys(stepConfig).indexOf(currentStep) + 1} of 3: {stepConfig[currentStep].label} your trade.</p>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" type="button" onClick={handleSaveDraft}>Save as draft (Prototype)</Button>
                            
                           {currentStep !== 'execute' && (
                                <TooltipProvider>
                                    <Tooltip open={isProceedDisabled && (planStatus === 'blocked' || currentStep === 'review' && !arjunFeedbackAccepted) ? undefined : false}>
                                        <TooltipTrigger asChild>
                                            <div tabIndex={0}>
                                                <Button type="submit" disabled={isProceedDisabled}>
                                                    {stepConfig[currentStep].buttonText}
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                {currentStep === 'plan' 
                                                    ? "Add a justification to override your rules."
                                                    : "Acknowledge Arjun's feedback to proceed."
                                                }
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                           )}
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
