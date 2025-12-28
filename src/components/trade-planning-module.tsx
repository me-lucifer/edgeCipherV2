
      "use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Info, CheckCircle, Circle, AlertTriangle, FileText, ArrowRight, Gauge, ShieldCheck, XCircle, X, Lock, Loader2, Bookmark, Copy, RefreshCw, Sparkles, Clock, HelpCircle, ArrowLeft } from "lucide-react";
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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";
import { Skeleton } from "./ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { JournalEntry } from "./trade-journal-module";
import type { StrategyGroup as Strategy, RuleSet } from './strategy-management-module';


interface TradePlanningModuleProps {
    onSetModule: (module: any, context?: any) => void;
    planContext?: {
        instrument: string;
        direction?: 'Long' | 'Short';
        origin: string;
    }
}

const planSchema = z.object({
    instrument: z.string().min(1, "A trading pair is required."),
    direction: z.enum(["Long", "Short"]),
    entryType: z.enum(["Market", "Limit"]),
    entryPrice: z.coerce.number().positive("Enter a valid entry price."),
    stopLoss: z.coerce.number().positive("A stop loss is mandatory for every plan."),
    takeProfit: z.coerce.number().optional(),
    leverage: z.coerce.number().min(1).max(100),
    accountCapital: z.coerce.number().positive("Account capital is required to calculate risk."),
    riskPercent: z.coerce.number().min(0.1, "Risk per trade must be at least 0.1%").max(100, "Risk cannot exceed 100%"),
    strategyId: z.string().min(1, "You must select a strategy for this plan."),
    notes: z.string().optional(),
    justification: z.string().optional(),
    mindset: z.string().optional(),
}).refine(data => {
    if (data.justification && data.justification.length > 0) return true;
    
    if (data.direction === 'Long' && data.entryPrice > 0 && data.stopLoss > 0) return data.stopLoss < data.entryPrice;
    return true;
}, {
    message: "For Longs, SL must be below Entry.",
    path: ["stopLoss"],
}).refine(data => {
    if (data.justification && data.justification.length > 0) return true;

    if (data.direction === 'Long' && data.entryPrice > 0 && data.takeProfit && data.takeProfit > 0) return data.takeProfit > data.entryPrice;
    return true;
}, {
    message: "For Longs, TP must be above Entry.",
    path: ["takeProfit"],
}).refine(data => {
    if (data.justification && data.justification.length > 0) return true;

    if (data.direction === 'Short' && data.entryPrice > 0 && data.stopLoss > 0) return data.stopLoss > data.entryPrice;
    return true;
}, {
    message: "For Shorts, SL must be above Entry.",
    path: ["stopLoss"],
}).refine(data => {
    if (data.justification && data.justification.length > 0) return true;

    if (data.direction === 'Short' && data.entryPrice > 0 && data.takeProfit && data.takeProfit > 0) return data.takeProfit < data.entryPrice;
    return true;
}, {
    message: "For Shorts, TP must be below Entry.",
    path: ["takeProfit"],
}).refine(data => {
    // If justification is provided, bypass this rule
    if (data.justification && data.justification.length > 0) return true;
    
    // Otherwise, check the condition
    if (data.entryPrice && data.stopLoss) {
        return data.entryPrice !== data.stopLoss;
    }
    return true;
}, {
    message: "Entry and Stop Loss cannot be the same.",
    path: ["stopLoss"],
});


type PlanFormValues = z.infer<typeof planSchema>;
type TradePlanStep = "plan" | "review" | "execute";
type SavedDraft = {
    formData: PlanFormValues;
    draftStep: TradePlanStep;
    timestamp: string;
};

// Validation Engine Types
type ValidationStatus = "PASS" | "WARN" | "FAIL";

type PlanInputs = {
    leverage: number;
    riskPct: number;
    rr: number;
    session: "Asia" | "London" | "New York"; // Mocked
};

type ValidationContext = {
    todayTradeCountAll: number;
    lossStreak: number;
    vixZone: "Calm" | "Normal" | "Elevated" | "Extreme";
};

type ValidationCheck = {
  ruleId: string;
  title: string;
  status: ValidationStatus;
  message: string;
  fixHint?: string;
};

type ValidationOutput = {
  validations: ValidationCheck[];
  overallStatus: "PASS" | "WARN" | "FAIL";
  requiresJustification: boolean;
};

// The Validation Engine
const validatePlanAgainstStrategy = (plan: PlanInputs, strategy: RuleSet, context: ValidationContext): ValidationOutput => {
    const validations: ValidationCheck[] = [];
    const { riskRules, tpRules, contextRules } = strategy;

    // A) Leverage cap
    validations.push({
        ruleId: 'leverageCap',
        title: `Leverage <= ${riskRules.leverageCap}x`,
        status: plan.leverage > riskRules.leverageCap ? "FAIL" : "PASS",
        message: plan.leverage > riskRules.leverageCap
            ? `Leverage of ${plan.leverage}x exceeds strategy max of ${riskRules.leverageCap}x.`
            : `Leverage is within strategy limits.`
    });

    // B) Risk per trade
    const riskDifference = plan.riskPct - riskRules.riskPerTradePct;
    let riskStatus: ValidationStatus = "PASS";
    let riskMessage = `Risk of ${plan.riskPct}% is within strategy limits.`;
    if (riskDifference > 0.25) {
        riskStatus = "FAIL";
        riskMessage = `Plan risks ${plan.riskPct}%, which is critically over the strategy's ${riskRules.riskPerTradePct}% limit.`;
    } else if (riskDifference > 0) {
        riskStatus = "WARN";
        riskMessage = `Plan risks ${plan.riskPct}%, which is slightly over the strategy's ${riskRules.riskPerTradePct}% limit.`;
    }
    validations.push({
        ruleId: 'riskPerTrade',
        title: `Risk per trade <= ${riskRules.riskPerTradePct}%`,
        status: riskStatus,
        message: riskMessage,
    });

    // C) Max daily trades
    validations.push({
        ruleId: 'maxDailyTrades',
        title: `Max daily trades <= ${riskRules.maxDailyTrades}`,
        status: context.todayTradeCountAll >= riskRules.maxDailyTrades ? "FAIL" : "PASS",
        message: context.todayTradeCountAll >= riskRules.maxDailyTrades
            ? `You've already made ${context.todayTradeCountAll} trades today. Your limit is ${riskRules.maxDailyTrades}.`
            : "Within daily trade limit."
    });

    // D) Cooldown after losses
    if (riskRules.cooldownAfterLosses && context.lossStreak >= 2) {
        validations.push({
            ruleId: 'cooldown',
            title: `Cooldown after ${2} losses`,
            status: "FAIL",
            message: `You are on a ${context.lossStreak}-trade losing streak. This rule requires a cooldown.`
        });
    }

    // E) RR minimum
    if (tpRules.minRR && plan.rr > 0) {
        validations.push({
            ruleId: 'minRR',
            title: `R:R Ratio >= ${tpRules.minRR}`,
            status: plan.rr < tpRules.minRR ? "FAIL" : "PASS",
            message: plan.rr < tpRules.minRR
                ? `R:R of ${plan.rr.toFixed(2)} is below the required minimum of ${tpRules.minRR}.`
                : "R:R meets minimum requirement."
        });
    }

    // F) VIX policy
    if (contextRules.vixPolicy !== 'allowAll') {
        let vixStatus: ValidationStatus = 'PASS';
        let message = "Volatility is within strategy parameters.";
        if (contextRules.vixPolicy === 'avoidHigh' && (context.vixZone === 'Elevated' || context.vixZone === 'Extreme')) {
            vixStatus = 'WARN';
            message = `Current VIX is '${context.vixZone}', which this strategy suggests avoiding.`;
        }
        if (contextRules.vixPolicy === 'onlyLowNormal' && (context.vixZone === 'Elevated' || context.vixZone === 'Extreme')) {
            vixStatus = 'FAIL';
            message = `Strategy requires 'Calm' or 'Normal' VIX, but it is currently '${context.vixZone}'.`;
        }
        validations.push({
            ruleId: 'vixPolicy',
            title: `VIX Policy: ${contextRules.vixPolicy}`,
            status: vixStatus,
            message: message
        });
    }

    // G) Session restriction
    if (contextRules.allowedSessions && contextRules.allowedSessions.length > 0) {
        const isAllowed = contextRules.allowedSessions.includes(plan.session);
        validations.push({
            ruleId: 'session',
            title: `Session in [${contextRules.allowedSessions.join(', ')}]`,
            status: isAllowed ? 'PASS' : 'WARN',
            message: isAllowed
                ? 'Trading within allowed session.'
                : `Current session (${plan.session}) is outside of this strategy's allowed sessions.`
        });
    }
    
    const overallStatus = validations.some(v => v.status === 'FAIL') ? 'FAIL'
                        : validations.some(v => v.status === 'WARN') ? 'WARN'
                        : 'PASS';

    return {
        validations,
        overallStatus,
        requiresJustification: overallStatus === 'FAIL'
    };
};


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
            strategyId: "strat_1",
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
            strategyId: "strat_3",
            notes: "Fading the extreme of the range during low volatility. Expecting a quick move back to the median.",
        }
    },
    { id: 'custom_soon', name: "Custom template 1 (soon)", values: {} },
];

type PlanStatusType = "incomplete" | "FAIL" | "WARN" | "PASS" | "overridden";

const PlanStatus = ({ status, message }: { status: PlanStatusType, message: string }) => {
    const statusConfig = {
        incomplete: {
            label: "Incomplete",
            className: "bg-muted text-muted-foreground border-border",
            icon: Circle
        },
        FAIL: {
            label: "Major Violation",
            className: "bg-red-500/20 text-red-400 border-red-500/30",
            icon: XCircle,
        },
        WARN: {
            label: "Needs Attention",
            className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
            icon: AlertTriangle
        },
        PASS: {
            label: "Aligned with Strategy",
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
        setMarket({ vixValue, vixZone: getVixZone(vixValue) as "Calm" | "Normal" | "Elevated" | "Extreme" });
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

const RuleCheckRow = ({ check }: { check: ValidationCheck }) => {
    const Icon = {
        PASS: CheckCircle,
        WARN: AlertTriangle,
        FAIL: XCircle,
    }[check.status];

    const color = {
        PASS: 'text-green-400',
        WARN: 'text-amber-400',
        FAIL: 'text-destructive',
    }[check.status];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex justify-between items-center text-sm cursor-help">
                        <div className="flex items-center gap-2">
                             <Icon className={cn("h-4 w-4", color)} />
                            <span className={cn('text-muted-foreground', check.status !== 'PASS' && 'text-foreground font-medium')}>{check.title}</span>
                        </div>
                         <Badge variant="secondary" className={cn("text-xs font-mono",
                            check.status === 'PASS' && "bg-green-500/10 text-green-400 border-green-500/20",
                            check.status === 'WARN' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                            check.status === 'FAIL' && "bg-red-500/10 text-red-400 border-red-500/20",
                         )}>{check.status}</Badge>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs">{check.message}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

function RuleChecks({ checks }: { checks: ValidationCheck[] }) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Strategy Rule Checks</h3>
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-4">
                {checks.map((check, i) => <RuleCheckRow key={i} check={check} />)}
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
        { price: stopLoss, label: "SL", color: "bg-destructive", dist: `-${slDistPercent}%` },
    ];

    if (takeProfit) {
        markers.push({ price: takeProfit, label: "TP", color: "bg-green-500", dist: `+${tpDistPercent}%` });
    }

    return (
        <div className="relative h-40 w-full overflow-hidden">
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

function SessionChecklist({ currentStep }: { currentStep: TradePlanStep }) {
    const [checklist, setChecklist] = useState({
        growthPlan: false,
        market: false,
        rules: false,
        emotion: false,
    });

    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (currentStep === 'plan') {
            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        } else if (interval) {
            clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [currentStep]);

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleCheck = (key: keyof typeof checklist) => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const checklistItems = [
        { id: 'growthPlan', label: "Reviewed today's Growth Plan" },
        { id: 'market', label: "Checked Crypto VIX and news" },
        { id: 'rules', label: "Defined Entry, SL, and risk %" },
        { id: 'emotion', label: "Emotion check done with Arjun" },
    ];

    return (
        <Card className="bg-muted/30 border-border/50 mb-8">
            <CardHeader>
                <CardTitle className="text-base">Session Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {checklistItems.map(item => (
                        <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={item.id} 
                                checked={checklist[item.id as keyof typeof checklist]}
                                onCheckedChange={() => handleCheck(item.id as keyof typeof checklist)}
                            />
                            <Label htmlFor={item.id} className="text-sm font-normal text-muted-foreground">{item.label}</Label>
                        </div>
                    ))}
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm">
                    <p className="text-muted-foreground">Time spent planning:</p>
                    <p className="font-mono font-semibold text-foreground">{formatTime(seconds)}</p>
                </div>
                 <p className="text-xs text-muted-foreground/80 pt-2">
                    Rushing planning is how impulsive trades slip through. Take a few minutes here – future you will thank you.
                </p>
            </CardContent>
        </Card>
    );
}

function ArjunGuardrailAlerts({ form }: { form: any }) {
    const [guardrails, setGuardrails] = useState({
        warnOnLowRR: true,
        warnOnHighRisk: true,
        warnOnHighVIX: false,
        warnAfterLosses: false,
    });
    const [warnings, setWarnings] = useState<string[]>([]);
    
    const { riskPercent, takeProfit, entryPrice, stopLoss } = useWatch({ control: form.control });

    useEffect(() => {
        const saved = localStorage.getItem("ec_guardrails");
        if (saved) {
            setGuardrails(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        const activeWarnings = [];
        if (guardrails.warnOnLowRR) {
            const riskPerUnit = (entryPrice && stopLoss) ? Math.abs(entryPrice - stopLoss) : 0;
            const rewardPerUnit = (takeProfit && entryPrice) ? Math.abs(takeProfit - entryPrice) : 0;
            const rrr = (riskPerUnit > 0 && rewardPerUnit > 0) ? rewardPerUnit / riskPerUnit : 0;
            if (rrr > 0 && rrr < 1.5) {
                activeWarnings.push("Low R:R Ratio (< 1.5)");
            }
        }
        if (guardrails.warnOnHighRisk && riskPercent > 2) {
            activeWarnings.push("High Risk (> 2%)");
        }

        const marketVix = localStorage.getItem('ec_demo_scenario') === 'high_vol' ? 'Elevated' : 'Normal';
        if (guardrails.warnOnHighVIX && (marketVix === 'Elevated' || marketVix === 'Extreme')) {
            activeWarnings.push("High Volatility Market");
        }
        
        const lastTwoTradesWereLosses = true; // Mock for prototype
        if (guardrails.warnAfterLosses && lastTwoTradesWereLosses) {
            activeWarnings.push("On a Losing Streak");
        }

        setWarnings(activeWarnings);
    }, [guardrails, riskPercent, takeProfit, entryPrice, stopLoss]);
    
    if (warnings.length === 0) return null;

    return (
        <Alert variant="default" className="bg-amber-950/30 border-amber-500/20 text-amber-300 mb-6">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-amber-400">Arjun Guardrail Warning</AlertTitle>
            <AlertDescription>
                <ul className="list-disc list-inside text-xs">
                    {warnings.map(w => <li key={w}>{w}</li>)}
                </ul>
            </AlertDescription>
        </Alert>
    );
}

function StrategyGuardrailChecklist({ strategyId, onSetModule }: { strategyId: string, onSetModule: (module: any, context?: any) => void; }) {
    const [strategy, setStrategy] = useState<Strategy | null>(null);

    useEffect(() => {
        if (!strategyId) {
            setStrategy(null);
            return;
        }
        const strategies: Strategy[] = JSON.parse(localStorage.getItem("ec_strategies") || "[]");
        const found = strategies.find(s => s.strategyId === strategyId);
        setStrategy(found || null);
    }, [strategyId]);

    if (!strategy) {
        return (
            <Card className="bg-muted/50 border-dashed">
                <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Select a strategy to see its pre-flight checklist.</p>
                </CardContent>
            </Card>
        );
    }

    const activeVersion = strategy.versions.find(v => v.isActiveVersion);
    const checklistItems = activeVersion?.ruleSet.entryRules.conditions.slice(0, 3) || [];

    return (
        <Card className="bg-muted/50 border-primary/20">
            <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Checklist for: {strategy.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Does this trade meet your core entry conditions?</p>
                {checklistItems.map((rule, i) => (
                    <div key={i} className="flex items-center space-x-2">
                        <Checkbox id={`guardrail-check-${i}`} />
                        <Label htmlFor={`guardrail-check-${i}`} className="text-sm font-normal text-muted-foreground">{rule}</Label>
                    </div>
                ))}
                {checklistItems.length === 0 && <p className="text-xs text-muted-foreground italic">No entry conditions defined in this strategy.</p>}
                 <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => onSetModule('strategyManagement')}>
                    Edit in Strategy Management
                </Button>
            </CardContent>
        </Card>
    );
}

function PlanSummary({ control, setPlanStatus, onSetModule }: { control: any, setPlanStatus: (status: PlanStatusType) => void, onSetModule: (module: any) => void }) {
    const values = useWatch({ control }) as PlanFormValues;
    const { direction, entryPrice, stopLoss, takeProfit, riskPercent, accountCapital, justification, strategyId } = values;

    const [strategies, setStrategies] = useState<Strategy[]>([]);
    useEffect(() => {
        const stored = localStorage.getItem("ec_strategies");
        if(stored) setStrategies(JSON.parse(stored));
    }, []);

    const selectedStrategy = strategies.find(s => s.strategyId === strategyId);
    const activeRuleset = selectedStrategy?.versions.find(v => v.isActiveVersion)?.ruleSet;

    const riskPerUnit = (entryPrice && stopLoss) ? Math.abs(entryPrice - stopLoss) : 0;
    const rewardPerUnit = (takeProfit && entryPrice) ? Math.abs(takeProfit - entryPrice) : 0;
    const rrr = (riskPerUnit > 0 && rewardPerUnit > 0) ? rewardPerUnit / riskPerUnit : 0;
    
    const potentialLoss = (accountCapital && riskPercent) ? (accountCapital * riskPercent) / 100 : 0;
    const potentialGain = rrr > 0 ? potentialLoss * rrr : 0;

    const positionSize = riskPerUnit > 0 ? potentialLoss / riskPerUnit : 0;

    const validationResult = useMemo(() => {
        if (!activeRuleset) return null;
        
        const scenario = localStorage.getItem('ec_demo_scenario') as DemoScenario | null;
        const vixZone = scenario === 'high_vol' ? 'Elevated' : 'Normal';
        const lossStreak = scenario === 'drawdown' ? 3 : 0;
        
        const planInputs: PlanInputs = {
            leverage: values.leverage,
            riskPct: values.riskPercent,
            rr: rrr,
            session: "New York" // Mock
        };
        const validationContext: ValidationContext = {
            todayTradeCountAll: 2, // Mock
            lossStreak,
            vixZone
        };
        return validatePlanAgainstStrategy(planInputs, activeRuleset, validationContext);
    }, [values, activeRuleset, rrr]);


    let status: PlanStatusType = 'incomplete';
    let message = "Fill in Entry, SL, Strategy and Risk % to see your plan summary.";

    if (validationResult && entryPrice > 0 && stopLoss > 0 && riskPercent > 0) {
        if (validationResult.overallStatus === 'FAIL') {
            status = 'FAIL';
            message = "Major violation. Arjun recommends NOT taking this trade.";
            if (justification && justification.length > 0) {
                status = 'overridden';
                message = "Critical rule overridden. You are consciously breaking your plan.";
            }
        } else if (validationResult.overallStatus === 'WARN') {
            status = 'WARN';
            message = "Slight deviation from your rules. Consider adjusting.";
        } else {
            status = 'PASS';
            message = "Aligned with your strategy. Looks solid.";
        }
    }
    
    useEffect(() => {
        setPlanStatus(status);
    }, [status, setPlanStatus]);

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="text-base">Plan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <PlanStatus status={status} message={message} />
                <Separator />
                <div className="space-y-2">
                    <SummaryRow label="R:R Ratio" value={rrr > 0 ? `${rrr.toFixed(2)} : 1` : '-'} className={rrr > 0 ? (rrr < (activeRuleset?.tpRules.minRR || 1.5) ? 'text-amber-400' : 'text-green-400') : ''} />
                    <SummaryRow label="Potential Gain" value={potentialGain > 0 ? `$${potentialGain.toFixed(2)}` : '-'} className="text-green-400" />
                    <SummaryRow label="Potential Loss" value={potentialLoss > 0 ? `$${potentialLoss.toFixed(2)}` : '-'} className="text-red-400" />
                    <SummaryRow label="Position Size" value={positionSize > 0 ? positionSize.toFixed(4) : '-'} />
                </div>
                <div className="h-40">
                   <PriceLadder direction={direction} entryPrice={entryPrice} stopLoss={stopLoss} takeProfit={takeProfit} />
                </div>
                {validationResult && (
                    <>
                        <Separator />
                        <RuleChecks checks={validationResult.validations} />
                    </>
                )}
                
                {validationResult?.overallStatus === 'FAIL' && (
                     <>
                        <Separator />
                         <FormField
                            control={control}
                            name="justification"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={cn(justification && justification.length > 0 ? "text-amber-400" : "text-destructive")}>Justification Required</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Why are you breaking your own rules for this trade? This will be logged in your journal."
                                            className="border-destructive/50"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
                
                <Separator />
                <DisciplineAlerts onSetModule={onSetModule} />
                <Separator />
                <MarketContext />
            </CardContent>
        </Card>
    );
}

function PlanStep({ form, onSetModule, setPlanStatus, onApplyTemplate, isNewUser, currentStep, draftToResume, onResume, onDiscard }: { form: any, onSetModule: any, setPlanStatus: any, onApplyTemplate: (templateId: string) => void, isNewUser: boolean, currentStep: TradePlanStep, draftToResume: SavedDraft | null, onResume: () => void, onDiscard: () => void }) {
    const entryType = useWatch({ control: form.control, name: 'entryType' });
    const strategyId = useWatch({ control: form.control, name: 'strategyId' });
    
    const [selectedTemplate, setSelectedTemplate] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("ec_trade_plan_last_template") || 'blank';
        }
        return 'blank';
    });
    
    const [isStrategyDrawerOpen, setIsStrategyDrawerOpen] = useState(false);
    const [availableStrategies, setAvailableStrategies] = useState<Strategy[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("ec_strategies");
            if (stored) {
                try {
                    const allStrategies: Strategy[] = JSON.parse(stored);
                    setAvailableStrategies(allStrategies.filter(s => s.status === 'active'));
                } catch(e) { console.error("Could not parse strategies", e); }
            }
        }
    }, []);

    const viewedStrategy = availableStrategies.find(s => s.strategyId === strategyId) || null;

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        onApplyTemplate(templateId);
    };

    return (
         <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
                <ArjunGuardrailAlerts form={form} />
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Plan details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {draftToResume && (
                            <Card className="border-primary/30 bg-muted/50">
                                <CardHeader className="flex-row items-center gap-4 space-y-0">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <div>
                                        <CardTitle className="text-base">Resume where you left off?</CardTitle>
                                        <CardDescription>
                                            You have an unfinished plan from {formatDistanceToNow(new Date(draftToResume.timestamp), { addSuffix: true })}.
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Button onClick={onResume}>Resume Draft</Button>
                                    <Button variant="ghost" onClick={onDiscard}>Discard</Button>
                                </CardContent>
                            </Card>
                        )}
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
                                    <FormItem><FormLabel>Trading Pair*</FormLabel><FormControl><Input placeholder="e.g., BTC-PERP" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="direction" render={({ field }) => (
                                    <FormItem><FormLabel>Direction</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex pt-2 gap-4">
                                    <Label className="flex items-center gap-2 p-2 h-10 rounded-md border border-transparent has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5 cursor-pointer"><FormControl><RadioGroupItem value="Long" /></FormControl><span>Long</span></Label>
                                    <Label className="flex items-center gap-2 p-2 h-10 rounded-md border border-transparent has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5 cursor-pointer"><FormControl><RadioGroupItem value="Short" /></FormControl><span>Short</span></Label>
                                    </RadioGroup></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="entryType" render={({ field }) => (
                                    <FormItem><FormLabel>Entry Type</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex pt-2 gap-4">
                                    <Label className="flex items-center gap-2 p-2 h-10 rounded-md border border-transparent has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5 cursor-pointer"><FormControl><RadioGroupItem value="Limit" /></FormControl><span>Limit</span></Label>
                                    <Label className="flex items-center gap-2 p-2 h-10 rounded-md border border-transparent has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5 cursor-pointer"><FormControl><RadioGroupItem value="Market" /></FormControl><span>Market</span></Label>
                                    </RadioGroup></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            <FormDescription className="text-xs italic">Be honest – is this following your plan, or chasing a move?</FormDescription>
                        </div>

                        {/* Group B */}
                        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground">Risk Anchors</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {entryType === 'Limit' ? (
                                    <FormField control={form.control} name="entryPrice" render={({ field }) => (
                                        <FormItem><FormLabel>Entry Price*</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
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
                                        <FormLabel>Stop Loss Price (your promised exit)*</FormLabel>
                                        <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value || ''} /></FormControl>
                                        <FormDescription className="text-xs">Your invalidation point. Where you promise to exit if wrong.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="takeProfit" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Take Profit Price (TP)</FormLabel>
                                        <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value || ''} /></FormControl>
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
                                    <FormItem><FormLabel>Account Capital ($)*</FormLabel><FormControl><Input type="number" placeholder="10000" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="riskPercent" render={({ field }) => (
                                    <FormItem><FormLabel>Risk per Trade (% of account)*</FormLabel><FormControl><Input type="number" placeholder="1" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
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
                            
                        </div>

                        <Separator />
                        
                        {/* Group D */}
                        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground">Strategy & Reasoning</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-end gap-2">
                                <FormField control={form.control} name="strategyId" render={({ field }) => (
                                    <FormItem><FormLabel>Strategy*</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select from your playbook"/></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableStrategies.map(s => <SelectItem key={s.strategyId} value={s.strategyId}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage /></FormItem>
                                )}/>
                                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setIsStrategyDrawerOpen(true)} disabled={!strategyId}>
                                    View strategy details <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>

                            {strategyId && <StrategyGuardrailChecklist strategyId={strategyId} onSetModule={onSetModule} />}

                            <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trade Rationale</FormLabel>
                                    <FormControl><Textarea placeholder="Why are you taking this trade? What conditions must be true?" {...field} /></FormControl>
                                    <FormDescription className="text-xs italic">This will be saved to your journal. Write it for your future self to review.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-6 sticky top-24">
                <SessionChecklist currentStep={currentStep} />
                <PlanSummary control={form.control} setPlanStatus={setPlanStatus} onSetModule={onSetModule} />
            </div>
            
            <Drawer open={isStrategyDrawerOpen} onOpenChange={setIsStrategyDrawerOpen}>
                <DrawerContent>
                    {viewedStrategy && viewedStrategy.versions.find(v => v.isActiveVersion) && (
                        <div className="mx-auto w-full max-w-2xl p-4 md:p-6" role="dialog" aria-modal="true" aria-labelledby="strategy-drawer-title">
                            <DrawerHeader>
                                <DrawerTitle className="text-2xl" id="strategy-drawer-title">{viewedStrategy.name}</DrawerTitle>
                                {viewedStrategy.versions.find(v => v.isActiveVersion)?.description &&
                                  <DrawerDescription>{viewedStrategy.versions.find(v => v.isActiveVersion)?.description}</DrawerDescription>
                                }
                            </DrawerHeader>
                            <div className="px-4 py-6 space-y-6">
                                {(['entryRules', 'slRules', 'tpRules', 'riskRules', 'contextRules'] as const).map(key => {
                                    const ruleset = viewedStrategy.versions.find(v => v.isActiveVersion)?.ruleSet;
                                    if (!ruleset || !ruleset[key]) return null;
                                    const rulesData = ruleset[key];
                                    
                                    const titles = {
                                        entryRules: 'Entry Criteria',
                                        slRules: 'Exit Criteria',
                                        tpRules: 'Take Profit Criteria',
                                        riskRules: 'Risk Rules',
                                        contextRules: 'Context Rules',
                                    };

                                    return (
                                        <div key={key} className="space-y-3">
                                            <h4 className="font-semibold text-foreground">{titles[key]}</h4>
                                            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                                {Object.entries(rulesData).map(([ruleKey, ruleValue]) => {
                                                    if (Array.isArray(ruleValue) && ruleValue.length > 0) {
                                                        return ruleValue.map((item, i) => <li key={`${ruleKey}-${i}`}>{item}</li>)
                                                    }
                                                    if (typeof ruleValue === 'string' || typeof ruleValue === 'number') {
                                                        return <li key={ruleKey}>{ruleKey}: {String(ruleValue)}</li>
                                                    }
                                                    if (typeof ruleValue === 'boolean') {
                                                        return <li key={ruleKey}>{ruleKey}: {ruleValue ? 'Yes' : 'No'}</li>
                                                    }
                                                    return null;
                                                })}
                                            </ul>
                                        </div>
                                    )
                                })}
                                
                                <Separator />
                                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                    <h4 className="font-semibold text-foreground">Pre-flight Checklist</h4>
                                    <div className="flex items-center space-x-2"><Checkbox id="check1" /><Label htmlFor="check1" className="text-sm font-normal">Market condition matches this strategy</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="check2" /><Label htmlFor="check2" className="text-sm font-normal">Setup matches A+ criteria</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="check3" /><Label htmlFor="check3" className="text-sm font-normal">I’m not forcing this trade.</Label></div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-border/50">
                                <Button className="w-full" onClick={() => { setIsStrategyDrawerOpen(false); onSetModule('strategyManagement'); }}>
                                    Open in Strategy Management
                                </Button>
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}

function ReviewStep({ form, onSetModule, onSetStep, arjunFeedbackAccepted, setArjunFeedbackAccepted, planStatus, reviewHeadingRef }: { form: any, onSetModule: any, onSetStep: (step: TradePlanStep) => void; arjunFeedbackAccepted: boolean, setArjunFeedbackAccepted: (accepted: boolean) => void, planStatus: PlanStatusType, reviewHeadingRef: React.Ref<HTMLDivElement> }) {
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
                    <CardTitle ref={reviewHeadingRef} tabIndex={-1} className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-sm -ml-1 pl-1"><Bot className="h-5 w-5 text-primary" />Review with Arjun</CardTitle>
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

function ExecutionOptions({ form, onSetModule, executionHeadingRef }: { form: any, onSetModule: (module: any, context?: any) => void; executionHeadingRef: React.Ref<HTMLDivElement> }) {
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
            
            const rrr = (() => {
                const rewardPerUnit = (values.takeProfit && values.entryPrice) ? Math.abs(values.takeProfit - values.entryPrice) : 0;
                return (riskPerUnit > 0 && rewardPerUnit > 0) ? rewardPerUnit / riskPerUnit : 0;
            })();
            
            const strategies: Strategy[] = JSON.parse(localStorage.getItem("ec_strategies") || "[]");
            const strategyName = strategies.find(s => s.strategyId === values.strategyId)?.name || "Unknown";

            const journalDraft: JournalEntry = {
                id: draftId,
                tradeId: tradeId,
                status: 'pending',
                timestamps: {
                    plannedAt: new Date().toISOString(),
                    executedAt: new Date().toISOString(),
                    closedAt: undefined,
                },
                technical: {
                    instrument: values.instrument,
                    direction: values.direction,
                    entryPrice: values.entryPrice,
                    stopLoss: values.stopLoss,
                    takeProfit: values.takeProfit,
                    leverage: values.leverage,
                    positionSize: positionSize,
                    riskPercent: values.riskPercent,
                    rrRatio: rrr,
                    strategy: strategyName,
                },
                planning: {
                    planNotes: values.notes,
                    ruleOverridesJustification: values.justification,
                    mindset: values.mindset,
                    arjunPreTradeSummary: "Arjun noted a tight SL and below-average R:R." // Mock summary
                },
                review: {
                    pnl: 0,
                    exitPrice: 0,
                },
                meta: {},
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
                            A journal draft has been created.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            A draft for this trade has been created. You can <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => onSetModule('tradeJournal', { draftId: executionResult.draftId })}>view it in your journal</Button> to add notes and psychological context.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
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
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle ref={executionHeadingRef} tabIndex={-1} className="focus:outline-none focus:ring-2 focus:ring-ring rounded-sm -ml-1 pl-1">Execution options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">1. Execution Type</h3>
                    <RadioGroup value={executionType} onValueChange={(v) => setExecutionType(v as "Market" | "Limit")} className="space-y-2">
                        <Label className="flex items-center gap-2 p-3 rounded-md border bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary/30 cursor-pointer">
                            <RadioGroupItem value="Market" />
                            <span>Execute now (Market order)</span>
                        </Label>
                         <Label className="flex items-center gap-2 p-3 rounded-md border bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary/30 cursor-pointer">
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
                        <div className="flex justify-between"><span className="text-muted-foreground">Estimated risk:</span><span className="font-mono text-destructive">${potentialLoss.toFixed(2)}</span></div>
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
                     <p className="text-xs text-muted-foreground/80 mt-4 text-center">
                        EdgeCipher never encourages revenge trading or ‘all-in’ bets. If you feel emotionally charged, step back and revisit your plan tomorrow.
                    </p>
                </div>
                 
            </CardContent>
        </Card>
    );
}

function ExecuteStep({ form, onSetModule, onSetStep, planStatus, executionHeadingRef }: { form: any, onSetModule: any, onSetStep: (step: TradePlanStep) => void; planStatus: PlanStatusType, executionHeadingRef: React.Ref<HTMLDivElement> }) {
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
            <ExecutionOptions form={form} onSetModule={onSetModule} executionHeadingRef={executionHeadingRef} />
        </div>
    );
}

function PlanSnapshot({ form, onSetStep }: { form: any; onSetStep: (step: TradePlanStep) => void }) {
    const values = form.getValues();
    const { instrument, direction, entryPrice, stopLoss, takeProfit, leverage, riskPercent, strategyId } = values;

    const [strategies, setStrategies] = useState<Strategy[]>([]);
    useEffect(() => {
        const stored = localStorage.getItem("ec_strategies");
        if(stored) setStrategies(JSON.parse(stored));
    }, []);

    const selectedStrategy = strategies.find(s => s.strategyId === strategyId);
    const activeRuleset = selectedStrategy?.versions.find(v => v.isActiveVersion)?.ruleSet;

    // Recalculate summary for snapshot
    const riskPerUnit = (entryPrice && stopLoss) ? Math.abs(entryPrice - stopLoss) : 0;
    const rewardPerUnit = (takeProfit && entryPrice) ? Math.abs(takeProfit - entryPrice) : 0;
    const rrr = (riskPerUnit > 0 && rewardPerUnit > 0) ? rewardPerUnit / riskPerUnit : 0;
    
    const validationResult = useMemo(() => {
        if (!activeRuleset) return null;
        
        const scenario = localStorage.getItem('ec_demo_scenario') as DemoScenario | null;
        const vixZone = scenario === 'high_vol' ? 'Elevated' : 'Normal';
        const lossStreak = scenario === 'drawdown' ? 3 : 0;
        
        const planInputs: PlanInputs = {
            leverage: values.leverage,
            riskPct: values.riskPercent,
            rr: rrr,
            session: "New York" // Mock
        };
        const validationContext: ValidationContext = {
            todayTradeCountAll: 2, // Mock
            lossStreak,
            vixZone
        };
        return validatePlanAgainstStrategy(planInputs, activeRuleset, validationContext);
    }, [values, activeRuleset, rrr]);

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
                <SummaryRow label="R:R Ratio" value={rrr > 0 ? `${rrr.toFixed(2)} : 1` : '-'} className={rrr > 0 ? (rrr < (activeRuleset?.tpRules.minRR || 1.5) ? 'text-amber-400' : 'text-green-400') : ''} />
                <SummaryRow label="Risk %" value={`${riskPercent}%`} className={riskPercent > (activeRuleset?.riskRules.riskPerTradePct || 2) ? 'text-destructive' : ''} />
            </div>
            <Separator />
            {validationResult && (
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Rule Checklist</h3>
                    <div className="space-y-3">
                        {validationResult.validations.map((check, i) => (
                            <RuleCheckRow key={i} check={check} />
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-4">
                 <Button variant="link" className="p-0 h-auto text-primary" onClick={() => onSetStep('plan')}>
                    Edit Plan (Step 1)
                </Button>
            </div>
        </div>
    );
}

function TradePlanningSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-5 w-80 mt-2" />
                </div>
                <Skeleton className="h-10 w-48" />
            </div>
            <Skeleton className="h-16 w-full" />
             <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                 <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        </div>
    );
}

function ScenarioWalkthrough({ isOpen, onOpenChange, onDemoSelect }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onDemoSelect: (scenario: 'conservative' | 'risky') => void }) {
    const walkthroughSteps = [
        { icon: FileText, title: "Step 1: Plan", description: "Define your Entry, Stop Loss, Take Profit, risk, and link the trade to one of your strategies." },
        { icon: Bot, title: "Step 2: Review", description: "Let Arjun check your plan against your own rules, best practices, and your current psychological state." },
        { icon: ShieldCheck, title: "Step 3: Execute", description: "Lock the plan, simulate execution, and automatically create a draft in your trade journal to complete later." },
    ];
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-background/90 backdrop-blur-sm animate-in fade-in"
                onClick={() => onOpenChange(false)}
            />
            <Card className="relative z-10 w-full max-w-4xl bg-muted/80 border-border/50 animate-in fade-in zoom-in-95">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center justify-between">
                        <span>Trade Planning Walkthrough</span>
                         <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="-mr-2" aria-label="Close walkthrough">
                            <X className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                    <CardDescription>The 3-step process to ensure every trade is disciplined.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid md:grid-cols-3 gap-6 text-center">
                        {walkthroughSteps.map((step, index) => (
                            <div key={step.title} className="relative">
                                <Card className="h-full bg-muted/50 p-6">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                        <step.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                                </Card>
                                {index < walkthroughSteps.length - 1 && (
                                    <ArrowRight className="absolute top-1/2 -right-3 -translate-y-1/2 h-6 w-6 text-border hidden md:block" />
                                )}
                            </div>
                        ))}
                    </div>
                     <Separator />
                     <div className="grid md:grid-cols-2 gap-6">
                        <div className="text-center">
                            <h3 className="font-semibold text-foreground mb-4">Try a demo scenario</h3>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button onClick={() => onDemoSelect('conservative')}>Demo: Conservative Plan</Button>
                                <Button variant="outline" onClick={() => onDemoSelect('risky')}>Demo: Risky Plan (breaks rules)</Button>
                            </div>
                        </div>
                        <div className="text-center md:text-left">
                            <h3 className="font-semibold text-foreground mb-4">Power-user Shortcuts</h3>
                             <p className="text-sm text-muted-foreground">
                                <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Alt</kbd> + <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">1/2/3</kbd> to switch steps.
                            </p>
                             <p className="text-sm text-muted-foreground mt-2">
                                <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl</kbd> + <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Enter</kbd> to continue.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function RecoveryModeWarning() {
    return (
        <Alert variant="default" className="bg-red-950/50 border-red-500/20 text-red-300">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-400">Recovery Mode is Active</AlertTitle>
            <AlertDescription>
                Arjun recommends a max risk of 0.5% and a max of 2 trades per day to get back on track.
            </AlertDescription>
        </Alert>
    )
}

export function TradePlanningModule({ onSetModule, planContext }: TradePlanningModuleProps) {
    const { toast } = useToast();
    const [isPlanningLoading, setIsPlanningLoading] = useState(true);
    const [planStatus, setPlanStatus] = useState<PlanStatusType>("incomplete");
    const [showBanner, setShowBanner] = useState(true);
    const [currentStep, setCurrentStep] = useState<TradePlanStep>("plan");
    const [arjunFeedbackAccepted, setArjunFeedbackAccepted] = useState(false);
    const [showTemplateOverwriteDialog, setShowTemplateOverwriteDialog] = useState(false);
    const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
    const [isNewUser, setIsNewUser] = useState(false);
    const [showValidationBanner, setShowValidationBanner] = useState(false);
    const [draftToResume, setDraftToResume] = useState<SavedDraft | null>(null);
    const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
    const [initialContext, setInitialContext] = useState(planContext);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);

    const reviewHeadingRef = useRef<HTMLDivElement>(null);
    const executionHeadingRef = useRef<HTMLDivElement>(null);

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
            entryPrice: '' as unknown as number, // Controlled input
            stopLoss: '' as unknown as number,
            takeProfit: '' as unknown as number,
            mindset: "",
        },
        mode: "onBlur",
    });

    const justificationValue = useWatch({
        control: form.control,
        name: 'justification'
    });
    
    const canProceedToReview = planStatus !== 'incomplete' && (planStatus !== 'FAIL' || (justificationValue && justificationValue.length > 0));
    const canProceedToExecution = canProceedToReview && arjunFeedbackAccepted;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsPlanningLoading(false);
        }, 1000);

        if (typeof window !== "undefined") {
            const scenario = localStorage.getItem('ec_demo_scenario') as DemoScenario | null;
            setIsNewUser(scenario === 'no_positions');
            setIsRecoveryMode(localStorage.getItem('ec_recovery_mode') === 'true');
            
            const draftString = localStorage.getItem("ec_trade_plan_draft");
            if (draftString) {
                try {
                    const parsedDraft = JSON.parse(draftString);
                    if(!form.formState.isDirty && !form.getValues('instrument')) {
                        setDraftToResume(parsedDraft);
                    }
                } catch(e) { console.error("Could not parse trade plan draft:", e); }
            }

            const storedContext = localStorage.getItem('ec_trade_planning_context');
            if (storedContext) {
                const parsedContext = JSON.parse(storedContext);
                setInitialContext(parsedContext);
                form.setValue('instrument', parsedContext.instrument);
                if (parsedContext.direction) {
                  form.setValue('direction', parsedContext.direction);
                }
                localStorage.removeItem('ec_trade_planning_context');
            } else if (planContext) {
                setInitialContext(planContext);
                form.setValue('instrument', planContext.instrument);
                if (planContext.direction) {
                    form.setValue('direction', planContext.direction);
                }
            }

            const walkthroughSeen = localStorage.getItem('ec_trade_plan_walkthrough_seen');
            if (!walkthroughSeen) {
                setIsWalkthroughOpen(true);
                localStorage.setItem('ec_trade_plan_walkthrough_seen', 'true');
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey) {
                e.preventDefault();
                if (e.key === '1') setCurrentStep('plan');
                if (e.key === '2' && canProceedToReview) setCurrentStep('review');
                if (e.key === '3' && canProceedToExecution) setCurrentStep('execute');
            }

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    if (document.activeElement?.tagName === 'TEXTAREA') return;
                    e.preventDefault();
                    form.handleSubmit(onValidSubmit, onInvalidSubmit)();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', handleKeyDown);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast, canProceedToReview, canProceedToExecution]);
    
    useEffect(() => {
        if (currentStep === 'review' && reviewHeadingRef.current) {
            reviewHeadingRef.current.focus();
        }
        if (currentStep === 'execute' && executionHeadingRef.current) {
            executionHeadingRef.current.focus();
        }
    }, [currentStep]);

    const handleResumeDraft = () => {
        if (!draftToResume) return;
        form.reset(draftToResume.formData);
        setCurrentStep(draftToResume.draftStep);
        setDraftToResume(null);
        toast({
            title: "Draft Loaded",
            description: "Your previous trade plan draft has been loaded.",
        });
    };
    
    const handleDiscardDraft = () => {
        localStorage.removeItem("ec_trade_plan_draft");
        setDraftToResume(null);
        toast({
            title: "Draft Discarded",
            variant: "destructive"
        });
    };
    
    const applyTemplate = (templateId: string) => {
        const template = planTemplates.find(t => t.id === templateId);
        if (!template || template.id === 'custom_soon') return;

        const defaultValues = {
            direction: "Long", entryType: "Limit", leverage: 10, accountCapital: 10000,
            riskPercent: 1, strategyId: '', instrument: "", notes: "", justification: "",
            entryPrice: '' as unknown as number, stopLoss: '' as unknown as number, takeProfit: '' as unknown as number, mindset: ""
        };

        form.reset({
            ...defaultValues,
            ...form.getValues(),
            ...template.values,
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
    
    const handleDemoSelect = (scenario: 'conservative' | 'risky') => {
        const conservativePlan = {
            instrument: "BTC-PERP",
            direction: "Long",
            entryType: "Limit",
            entryPrice: 68000,
            stopLoss: 67500,
            takeProfit: 69500,
            riskPercent: 1,
            accountCapital: 10000,
            strategyId: "strat_1",
            leverage: 10
        };

        const riskyPlan = {
            instrument: "MEME-COIN",
            direction: "Long",
            entryType: "Market",
            entryPrice: 1.2,
            stopLoss: 1.15,
            takeProfit: 1.22,
            riskPercent: 5,
            accountCapital: 10000,
            strategyId: "strat_3",
            leverage: 50,
        };

        if (scenario === 'conservative') {
            form.reset(conservativePlan);
            setCurrentStep('review');
        } else {
            form.reset(riskyPlan);
            setCurrentStep('plan');
        }
        setIsWalkthroughOpen(false);
    };

    const onValidSubmit = (values: PlanFormValues) => {
        setShowValidationBanner(false);
        if (currentStep === 'plan') {
            setCurrentStep('review');
        } else if (currentStep === 'review') {
            setCurrentStep('execute');
        } else {
             // Execution logic is now inside ExecutionOptions
        }
    };

    const onInvalidSubmit = () => {
        setShowValidationBanner(true);
    }

    const handleSaveDraft = () => {
        const values = form.getValues();
        const draft: SavedDraft = {
            formData: values,
            draftStep: currentStep,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem("ec_trade_plan_draft", JSON.stringify(draft));
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

    
    const isProceedDisabled = currentStep === 'plan' ? !canProceedToReview :
                              currentStep === 'review' ? !canProceedToExecution :
                              false;
    
    const isBannerVisible = showBanner && (planStatus === 'FAIL' || planStatus === 'overridden');

    const stepConfig = {
        plan: { label: "Plan", buttonText: isNewUser ? "Practice review (no real risk)" : "Proceed to Review (Step 2)", disabled: false },
        review: { label: "Review", buttonText: "Proceed to Execution (Step 3)", disabled: !canProceedToReview },
        execute: { label: "Execute", buttonText: "Execute (Prototype)", disabled: !canProceedToExecution },
    }
    
    if (isPlanningLoading) {
        return <TradePlanningSkeleton />;
    }

    return (
        <div className="space-y-8">
            <ScenarioWalkthrough isOpen={isWalkthroughOpen} onOpenChange={setIsWalkthroughOpen} onDemoSelect={handleDemoSelect} />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-4">
                        {initialContext?.origin === 'chart' && (
                            <Button variant="ghost" size="sm" className="text-muted-foreground -ml-4" onClick={() => onSetModule('chart')}>
                                <ArrowLeft className="mr-2 h-4 w-4"/>
                                Back to Chart
                            </Button>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Trade Planning</h1>
                    <p className="text-muted-foreground">The heart of disciplined trading inside EdgeCipher.</p>
                </div>
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => setIsWalkthroughOpen(true)}>
                                    <HelpCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Open walkthrough</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
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

            {initialContext && (
                 <Alert variant="default" className="bg-primary/10 border-primary/20 text-primary">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <AlertTitle>Context from {initialContext.origin}</AlertTitle>
                    <AlertDescription>
                       You've been sent here to plan a trade for <strong className="font-semibold">{initialContext.instrument}</strong>.
                    </AlertDescription>
                </Alert>
            )}

            {showValidationBanner && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <AlertTitle>Validation Errors</AlertTitle>
                            <AlertDescription>
                                Fix the highlighted issues before moving to Review.
                            </AlertDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowValidationBanner(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </Alert>
            )}
            
            {isBannerVisible && (
                 <Alert variant="destructive" className="bg-amber-950/60 border-amber-500/30 text-amber-300">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <AlertTitle className="text-amber-400">
                                {planStatus === 'overridden' ? "You are overriding your rules" : "Major Violation. Arjun recommends NOT taking this trade."}
                            </AlertTitle>
                            <AlertDescription>
                               {planStatus === 'overridden' 
                                 ? "This should be rare and done consciously. Your justification will be logged."
                                 : "Fix the issues in the summary card, or add a justification to proceed."}
                            </AlertDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowBanner(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </Alert>
            )}

             {isRecoveryMode ? <RecoveryModeWarning /> : isNewUser ? (
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
                <form onSubmit={form.handleSubmit(onValidSubmit, onInvalidSubmit)} className="space-y-8">

                    {currentStep === "plan" && <PlanStep form={form} onSetModule={onSetModule} setPlanStatus={setPlanStatus} onApplyTemplate={handleApplyTemplate} isNewUser={isNewUser} currentStep={currentStep} draftToResume={draftToResume} onResume={handleResumeDraft} onDiscard={handleDiscardDraft} />}
                    {currentStep === "review" && <ReviewStep form={form} onSetModule={onSetModule} onSetStep={setCurrentStep} arjunFeedbackAccepted={arjunFeedbackAccepted} setArjunFeedbackAccepted={setArjunFeedbackAccepted} planStatus={planStatus} reviewHeadingRef={reviewHeadingRef} />}
                    {currentStep === "execute" && <ExecuteStep form={form} onSetModule={onSetModule} onSetStep={setCurrentStep} planStatus={planStatus} executionHeadingRef={executionHeadingRef} />}

                     <div className="mt-8 p-4 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">Step {Object.keys(stepConfig).indexOf(currentStep) + 1} of 3: {stepConfig[currentStep].label} your trade.</p>
                        <div className="flex w-full sm:w-auto flex-col sm:flex-row items-center gap-4">
                            <Button variant="outline" type="button" onClick={handleSaveDraft} className="w-full sm:w-auto">Save as draft (Prototype)</Button>
                            
                           {currentStep !== 'execute' && (
                                <TooltipProvider>
                                    <Tooltip open={isProceedDisabled && (planStatus === 'FAIL' || currentStep === 'review' && !arjunFeedbackAccepted) ? undefined : false}>
                                        <TooltipTrigger asChild>
                                            <div className="w-full sm:w-auto" tabIndex={0}>
                                                <Button type="submit" disabled={isProceedDisabled} className="w-full">
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
function SummaryRow({ label, value, className }: { label: string, value: string | React.ReactNode, className?: string }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">{label}</p>
            <p className={cn("font-semibold font-mono text-foreground", className)}>{value}</p>
        </div>
    )
}

    