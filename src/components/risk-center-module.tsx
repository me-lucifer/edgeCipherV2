
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, Pencil, ShieldAlert, BarChart, Info, CheckCircle, XCircle, AlertTriangle, Gauge, Calendar, Zap, Sun, Moon, Waves, User, ArrowRight } from "lucide-react";
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
import type { DemoScenario } from "./dashboard-module";

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

const getTradeDecision = ({
  vixZone,
  disciplineScore,
  lossStreak,
}: {
  vixZone: "Calm" | "Normal" | "Elevated" | "Extreme";
  disciplineScore: number;
  lossStreak: number;
}) => {
  if (vixZone === "Extreme" && disciplineScore < 50) {
    return {
      status: "Red / No-Go",
      message: "Extreme volatility and low recent discipline. Arjun's analysis strongly suggests reviewing and planning, not trading.",
      chipColor: "bg-red-500/20 text-red-400",
      glowColor: "shadow-[0_0_10px_rgba(239,68,68,0.3)]",
    };
  }
  if (lossStreak >= 3) {
    return {
      status: "Red / No-Go",
      message: `You are on a ${lossStreak}-trade losing streak. Your rules require a cooldown. Today is for review, not trading.`,
      chipColor: "bg-red-500/20 text-red-400",
      glowColor: "shadow-[0_0_10px_rgba(239,68,68,0.3)]",
    };
  }

  if (vixZone === "Elevated" || disciplineScore < 60) {
    return {
      status: "Amber / Caution",
      message: "Conditions are challenging. Reduce size, be selective, and stick strictly to your A+ setups.",
      chipColor: "bg-amber-500/20 text-amber-400",
      glowColor: "shadow-[0_0_10px_rgba(245,158,11,0.3)]",
    };
  }

  return {
    status: "Green / Go",
    message: "Market conditions and your personal risk posture are aligned. Execute your plan.",
    chipColor: "bg-green-500/20 text-green-400",
    glowColor: "shadow-[0_0_10px_rgba(34,197,94,0.3)]",
  };
};

function TradeDecisionBar({ vixZone, disciplineScore, lossStreak }: { vixZone: any, disciplineScore: any, lossStreak: any}) {
    const decision = getTradeDecision({ vixZone, disciplineScore, lossStreak });

    return (
        <Card className={cn("border-2", 
            decision.status.startsWith("Green") && "border-green-500/30",
            decision.status.startsWith("Amber") && "border-amber-500/30",
            decision.status.startsWith("Red") && "border-red-500/30"
        )}>
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-full", decision.chipColor)}>
                        {decision.status.startsWith("Green") && <CheckCircle className="h-6 w-6 text-green-400" />}
                        {decision.status.startsWith("Amber") && <AlertTriangle className="h-6 w-6 text-amber-400" />}
                        {decision.status.startsWith("Red") && <XCircle className="h-6 w-6 text-red-400" />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Today's Trading Decision: <span className={cn("font-bold",
                             decision.status.startsWith("Green") && "text-green-400",
                             decision.status.startsWith("Amber") && "text-amber-400",
                             decision.status.startsWith("Red") && "text-red-400"
                        )}>{decision.status}</span></h3>
                        <p className="text-sm text-muted-foreground">{decision.message}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function RiskCenterModule({ onSetModule }: RiskCenterModuleProps) {
    const { toast } = useToast();
    const { addLog } = useEventLog();
    const [rules, setRules] = useState<RiskRule[]>(defaultRules);
    const [editingRule, setEditingRule] = useState<RiskRule | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    
    // Mocked data that would come from other services
    const [marketContext, setMarketContext] = useState({
        vixValue: 45,
        vixZone: 'Normal' as "Calm" | "Normal" | "Elevated" | "Extreme"
    });
    const [personalPosture, setPersonalPosture] = useState({
        disciplineScore: 75,
        lossStreak: 0,
        topBreach: "Max trades per day"
    });

     useEffect(() => {
        if (typeof window !== "undefined") {
            const savedRules = localStorage.getItem("ec_risk_rules");
            if (savedRules) {
                setRules(JSON.parse(savedRules));
            }
            
            const scenario = localStorage.getItem('ec_demo_scenario') as DemoScenario;
            let vixValue = 45;
            let disciplineScore = 75;
            let lossStreak = 0;
            let topBreach = "None";

            if (scenario === 'high_vol') {
                vixValue = 82;
            } else if (scenario === 'drawdown') {
                vixValue = 65;
                disciplineScore = 58;
                lossStreak = 3;
                topBreach = "Max consecutive losses";
            }

            const getVixZone = (vix: number): "Calm" | "Normal" | "Elevated" | "Extreme" => {
                if (vix > 75) return "Extreme";
                if (vix > 50) return "Elevated";
                if (vix > 25) return "Normal";
                return "Calm";
            };

            setMarketContext({ vixValue, vixZone: getVixZone(vixValue) });
            setPersonalPosture({ disciplineScore, lossStreak, topBreach });
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


    return (
        <div className="space-y-8">
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
                                <p className="max-w-xs">Scope note: Risk Center aggregates data from Strategy, Planning, Analytics, and VIX.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </p>
            </div>
            
            <TradeDecisionBar vixZone={marketContext.vixZone} disciplineScore={personalPosture.disciplineScore} lossStreak={personalPosture.lossStreak} />
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5" /> Market Volatility</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Crypto VIX</p>
                                <p className="text-5xl font-bold font-mono">{marketContext.vixValue}</p>
                                <Badge className={cn("text-base", 
                                    marketContext.vixZone === "Extreme" && "bg-red-500/20 text-red-300 border-red-500/30",
                                    marketContext.vixZone === "Elevated" && "bg-amber-500/20 text-amber-300 border-amber-500/30",
                                    marketContext.vixZone === "Normal" && "bg-blue-500/20 text-blue-300 border-blue-500/30",
                                    marketContext.vixZone === "Calm" && "bg-green-500/20 text-green-300 border-green-500/30"
                                )}>{marketContext.vixZone}</Badge>
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
                                    <p className="text-2xl font-bold">{personalPosture.disciplineScore}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Losing Streak</p>
                                    <p className="text-2xl font-bold">{personalPosture.lossStreak}</p>
                                </div>
                            </div>
                            <div className="text-sm">
                                <p className="text-muted-foreground">Top recent breach: <Badge variant="destructive">{personalPosture.topBreach}</Badge></p>
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
