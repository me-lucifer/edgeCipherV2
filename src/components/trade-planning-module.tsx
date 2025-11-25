
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
import { Bot, Info, CheckCircle, Circle, AlertTriangle, FileText, BarChart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface TradePlanningModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const planSchema = z.object({
    instrument: z.string().min(1, "Required."),
    direction: z.enum(["Long", "Short"]),
    entryType: z.enum(["Market", "Limit"]),
    entryPrice: z.coerce.number().positive("Must be > 0."),
    stopLoss: z.coerce.number().positive("Must be > 0."),
    takeProfit: z.coerce.number().positive("Must be > 0."),
    leverage: z.coerce.number().min(1).max(100),
    accountCapital: z.coerce.number().positive("Must be > 0."),
    riskPercent: z.coerce.number().min(0.1).max(100),
    strategyId: z.string().min(1, "Required."),
    justification: z.string().min(10, "Min 10 characters."),
    notes: z.string().optional(),
}).refine(data => {
    if (data.direction === 'Long' && data.entryPrice > 0) return data.stopLoss < data.entryPrice && data.takeProfit > data.entryPrice;
    return true;
}, {
    message: "For Longs, SL must be below Entry, and TP must be above.",
    path: ["stopLoss"],
}).refine(data => {
    if (data.direction === 'Short' && data.entryPrice > 0) return data.stopLoss > data.entryPrice && data.takeProfit < data.entryPrice;
    return true;
}, {
    message: "For Shorts, SL must be above Entry, and TP must be below.",
    path: ["stopLoss"],
});


type PlanFormValues = z.infer<typeof planSchema>;

const mockStrategies = [
    { id: '1', name: "London Reversal" },
    { id: '2', name: "BTC Trend Breakout" },
];

function PlanSummary({ control }: { control: any }) {
    const values = useWatch({ control }) as Partial<PlanFormValues>;
    const { instrument, direction, entryPrice, stopLoss, takeProfit, riskPercent, accountCapital } = values;

    const [summary, setSummary] = useState({ rrr: 0, positionSize: 0, potentialLoss: 0, potentialProfit: 0 });

    useEffect(() => {
        if (entryPrice && stopLoss && takeProfit && riskPercent && accountCapital) {
            const riskPerUnit = Math.abs(entryPrice - stopLoss);
            const rewardPerUnit = Math.abs(takeProfit - entryPrice);
            const rrr = riskPerUnit > 0 ? rewardPerUnit / riskPerUnit : 0;
            
            const potentialLoss = (accountCapital * riskPercent) / 100;
            const positionSize = riskPerUnit > 0 ? potentialLoss / riskPerUnit : 0;
            const potentialProfit = potentialLoss * rrr;
            
            setSummary({ rrr, positionSize, potentialLoss, potentialProfit });
        } else {
            setSummary({ rrr: 0, positionSize: 0, potentialLoss: 0, potentialProfit: 0 });
        }
    }, [entryPrice, stopLoss, takeProfit, riskPercent, accountCapital]);

    const isLong = direction === "Long";
    const isValidRrr = summary.rrr >= 1.5;

    return (
        <Card className="bg-muted/30 border-primary/20">
            <CardHeader>
                <CardTitle>Plan Summary & Checks</CardTitle>
                <CardDescription>Live calculation based on your inputs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1"><p className="text-muted-foreground">Instrument</p><p className="font-semibold text-foreground font-mono">{instrument || '-'}</p></div>
                    <div className="space-y-1"><p className="text-muted-foreground">Direction</p><p className={cn("font-semibold font-mono", isLong ? 'text-green-400' : 'text-red-400')}>{direction || '-'}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Risk/Reward</p>
                        <p className={cn("font-semibold font-mono", isValidRrr ? 'text-green-400' : 'text-amber-400')}>{summary.rrr > 0 ? `${summary.rrr.toFixed(2)} : 1` : '-'}</p>
                        {!isValidRrr && summary.rrr > 0 && <p className="text-xs text-amber-500">R:R is below the recommended 1.5:1</p>}
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Position Size</p>
                        <p className="font-semibold text-foreground font-mono">{summary.positionSize > 0 ? summary.positionSize.toFixed(4) : '-'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Potential Loss</p>
                        <p className="font-semibold text-red-400 font-mono">-${summary.potentialLoss > 0 ? summary.potentialLoss.toFixed(2) : '0.00'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Potential Profit</p>
                        <p className="font-semibold text-green-400 font-mono">+${summary.potentialProfit > 0 ? summary.potentialProfit.toFixed(2) : '0.00'}</p>
                    </div>
                </div>
                <Alert className="mt-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Prototype Calculation</AlertTitle>
                    <AlertDescription>
                        This is a simplified calculation. The final version will account for fees and slippage.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}

export function TradePlanningModule({ onSetModule }: TradePlanningModuleProps) {
    const form = useForm<PlanFormValues>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            direction: "Long",
            entryType: "Limit",
            leverage: 10,
            accountCapital: 10000,
            riskPercent: 1,
            strategyId: '1',
            instrument: "BTC-PERP",
            justification: "",
        },
    });
    
    const entryType = useWatch({
        control: form.control,
        name: 'entryType',
    });

    const onSubmit = (values: PlanFormValues) => {
        console.log("Plan submitted (prototype):", values);
        // Here you would save the plan and move to step 2
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Trade Planning</h1>
                    <p className="text-muted-foreground">The heart of disciplined trading inside EdgeCipher.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="border-primary/50 bg-primary/20 text-primary">Step 1 - Plan</Badge>
                    <Badge variant="outline">Step 2 - Review</Badge>
                    <Badge variant="outline">Step 3 - Execute</Badge>
                </div>
            </div>

            <Alert variant="default" className="bg-muted/30 border-border/50">
                <FileText className="h-4 w-4" />
                <AlertDescription>
                    Every trade must start here. No plan = no trade. This checklist ensures you have a reason for every action.
                </AlertDescription>
            </Alert>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8 items-start">
                    <Card className="lg:col-span-2 bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>Plan Details</CardTitle>
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
                                        <FormItem><FormLabel>Direction</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex pt-2 gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Long" /></FormControl><FormLabel className="font-normal">Long</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Short" /></FormControl><FormLabel className="font-normal">Short</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="entryType" render={({ field }) => (
                                        <FormItem><FormLabel>Entry Type</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex pt-2 gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Limit" /></FormControl><FormLabel className="font-normal">Limit</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Market" /></FormControl><FormLabel className="font-normal">Market</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                            </div>

                            {/* Group B */}
                            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground">Risk Anchors</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {entryType === 'Limit' ? (
                                        <FormField control={form.control} name="entryPrice" render={({ field }) => (
                                            <FormItem><FormLabel>Entry Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
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
                                        <FormItem><FormLabel>Stop Loss Price (SL)*</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="takeProfit" render={({ field }) => (
                                        <FormItem><FormLabel>Take Profit Price (TP)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                            </div>
                            
                            {/* Group C */}
                            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground">Account & Risk</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="accountCapital" render={({ field }) => (
                                        <FormItem><FormLabel>Account Capital ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="riskPercent" render={({ field }) => (
                                        <FormItem><FormLabel>Risk Per Trade (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                     <FormField control={form.control} name="leverage" render={({ field }) => (
                                        <FormItem><FormLabel>Leverage</FormLabel><Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="5">5x</SelectItem><SelectItem value="10">10x</SelectItem><SelectItem value="20">20x</SelectItem><SelectItem value="50">50x</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                    )}/>
                                </div>
                            </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="strategyId" render={({ field }) => (
                                    <FormItem><FormLabel>Strategy</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select from your playbook"/></SelectTrigger></FormControl><SelectContent>{mockStrategies.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="justification" render={({ field }) => (
                                    <FormItem><FormLabel>Justification</FormLabel><FormControl><Input placeholder="Why this trade, right now?" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any extra details, context, or things to watch out for." {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-1 space-y-6 sticky top-24">
                        <PlanSummary control={form.control} />
                        <Card className="bg-muted/30 border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Arjun's Pre-Flight Check</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">Arjun will review your plan against your historical performance, risk rules, and current market volatility.</p>
                                <Button className="w-full" type="submit">
                                    Continue to Review <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </Form>
        </div>
    );
}

    