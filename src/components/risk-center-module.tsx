
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, Pencil, ShieldAlert, BarChart } from "lucide-react";
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

interface RiskCenterModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

type RiskRule = {
    id: 'maxRiskPerTrade' | 'maxDailyLoss' | 'maxTradesPerDay' | 'maxConsecutiveLosses';
    label: string;
    value: number;
    unit: '%' | 'R' | 'trades';
};

const defaultRules: RiskRule[] = [
    { id: 'maxRiskPerTrade', label: "Max risk per trade", value: 1, unit: '%' },
    { id: 'maxDailyLoss', label: "Max daily loss", value: 3, unit: '%' },
    { id: 'maxTradesPerDay', label: "Max trades per day", value: 5, unit: 'trades' },
    { id: 'maxConsecutiveLosses', label: "Max consecutive losses", value: 3, unit: 'trades' },
];

const mockBreaches = [
    { date: "2024-07-22", rule: "Max trades per day", context: "6th trade taken after reaching limit", action: "Continued trading" },
    { date: "2024-07-21", rule: "Max risk per trade", context: "Risked 2.5% on ETH short", action: "System Alert" },
    { date: "2024-07-19", rule: "Max daily loss", context: "Reached -4.5% daily loss", action: "Stopped for day" },
];


export function RiskCenterModule({ onSetModule }: RiskCenterModuleProps) {
    const { toast } = useToast();
    const [rules, setRules] = useState<RiskRule[]>(defaultRules);
    const [editingRule, setEditingRule] = useState<RiskRule | null>(null);
    const [editValue, setEditValue] = useState<string>("");

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
                <p className="text-muted-foreground">Define your limits. Protect your capital.</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Rules & Breaches */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>Your Risk Rules</CardTitle>
                            <CardDescription>These are your personal limits. Arjun uses them to know when you're off track.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rule</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rules.map(rule => (
                                        <TableRow key={rule.id}>
                                            <TableCell className="font-medium">{rule.label}</TableCell>
                                            <TableCell>{rule.value} {rule.unit}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(rule)}>
                                                    <Pencil className="mr-2 h-3 w-3" />
                                                    Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                     <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>Recent Breach Log</CardTitle>
                            <CardDescription>A log of when your actions didn't match your rules.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Rule Breached</TableHead>
                                        <TableHead>Context</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockBreaches.map((breach, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{breach.date}</TableCell>
                                            <TableCell><Badge variant="destructive">{breach.rule}</Badge></TableCell>
                                            <TableCell>{breach.context}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Summary */}
                <div className="lg:col-span-1 space-y-8">
                    <Card className="bg-muted/30 border-primary/20 sticky top-24">
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> Arjun's Risk Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <h4 className="font-semibold text-foreground flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-500" /> Key Patterns</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                                    <li>You've breached risk rules <strong>3 times</strong> in the last 7 days.</li>
                                    <li>Most common breach: <strong>Exceeding max trades per day.</strong></li>
                                </ul>
                            </div>
                             <div className="space-y-2">
                                <h4 className="font-semibold text-foreground flex items-center gap-2"><BarChart className="h-4 w-4 text-blue-500" /> Recommendations</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                                     <li>Consider a hard stop after 3 trades for one week.</li>
                                     <li>Review journal entries for trades taken after your session ends.</li>
                                </ul>
                            </div>
                             <Button 
                                variant="link" 
                                className="px-0 text-primary/90 hover:text-primary" 
                                onClick={() => onSetModule('aiCoaching', { initialMessage: "Arjun, let's talk about my risk management." })}
                            >
                                Discuss your risk profile with Arjun
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Rule: {editingRule?.label}</DialogTitle>
                        <DialogDescription>
                            Adjust your risk parameters. Changes will be reflected in Arjun's analysis.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="rule-value">New Value</Label>
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
