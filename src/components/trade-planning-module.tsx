
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface TradePlanningModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const planSchema = z.object({
    instrument: z.string().min(1, "Instrument is required."),
    direction: z.enum(["Long", "Short"]),
    entryPrice: z.coerce.number().positive("Entry must be a positive number."),
    stopLoss: z.coerce.number().positive("Stop Loss must be a positive number."),
    targetPrice: z.coerce.number().positive("Target must be a positive number."),
    riskPercentage: z.coerce.number().optional(),
    notes: z.string().optional(),
});

type PlanFormValues = z.infer<typeof planSchema>;

const mockPlans: (PlanFormValues & { status: "Planned" | "Executed" | "Cancelled", rrr: number })[] = [
    { instrument: 'BTC-PERP', direction: 'Long', entryPrice: 68000, stopLoss: 67500, targetPrice: 70000, status: 'Planned', rrr: 4.0 },
    { instrument: 'ETH-PERP', direction: 'Short', entryPrice: 3600, stopLoss: 3650, targetPrice: 3400, status: 'Executed', rrr: 4.0 },
    { instrument: 'SOL-PERP', direction: 'Long', entryPrice: 165, stopLoss: 160, targetPrice: 175, status: 'Cancelled', rrr: 2.0 },
];

function RRRDisplay({ control }: { control: any }) {
    const [entry, sl, tp] = useWatch({
        control,
        name: ["entryPrice", "stopLoss", "targetPrice"],
    });

    const [rrr, setRrr] = useState<number | null>(null);

    useEffect(() => {
        const entryPrice = parseFloat(entry);
        const stopLoss = parseFloat(sl);
        const targetPrice = parseFloat(tp);

        if (entryPrice > 0 && stopLoss > 0 && targetPrice > 0 && stopLoss !== entryPrice) {
            const risk = Math.abs(entryPrice - stopLoss);
            const reward = Math.abs(targetPrice - entryPrice);
            setRrr(reward / risk);
        } else {
            setRrr(null);
        }
    }, [entry, sl, tp]);

    if (rrr === null) {
        return <p className="text-sm text-muted-foreground h-10 flex items-center">-</p>;
    }

    return (
        <div className={cn("h-10 flex items-center font-mono font-semibold", rrr < 1 ? "text-red-500" : "text-green-500")}>
            {rrr.toFixed(2)} : 1
        </div>
    );
}

export function TradePlanningModule({ onSetModule }: TradePlanningModuleProps) {
    const [plans, setPlans] = useState(mockPlans);

    const form = useForm<PlanFormValues>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            direction: "Long",
        },
    });

    const onSubmit = (values: PlanFormValues) => {
        const risk = Math.abs(values.entryPrice - values.stopLoss);
        const reward = Math.abs(values.targetPrice - values.entryPrice);
        const newPlan = {
            ...values,
            status: "Planned" as const,
            rrr: risk > 0 ? reward / risk : 0,
        };
        setPlans(prev => [newPlan, ...prev]);
        form.reset();
    };
    
    const askArjun = () => {
        const values = form.getValues();
        const { instrument, direction, entryPrice, stopLoss, targetPrice } = values;
        if (instrument && entryPrice && stopLoss && targetPrice) {
            const question = `Arjun, can you review this trade plan for me? Plan: ${direction} ${instrument} from ${entryPrice}, with a stop-loss at ${stopLoss} and a target at ${targetPrice}. Does this align with my rules and current market conditions?`;
            onSetModule('aiCoaching', { initialMessage: question });
        } else {
            // In a real app, use toast here
            alert("Please fill in Instrument, Entry, SL, and TP to ask Arjun.");
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Trade Planning</h1>
                <p className="text-muted-foreground">Define your trades before you take them. Discipline starts here.</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {/* Open Plans List */}
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>Open Trade Plans</CardTitle>
                            <CardDescription>Your currently active and recently closed trade ideas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Instrument</TableHead>
                                        <TableHead>Direction</TableHead>
                                        <TableHead>Entry</TableHead>
                                        <TableHead>SL</TableHead>
                                        <TableHead>TP</TableHead>
                                        <TableHead>R:R</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {plans.map((plan, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-mono">{plan.instrument}</TableCell>
                                            <TableCell className={cn(plan.direction === 'Long' ? 'text-green-400' : 'text-red-400')}>{plan.direction}</TableCell>
                                            <TableCell className="font-mono">{plan.entryPrice}</TableCell>
                                            <TableCell className="font-mono">{plan.stopLoss}</TableCell>
                                            <TableCell className="font-mono">{plan.targetPrice}</TableCell>
                                            <TableCell className="font-mono">{plan.rrr.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={plan.status === 'Planned' ? 'default' : 'secondary'} className={cn(
                                                    plan.status === 'Planned' && 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                                                    plan.status === 'Executed' && 'bg-green-500/20 text-green-400 border-green-500/30',
                                                    plan.status === 'Cancelled' && 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                                                )}>
                                                    {plan.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                
                {/* New Plan Form */}
                <Card className="lg:col-span-1 bg-muted/30 border-border/50 sticky top-24">
                     <CardHeader>
                        <CardTitle>Create New Plan</CardTitle>
                        <CardDescription>Think before you click.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="instrument" render={({ field }) => (
                                    <FormItem><FormLabel>Instrument</FormLabel><FormControl><Input placeholder="e.g., BTC-PERP" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="direction" render={({ field }) => (
                                    <FormItem><FormLabel>Direction</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex pt-1"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Long" /></FormControl><FormLabel className="font-normal">Long</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Short" /></FormControl><FormLabel className="font-normal">Short</FormLabel></FormItem></RadioGroup></FormControl></FormItem>
                                )} />
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField control={form.control} name="entryPrice" render={({ field }) => (
                                        <FormItem><FormLabel>Entry</FormLabel><FormControl><Input type="number" placeholder="68000" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="stopLoss" render={({ field }) => (
                                        <FormItem><FormLabel>Stop Loss</FormLabel><FormControl><Input type="number" placeholder="67500" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="targetPrice" render={({ field }) => (
                                        <FormItem><FormLabel>Target</FormLabel><FormControl><Input type="number" placeholder="70000" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div>
                                    <FormLabel>Calculated R:R</FormLabel>
                                    <RRRDisplay control={form.control} />
                                </div>
                                <FormField control={form.control} name="riskPercentage" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            Risk % (Optional)
                                            <TooltipProvider>
                                                <Tooltip delayDuration={0}>
                                                    <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                                    <TooltipContent><p>Percentage of your total capital to risk on this trade.</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 1" {...field} className="font-mono" /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="notes" render={({ field }) => (
                                    <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Why this trade? What's the setup? (e.g., 'Key support bounce, confirmation on 1H')" {...field} /></FormControl></FormItem>
                                )} />
                                
                                <Separator className="!my-6" />

                                <div className="space-y-3">
                                    <Button type="submit" className="w-full">Save Plan (Prototype)</Button>
                                    <Button type="button" variant="outline" className="w-full" onClick={askArjun}>
                                        <Bot className="mr-2 h-4 w-4" />
                                        Ask Arjun about this plan
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
