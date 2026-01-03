
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, Pencil, ShieldAlert, BarChart, Info, CheckCircle, XCircle, AlertTriangle, Gauge, Calendar, Zap, Sun, Moon, Waves, User, ArrowRight, RefreshCw } from "lucide-react";
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
import { useRiskState, type RiskState, type VixZone } from "@/hooks/use-risk-state";
import { Skeleton } from "./ui/skeleton";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";


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

const mockEvents = [
    { time: "1:30 PM EST", event: "Fed Chair Speaks", impact: "High" },
    { time: "4:00 PM EST", event: "BTC Options Expiry", impact: "Medium" },
    { time: "Tomorrow 8:30 AM EST", event: "Non-Farm Payrolls", impact: "High" },
];

function TradeDecisionBar({ decision }: { decision: RiskState['decision'] | null }) {
    const [isWhyOpen, setIsWhyOpen] = useState(false);
    
    if (!decision) return <Skeleton className="h-20 w-full" />;

    const decisionConfig = {
        green: { status: "Green / Go", icon: CheckCircle, className: "border-green-500/30 text-green-400" },
        yellow: { status: "Amber / Caution", icon: AlertTriangle, className: "border-amber-500/30 text-amber-400" },
        red: { status: "Red / No-Go", icon: XCircle, className: "border-red-500/30 text-red-400" },
    };

    const config = decisionConfig[decision.level];
    const Icon = config.icon;

    return (
        <>
            <Drawer open={isWhyOpen} onOpenChange={setIsWhyOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Reasoning for Today's Decision</DrawerTitle>
                        <DrawerDescription>Arjun aggregated these risk factors to form the recommendation.</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4">
                        <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                            {decision.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                        </ul>
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
                    <Button variant="link" onClick={() => setIsWhyOpen(true)}>Why?</Button>
                </CardContent>
            </Card>
        </>
    );
}

export function RiskCenterModule({ onSetModule }: RiskCenterModuleProps) {
    const { toast } = useToast();
    const { addLog } = useEventLog();
    const [rules, setRules] = useState<RiskRule[]>(defaultRules);
    const [editingRule, setEditingRule] = useState<RiskRule | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const { riskState, isLoading, refresh } = useRiskState();

     useEffect(() => {
        if (typeof window !== "undefined") {
            const savedRules = localStorage.getItem("ec_risk_rules");
            if (savedRules) {
                setRules(JSON.parse(savedRules));
            }
        }
    }, []);
    
    const handleSaveRule = () => {
        if (!editingRule || isNaN(parseFloat(editValue))) return;
        const newRules = rules.map(r => r.id === editingRule.id ? { ...r, value: parseFloat(editValue) } : r);
        setRules(newRules);
        if (typeof window !== "undefined") {
            localStorage.setItem("ec_risk_rules", JSON.stringify(newRules));
        }
        setEditingRule(null);
        const logMessage = `Risk rule updated: ${editingRule.label} set to ${editValue}${editingRule.unit}.`;
        addLog(logMessage);
        toast({
            title: "Risk rule updated",
            description: `Your ${editingRule.label} rule has been set to ${editValue}${editingRule.unit}.`,
        });
    }
    
    const handleEditClick = (rule: RiskRule) => {
        setEditingRule(rule);
        setEditValue(String(rule.value));
    }


    if (isLoading || !riskState) {
        return (
            <div className="space-y-8 animate-pulse">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-20 w-full" />
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-48 w-full" />
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

    const { marketRisk, personalRisk, todaysLimits, decision } = riskState;


    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
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
                                    <p className="max-w-xs">Risk Center aggregates data from your Persona, Journal, Strategies, and market context.</p>
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
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5" /> Market Volatility</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Crypto VIX</p>
                                <p className="text-5xl font-bold font-mono">{marketRisk.vixValue}</p>
                                <Badge className={cn("text-base", 
                                    marketRisk.vixZone === "Extreme" && "bg-red-500/20 text-red-300 border-red-500/30",
                                    marketRisk.vixZone === "Elevated" && "bg-amber-500/20 text-amber-300 border-amber-500/30",
                                    marketRisk.vixZone === "Normal" && "bg-blue-500/20 text-blue-300 border-blue-500/30",
                                    marketRisk.vixZone === "Calm" && "bg-green-500/20 text-green-300 border-green-500/30"
                                )}>{marketRisk.vixZone}</Badge>
                            </div>
                            <div className="space-y-3">
                               <p className="text-sm text-muted-foreground">High volatility means larger price swings and more risk. It’s easier to get stopped out on noise. Low volatility means smaller moves and requires more patience.</p>
                               <Button variant="link" className="p-0 h-auto" onClick={() => onSetModule('cryptoVix')}>
                                   Open Crypto VIX Module <ArrowRight className="ml-2 h-4 w-4" />
                               </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Key Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Time</TableHead><TableHead>Event</TableHead><TableHead>Impact</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockEvents.map((event, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{event.time}</TableCell>
                                            <TableCell>{event.event}</TableCell>
                                            <TableCell><Badge variant="outline" className={cn(
                                                event.impact === "High" && "border-red-500/50 text-red-400",
                                                event.impact === "Medium" && "border-amber-500/50 text-amber-400"
                                            )}>{event.impact}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             <Button variant="link" className="p-0 h-auto mt-4" onClick={() => onSetModule('news')}>
                                Open News Module <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-8">
                     <Card className="bg-muted/30 border-border/50 sticky top-24">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Risk Posture</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-around text-center">
                                <div>
                                    <p className="text-xs text-muted-foreground">Discipline Score</p>
                                    <p className="text-2xl font-bold">{personalRisk.disciplineScore}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Losing Streak</p>
                                    <p className="text-2xl font-bold">{todaysLimits.lossStreak}</p>
                                </div>
                            </div>
                            <div className="text-sm">
                                <p className="text-muted-foreground">Trades Today: <Badge variant="secondary">{todaysLimits.tradesExecuted} / {todaysLimits.maxTrades}</Badge></p>
                            </div>
                            <Button variant="link" className="p-0 h-auto" onClick={() => onSetModule('analytics')}>
                                Open Performance Analytics <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Your Risk Rules</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="w-full whitespace-nowrap">
                                <Table>
                                    <TableBody>
                                        {rules.map(rule => (
                                            <TableRow key={rule.id}>
                                                <TableCell className="font-medium">{rule.label}</TableCell>
                                                <TableCell className="text-right">{rule.value}{rule.unit}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(rule)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Rule: {editingRule?.label}</DialogTitle>
                        <DialogDescription>
                            {editingRule?.description}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="rule-value">New Value ({editingRule?.unit})</Label>
                        <Input 
                            id="rule-value" 
                            type="number" 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)} 
                            className="font-mono"
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSaveRule}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
