

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

// The Validation Engine
const validatePlanAgainstStrategy = (plan: PlanInputs, strategy: RuleSet, context: ValidationContext): ValidationOutput => {
    const validations: ValidationCheck[] = [];
    const { riskRules, tpRules, contextRules, entryRules } = strategy;
    
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
    
    // A.1) VIX-based leverage checks
    if (context.vixZone === 'Extreme' && plan.leverage > 5) {
        validations.push({
            ruleId: 'vixLeverageExtreme',
            title: `Leverage <= 5x in Extreme VIX`,
            status: "FAIL",
            message: `High volatility increases liquidation risk. Using >5x leverage in 'Extreme' VIX is highly discouraged.`,
            category: 'Risk & Leverage',
            fix: { type: 'SET_VALUE', payload: { field: 'leverage', value: 5 } },
        });
    } else if ((context.vixZone === 'High Volatility' || context.vixZone === 'Extreme') && plan.leverage > 10) {
         validations.push({
            ruleId: 'vixLeverageHigh',
            title: `Leverage <= 10x in High/Extreme VIX`,
            status: "WARN",
            message: `High volatility increases liquidation risk. Using >10x leverage is not recommended.`,
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
    
    if (finalVixPolicy === 'conservative' && (context.vixZone === 'Elevated' || context.vixZone === 'Extreme')) {
        vixStatus = 'WARN';
        message = `Current VIX is '${context.vixZone}', which the 'Conservative' policy suggests avoiding.`;
        fix = { type: 'SHOW_HINT', payload: { toastMessage: 'Consider switching to a strategy that performs better in high volatility.' } };
    } else if (finalVixPolicy === 'strict' && (context.vixZone !== 'Calm' && context.vixZone !== 'Normal')) {
        vixStatus = 'FAIL';
        message = `The 'Strict' policy only allows trading in 'Calm' or 'Normal' VIX, but it is currently '${context.vixZone}'.`;
        fix = { type: 'SHOW_HINT', payload: { toastMessage: 'Switch to a different strategy or wait for calmer markets.' } };
    } else if (contextRules.vixPolicy === 'avoidHigh' && (context.vixZone === 'Elevated' || context.vixZone === 'Extreme')) {
        vixStatus = 'WARN';
        message = `Strategy suggests avoiding high VIX, and current VIX is '${context.vixZone}'.`;
        fix = { type: 'SHOW_HINT', payload: { toastMessage: 'Consider switching to a strategy that performs better in high volatility.' } };
    } else if (contextRules.vixPolicy === 'onlyLowNormal' && (context.vixZone === 'Elevated' || context.vixZone === 'Extreme')) {
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
        if (vix > 50) return "Elevated";
        if (vix > 25) return "Normal";
        return "Calm";
    };

    const isHighVol = vixZone === 'Extreme' || vixZone === 'Elevated';

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
                            <SelectItem value="Calm">Calm</SelectItem>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Elevated">Elevated</SelectItem>
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
                            render={({ field }) => (
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

interface PlanStepProps {
    form: any;
    onSetModule: any;
    setPlanStatus: any;
    onApplyTemplate: (templateId: string) => void;
    isNewUser: boolean;
    currentStep: TradePlanStep;
    draftToResume: SavedDraft | null;
    onResume: () => void;
    onDiscard: () => void;
    entryChecklist: Record<string, boolean>;
    setEntryChecklist: (checklist: Record<string, boolean>) => void;
    session: "Asia" | "London" | "New York";
    setSession: (s: "Asia" | "London" | "New York") => void;
    vixZone: VixZone;
    setVixZone: (z: VixZone) => void;
}

const getStrategyHealth = (strategy: Strategy) => {
    // This is mock logic. In a real app, this would be computed from analytics data.
    const usage = strategy.versions.reduce((sum, v) => sum + v.usageCount, 0);
    if (usage === 0) return "Needs Work";
    if (strategy.strategyId === 'strat_1') return "Healthy";
    if (strategy.strategyId === 'strat_2') return "Needs Work";
    return "Risky";
};

const getRecommendedStatus = (strategy: Strategy, context: { instrument: string, session: string }) => {
    if (strategy.name.toLowerCase().includes(context.instrument.split('-')[0].toLowerCase())) {
        return "Symbol Match";
    }
    const activeVersion = strategy.versions.find(v => v.isActiveVersion);
    if (activeVersion?.ruleSet.contextRules.allowedSessions.includes(context.session)) {
        return "Session Match";
    }
    return null;
}

function PlanStep({ form, onSetModule, setPlanStatus, onApplyTemplate, isNewUser, currentStep, draftToResume, onResume, onDiscard, entryChecklist, setEntryChecklist, session, setSession, vixZone, setVixZone }: PlanStepProps) {
    const entryType = useWatch({ control: form.control, name: 'entryType' });
    const strategyId = useWatch({ control: form.control, name: 'strategyId' });
    const instrument = useWatch({ control: form.control, name: 'instrument' });
    const { toast } = useToast();
    
    const [selectedTemplate, setSelectedTemplate] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("ec_trade_plan_last_template") || 'blank';
        }
        return 'blank';
    });
    
    const [isStrategyDrawerOpen, setIsStrategyDrawerOpen] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [availableStrategies, setAvailableStrategies] = useState<Strategy[]>([]);
    const [showArchivedWarning, setShowArchivedWarning] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("ec_strategies");
            if (stored) {
                try {
                    const allStrategies: Strategy[] = JSON.parse(stored);
                    const activeStrategies = allStrategies.filter(s => s.status === 'active');
                    setAvailableStrategies(activeStrategies);

                    const currentStrategyId = form.getValues('strategyId');
                    if (currentStrategyId && !activeStrategies.some(s => s.strategyId === currentStrategyId)) {
                        setShowArchivedWarning(true);
                    }

                } catch(e) { console.error("Could not parse strategies", e); }
            }
        }
    }, [form]);

    const viewedStrategy = availableStrategies.find(s => s.strategyId === strategyId) || null;
    const activeVersion = viewedStrategy?.versions.find(v => v.isActiveVersion);

    useEffect(() => {
        if (strategyId && availableStrategies.length > 0) {
            const strategy = availableStrategies.find(s => s.strategyId === strategyId);
            if (!strategy) {
                 setShowArchivedWarning(true);
                 return;
            };
            setShowArchivedWarning(false);
            const activeRuleset = strategy.versions.find(v => v.isActiveVersion)?.ruleSet;
            if (!activeRuleset) return;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [strategyId, availableStrategies]);

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        onApplyTemplate(templateId);
    };

    const handleCheckRule = (rule: string, isChecked: boolean) => {
        setEntryChecklist({
            ...entryChecklist,
            [rule]: isChecked,
        });
    };

    const handleStrategySelect = (stratId: string) => {
        const selectedStrat = availableStrategies.find(s => s.strategyId === stratId);
        if (!selectedStrat) return;

        const activeRuleset = selectedStrat.versions.find(v => v.isActiveVersion)?.ruleSet;
        if (!activeRuleset) return;

        form.setValue('strategyId', stratId, { shouldValidate: true });
        form.setValue('riskPercent', activeRuleset.riskRules.riskPerTradePct, { shouldValidate: true });
        form.setValue('leverage', activeRuleset.riskRules.leverageCap, { shouldValidate: true });
        setIsSelectorOpen(false);

        toast({
            title: "Strategy Defaults Applied",
            description: `Risk set to ${activeRuleset.riskRules.riskPerTradePct}% and Leverage to ${activeRuleset.riskRules.leverageCap}x.`,
        });
    }
    const selectedStrategyForDisplay = availableStrategies.find(s => s.strategyId === strategyId);

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
                            {showArchivedWarning && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Strategy Archived</AlertTitle>
                                    <AlertDescription>
                                        The strategy previously selected for this plan has been archived. Please select an active strategy to proceed.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-end gap-2">
                                 <FormField control={form.control} name="strategyId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Strategy*</FormLabel>
                                        <Popover open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {selectedStrategyForDisplay
                                                            ? selectedStrategyForDisplay.name
                                                            : "Select from your playbook"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                                                <Command>
                                                    <CommandInput placeholder="Search strategy..." />
                                                    <CommandEmpty>No strategy found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandList>
                                                        {availableStrategies.map(strategy => {
                                                            const health = getStrategyHealth(strategy);
                                                            const activeVersion = strategy.versions.find(v => v.isActiveVersion);
                                                            const recommendation = getRecommendedStatus(strategy, { instrument, session });

                                                            const minRR = activeVersion?.ruleSet?.tpRules.minRR;
                                                            const maxTrades = activeVersion?.ruleSet?.riskRules.maxDailyTrades;
                                                            const vixPolicy = activeVersion?.ruleSet?.contextRules.vixPolicy;

                                                            return (
                                                                <CommandItem
                                                                    value={strategy.name}
                                                                    key={strategy.strategyId}
                                                                    onSelect={() => handleStrategySelect(strategy.strategyId)}
                                                                >
                                                                    <div className="flex flex-col gap-2 w-full">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <p className="font-semibold">{strategy.name} <span className="text-xs text-muted-foreground">v{activeVersion?.versionNumber}</span></p>
                                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                                    {recommendation && <Badge className="text-xs bg-primary/10 text-primary">{recommendation}</Badge>}
                                                                                    <Badge variant="outline" className="text-xs">{strategy.type}</Badge>
                                                                                    {strategy.timeframes.map(tf => <Badge key={tf} variant="secondary" className="text-xs">{tf}</Badge>)}
                                                                                </div>
                                                                            </div>
                                                                            <Badge variant={health === 'Healthy' ? 'secondary' : 'destructive'} className={cn(
                                                                                "text-xs",
                                                                                health === 'Healthy' && 'bg-green-500/10 text-green-400 border-green-500/20',
                                                                                health === 'Needs Work' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                                                                                health === 'Risky' && 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                            )}>{health}</Badge>
                                                                        </div>
                                                                         <div className="flex flex-wrap items-center gap-2">
                                                                            {minRR && <Badge variant="outline" className="text-xs">RR ≥ {minRR}</Badge>}
                                                                            {maxTrades && <Badge variant="outline" className="text-xs">Max {maxTrades} trades/day</Badge>}
                                                                            {vixPolicy === 'avoidHigh' && <Badge variant="outline" className="text-xs">Avoid High VIX</Badge>}
                                                                        </div>
                                                                    </div>
                                                                    <Check className={cn("ml-auto h-4 w-4", field.value === strategy.strategyId ? "opacity-100" : "opacity-0")} />
                                                                </CommandItem>
                                                            )
                                                        })}
                                                        </CommandList>
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <Button type="button" variant="outline" size="sm" onClick={() => setIsStrategyDrawerOpen(true)} disabled={!strategyId}>
                                    View Details
                                </Button>
                            </div>

                            {activeVersion && (
                                <Alert variant="default" className="bg-muted/50 border-border/50">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <AlertDescription className="text-xs">
                                        This strategy is tuned for <strong className="text-foreground">{activeVersion.ruleSet.contextRules.allowedSessions.join(', ')}</strong> sessions with a <strong className="text-foreground">{activeVersion.ruleSet.contextRules.vixPolicy}</strong> VIX policy.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <StrategyGuardrailChecklist strategyId={strategyId} onSetModule={onSetModule} checkedRules={entryChecklist} onCheckRule={handleCheckRule} />

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
                <PlanSummary control={form.control} setPlanStatus={setPlanStatus} onSetModule={onSetModule} entryChecklist={entryChecklist} session={session} vixZone={vixZone} form={form} />
                 <Card className="bg-muted/30 border-border/50">
                    <CardContent className="p-4">
                         <MarketContext session={session} setSession={setSession} vixZone={vixZone} setVixZone={setVixZone} />
                    </CardContent>
                </Card>
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
    
    // ... other components remain the same ...
    
    // Re-adding the full file content with the change integrated.
    
    function ExecutionOptions({ form, onSetModule, executionHeadingRef, validationResult, entryChecklist }: { form: any, onSetModule: (module: any, context?: any) => void; executionHeadingRef: React.Ref<HTMLDivElement>; validationResult: ValidationOutput | null, entryChecklist: Record<string, boolean> }) {
        const [executionType, setExecutionType] = useState<"Market" | "Limit">("Market");
        const [isExecuting, setIsExecuting] = useState(false);
        const [executionResult, setExecutionResult] = useState<{ tradeId: string, draftId: string } | null>(null);
        const { addLog } = useEventLog();
        const { toast } = useToast();
        const { incrementTrades, incrementOverrides } = useDailyCounters();
    
        const values = form.getValues() as PlanFormValues;
        const { entryPrice, stopLoss, riskPercent, accountCapital, instrument, justification } = values;
    
        const riskPerUnit = (entryPrice && stopLoss) ? Math.abs(entryPrice - stopLoss) : 0;
        const potentialLoss = (accountCapital && riskPercent) ? (accountCapital * riskPercent) / 100 : 0;
        const positionSize = riskPerUnit > 0 ? potentialLoss / riskPerUnit : 0;
        
        const handleExecute = () => {
            setIsExecuting(true);
            addLog("Executing trade plan (prototype)...");
    
            incrementTrades(values.strategyId);

            if(justification && justification.length > 0){
                incrementOverrides();
                localStorage.setItem('ec_override_used_flag', justification);
            }
    
            // Update strategy usage
            if (typeof window !== "undefined") {
                try {
                    const strategies: Strategy[] = JSON.parse(localStorage.getItem("ec_strategies") || "[]");
                    const now = new Date().toISOString();
                    const updatedStrategies = strategies.map(s => {
                        if (s.strategyId === values.strategyId) {
                            const activeVersionIndex = s.versions.findIndex(v => v.isActiveVersion);
                            if (activeVersionIndex !== -1) {
                                s.versions[activeVersionIndex].usageCount += 1;
                                s.versions[activeVersionIndex].lastUsedAt = now;
                            }
                            return { ...s, lastUsedAt: now };
                        }
                        return s;
                    });
                    localStorage.setItem("ec_strategies", JSON.stringify(updatedStrategies));
                } catch (e) {
                    console.error("Failed to update strategy usage", e);
                }
            }
            
            setTimeout(() => {
                const tradeId = `DELTA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const draftId = `draft-${Date.now()}`;
                
                const rrr = (() => {
                    const rewardPerUnit = (values.takeProfit && values.entryPrice) ? Math.abs(values.takeProfit - values.entryPrice) : 0;
                    return (riskPerUnit > 0 && rewardPerUnit > 0) ? rewardPerUnit / riskPerUnit : 0;
                })();
                
                const strategies: Strategy[] = JSON.parse(localStorage.getItem("ec_strategies") || "[]");
                const strategyName = strategies.find(s => s.strategyId === values.strategyId)?.name || "Unknown";
    
                const ruleAdherenceSummary: JournalEntry['meta']['ruleAdherenceSummary'] = {
                    followedEntryRules: (validationResult?.validations.find(v => v.ruleId === 'entryConfirmation')?.status === 'PASS'),
                    movedSL: false, // This would be determined post-trade
                    exitedEarly: false, // This would be determined post-trade
                    rrBelowMin: (validationResult?.validations.find(v => v.ruleId === 'minRR')?.status !== 'PASS'),
                };
    
                let mistakes = [];
                if (values.justification) {
                    mistakes.push('Override');
                }
    
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
                        mistakesTags: mistakes.join(','),
                    },
                    meta: {
                        ruleAdherenceSummary: ruleAdherenceSummary,
                    },
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
    
    function ExecuteStep({ form, onSetModule, onSetStep, planStatus, executionHeadingRef, validationResult, entryChecklist }: { form: any, onSetModule: any, onSetStep: (step: TradePlanStep) => void; planStatus: PlanStatusType, executionHeadingRef: React.Ref<HTMLDivElement>, validationResult: ValidationOutput | null, entryChecklist: Record<string, boolean> }) {
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
                <ExecutionOptions form={form} onSetModule={onSetModule} executionHeadingRef={executionHeadingRef} validationResult={validationResult} entryChecklist={entryChecklist} />
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
                vixZone,
                allEntryRulesChecked: true, // Assume checked for snapshot
                tempVolatilityPolicy: "follow", // Assume default
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
                        <h3 className="text-sm font-semibold text-foreground mb-3">Rulebook Firewall</h3>
                        <div className="space-y-3">
                            {validationResult.validations.map((check, i) => (
                                <RuleCheckRow key={i} check={check} onFix={() => {}} /> // onFix is no-op in snapshot
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
    
    const SummaryRow = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
        <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">{label}</p>
            <p className={cn("font-mono font-semibold", className)}>{value}</p>
        </div>
    );

    function RiskNudge({ nudge }: { nudge: ActiveNudge | null }) {
        const [isVisible, setIsVisible] = useState(false);
    
        useEffect(() => {
            if (nudge) {
                setIsVisible(true);
                localStorage.setItem('ec_last_risk_nudge_id', nudge.id);
            }
        }, [nudge]);
    
        if (!nudge || !isVisible) {
            return null;
        }
    
        const severityConfig = {
            warn: {
                icon: AlertTriangle,
                className: "bg-amber-950/40 border-amber-500/20 text-amber-300",
                titleClass: "text-amber-400"
            },
            info: {
                icon: Info,
                className: "bg-blue-950/40 border-blue-500/20 text-blue-300",
                titleClass: "text-blue-400"
            },
        };
        
        const config = severityConfig[nudge.severity];
        const Icon = config.icon;
    
        return (
            <Alert variant="default" className={cn(config.className, "animate-in fade-in")}>
                <Icon className="h-4 w-4" />
                <AlertTitle className={config.titleClass}>{nudge.title}</AlertTitle>
                <AlertDescription>{nudge.message}</AlertDescription>
            </Alert>
        );
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
        const [entryChecklist, setEntryChecklist] = useState<Record<string, boolean>>({});
        
        const { riskState } = useRiskState();
        const [justificationOverride, setJustificationOverride] = useState(false);
        const [yellowAcknowledge, setYellowAcknowledge] = useState(false);

        // Context states
        const [session, setSession] = useState<'Asia' | 'London' | 'New York'>('New York');
        const [vixZone, setVixZone] = useState<VixZone>('Normal');
    
    
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

        const canProceedToReview = useMemo(() => {
            if (planStatus === 'incomplete') return false;
            
            const riskLevel = riskState?.decision.level;

            if (riskLevel === 'red') {
                return justificationOverride && justificationValue && justificationValue.length > 0;
            }
            if (riskLevel === 'yellow') {
                return yellowAcknowledge;
            }
            if (planStatus === 'FAIL') {
                return justificationValue && justificationValue.length > 0;
            }

            return true;
        }, [planStatus, riskState, justificationOverride, justificationValue, yellowAcknowledge]);
        
        const canProceedToExecution = canProceedToReview && arjunFeedbackAccepted;
    
        useEffect(() => {
            const timer = setTimeout(() => {
                setIsPlanningLoading(false);
            }, 1000);
    
            if (typeof window !== "undefined") {
                const scenario = localStorage.getItem('ec_demo_scenario') as DemoScenario | null;
                setIsNewUser(scenario === 'no_positions');
                
                const recovery = localStorage.getItem('ec_recovery_mode') === 'true';
                setIsRecoveryMode(recovery);
                
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
                let contextToUse = planContext;
                if (storedContext) {
                    try {
                        contextToUse = JSON.parse(storedContext);
                        localStorage.removeItem('ec_trade_planning_context');
                    } catch (e) {}
                }
    
                if (contextToUse) {
                    setInitialContext(contextToUse);
                    form.setValue('instrument', contextToUse.instrument);
                    if (contextToUse.direction) {
                        form.setValue('direction', contextToUse.direction);
                    }
                    if (contextToUse.safeMode || recovery) {
                        form.setValue('riskPercent', 0.5);
                        form.setValue('leverage', 10);
                        toast({ title: 'Safe Mode Activated', description: "Default risk has been reduced to 0.5%." });
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
    
        const riskDecisionLevel = riskState?.decision.level;
        let isProceedDisabled = currentStep === 'plan' ? !canProceedToReview :
                                  currentStep === 'review' ? !canProceedToExecution :
                                  false;
        
        const isBlocked = (planStatus === 'FAIL' && (!justificationValue || justificationValue.length === 0)) || (riskDecisionLevel === 'red' && (!justificationOverride || !justificationValue || justificationValue.length === 0));

        const isBannerVisible = showBanner && isBlocked;
    
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
                            {initialContext?.origin === 'Chart Module' && (
                                <Button variant="ghost" size="sm" className="text-muted-foreground -ml-4" onClick={() => onSetModule('chart')}>
                                    <ArrowLeft className="mr-2 h-4 w-4"/>
                                    Back to Chart
                                </Button>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Trade Planning</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <p className="text-muted-foreground">This is where every disciplined trade begins.</p>
                            <Badge variant="outline" className={cn(planStatus === 'FAIL' && 'border-destructive text-destructive', planStatus === 'WARN' && 'border-amber-500 text-amber-500', planStatus === 'PASS' && 'border-green-500 text-green-500', 'capitalize')}>
                                Strategy: {planStatus}
                            </Badge>
                            {riskState && (
                                <Badge variant="outline" className={cn(riskState.decision.level === 'red' && 'border-destructive text-destructive', riskState.decision.level === 'yellow' && 'border-amber-500 text-amber-500', riskState.decision.level === 'green' && 'border-green-500 text-green-500', 'capitalize')}>
                                    Risk Center: {riskState.decision.level}
                                </Badge>
                            )}
                        </div>
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

                {isBlocked && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <div className="flex items-center justify-between w-full">
                            <div>
                                <AlertTitle>Execution Blocked</AlertTitle>
                                <AlertDescription>
                                    This trade plan is blocked by the Rulebook Firewall or Risk Center. Review the violations below and either fix them or provide a justification to override.
                                </AlertDescription>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowValidationBanner(false)}>
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
    
                        {currentStep === "plan" && <PlanStep form={form} onSetModule={onSetModule} setPlanStatus={setPlanStatus} onApplyTemplate={handleApplyTemplate} isNewUser={isNewUser} currentStep={currentStep} draftToResume={draftToResume} onResume={handleResumeDraft} onDiscard={handleDiscardDraft} entryChecklist={entryChecklist} setEntryChecklist={setEntryChecklist} session={session} setSession={setSession} vixZone={vixZone} setVixZone={setVixZone} />}
                        {currentStep === "review" && <ReviewStep form={form} onSetModule={onSetModule} onSetStep={setCurrentStep} arjunFeedbackAccepted={arjunFeedbackAccepted} setArjunFeedbackAccepted={setArjunFeedbackAccepted} planStatus={planStatus} reviewHeadingRef={reviewHeadingRef} />}
                        {currentStep === "execute" && <ExecuteStep form={form} onSetModule={onSetModule} onSetStep={setCurrentStep} planStatus={planStatus} executionHeadingRef={executionHeadingRef} validationResult={null} entryChecklist={entryChecklist} />}
    
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
                                                        ? (riskDecisionLevel === 'red' ? 'Justification required to override RED status.' : 'Fix validation errors or acknowledge warnings.')
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
    
    
    







