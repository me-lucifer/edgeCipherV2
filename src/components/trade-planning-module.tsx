
      "use client";
import { useState, useEffect, useRef, useMemo } from "react";
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
import { Bot, Info, CheckCircle, Circle, AlertTriangle, FileText, ArrowRight, Gauge, ShieldCheck, XCircle, X, Lock, Loader2, Bookmark, Copy, RefreshCw, Sparkles, Clock, HelpCircle, ArrowLeft, ChevronsUpDown, HeartPulse, Scale, ChevronDown, Wand2 } from "lucide-react";
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
import { useDailyCounters } from "@/hooks/use-daily-counters";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Check } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { useRiskState, type RiskDecision, type ActiveNudge, type VixZone } from "@/hooks/use-risk-state";
import { VixBadge } from "./ui/vix-badge";


interface TradePlanningModuleProps {
    onSetModule: (module: any, context?: any) => void;
    planContext?: {
        instrument: string;
        direction?: 'Long' | 'Short';
        origin: string;
        safeMode?: boolean;
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
    newsRiskAcknowledged: z.boolean().optional(),
    newsRiskJustification: z.string().optional(),
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
type ValidationCategory = 'Risk & Leverage' | 'RR & TP' | 'Daily Discipline' | 'Context' | 'Entry Confirmation';

type PlanInputs = {
    leverage: number;
    riskPct: number;
    rr: number;
    session: "Asia" | "London" | "New York"; // Mocked
};

type ValidationContext = {
    todayTradeCountAll: number;
    lossStreak: number;
    vixZone: VixZone;
    allEntryRulesChecked: boolean;
    tempVolatilityPolicy: "follow" | "conservative" | "strict" | null;
};

type ValidationCheck = {
  ruleId: string;
  title: string;
  status: ValidationStatus;
  message: string;
  category: ValidationCategory;
  fix?: {
    type: 'SET_VALUE' | 'SHOW_HINT';
    payload: {
        field?: keyof PlanFormValues;
        value?: any;
        toastMessage?: string;
    }
  }
};

type ValidationOutput = {
  validations: ValidationCheck[];
  overallStatus: "PASS" | "WARN" | "FAIL";
  requiresJustification: boolean;
};

const NEWS_RISK_CONTEXT_KEY = "ec_news_risk_context";

// The Validation Engine
const validatePlanAgainstStrategy = (plan: PlanInputs, strategy: RuleSet, context: ValidationContext): ValidationOutput => {
    const validations: ValidationCheck[] = [];
    const { riskRules, tpRules, contextRules, entryRules } = strategy;
    
    const guardrails = JSON.parse(localStorage.getItem("ec_guardrails") || "{}");
    const warnThreshold = guardrails.warnThreshold || 41;
    const strongWarnThreshold = guardrails.strongWarnThreshold || 61;
    const lockThreshold = guardrails.lockThreshold || 81;


    if (!riskRules || !tpRules || !contextRules || !entryRules) {
        // Fallback if ruleSet is incomplete
        return {
            validations: [{ ruleId: 'incomplete', title: 'Strategy Incomplete', status: 'FAIL', message: 'The selected strategy is missing critical rule definitions.', category: 'Risk & Leverage' }],
            overallStatus: 'FAIL',
            requiresJustification: true
        };
    }

    // A) Leverage cap
    validations.push({
        ruleId: 'leverageCap',
        title: `Leverage <= ${riskRules.leverageCap}x`,
        status: plan.leverage > riskRules.leverageCap ? "FAIL" : "PASS",
        message: plan.leverage > riskRules.leverageCap
            ? `Leverage of ${plan.leverage}x exceeds strategy max of ${riskRules.leverageCap}x.`
            : `Leverage is within strategy limits.`,
        category: 'Risk & Leverage',
        fix: plan.leverage > riskRules.leverageCap ? {
            type: 'SET_VALUE',
            payload: { field: 'leverage', value: riskRules.leverageCap }
        } : undefined,
    });
    
    // VIX-based leverage checks from Guardrails
    if (guardrails.lockOnVixExtreme && context.vixZone === 'Extreme' && plan.leverage > 5) {
        validations.push({
            ruleId: 'vixLeverageExtreme',
            title: `Leverage <= 5x in Extreme VIX`,
            status: "FAIL",
            message: `Guardrail active: Using >5x leverage in 'Extreme' VIX is blocked.`,
            category: 'Risk & Leverage',
            fix: { type: 'SET_VALUE', payload: { field: 'leverage', value: 5 } },
        });
    } else if (guardrails.warnOnVixHigh && (context.vixZone === 'High Volatility' || context.vixZone === 'Extreme') && plan.leverage > 10) {
         validations.push({
            ruleId: 'vixLeverageHigh',
            title: `Leverage <= 10x in High/Extreme VIX`,
            status: "WARN",
            message: `Guardrail active: Using >10x leverage in high volatility is not recommended.`,
            category: 'Risk & Leverage',
            fix: { type: 'SET_VALUE', payload: { field: 'leverage', value: 10 } },
        });
    }


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
        category: 'Risk & Leverage',
        fix: riskDifference > 0 ? {
            type: 'SET_VALUE',
            payload: { field: 'riskPercent', value: riskRules.riskPerTradePct }
        } : undefined,
    });

    // C) Max daily trades
    validations.push({
        ruleId: 'maxDailyTrades',
        title: `Max daily trades <= ${riskRules.maxDailyTrades}`,
        status: context.todayTradeCountAll >= riskRules.maxDailyTrades ? "FAIL" : "PASS",
        message: context.todayTradeCountAll >= riskRules.maxDailyTrades
            ? `You've already made ${context.todayTradeCountAll} trades today. Your limit for this strategy is ${riskRules.maxDailyTrades}.`
            : "Within daily trade limit.",
        category: 'Daily Discipline'
    });

    // D) Cooldown after losses
    if (riskRules.cooldownAfterLosses && context.lossStreak >= 2) {
        validations.push({
            ruleId: 'cooldown',
            title: `Cooldown after ${2} losses`,
            status: "FAIL",
            message: `You are on a ${context.lossStreak}-trade losing streak. This strategy requires a cooldown.`,
            category: 'Daily Discipline'
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
                : "R:R meets minimum requirement.",
            category: 'RR & TP',
            fix: plan.rr < tpRules.minRR ? {
                type: 'SET_VALUE',
                payload: { field: 'takeProfit', value: tpRules.minRR } // Special handling needed
            } : undefined,
        });
    }

    // F) VIX policy with temporary override
    const finalVixPolicy = context.tempVolatilityPolicy !== 'follow' && context.tempVolatilityPolicy !== null ? context.tempVolatilityPolicy : (contextRules.vixPolicy || 'allowAll');
    let vixStatus: ValidationStatus = 'PASS';
    let message = "Volatility is within strategy parameters.";
    let fix: ValidationCheck['fix'] | undefined;
    
    if (finalVixPolicy === 'conservative' && (context.vixZone === 'Volatile' || context.vixZone === 'High Volatility' || context.vixZone === 'Extreme')) {
        vixStatus = 'WARN';
        message = `Current VIX is '${context.vixZone}', which the 'Conservative' policy suggests avoiding.`;
        fix = { type: 'SHOW_HINT', payload: { toastMessage: 'Consider switching to a strategy that performs better in high volatility.' } };
    } else if (finalVixPolicy === 'strict' && (context.vixZone !== 'Extremely Calm' && context.vixZone !== 'Normal')) {
        vixStatus = 'FAIL';
        message = `The 'Strict' policy only allows trading in 'Calm' or 'Normal' VIX, but it is currently '${context.vixZone}'.`;
        fix = { type: 'SHOW_HINT', payload: { toastMessage: 'Switch to a different strategy or wait for calmer markets.' } };
    } else if (contextRules.vixPolicy === 'avoidHigh' && (context.vixZone === 'High Volatility' || context.vixZone === 'Extreme')) {
        vixStatus = 'WARN';
        message = `Strategy suggests avoiding high VIX, and current VIX is '${context.vixZone}'.`;
        fix = { type: 'SHOW_HINT', payload: { toastMessage: 'Consider switching to a strategy that performs better in high volatility.' } };
    } else if (contextRules.vixPolicy === 'onlyLowNormal' && (context.vixZone === 'Volatile' || context.vixZone === 'High Volatility' || context.vixZone === 'Extreme')) {
        vixStatus = 'FAIL';
        message = `Strategy requires 'Calm' or 'Normal' VIX, but it is currently '${context.vixZone}'.`;
        fix = { type: 'SHOW_HINT', payload: { toastMessage: 'Switch to a different strategy or wait for calmer markets.' } };
    }

    validations.push({
        ruleId: 'vixPolicy',
        title: `VIX Policy: ${finalVixPolicy}`,
        status: vixStatus,
        message: message,
        category: 'Context',
        fix,
    });


    // G) Session restriction
    if (contextRules.allowedSessions && contextRules.allowedSessions.length > 0) {
        const isAllowed = contextRules.allowedSessions.includes(plan.session);
        validations.push({
            ruleId: 'session',
            title: `Session in [${contextRules.allowedSessions.join(', ')}]`,
            status: isAllowed ? 'PASS' : 'WARN',
            message: isAllowed
                ? 'Trading within allowed session.'
                : `Current session (${plan.session}) is outside of this strategy's allowed sessions.`,
            category: 'Context'
        });
    }
    
    // H) Entry rule self-check
    if (entryRules.conditions && entryRules.conditions.length > 0) {
        validations.push({
            ruleId: 'entryConfirmation',
            title: `Entry checklist`,
            status: context.allEntryRulesChecked ? 'PASS' : 'WARN',
            message: context.allEntryRulesChecked 
                ? 'All entry conditions have been manually confirmed.'
                : 'Entry confirmation checklist is incomplete.',
            category: 'Entry Confirmation'
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

const PlanStatus = ({ status }: { status: PlanStatusType }) => {
    const statusConfig = {
        incomplete: {
            label: "Incomplete",
            message: "Fill in Entry, SL, Strategy and Risk % to see your plan summary.",
            className: "bg-muted text-muted-foreground border-border",
            icon: Circle
        },
        FAIL: {
            label: "Major Violation",
            message: "Arjun recommends NOT taking this trade.",
            className: "bg-red-500/20 text-red-400 border-red-500/30",
            icon: XCircle,
        },
        WARN: {
            label: "Needs Attention",
            message: "Slight deviation from your rules. Consider adjusting.",
            className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
            icon: AlertTriangle
        },
        PASS: {
            label: "Aligned with Strategy",
            message: "This plan is aligned with your strategy. Looks solid.",
            className: "bg-green-500/20 text-green-400 border-green-500/30",
            icon: CheckCircle
        },
        overridden: {
            label: "Rules Overridden",
            message: "Critical rule overridden. You are consciously breaking your plan.",
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
            <p className="text-xs text-muted-foreground mt-2">{config.message}</p>
        </div>
    )
}

function MarketContext({ session, setSession, vixZone, setVixZone }: { session: "Asia" | "London" | "New York", setSession: (s: "Asia" | "London" | "New York") => void, vixZone: VixZone, setVixZone: (z: VixZone) => void}) {
    const [market, setMarket] = useState({ vixValue: 45 });

    useEffect(() => {
        const scenario = localStorage.getItem('ec_demo_scenario') as DemoScenario | null;
        let vixValue = 45;
        if (scenario === 'high_vol') vixValue = 82;
        
        setMarket({ vixValue });
        setVixZone(getVixZone(vixValue));
    }, [setVixZone]);

    const getVixZone = (vix: number): VixZone => {
        if (vix > 75) return "Extreme";
        if (vix > 50) return "Volatile";
        if (vix > 25) return "Normal";
        return "Extremely Calm";
    };

    const isHighVol = vixZone === 'Extreme' || vixZone === 'High Volatility';

    return (
        <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Market Context</h3>
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3">
                <div className="flex justify-between items-center">
                    <Label htmlFor="session-select" className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Session</Label>
                    <Select value={session} onValueChange={(v) => setSession(v as any)}>
                        <SelectTrigger id="session-select" className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Asia">Asia</SelectItem>
                            <SelectItem value="London">London</SelectItem>
                            <SelectItem value="New York">New York</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex justify-between items-center">
                    <Label htmlFor="vix-select" className="text-sm text-muted-foreground flex items-center gap-2"><Gauge className="h-4 w-4" /> VIX Zone</Label>
                    <Select value={vixZone} onValueChange={(v) => setVixZone(v as any)}>
                        <SelectTrigger id="vix-select" className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Extremely Calm">Extremely Calm</SelectItem>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Volatile">Volatile</SelectItem>
                            <SelectItem value="High Volatility">High Volatility</SelectItem>
                            <SelectItem value="Extreme">Extreme</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
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

const RuleCheckRow = ({ check, onFix }: { check: ValidationCheck, onFix: (fix: ValidationCheck['fix']) => void }) => {
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
                         <div className="flex items-center gap-2">
                             {check.fix && check.status !== 'PASS' && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => onFix(check.fix)}>
                                    <Wand2 className="mr-1 h-3 w-3" />
                                    Fix
                                </Button>
                            )}
                            <Badge variant="secondary" className={cn("text-xs font-mono",
                                check.status === 'PASS' && "bg-green-500/10 text-green-400 border-green-500/20",
                                check.status === 'WARN' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                check.status === 'FAIL' && "bg-red-500/10 text-red-400 border-red-500/20",
                            )}>{check.status}</Badge>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs">{check.message}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

function RuleChecks({ checks, onFix }: { checks: ValidationCheck[]; onFix: (fix: ValidationCheck['fix']) => void; }) {
    const groupedChecks = useMemo(() => {
        const groups: Partial<Record<ValidationCategory, ValidationCheck[]>> = {};
        for (const check of checks) {
            if (!groups[check.category]) {
                groups[check.category] = [];
            }
            groups[check.category]!.push(check);
        }
        return Object.entries(groups) as [ValidationCategory, ValidationCheck[]][];
    }, [checks]);

    const getGroupStatus = (group: ValidationCheck[]): ValidationStatus => {
        if (group.some(c => c.status === 'FAIL')) return 'FAIL';
        if (group.some(c => c.status === 'WARN')) return 'WARN';
        return 'PASS';
    };

    return (
        <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Rulebook Firewall</h3>
            <div className="rounded-lg bg-muted/50 border border-border/50">
                {groupedChecks.map(([category, group], index) => {
                    const status = getGroupStatus(group);
                    const Icon = { PASS: CheckCircle, WARN: AlertTriangle, FAIL: XCircle }[status];
                    const color = { PASS: 'text-green-400', WARN: 'text-amber-400', FAIL: 'text-destructive' }[status];
                    
                    return (
                        <Collapsible key={category} defaultOpen={status !== 'PASS'}>
                             <CollapsibleTrigger className="w-full">
                                <div className={cn("flex items-center justify-between p-3 cursor-pointer hover:bg-muted", index > 0 && "border-t")}>
                                    <div className="flex items-center gap-2">
                                        <Icon className={cn("h-4 w-4", color)} />
                                        <span className="text-sm font-semibold text-foreground">{category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className={cn("text-xs font-mono",
                                            status === 'PASS' && "bg-green-500/10 text-green-400 border-green-500/20",
                                            status === 'WARN' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                            status === 'FAIL' && "bg-red-500/10 text-red-400 border-red-500/20",
                                        )}>{status}</Badge>
                                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                                    </div>
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-4 pt-0">
                                <div className="space-y-4 pt-2 border-t">
                                     {group.map((check) => <RuleCheckRow key={check.ruleId} check={check} onFix={onFix} />)}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    );
                })}
            </div>
        </div>
    );
}

const interventionMessages = {
    maxDailyTrades: {
        message: "You've hit your daily trade limit.",
        why: "This is where overtrading starts and discipline fails.",
        suggestion: "Review today's trades instead of taking another."
    },
    minRR: {
        message: "Your potential reward doesn't justify the risk.",
        why: "Taking trades with low R:R is a slow bleed over time, even with a high win rate.",
        suggestion: "Adjust your TP or wait for a better entry to improve your R:R."
    },
    cooldown: {
        message: "You're on a losing streak and your rules require a cooldown.",
        why: "This prevents revenge trading and emotional decisions.",
        suggestion: "Step back. Review your losing trades in the journal."
    },
    vixPolicy: {
        message: "This strategy is not optimal for current market volatility.",
        why: "Your rules say to avoid these conditions.",
        suggestion: "Reduce size, find a different strategy, or wait for calmer markets."
    },
    riskPerTrade: {
        message: "Your risk on this trade is too high.",
        why: "A single loss will set you back more than your plan allows.",
        suggestion: "Lower your risk % to align with your strategy."
    },
    entryConfirmation: {
        message: "Your entry confirmation checklist is incomplete.",
        why: "Skipping this step leads to impulsive entries that don't fit your plan.",
        suggestion: "Review each entry condition and confirm your setup is valid before proceeding."
    },
    vixLeverageExtreme: {
        message: "Leverage is too high for extreme volatility.",
        why: "High volatility dramatically increases liquidation risk. This is a recipe for a blown account.",
        suggestion: "Reduce leverage to 5x or less immediately."
    },
    vixLeverageHigh: {
        message: "Leverage is high for current volatility.",
        why: "High volatility increases liquidation risk.",
        suggestion: "Consider reducing leverage to 10x or less."
    },
    default: {
        message: "This plan deviates from your strategy.",
        why: "Following your rules consistently is key to long-term success.",
        suggestion: "Adjust the plan to meet all your rulebook criteria."
    }
};

function ArjunInterventionAlert({ validationResult }: { validationResult: ValidationOutput | null }) {
    if (!validationResult || validationResult.overallStatus === 'PASS') {
        return null;
    }

    const firstFail = validationResult.validations.find(v => v.status === 'FAIL');
    const firstWarn = validationResult.validations.find(v => v.status === 'WARN');
    
    const criticalValidation = firstFail || firstWarn;
    if (!criticalValidation) return null;

    const messages = interventionMessages[criticalValidation.ruleId as keyof typeof interventionMessages] || interventionMessages.default;

    return (
        <Alert variant="default" className="bg-amber-950/30 border-amber-500/20 text-amber-300 mb-6">
            <Bot className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-amber-400">Arjun's Intervention</AlertTitle>
            <AlertDescription className="space-y-2">
                <p className="font-semibold text-amber-300">"{messages.message}"</p>
                <p className="text-xs"><strong className="text-amber-400/80">Why:</strong> {messages.why}</p>
                <p className="text-xs"><strong className="text-amber-400/80">Suggestion:</strong> {messages.suggestion}</p>
            </AlertDescription>
        </Alert>
    );
}

function PlanSummary({ control, setPlanStatus, onSetModule, entryChecklist, session, vixZone, form }: { control: any, setPlanStatus: (status: PlanStatusType) => void, onSetModule: (module: any) => void, entryChecklist: Record<string, boolean>, session: "Asia" | "London" | "New York", vixZone: VixZone, form: any }) {
    const values = useWatch({ control }) as PlanFormValues;
    const { direction, entryPrice, stopLoss, takeProfit, riskPercent, accountCapital, justification, strategyId } = values;
    const { totalTradesExecuted, lossStreak } = useDailyCounters();
    const { toast } = useToast();

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
        
        const allEntryRulesChecked = (activeRuleset.entryRules.conditions || []).every(rule => entryChecklist[rule]);
        
        const tempVolatilityPolicy = typeof window !== 'undefined' ? localStorage.getItem("ec_temp_vol_policy") as "follow" | "conservative" | "strict" | null : null;


        const planInputs: PlanInputs = {
            leverage: values.leverage,
            riskPct: values.riskPercent,
            rr: rrr,
            session: session,
        };
        const validationContext: ValidationContext = {
            todayTradeCountAll: totalTradesExecuted,
            lossStreak,
            vixZone,
            allEntryRulesChecked,
            tempVolatilityPolicy,
        };
        return validatePlanAgainstStrategy(planInputs, activeRuleset, validationContext);
    }, [values, activeRuleset, rrr, entryChecklist, totalTradesExecuted, lossStreak, session, vixZone]);

    const handleFix = (fix: ValidationCheck['fix']) => {
        if (!fix) return;

        if (fix.type === 'SET_VALUE' && fix.payload.field) {
            let valueToSet = fix.payload.value;

            // Special handling for R:R fix
            if (fix.payload.field === 'takeProfit' && typeof fix.payload.value === 'number') {
                const minRR = fix.payload.value;
                const riskDist = Math.abs(values.entryPrice - values.stopLoss);
                if (values.direction === 'Long') {
                    valueToSet = values.entryPrice + (riskDist * minRR);
                } else {
                    valueToSet = values.entryPrice - (riskDist * minRR);
                }
            }
            
            form.setValue(fix.payload.field, valueToSet, { shouldValidate: true });
            toast({ title: `Auto-fix applied to ${fix.payload.field}.` });
        } else if (fix.type === 'SHOW_HINT' && fix.payload.toastMessage) {
            toast({ title: "Arjun's Suggestion", description: fix.payload.toastMessage });
        }
    };


    let status: PlanStatusType = 'incomplete';
    
    if (validationResult && entryPrice > 0 && stopLoss > 0 && riskPercent > 0 && strategyId) {
        if (validationResult.overallStatus === 'FAIL') {
            status = 'FAIL';
            if (justification && justification.length > 0) {
                status = 'overridden';
            }
        } else if (validationResult.overallStatus === 'WARN') {
            status = 'WARN';
        } else {
            status = 'PASS';
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
                <PlanStatus status={status} />
                {validationResult && <ArjunInterventionAlert validationResult={validationResult} />}
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
                        <RuleChecks checks={validationResult.validations} onFix={handleFix} />
                    </>
                )}
                
                {validationResult?.overallStatus === 'FAIL' && (
                     <>
                        <Separator />
                         <FormField
                            control={control}
                            name="justification"
                            render={({ field }: any) => (
                                <FormItem>
                                    <FormLabel className={cn("flex items-center gap-2", justification && justification.length > 0 ? "text-amber-400" : "text-destructive")}>
                                        <AlertTriangle className="h-4 w-4" />
                                        Justification Required
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Explain why this trade is still valid despite the violation. This will be logged in your journal."
                                            className="border-destructive/50 focus-visible:ring-destructive"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">You must explain why you are overriding a critical rule before proceeding.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
                
                <Separator />
                <DisciplineAlerts onSetModule={onSetModule} />
            </CardContent>
        </Card>
    );
}

const SummaryRow = ({ label, value, className }: { label: string, value: string, className?: string }) => (
    <div className="flex justify-between items-center text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className={cn("font-mono font-semibold text-foreground", className)}>{value}</p>
    </div>
);

const PriceLadder = ({ direction, entryPrice, stopLoss, takeProfit }: { direction: 'Long' | 'Short', entryPrice: number, stopLoss: number, takeProfit?: number }) => {
    const isLong = direction === 'Long';
    const prices = [
        ...(takeProfit ? [{ price: takeProfit, type: 'TP', color: 'text-green-400' }] : []),
        { price: entryPrice, type: 'Entry', color: 'text-primary' },
        { price: stopLoss, type: 'SL', color: 'text-red-400' },
    ].filter(p => p.price > 0).sort((a,b) => b.price - a.price);

    if (prices.length < 2) return <div className="h-full w-full bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">Enter prices to visualize</div>;

    const minPrice = Math.min(...prices.map(p => p.price));
    const maxPrice = Math.max(...prices.map(p => p.price));
    const range = maxPrice - minPrice;

    if (range <= 0) return <div className="h-full w-full bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">Invalid prices</div>;

    return (
        <div className="relative h-full w-full flex justify-end">
            <div className="absolute top-0 bottom-0 right-20 w-px bg-border/50" />
            {prices.map(({price, type, color}) => {
                const position = ((maxPrice - price) / range) * 100;
                return (
                    <div key={type} className="absolute w-full" style={{ top: `${position}%`, transform: 'translateY(-50%)' }}>
                        <div className="flex items-center">
                            <div className="flex-1 border-t border-dashed border-border/50" />
                            <div className="text-xs text-right pr-2 w-20">
                                <p className={cn("font-semibold font-mono", color)}>{price.toFixed(2)}</p>
                                <p className={cn("text-xs", color)}>{type}</p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

const DisciplineAlerts = ({ onSetModule }: { onSetModule: (module: any) => void }) => {
    return (
        <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Discipline Alerts (Prototype)</h3>
            <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start text-left h-auto py-2" onClick={() => onSetModule('riskCenter')}>
                    <span className="flex items-center gap-2 font-semibold text-amber-400"><AlertTriangle className="h-4 w-4" /> VIX is elevated</span>
                    <span className="text-xs text-muted-foreground ml-auto">Open Risk Center</span>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-left h-auto py-2" onClick={() => onSetModule('riskCenter')}>
                    <span className="flex items-center gap-2 font-semibold text-red-400"><XCircle className="h-4 w-4" /> Approaching daily loss limit</span>
                    <span className="text-xs text-muted-foreground ml-auto">See Budget</span>
                </Button>
            </div>
        </div>
    );
};

export function TradePlanningModule({ onSetModule, planContext }: TradePlanningModuleProps) {
    const { toast } = useToast();
    const { addLog, toggleEventLog } = useEventLog();
    const { incrementTrades, incrementOverrides } = useDailyCounters();
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
    const [entryChecklist, setEntryChecklist] = useState<Record<string, boolean>>({});
    const [session, setSession] = useState<'Asia' | 'London' | 'New York'>('New York');
    const { riskState } = useRiskState();
    const [planStatus, setPlanStatus] = useState<PlanStatusType>('incomplete');
    const [tempVolatilityPolicy, setTempVolatilityPolicy] = useState<'follow' | 'conservative' | 'strict' | null>(null);
    const [activeNewsRisk, setActiveNewsRisk] = useState<any>(null);

    const form = useForm<PlanFormValues>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            instrument: "",
            direction: "Long",
            entryType: "Market",
            leverage: 10,
            accountCapital: 10000,
            riskPercent: 1.0,
            strategyId: "",
            newsRiskAcknowledged: false,
        },
    });

    useEffect(() => {
        if(typeof window !== "undefined") {
            const storedStrategies = localStorage.getItem("ec_strategies");
            if(storedStrategies) {
                setStrategies(JSON.parse(storedStrategies));
            }
            
            const lastUsedStrategyId = localStorage.getItem("ec_last_used_strategy");
            if (lastUsedStrategyId) {
                form.setValue('strategyId', lastUsedStrategyId);
            }

            const storedCapital = localStorage.getItem("ec_assumed_capital");
            if (storedCapital) {
                form.setValue('accountCapital', parseFloat(storedCapital));
            }

            const draftString = localStorage.getItem("ec_trade_plan_draft");
            if (draftString) {
                try {
                    const draft = JSON.parse(draftString);
                    form.reset(draft.formData);
                    toast({
                        title: "Draft Loaded",
                        description: "Your previous unfinished trade plan has been restored.",
                    });
                } catch(e) {
                     localStorage.removeItem("ec_trade_plan_draft");
                }
            }
        }
    }, [form, toast]);
    
    useEffect(() => {
        if (planContext) {
            form.setValue('instrument', planContext.instrument);
            if (planContext.direction) {
                form.setValue('direction', planContext.direction);
            }
            if(planContext.safeMode) {
                setTempVolatilityPolicy('conservative');
                toast({
                    title: "Conservative Mode Active",
                    description: "Stricter volatility rules are temporarily being enforced.",
                    variant: "destructive"
                });
            }
            addLog(`Trade planning context loaded from ${planContext.origin}: ${planContext.instrument}`);
        }
    }, [planContext, form, addLog, toast]);
    
     useEffect(() => {
        if (typeof window !== "undefined") {
            const updateNewsRisk = () => {
                const context = localStorage.getItem(NEWS_RISK_CONTEXT_KEY);
                if (context) {
                    const parsed = JSON.parse(context);
                    if (parsed.active && parsed.expiresAt > Date.now()) {
                        setActiveNewsRisk(parsed);
                    } else {
                        setActiveNewsRisk(null);
                        if (parsed.expiresAt <= Date.now()) {
                            localStorage.removeItem(NEWS_RISK_CONTEXT_KEY);
                        }
                    }
                } else {
                    setActiveNewsRisk(null);
                }
            };

            updateNewsRisk();
            const interval = setInterval(updateNewsRisk, 5000);
            window.addEventListener('storage', updateNewsRisk);

            return () => {
                clearInterval(interval);
                window.removeEventListener('storage', updateNewsRisk);
            };
        }
    }, []);

    const activeStrategyId = useWatch({ control: form.control, name: 'strategyId' });

    useEffect(() => {
        const strat = strategies.find(s => s.strategyId === activeStrategyId);
        setSelectedStrategy(strat || null);

        // Reset checklist when strategy changes
        const newChecklist: Record<string, boolean> = {};
        strat?.versions.find(v => v.isActiveVersion)?.ruleSet.entryRules.conditions.forEach(rule => {
            newChecklist[rule] = false;
        });
        setEntryChecklist(newChecklist);
        
        if(strat) {
            localStorage.setItem("ec_last_used_strategy", strat.strategyId);
        }

    }, [activeStrategyId, strategies]);
    
     const {
        handleSubmit,
        formState: { isSubmitting },
        getValues,
    } = form;

    const onExecuteTrade = (values: PlanFormValues) => {
        addLog(`Executing trade plan for ${values.instrument}`);
        incrementTrades(values.strategyId);
        
        if (planStatus === 'overridden') {
            incrementOverrides();
        }

        const newsContextTags: string[] = [];
        if (activeNewsRisk) {
            newsContextTags.push("News-driven day");
            newsContextTags.push(`Active risk window: ${activeNewsRisk.headline}`);
        }

        const newJournalEntry: JournalEntry = {
            id: `draft-${Date.now()}`,
            tradeId: `DELTA-${Date.now()}`,
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
                positionSize: 0, // Should be calculated
                riskPercent: values.riskPercent,
                rrRatio: 0, // Should be calculated
                strategy: selectedStrategy?.name || 'Unknown',
            },
            planning: {
                planNotes: values.notes,
                ruleOverridesJustification: values.justification,
                mindset: values.mindset,
            },
            review: {
                pnl: 0,
                exitPrice: 0,
                newsContextTags: newsContextTags.join(','),
            },
            meta: {
                strategyVersion: selectedStrategy?.versions.find(v => v.isActiveVersion)?.versionNumber.toString(),
                vixOnExecute: {
                    value: riskState?.marketRisk.vixValue || 0,
                    zone: riskState?.marketRisk.vixZone || 'Normal',
                },
                ruleAdherenceSummary: {
                    followedEntryRules: true, // Placeholder
                    movedSL: false,
                    exitedEarly: false,
                    rrBelowMin: false
                }
            }
        };

        const existingDrafts = JSON.parse(localStorage.getItem('ec_journal_drafts') || '[]');
        localStorage.setItem('ec_journal_drafts', JSON.stringify([newJournalEntry, ...existingDrafts]));
        localStorage.removeItem('ec_trade_plan_draft');

        toast({
            title: "Trade Executed (Prototype)",
            description: "A draft has been created in your trade journal.",
        });
        onSetModule('tradeJournal');
    };
    
    const handleSaveDraft = () => {
        const currentData = getValues();
        const draft: SavedDraft = {
            formData: currentData,
            draftStep: 'plan',
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem('ec_trade_plan_draft', JSON.stringify(draft));
        addLog("Trade plan draft saved.");
        toast({
            title: "Draft Saved",
            description: "Your trade plan has been saved for later.",
        });
    };

    const isExecuteDisabled = useMemo(() => {
        if (isSubmitting) return true;
        if (planStatus === 'FAIL') return true;
        if (activeNewsRisk && !form.getValues('newsRiskAcknowledged')) return true;
        return false;
    }, [isSubmitting, planStatus, activeNewsRisk, form]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Trade Planning</h1>
                    <p className="text-muted-foreground">This is where you build your case for a trade.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onSetModule('strategyManagement')}>
                        <BookOpen className="mr-2 h-4 w-4" /> My Rulebooks
                    </Button>
                    <Button variant="ghost" size="sm" onClick={toggleEventLog}>Toggle Event Log</Button>
                </div>
            </div>
            
            <Form {...form}>
                <form onSubmit={handleSubmit(onExecuteTrade)} className="space-y-8">
                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                        {/* --- FORM FIELDS --- */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-muted/30 border-border/50">
                                <CardHeader>
                                    <CardTitle>Trade Idea</CardTitle>
                                    <CardDescription>
                                        Define the instrument and core parameters for your trade.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <FormField control={form.control} name="instrument" render={({ field }) => ( <FormItem><FormLabel>Instrument</FormLabel><FormControl><Input placeholder="e.g., BTC-PERP" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                        </div>
                                         <FormField control={form.control} name="direction" render={({ field }) => ( <FormItem className="space-y-3"><FormLabel>Direction</FormLabel><FormControl> <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"> <FormItem className="flex items-center space-x-3 space-y-0"> <FormControl><RadioGroupItem value="Long" /></FormControl><FormLabel className="font-normal text-green-400">Long</FormLabel> </FormItem> <FormItem className="flex items-center space-x-3 space-y-0"> <FormControl><RadioGroupItem value="Short" /></FormControl><FormLabel className="font-normal text-red-400">Short</FormLabel> </FormItem> </RadioGroup> </FormControl><FormMessage /></FormItem> )}/>
                                     </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <FormField control={form.control} name="entryPrice" render={({ field }) => ( <FormItem><FormLabel>Entry Price</FormLabel><FormControl><Input type="number" placeholder="69000.0" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                          <FormField control={form.control} name="stopLoss" render={({ field }) => ( <FormItem><FormLabel>Stop Loss</FormLabel><FormControl><Input type="number" placeholder="68500.0" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                          <FormField control={form.control} name="takeProfit" render={({ field }) => ( <FormItem><FormLabel>Take Profit (Optional)</FormLabel><FormControl><Input type="number" placeholder="71000.0" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                      </div>
                                </CardContent>
                            </Card>
                             <Card className="bg-muted/30 border-border/50">
                                <CardHeader>
                                    <CardTitle>Risk & Sizing</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <FormField control={form.control} name="leverage" render={({ field }) => ( <FormItem><FormLabel>Leverage</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={form.control} name="riskPercent" render={({ field }) => ( <FormItem><FormLabel>Risk (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={form.control} name="accountCapital" render={({ field }) => ( <FormItem><FormLabel>Account Capital ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                </CardContent>
                            </Card>
                             <Card className="bg-muted/30 border-border/50">
                                <CardHeader>
                                    <CardTitle>Rationale</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <FormField control={form.control} name="strategyId" render={({ field }) => ( <FormItem> <FormLabel>Strategy</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select a strategy from your playbook..." /></SelectTrigger></FormControl> <SelectContent> {strategies.filter(s => s.status === 'active').map(s => <SelectItem key={s.strategyId} value={s.strategyId}>{s.name}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                                     <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Trade thesis / Rationale</FormLabel><FormControl><Textarea placeholder="e.g., 'Price is retesting a key broken support level which should now act as resistance...'" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                     <FormField control={form.control} name="mindset" render={({ field }) => ( <FormItem><FormLabel>Pre-trade mindset</FormLabel><FormControl><Input placeholder="e.g., Focused, a bit anxious due to volatility" {...field} /></FormControl><FormDescription className="text-xs">Your self-reported mindset before entering. Be honest.</FormDescription><FormMessage /></FormItem> )}/>
                                </CardContent>
                            </Card>
                             {selectedStrategy && (
                                <Card className="bg-muted/30 border-border/50">
                                    <CardHeader>
                                        <CardTitle>Entry Confirmation Checklist</CardTitle>
                                        <CardDescription>Confirm your strategy's entry conditions are met.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {selectedStrategy.versions.find(v => v.isActiveVersion)?.ruleSet.entryRules.conditions.map((rule, i) => (
                                                <div key={i} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`checklist-${i}`}
                                                        checked={entryChecklist[rule] || false}
                                                        onCheckedChange={(checked) => setEntryChecklist(prev => ({ ...prev, [rule]: !!checked }))}
                                                    />
                                                    <Label htmlFor={`checklist-${i}`} className="text-sm font-normal">{rule}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* --- SIDEBAR --- */}
                        <div className="lg:col-span-1 space-y-6 sticky top-24">
                           {activeNewsRisk && (
                                <Card className="bg-muted/30 border-border/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-400" />Active News Risk Window</CardTitle>
                                        <CardDescription>{activeNewsRisk.headline}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="newsRiskAcknowledged"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl>
                                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>I understand there is an active news risk window.</FormLabel>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        {activeNewsRisk.volatilityImpact === 'High' && form.getValues('instrument').includes(activeNewsRisk.impactedCoins[0]) && (
                                            <FormField
                                                control={form.control}
                                                name="newsRiskJustification"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Why are you trading now?</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="Briefly explain your reasoning for taking this trade despite the high-impact news." {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                            <PlanSummary control={form.control} setPlanStatus={setPlanStatus} onSetModule={onSetModule} entryChecklist={entryChecklist} session={session} vixZone={riskState?.marketRisk.vixZone || 'Normal'} form={form} />
                             <MarketContext session={session} setSession={setSession} vixZone={riskState?.marketRisk.vixZone || 'Normal'} setVixZone={() => {}} />
                        </div>
                    </div>
                     <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:items-center gap-2 pt-6 border-t border-border/50">
                        <Button variant="ghost" type="button" onClick={handleSaveDraft}>Save Draft</Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    disabled={isExecuteDisabled}
                                    className="relative w-full sm:w-auto"
                                >
                                     {isSubmitting && <Loader2 className="absolute h-4 w-4 animate-spin" />}
                                    <span className={cn(isSubmitting && 'invisible')}>Execute Trade (Prototype)</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Execution (Prototype)</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This is a prototype. No real trade will be placed. A draft will be created in your journal for review.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onExecuteTrade(getValues())}>
                                        Confirm
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </form>
            </Form>
        </div>
    );
};
