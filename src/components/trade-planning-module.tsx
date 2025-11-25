
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
import { Bot, Info, CheckCircle, Circle, AlertTriangle, FileText, BarChart, ArrowRight, Gauge, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { DemoScenario } from "./dashboard-module";


interface TradePlanningModuleProps {
    onSetModule: (module: any, context?: any) => void;
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
    justification: z.string().min(10, "Justification must be at least 10 characters."),
    notes: z.string().optional(),
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

type PlanStatusType = "incomplete" | "needs_attention" | "ok";

const PlanStatus = ({ status, message }: { status: PlanStatusType, message: string }) => {
    const statusConfig = {
        incomplete: {
            label: "Incomplete",
            className: "bg-muted text-muted-foreground border-border",
            icon: Circle
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
    }, []); // Runs once on mount for simplicity. Could be triggered by storage event.
    
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

const StatusBadge = ({ status }: { status: RuleStatus }) => {
    const config = {
        "PASS": "bg-green-500/20 text-green-400 border-green-500/30",
        "WARN": "bg-amber-500/20 text-amber-400 border-amber-500/30",
        "FAIL": "bg-red-500/20 text-red-400 border-red-500/30",
        "N/A": "bg-muted text-muted-foreground border-border",
    };
    return <Badge variant="secondary" className={cn("text-xs font-mono", config[status])}>{status}</Badge>;
}

function RuleChecks({ rrr, riskPercent }: { rrr: number, riskPercent: number }) {
    
    // In a real app, this data would come from context/props
    const vixZone = (localStorage.getItem('ec_demo_scenario') === 'high_vol') ? 'Elevated' : 'Normal';
    const performanceState = (localStorage.getItem('ec_demo_scenario') === 'drawdown') ? 'drawdown' : 'stable';

    const checks: { label: string; status: RuleStatus, note: string }[] = [
        {
            label: "R:R Ratio must be >= 1.5",
            status: !rrr || rrr <= 0 ? "FAIL" : rrr < 1.5 ? "WARN" : "PASS",
            note: !rrr || rrr <= 0 ? "TP not set or invalid." : rrr < 1.5 ? "Low reward for the risk." : "Good risk/reward."
        },
        {
            label: "Risk per trade <= 2%",
            status: !riskPercent ? "N/A" : riskPercent > 3 ? "FAIL" : riskPercent > 2 ? "WARN" : "PASS",
            note: !riskPercent ? "Risk % not set." : riskPercent > 3 ? "Risk exceeds max safety limit." : riskPercent > 2 ? "Above recommended risk." : "Within risk parameters."
        },
        {
            label: "Trade only in Calm/Normal VIX",
            status: vixZone === "Extreme" ? "FAIL" : vixZone === "Elevated" ? "WARN" : "PASS",
            note: vixZone === "Elevated" ? "Market is volatile." : vixZone === "Extreme" ? "Extreme volatility." : "Market is stable."
        },
        {
            label: "Avoid trading in a drawdown",
            status: performanceState === 'drawdown' ? "WARN" : "PASS",
            note: performanceState === 'drawdown' ? "You're in a drawdown, trade with caution." : "Performance is stable."
        }
    ];

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
                                <p>{check.note}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    )
}

function PlanSummary({ control, setPlanStatus, planStatus }: { control: any, setPlanStatus: (status: PlanStatusType) => void, planStatus: PlanStatusType }) {
    const values = useWatch({ control }) as Partial<PlanFormValues>;
    const { instrument, direction, entryPrice, stopLoss, takeProfit, riskPercent, accountCapital, strategyId, justification } = values;

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
    
    const [statusMessage, setStatusMessage] = useState("Fill in all required values to continue.");

    useEffect(() => {
        // --- Calculations ---
        const isLong = direction === "Long";
        const riskPerUnit = (entryPrice && stopLoss) ? Math.abs(entryPrice - stopLoss) : 0;
        const rewardPerUnit = (takeProfit && entryPrice) ? Math.abs(takeProfit - entryPrice) : 0;
        const rrr = (riskPerUnit > 0 && rewardPerUnit > 0) ? rewardPerUnit / riskPerUnit : 0;
        
        const potentialLoss = (accountCapital && riskPercent) ? (accountCapital * riskPercent) / 100 : 0;
        const positionSize = riskPerUnit > 0 ? potentialLoss / riskPerUnit : 0;
        const potentialProfit = potentialLoss * rrr;
        
        const distanceToSl = (entryPrice && stopLoss) ? Math.abs(entryPrice - stopLoss) : 0;
        const distanceToSlPercent = entryPrice > 0 ? (distanceToSl / entryPrice) * 100 : 0;
        const distanceToTp = (takeProfit && entryPrice) ? Math.abs(takeProfit - entryPrice) : 0;
        const distanceToTpPercent = (entryPrice && takeProfit) ? (distanceToTp / entryPrice) * 100 : 0;
        
        setSummary({ rrr, positionSize, potentialLoss, potentialProfit, distanceToSl, distanceToSlPercent, distanceToTp, distanceToTpPercent });
        
        // --- Status Logic ---
        const requiredFieldsSet = instrument && direction && entryPrice && stopLoss && accountCapital && riskPercent && strategyId && justification && justification.length >= 10;

        if (!requiredFieldsSet) {
            setPlanStatus("incomplete");
            setStatusMessage("Fill in all required values to continue.");
            return;
        }

        const attentionChecks = [];
        if (rrr > 0 && rrr < 1.0) attentionChecks.push("Risk/Reward is below 1:1.");
        if (riskPercent && riskPercent > 3) attentionChecks.push("Risk per trade is over 3%.");
        if (entryPrice === stopLoss) attentionChecks.push("Stop Loss cannot be the same as entry.");

        if (attentionChecks.length > 0) {
            setPlanStatus("needs_attention");
            setStatusMessage(attentionChecks.join(" "));
            return;
        }

        setPlanStatus("ok");
        setStatusMessage("This plan looks structurally sound. Rule checks come next.");

    }, [instrument, direction, entryPrice, stopLoss, takeProfit, riskPercent, accountCapital, strategyId, justification, setPlanStatus]);

    const isLong = direction === "Long";
    const isSlSet = stopLoss && stopLoss > 0;
    const isTpSet = takeProfit && takeProfit > 0;
    const canCalcRisk = entryPrice && stopLoss && riskPercent && accountCapital;
    const isValidRrr = summary.rrr >= 1.5;

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
                <PlanStatus status={planStatus} message={statusMessage} />
                
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Numeric Summary</h3>
                    <div className="space-y-2">
                        <SummaryRow label="Pair / Direction" value={<span className={isLong ? 'text-green-400' : 'text-red-400'}>{instrument || '-'} {direction}</span>} />
                        <SummaryRow label="Entry Price" value={entryPrice && entryPrice > 0 ? entryPrice.toFixed(4) : '-'} />
                        <SummaryRow label="Stop Loss" value={isSlSet ? stopLoss?.toFixed(4) : <span className="text-red-400">Not set</span>} />
                        {isSlSet && entryPrice && (
                             <p className="text-xs text-muted-foreground text-right -mt-1">
                                Distance: ${summary.distanceToSl.toFixed(4)} ({summary.distanceToSlPercent.toFixed(2)}%)
                            </p>
                        )}
                        <SummaryRow label="Take Profit" value={isTpSet ? takeProfit?.toFixed(4) : 'Not set'} />
                         {isTpSet && entryPrice && (
                             <p className="text-xs text-muted-foreground text-right -mt-1">
                                Distance: ${summary.distanceToTp.toFixed(4)} ({summary.distanceToTpPercent.toFixed(2)}%)
                            </p>
                        )}
                    </div>
                </div>
                
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

                <RuleChecks rrr={summary.rrr} riskPercent={riskPercent || 0} />
                
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

export function TradePlanningModule({ onSetModule }: TradePlanningModuleProps) {
    const { toast } = useToast();
    const [planStatus, setPlanStatus] = useState<PlanStatusType>("incomplete");
    
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
            justification: "",
            entryPrice: undefined,
            stopLoss: undefined,
            takeProfit: undefined,
        },
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
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
        }
    }, [form, toast]);
    
    const entryType = useWatch({
        control: form.control,
        name: 'entryType',
    });

    const onSubmit = (values: PlanFormValues) => {
        console.log("Proceeding to review step (prototype):", values);
        // Here you would set an internal substep to 'review'
    };

    const handleSaveDraft = () => {
        const values = form.getValues();
        localStorage.setItem("ec_trade_plan_draft", JSON.stringify(values));
        toast({
            title: "Plan saved as draft",
            description: "Your current trade plan has been saved locally.",
        });
    };

    const proceedButton = (
         <Button type="submit" disabled={planStatus === 'incomplete'}>
            Proceed to Review (Step 2)
        </Button>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Trade Planning</h1>
                    <p className="text-muted-foreground">The heart of disciplined trading inside EdgeCipher.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="border-primary/50 bg-primary/20 text-primary">Step 1 – Plan</Badge>
                    <Badge variant="outline">Step 2 – Review</Badge>
                    <Badge variant="outline">Step 3 – Execute</Badge>
                </div>
            </div>

            <Alert variant="default" className="bg-muted/30 border-border/50">
                <FileText className="h-4 w-4" />
                <AlertDescription>
                    Every trade must start here. No plan = no trade. This checklist ensures you have a reason for every action.
                </AlertDescription>
            </Alert>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                        <Card className="lg:col-span-2 bg-muted/30 border-border/50">
                            <CardHeader>
                                <CardTitle>Plan details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
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
                                </div>

                                <Separator />
                                
                                {/* Group D */}
                                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground">Strategy & Reasoning</h3>
                                    <FormField control={form.control} name="strategyId" render={({ field }) => (
                                        <FormItem><FormLabel>Strategy</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select from your playbook"/></SelectTrigger></FormControl><SelectContent>{mockStrategies.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="justification" render={({ field }) => (
                                        <FormItem><FormLabel>Justification</FormLabel><FormControl><Textarea placeholder="Why are you taking this trade? What conditions must be true?" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="notes" render={({ field }) => (
                                        <FormItem><FormLabel>Extra Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any extra details, context, or things to watch out for." {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="lg:col-span-1 space-y-6 sticky top-24">
                            <PlanSummary control={form.control} setPlanStatus={setPlanStatus} planStatus={planStatus} />
                            <Card className="bg-muted/30 border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Arjun's Pre-Flight Check</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Arjun will review your plan against your historical performance, risk rules, and current market volatility.</p>
                                    <p className="text-xs text-muted-foreground italic">In a real app, this step would involve a backend call to check against your data.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                     <div className="mt-8 p-4 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">Step 1 of 3: Plan your trade.</p>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" type="button" onClick={handleSaveDraft}>Save as draft (Prototype)</Button>
                            
                            {planStatus === 'needs_attention' ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            {proceedButton}
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                This plan violates basic risk hygiene.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                proceedButton
                            )}
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
