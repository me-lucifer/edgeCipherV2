
"use client";

import { Button } from "@/components/ui/button";
import { BrainCircuit, PlusCircle, CheckCircle, Search, Filter as FilterIcon, Clock, ListOrdered, FileText, Gauge, Calendar, ShieldCheck, Zap, MoreHorizontal, ArrowLeft, Edit, Archive, Star, BookOpen, BarChartHorizontal, Trash2, ChevronsUpDown, Info, Check, Save, Copy, CircleDashed, ArrowRight, X, AlertTriangle, ChevronUp } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Label } from "./ui/label";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Textarea } from "./ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "./ui/form";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogClose, DialogContent as DialogContentNonAlertDialog, DialogFooter as DialogFooterNonAlertDialog, DialogHeader as DialogHeaderNonAlertDialog, DialogTitle as DialogTitleNonAlertDialog } from "./ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";


interface StrategyManagementModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

// =================================================================
// DATA MODELS
// =================================================================
const ruleSetSchema = z.object({
    entryRules: z.object({
        conditions: z.array(z.string()).min(1, "At least one entry rule is required."),
        confirmations: z.array(z.string()),
    }),
    slRules: z.object({
        rules: z.array(z.string()).min(1, "At least one stop loss rule is required."),
    }),
    tpRules: z.object({
        minRR: z.number().optional(),
        preferredRR: z.number().optional(),
        otherRules: z.array(z.string()),
    }),
    riskRules: z.object({
        riskPerTradePct: z.number().min(0.1).max(5),
        maxDailyLossPct: z.number().min(1).max(10),
        maxDailyTrades: z.number().min(1).max(20),
        leverageCap: z.number().min(1).max(50),
        cooldownAfterLosses: z.boolean().default(false),
    }),
    contextRules: z.object({
        allowedSessions: z.array(z.string()),
        vixPolicy: z.enum(["allowAll", "avoidHigh", "onlyLowNormal"]),
        avoidNews: z.boolean().default(false),
        otherRules: z.array(z.string()),
    }),
});

const strategyCreationSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters."),
    type: z.string().min(1, "Please select a type."),
    timeframes: z.array(z.string()).min(1, "Select at least one timeframe."),
    description: z.string().optional(),
    difficulty: z.string().optional(),
    changeNotes: z.string().optional(),
    ruleSet: ruleSetSchema,
});

type RuleSet = z.infer<typeof ruleSetSchema>;
type StrategyCreationValues = z.infer<typeof strategyCreationSchema>;

type StrategyVersion = {
    versionId: string;
    versionNumber: number;
    isActiveVersion: boolean;
    createdAt: string;
    changeNotes?: string;
    ruleSet: RuleSet;
    description?: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    usageCount: number;
    lastUsedAt: string | null;
};

export type StrategyGroup = {
    strategyId: string;
    name: string;
    type: 'Reversal' | 'Trend-Following' | 'Scalping' | 'Breakout' | 'Pullback' | 'SMC' | 'Custom';
    timeframes: string[];
    createdAt: string;
    status: 'active' | 'archived' | 'draft';
    versions: StrategyVersion[];
};

// =================================================================
// MOCK DATA
// =================================================================
const seedStrategies: StrategyGroup[] = [
    {
        strategyId: 'strat_1',
        name: "Breakout Trend",
        type: 'Breakout',
        timeframes: ['15m', '1H'],
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        status: 'active',
        versions: [
            {
                versionId: 'sv_1_1',
                versionNumber: 1,
                isActiveVersion: true,
                createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
                changeNotes: "Initial creation of the strategy.",
                description: "A classic breakout strategy for trending markets.",
                difficulty: "Intermediate",
                ruleSet: {
                    entryRules: { conditions: ["Price breaks out of a 4-hour consolidation range", "Breakout candle has above-average volume"], confirmations: ["Enter on a retest of the broken level"] },
                    slRules: { rules: ["Stop-loss is below the mid-point of the consolidation range"] },
                    tpRules: { minRR: 2, preferredRR: 3, otherRules: ["Target is the next major liquidity level"] },
                    riskRules: { riskPerTradePct: 1, maxDailyLossPct: 3, maxDailyTrades: 4, leverageCap: 20, cooldownAfterLosses: false },
                    contextRules: { allowedSessions: ["New York"], vixPolicy: "avoidHigh", avoidNews: true, otherRules: [] }
                },
                usageCount: 42,
                lastUsedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            }
        ]
    },
    {
        strategyId: 'strat_2',
        name: "Pullback Continuation",
        type: 'Pullback',
        timeframes: ['1H', '4H'],
        createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
        status: 'active',
        versions: [
            {
                versionId: 'sv_2_1',
                versionNumber: 1,
                isActiveVersion: true,
                createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
                changeNotes: "Initial creation.",
                description: "Entering a strong existing trend on a dip.",
                difficulty: "Intermediate",
                ruleSet: {
                    entryRules: { conditions: ["Market is in a clear uptrend/downtrend on 4H", "Price pulls back to the 1H 21 EMA"], confirmations: ["Enter on a bullish/bearish candle that respects the EMA"] },
                    slRules: { rules: ["Stop-loss is behind the most recent swing structure"] },
                    tpRules: { minRR: 1.5, preferredRR: 2.5, otherRules: ["Target is the previous swing high/low"] },
                    riskRules: { riskPerTradePct: 1.5, maxDailyLossPct: 4, maxDailyTrades: 3, leverageCap: 10, cooldownAfterLosses: true },
                    contextRules: { allowedSessions: ["London", "New York"], vixPolicy: "avoidHigh", avoidNews: false, otherRules: ["Only valid when 1H and 4H timeframes are aligned"] }
                },
                usageCount: 89,
                lastUsedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            }
        ]
    },
    {
        strategyId: 'strat_3',
        name: "Range Fade",
        type: 'Reversal',
        timeframes: ['5m', '15m'],
        createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
        status: 'active',
        versions: [
            {
                versionId: 'sv_3_1',
                versionNumber: 1,
                isActiveVersion: true,
                createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
                changeNotes: "Initial creation.",
                description: "Trading mean reversion in a range-bound market.",
                difficulty: "Advanced",
                ruleSet: {
                    entryRules: { conditions: ["Price is in a clearly defined range on 1H", "Price sweeps the high/low of the range on 5m"], confirmations: ["Enter when 5m candle closes back inside the range"] },
                    slRules: { rules: ["Stop-loss is above/below the wick of the sweep candle"] },
                    tpRules: { minRR: 1.8, preferredRR: 2, otherRules: ["Target is the mid-point of the range (0.5 level)"] },
                    riskRules: { riskPerTradePct: 0.75, maxDailyLossPct: 2.5, maxDailyTrades: 5, leverageCap: 50, cooldownAfterLosses: true },
                    contextRules: { allowedSessions: ["Asia"], vixPolicy: "onlyLowNormal", avoidNews: false, otherRules: [] }
                },
                usageCount: 153,
                lastUsedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            }
        ]
    }
];

type SortOption = 'recentlyUsed' | 'mostUsed' | 'recentlyCreated';

interface StrategyFilters {
    search: string;
    type: string;
    timeframe: string;
    sort: SortOption;
}

const InfoTooltip = ({ text, children }: { text: React.ReactNode, children: React.ReactNode }) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    {typeof text === 'string' ? <p>{text}</p> : text}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const RuleItem = ({ icon: Icon, label, value, unit }: { icon: React.ElementType, label: string, value: string | null | number, unit?: string }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{label}: <span className="font-semibold text-foreground">{value}{unit}</span></p>
        </div>
    );
};

function StrategyCard({ strategy, onOpen, onEdit, onDuplicate }: { strategy: StrategyGroup, onOpen: (strategy: StrategyGroup) => void, onEdit: (strategy: StrategyGroup) => void, onDuplicate: (strategy: StrategyGroup) => void }) {
    const activeVersion = strategy.versions.find(v => v.isActiveVersion);
    const totalUsage = strategy.versions.reduce((sum, v) => sum + v.usageCount, 0);

    const { riskPerTradePct, maxDailyLossPct, maxDailyTrades, leverageCap } = activeVersion?.ruleSet?.riskRules || {};
    const { allowedSessions, vixPolicy } = activeVersion?.ruleSet?.contextRules || {};
    
    return (
        <Card className="bg-muted/40 hover:bg-muted/60 transition-colors flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{strategy.name}</CardTitle>
                    <Badge variant={strategy.status === 'active' ? 'secondary' : strategy.status === 'draft' ? 'outline' : 'destructive'} className={cn(
                        strategy.status === 'active' && 'bg-green-500/10 text-green-400 border-green-500/20',
                        strategy.status === 'draft' && 'border-amber-500/30 text-amber-400'
                    )}>
                        {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                    </Badge>
                </div>
                <CardDescription>
                    <Badge variant="outline">{strategy.type}</Badge>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {strategy.timeframes && strategy.timeframes.map(tf => <Badge key={tf} variant="outline" className="text-xs">{tf}</Badge>)}
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div className="p-3 rounded-md bg-muted border space-y-3">
                    <h4 className="font-semibold text-xs text-muted-foreground">Risk Rules Snapshot</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <RuleItem icon={ShieldCheck} label="Risk/trade" value={riskPerTradePct} unit="%" />
                        <RuleItem icon={Gauge} label="Max loss/day" value={maxDailyLossPct} unit="%" />
                        <RuleItem icon={ListOrdered} label="Max trades/day" value={maxDailyTrades} />
                        <RuleItem icon={FileText} label="Leverage cap" value={leverageCap} unit="x" />
                    </div>
                </div>
                <div className="p-3 rounded-md bg-muted border space-y-3">
                    <h4 className="font-semibold text-xs text-muted-foreground">Context Rules Snapshot</h4>
                     <div className="grid grid-cols-2 gap-2">
                        <RuleItem icon={Clock} label="Session" value={(allowedSessions || []).join(', ') || "Any"} />
                        <RuleItem icon={Calendar} label="Volatility" value={vixPolicy || 'Any'} />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                <div className="w-full text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Active version:</span> <span>v{activeVersion?.versionNumber || '-'}</span></div>
                    <div className="flex justify-between"><span>Total trades:</span> <span>{totalUsage}</span></div>
                </div>
                <div className="w-full flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => strategy.status === 'draft' ? onEdit(strategy) : onOpen(strategy)}>
                        {strategy.status === 'draft' ? "Finish Setup" : "Open"}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="px-2">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => onDuplicate(strategy)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                {strategy.status === 'active' ? "Archive" : "Unarchive"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardFooter>
        </Card>
    );
}

const RulesCard = ({ title, children }: { title: string; children: React.ReactNode }) => {
    return (
        <Card className="bg-muted/50 border-border/50">
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
};

const WhereThisMatters = ({ onSetModule }: { onSetModule: (module: any, context?: any) => void; }) => {
    const items = [
        { icon: ShieldCheck, text: "Used by Trade Planning for PASS/WARN/FAIL checks." },
        { icon: BookOpen, text: "Shown in Journal for rule adherence analysis." },
        { icon: BarChartHorizontal, text: "Grouped in Performance Analytics by strategy." },
    ];
    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="text-base">Where This Matters</CardTitle>
                <CardDescription className="text-xs">This strategy rulebook connects to other modules:</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                            <item.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-muted-foreground">{item.text}</p>
                        </div>
                    ))}
                </div>
                <Separator className="my-4" />
                <div className="flex gap-2">
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => onSetModule('tradePlanning')}>Open Trade Planning</Button>
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => onSetModule('analytics')}>Open Analytics</Button>
                </div>
            </CardContent>
        </Card>
    );
};

function StrategyDetailView({ 
    strategy, 
    onBack,
    onArchive,
    onDelete,
    onMakeActive,
    onEdit,
    onSetModule,
}: { 
    strategy: StrategyGroup; 
    onBack: () => void;
    onArchive: () => void;
    onDelete: () => void;
    onMakeActive: (versionId: string) => void;
    onEdit: (strategy: StrategyGroup) => void;
    onSetModule: (module: any, context?: any) => void;
}) {
    const [selectedVersionId, setSelectedVersionId] = useState<string>(strategy.versions.find(v => v.isActiveVersion)?.versionId || strategy.versions[0].versionId);

    const selectedVersion = strategy.versions.find(v => v.versionId === selectedVersionId);

    if (!selectedVersion) return null; // Should not happen if data is correct

    const { entryRules, slRules, tpRules, riskRules, contextRules } = selectedVersion.ruleSet;

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <Button variant="ghost" onClick={onBack} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Playbook
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => onEdit(strategy)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit (creates new version)
                    </Button>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onArchive}>
                                <Archive className="mr-2 h-4 w-4" />
                                {strategy.status === 'active' ? 'Archive' : 'Restore'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    onDelete();
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete strategy
                                            </DropdownMenuItem>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        <p>Delete is allowed only if strategy has never been used in any executed trade.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="space-y-6">
                <WhereThisMatters onSetModule={onSetModule} />

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-1 space-y-6 sticky top-24">
                        <Card className="bg-muted/30 border-border/50">
                            <CardHeader>
                                <CardTitle>{strategy.name}</CardTitle>
                                <CardDescription>
                                    <Badge variant="outline">{strategy.type}</Badge>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {strategy.timeframes.map(tf => <Badge key={tf} variant="outline" className="text-xs">{tf}</Badge>)}
                                    </div>
                                </CardDescription>
                            </CardHeader>
                             <CardContent>
                                <h4 className="font-semibold text-foreground mb-3 text-sm">Version History</h4>
                                <div className="space-y-3">
                                    {strategy.versions.map(v => (
                                        <div
                                            key={v.versionId}
                                            onClick={() => setSelectedVersionId(v.versionId)}
                                            className={cn("p-3 rounded-md border cursor-pointer transition-colors", selectedVersionId === v.versionId ? "bg-muted border-primary/50" : "bg-muted/50 hover:bg-muted")}
                                        >
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-sm">Version {v.versionNumber}</p>
                                                {v.isActiveVersion && <Badge variant="secondary" className="bg-primary/10 text-primary">Active</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Created: {new Date(v.createdAt).toLocaleDateString()}</p>
                                             {v.changeNotes && <p className="text-xs text-muted-foreground mt-2 italic">"{v.changeNotes}"</p>}
                                             {!v.isActiveVersion && (
                                                <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-2" onClick={(e) => { e.stopPropagation(); onMakeActive(v.versionId); }}>
                                                    Make active
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <RulesCard title="Description / When to Use"><p className="text-sm text-muted-foreground italic">{selectedVersion.description || 'Not defined.'}</p></RulesCard>
                        <RulesCard title="Entry Rules">
                           <div className="space-y-4">
                                <p className="text-xs text-muted-foreground font-semibold uppercase">Conditions</p>
                                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                    {entryRules.conditions.map((rule, i) => <li key={i}>{rule}</li>)}
                                </ul>
                                {entryRules.confirmations.length > 0 && <>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase pt-2">Confirmations</p>
                                    <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                        {entryRules.confirmations.map((rule, i) => <li key={i}>{rule}</li>)}
                                    </ul>
                                </>}
                           </div>
                        </RulesCard>
                        <RulesCard title="Stop Loss Rules"><ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">{slRules.rules.map((rule, i) => <li key={i}>{rule}</li>)}</ul></RulesCard>
                        <RulesCard title="Take Profit Rules">
                            <div className="space-y-4">
                               {tpRules.minRR && <p className="text-sm text-muted-foreground">Minimum R:R: <span className="font-semibold text-foreground">{tpRules.minRR}:1</span></p>}
                               {tpRules.preferredRR && <p className="text-sm text-muted-foreground">Preferred R:R: <span className="font-semibold text-foreground">{tpRules.preferredRR}:1</span></p>}
                               {tpRules.otherRules.length > 0 && <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">{tpRules.otherRules.map((rule, i) => <li key={i}>{rule}</li>)}</ul>}
                            </div>
                        </RulesCard>
                        <RulesCard title="Risk Management Rules">
                            <div className="grid grid-cols-2 gap-4">
                                <p className="text-sm text-muted-foreground">Risk per trade: <span className="font-semibold text-foreground">{riskRules.riskPerTradePct}%</span></p>
                                <p className="text-sm text-muted-foreground">Max daily loss: <span className="font-semibold text-foreground">{riskRules.maxDailyLossPct}%</span></p>
                                <p className="text-sm text-muted-foreground">Max daily trades: <span className="font-semibold text-foreground">{riskRules.maxDailyTrades}</span></p>
                                <p className="text-sm text-muted-foreground">Leverage cap: <span className="font-semibold text-foreground">{riskRules.leverageCap}x</span></p>
                                <p className="text-sm text-muted-foreground">Cooldown after losses: <span className="font-semibold text-foreground">{riskRules.cooldownAfterLosses ? 'Yes' : 'No'}</span></p>
                            </div>
                        </RulesCard>
                        <RulesCard title="Context Rules">
                            <div className="grid grid-cols-2 gap-4">
                                <p className="text-sm text-muted-foreground">Allowed Sessions: <span className="font-semibold text-foreground">{contextRules.allowedSessions.join(', ') || 'Any'}</span></p>
                                <p className="text-sm text-muted-foreground">VIX Policy: <span className="font-semibold text-foreground">{contextRules.vixPolicy}</span></p>
                                <p className="text-sm text-muted-foreground">Avoid News: <span className="font-semibold text-foreground">{contextRules.avoidNews ? 'Yes' : 'No'}</span></p>
                            </div>
                            {contextRules.otherRules.length > 0 && <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside mt-4">{contextRules.otherRules.map((rule, i) => <li key={i}>{rule}</li>)}</ul>}
                        </RulesCard>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Stepper = ({ currentStep, steps }: { currentStep: number; steps: { name: string }[] }) => (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className="md:flex-1">
            {stepIdx < currentStep ? (
              <div className="group flex w-full flex-col border-l-4 border-primary py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-primary transition-colors ">{step.name}</span>
              </div>
            ) : stepIdx === currentStep ? (
              <div
                className="flex w-full flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                aria-current="step"
              >
                <span className="text-sm font-medium text-primary">{step.name}</span>
              </div>
            ) : (
              <div className="group flex w-full flex-col border-l-4 border-border py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-muted-foreground transition-colors">{step.name}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
);

type ClarityStatus = 'clear' | 'vague' | 'neutral';

const getClarity = (text: string): { status: ClarityStatus, hint: string | null } => {
    const lowerText = text.toLowerCase();
    
    if (text.length === 0) return { status: 'neutral', hint: null };
    if (text.length < 12) return { status: 'vague', hint: "This seems too short to be a testable rule. Add more detail." };

    const vagueWords = ['good', 'nice', 'strong', 'weak', 'seems', 'looks like', 'feel', 'maybe', 'probably', 'might'];
    if (vagueWords.some(word => lowerText.includes(word))) {
        return { status: 'vague', hint: "Try to avoid subjective words like 'good' or 'strong'. Use measurable terms (e.g., 'price is above 200 EMA')." };
    }

    const clearWords = ['ema', 'rsi', 'macd', 'volume', 'break', 'retest', 'high', 'low', 'close', 'above', 'below', 'cross', 'divergence', 'consolidation', 'range', 'wick', 'sweep'];
    if (clearWords.some(word => lowerText.includes(word))) {
        return { status: 'clear', hint: "Good job! This rule includes specific, testable conditions." };
    }

    return { status: 'neutral', hint: null };
};

const RuleEditor = ({ value, onChange, placeholder, description }: { value: string[]; onChange: (value: string[]) => void; placeholder: string; description?: string; }) => {
    const [text, setText] = useState('');
    const clarity = getClarity(text);

    const handleAddRule = () => {
        if (text.trim()) {
            onChange([...value, text.trim()]);
            setText('');
        }
    };

    const handleRemoveRule = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const clarityConfig = {
        clear: { text: "Clear", className: "bg-green-500/20 text-green-300 border-green-500/30" },
        vague: { text: "Vague", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
        neutral: { text: "", className: "hidden" },
    };
    
    const { text: clarityText, className: clarityClassName } = clarityConfig[clarity.status];

    return (
        <div className="space-y-2">
             {description && <FormDescription className="mb-2">{description}</FormDescription>}
            <ul className="space-y-2">
                {value.map((rule, index) => (
                    <li key={index} className="flex items-center justify-between group p-2 rounded-md hover:bg-muted/50">
                        <span className="text-sm text-muted-foreground">{index + 1}. {rule}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveRule(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </li>
                ))}
            </ul>
            <div className="space-y-2">
                <div className="flex gap-2 items-center">
                    <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddRule(); }}} />
                    <Badge variant="outline" className={clarityClassName}>{clarityText}</Badge>
                    <Button type="button" variant="outline" onClick={handleAddRule} disabled={!text.trim()}>Add Rule</Button>
                </div>
                {clarity.status === 'vague' && clarity.hint && (
                    <p className="text-xs text-amber-400/80 flex items-start gap-2">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span><span className="font-semibold">Hint:</span> {clarity.hint}</span>
                    </p>
                )}
            </div>
        </div>
    );
};
  
const strategyTemplates: (Omit<StrategyCreationValues, 'name' | 'changeNotes' | 'difficulty'> & {id: string, name: string, description: string})[] = [
    {
        id: 'breakout',
        name: "Breakout Trend",
        description: "For clear trends after consolidation.",
        type: 'Breakout',
        timeframes: ['15m'],
        ruleSet: {
            entryRules: { conditions: ["Price breaks out of a 4-hour consolidation range", "Breakout candle has above-average volume"], confirmations: [] },
            slRules: { rules: ["Stop-loss is below the mid-point of the consolidation range"] },
            tpRules: { minRR: 2, preferredRR: 3, otherRules: [] },
            riskRules: { riskPerTradePct: 1, maxDailyLossPct: 3, maxDailyTrades: 4, leverageCap: 20, cooldownAfterLosses: false },
            contextRules: { allowedSessions: ["New York"], vixPolicy: "avoidHigh", avoidNews: true, otherRules: [] }
        }
    },
    {
        id: 'pullback',
        name: "Pullback Continuation",
        description: "For entering an existing strong trend.",
        type: 'Pullback',
        timeframes: ['1H'],
        ruleSet: {
            entryRules: { conditions: ["Market is in a clear uptrend on 4H", "Price pulls back to the 1H 21 EMA"], confirmations: [] },
            slRules: { rules: ["Stop-loss is behind the most recent swing structure"] },
            tpRules: { minRR: 1.5, preferredRR: 2.5, otherRules: [] },
            riskRules: { riskPerTradePct: 1.5, maxDailyLossPct: 4, maxDailyTrades: 3, leverageCap: 10, cooldownAfterLosses: true },
            contextRules: { allowedSessions: ["London", "New York"], vixPolicy: "avoidHigh", avoidNews: false, otherRules: ["Only valid when 1H and 4H timeframes are aligned"] }
        }
    },
    {
        id: 'range',
        name: "Range Fade",
        description: "For non-trending, range-bound markets.",
        type: 'Reversal',
        timeframes: ['5m'],
        ruleSet: {
            entryRules: { conditions: ["Price is in a clearly defined range on 1H", "Price sweeps the high/low of the range on 5m"], confirmations: [] },
            slRules: { rules: ["Stop-loss is above/below the wick of the sweep candle"] },
            tpRules: { minRR: 1.8, preferredRR: 2, otherRules: [] },
            riskRules: { riskPerTradePct: 0.75, maxDailyLossPct: 2.5, maxDailyTrades: 5, leverageCap: 50, cooldownAfterLosses: true },
            contextRules: { allowedSessions: ["Asia"], vixPolicy: "onlyLowNormal", avoidNews: false, otherRules: [] }
        }
    },
    {
        id: 'beginner',
        name: "Simple Beginner Strategy",
        description: "A basic, easy-to-follow plan.",
        type: 'Custom',
        timeframes: ['15m'],
        ruleSet: {
            entryRules: { conditions: ["Price is above the 200 EMA", "RSI is not overbought/oversold"], confirmations: [] },
            slRules: { rules: ["Stop-loss is 1.5x ATR below entry"] },
            tpRules: { minRR: 1.5, otherRules: [] },
            riskRules: { riskPerTradePct: 1, maxDailyLossPct: 2, maxDailyTrades: 3, leverageCap: 10, cooldownAfterLosses: true },
            contextRules: { allowedSessions: ["New York"], vixPolicy: "onlyLowNormal", avoidNews: true, otherRules: [] }
        }
    }
];

const RulebookPreview = ({ form }: { form: any }) => {
    const values = useWatch({ control: form.control }) as StrategyCreationValues;

    const checks = {
      entry: (values.ruleSet?.entryRules?.conditions || []).length > 0,
      sl: (values.ruleSet?.slRules?.rules || []).length > 0,
      riskPerTrade: values.ruleSet?.riskRules?.riskPerTradePct > 0,
      maxTrades: values.ruleSet?.riskRules?.maxDailyTrades > 0,
    };

    const isReady = checks.entry && checks.sl && checks.riskPerTrade && checks.maxTrades;
    
    const readinessLabel = isReady ? 'Ready' : 'Incomplete';
    const readinessColor = isReady ? 'text-green-400' : 'text-amber-400';
    const ReadinessIcon = isReady ? CheckCircle : AlertTriangle;

    const checklist = [
      { label: "Entry Rule Defined", checked: checks.entry },
      { label: "Stop Loss Rule Defined", checked: checks.sl },
      { label: "Risk Per Trade Defined", checked: checks.riskPerTrade },
      { label: "Max Daily Trades Defined", checked: checks.maxTrades },
    ];

    return (
        <Card className="sticky top-24">
            <CardHeader>
                <CardTitle className="text-base">Rulebook Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-foreground">{values.name || "Untitled Strategy"}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {values.type && <Badge variant="outline">{values.type}</Badge>}
                        {values.timeframes?.map(tf => <Badge key={tf} variant="secondary">{tf}</Badge>)}
                    </div>
                </div>

                <Separator />

                <div>
                    <Label className="text-xs text-muted-foreground">Enforcement Readiness</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <ReadinessIcon className={cn("h-5 w-5", readinessColor)} />
                        <p className={cn("font-semibold", readinessColor)}>{readinessLabel}</p>
                    </div>
                    <div className="space-y-2 text-xs mt-3">
                        {checklist.map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                {item.checked ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                                <span className={cn("text-muted-foreground", item.checked && "line-through")}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground/80 mt-3">
                      A "Ready" strategy can be fully enforced by Arjun in the Trade Planning module.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

function StrategyCreatorView({ 
    onBack, 
    onSave, 
    onSaveDraft, 
    initialData,
    editingId,
}: { 
    onBack: () => void; 
    onSave: (data: StrategyCreationValues) => void; 
    onSaveDraft: (data: StrategyCreationValues) => void; 
    initialData?: StrategyCreationValues | null;
    editingId?: string;
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [wizardStarted, setWizardStarted] = useState(!!initialData);
    const [persona, setPersona] = useState<{ primaryPersonaName?: string } | null>(null);
    const [showPersonaAlert, setShowPersonaAlert] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const personaData = localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base");
            if (personaData) {
                setPersona(JSON.parse(personaData));
            }
        }
    }, []);

    const creationSteps = [
        { name: "Basic Info", fields: ["name", "type", "timeframes"] },
        { name: "Entry Rules", fields: ["ruleSet.entryRules.conditions"] },
        { name: "Stop Loss", fields: ["ruleSet.slRules.rules"] },
        { name: "Take Profit" },
        { name: "Risk Rules", fields: ["ruleSet.riskRules.riskPerTradePct", "ruleSet.riskRules.maxDailyLossPct", "ruleSet.riskRules.maxDailyTrades", "ruleSet.riskRules.leverageCap"] },
        { name: "Context Rules" },
        { name: "Review & Save" },
    ];
    
    const strategyTypes = ['Breakout', 'Pullback', 'Reversal', 'Scalping', 'SMC', 'Custom'];
    const timeframeOptions = ['1m', '5m', '15m', '1H', '4H', '1D'];
    const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced'];

    const form = useForm<StrategyCreationValues>({
        resolver: zodResolver(strategyCreationSchema),
        defaultValues: initialData || {
            name: '',
            type: '',
            timeframes: [],
            description: '',
            difficulty: '',
            changeNotes: '',
            ruleSet: {
                entryRules: { conditions: [], confirmations: [] },
                slRules: { rules: [] },
                tpRules: { otherRules: [] },
                riskRules: { riskPerTradePct: 1, maxDailyLossPct: 3, maxDailyTrades: 3, leverageCap: 10, cooldownAfterLosses: false },
                contextRules: { allowedSessions: [], vixPolicy: 'allowAll', avoidNews: false, otherRules: [] },
            }
        },
    });

    useEffect(() => {
        const handlePopulate = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if(detail) {
                form.reset(detail);
                setWizardStarted(true);
            }
        };
        window.addEventListener('populate-creator-form', handlePopulate);
        return () => window.removeEventListener('populate-creator-form', handlePopulate);
    }, [form]);

    const handleNext = async () => {
        const fieldsToValidate = creationSteps[currentStep].fields;
        const isValid = fieldsToValidate ? await form.trigger(fieldsToValidate as any) : true;

        if (isValid && currentStep < creationSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else if (isValid && currentStep === creationSteps.length - 1) {
            form.handleSubmit(onSave)();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else if (wizardStarted) {
            setWizardStarted(false);
            setShowPersonaAlert(false); // Reset alert when going back to template selection
        } else {
            if (form.formState.isDirty) {
                setShowCancelDialog(true);
            } else {
                onBack();
            }
        }
    };
    
    const handleTemplateSelect = (templateId: string) => {
        const template = strategyTemplates.find(t => t.id === templateId);
        if(template) {
            let modifiedRuleSet = { ...template.ruleSet };

            if(persona?.primaryPersonaName?.includes("Impulsive")) {
                modifiedRuleSet.riskRules.maxDailyTrades = 3;
                setShowPersonaAlert(true);
            } else if (persona?.primaryPersonaName?.includes("Fearful")) {
                 modifiedRuleSet.tpRules.otherRules.push("Let winners run to target, do not exit early");
                 setShowPersonaAlert(true);
            }
            
            form.reset({
                name: template.name,
                type: template.type,
                timeframes: template.timeframes,
                description: template.description,
                ruleSet: modifiedRuleSet,
                changeNotes: 'Created from template.',
            });
            setWizardStarted(true);
        }
    };

    const RuleEditorFormItem = ({ name, label, tooltipText, placeholder, description }: { name: `ruleSet.entryRules.conditions` | `ruleSet.entryRules.confirmations` | `ruleSet.slRules.rules` | `ruleSet.tpRules.otherRules` | `ruleSet.contextRules.otherRules`, label: string, tooltipText: string, placeholder: string, description?: string }) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center gap-2">
                        {label}
                        <InfoTooltip text={tooltipText}>
                            <Info className="h-4 w-4 text-muted-foreground" />
                        </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                        <RuleEditor {...field} placeholder={placeholder} description={description} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );


    return (
        <div className="space-y-8">
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to discard this new strategy?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Editing</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={onBack}>Discard</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{editingId ? 'Edit Strategy' : 'Create Strategy'}</h1>
                <p className="text-muted-foreground">{editingId ? 'Create a new version of your strategy.' : 'Build a rulebook Arjun can enforce.'}</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {wizardStarted ? (
                        <>
                            {showPersonaAlert && (
                                <Alert variant="default" className="bg-primary/10 border-primary/20 text-primary">
                                    <Zap className="h-4 w-4 text-primary" />
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <AlertTitle>Persona-based Rule Added</AlertTitle>
                                            <AlertDescription className="text-primary/80">
                                                Arjun added a suggested rule based on your <strong className="font-semibold">{persona?.primaryPersonaName}</strong> persona. You can edit or remove it.
                                            </AlertDescription>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1" onClick={() => setShowPersonaAlert(false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Alert>
                            )}
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <Stepper currentStep={currentStep} steps={creationSteps} />
                            </div>
                            <Card className="bg-muted/30">
                                <CardContent className="p-6">
                                    <Form {...form}>
                                        <form className="space-y-6">
                                            {currentStep === 0 && (
                                                <div className="space-y-4">
                                                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Strategy Name</FormLabel><FormControl><Input placeholder="e.g., London Open Reversal" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description / When to use (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., 'A mean-reversion strategy played during the first 2 hours of the London session...'" {...field} /></FormControl><FormMessage /></FormItem>)} />

                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{strategyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                        <FormField control={form.control} name="difficulty" render={({ field }) => (<FormItem><FormLabel>Difficulty (Optional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger></FormControl><SelectContent>{difficultyOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                    </div>
                                                    <FormField
                                                        control={form.control}
                                                        name="timeframes"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Timeframe Focus</FormLabel>
                                                                <FormControl>
                                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                                        {timeframeOptions.map(tf => {
                                                                            const isSelected = field.value?.includes(tf);
                                                                            return (
                                                                                <Button
                                                                                    key={tf}
                                                                                    type="button"
                                                                                    variant={isSelected ? "secondary" : "outline"}
                                                                                    onClick={() => {
                                                                                        const newValue = isSelected
                                                                                            ? (field.value || []).filter(v => v !== tf)
                                                                                            : [...(field.value || []), tf];
                                                                                        field.onChange(newValue);
                                                                                    }}
                                                                                >
                                                                                    {tf}
                                                                                </Button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </FormControl>
                                                                <FormDescription className="text-xs italic">Timeframe focus helps Arjun detect where you tend to break discipline.</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}
                                            {currentStep === 1 && (
                                                <div className="space-y-6">
                                                    <RuleEditorFormItem name="ruleSet.entryRules.conditions" label="Entry Conditions" tooltipText="What specific, observable conditions must be true on the chart for you to consider entering a trade?" placeholder="e.g., Price breaks 4H consolidation range" />
                                                    <RuleEditorFormItem name="ruleSet.entryRules.confirmations" label="Entry Confirmations (Optional)" tooltipText="What final signal confirms your entry? This could be a specific candle pattern or indicator signal." placeholder="e.g., Enter on a retest of the broken level" />
                                                </div>
                                            )}
                                            {currentStep === 2 && <RuleEditorFormItem name="ruleSet.slRules.rules" label="Stop Loss Rules" tooltipText="Your stop-loss is your non-negotiable exit point if a trade goes against you. It defines your risk." placeholder="e.g., Below previous swing low OR fixed 0.8% from entry" />}
                                            {currentStep === 3 && (
                                                <div className="space-y-6">
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="ruleSet.tpRules.minRR" render={({ field }) => (<FormItem><FormLabel>Minimum R:R</FormLabel><FormControl><Input type="number" placeholder="1.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                                                        <FormField control={form.control} name="ruleSet.tpRules.preferredRR" render={({ field }) => (<FormItem><FormLabel>Preferred R:R</FormLabel><FormControl><Input type="number" placeholder="2.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                                                    </div>
                                                    <RuleEditorFormItem name="ruleSet.tpRules.otherRules" label="Other TP Rules" tooltipText="Define any other rules for taking profit, such as partial profit-taking or trailing stops." placeholder="e.g., Take 50% profit at 1R, move SL to entry" />
                                                </div>
                                            )}
                                            {currentStep === 4 && (
                                                <div className="space-y-4">
                                                    <Alert variant="default" className="bg-muted/50 border-border/50">
                                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                                        <AlertTitle>Why this matters</AlertTitle>
                                                        <AlertDescription className="text-muted-foreground">
                                                            Your risk rules are the most critical part of your plan. They protect your capital so you can stay in the game.
                                                        </AlertDescription>
                                                    </Alert>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="ruleSet.riskRules.riskPerTradePct" render={({ field }) => (<FormItem><FormLabel>Risk per trade (%)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                                                        <FormField control={form.control} name="ruleSet.riskRules.maxDailyLossPct" render={({ field }) => (<FormItem><FormLabel>Max daily loss (%)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                                                        <FormField control={form.control} name="ruleSet.riskRules.maxDailyTrades" render={({ field }) => (<FormItem><FormLabel>Max daily trades</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)} />
                                                        <FormField control={form.control} name="ruleSet.riskRules.leverageCap" render={({ field }) => (<FormItem><FormLabel>Leverage cap</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)} />
                                                    </div>
                                                    <FormField control={form.control} name="ruleSet.riskRules.cooldownAfterLosses" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 bg-muted/50"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Enable cooldown rule</FormLabel><FormDescription>After 2 consecutive losses, stop trading for the day.</FormDescription></div></FormItem>)} />
                                                </div>
                                            )}
                                            {currentStep === 5 && (
                                                <div className="space-y-6">
                                                    <FormField control={form.control} name="ruleSet.contextRules.allowedSessions" render={() => ( <FormItem> <FormLabel>Allowed Trading Sessions</FormLabel> <div className="flex flex-wrap gap-2 pt-2"> {['Asia', 'London', 'New York'].map((item) => ( <FormField key={item} control={form.control} name="ruleSet.contextRules.allowedSessions" render={({ field }) => ( <FormItem key={item} className="flex flex-row items-center space-x-3 space-y-0"> <FormControl> <Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item]) : field.onChange((field.value || []).filter((value) => value !== item)) }} /> </FormControl> <FormLabel className="font-normal">{item}</FormLabel> </FormItem> )} /> ))} </div> </FormItem> )}/>
                                                    <FormField control={form.control} name="ruleSet.contextRules.vixPolicy" render={({ field }) => ( <FormItem> <FormLabel>Volatility Policy</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select VIX policy" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="allowAll">Allow all conditions</SelectItem> <SelectItem value="avoidHigh">Avoid Elevated/Extreme VIX</SelectItem> <SelectItem value="onlyLowNormal">Only trade in Calm/Normal VIX</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                                                    <FormField control={form.control} name="ruleSet.contextRules.avoidNews" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 bg-muted/50"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Avoid major news events</FormLabel><FormDescription>Requires manual awareness in prototype.</FormDescription></div></FormItem>)} />
                                                    <RuleEditorFormItem name="ruleSet.contextRules.otherRules" label="Other Context Rules" tooltipText="Any other environmental conditions that must be met." placeholder="e.g., BTC.D must be trending up" />
                                                </div>
                                            )}
                                            {currentStep === 6 && (
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold">Review & Save</h3>
                                                    {editingId && ( <FormField control={form.control} name="changeNotes" render={({ field }) => ( <FormItem> <FormLabel>What's new in this version?</FormLabel> <FormControl> <Textarea placeholder="e.g., 'Tightened SL rule and added a new entry confirmation.'" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                                                    )}
                                                    <p>Final review of all structured rules will be available in the detail view after saving.</p>
                                                </div>
                                            )}
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card className="bg-muted/30">
                            <CardHeader>
                                <CardTitle>Start with a Template</CardTitle>
                                <CardDescription>
                                    <InfoTooltip text="Templates are editable. Saving creates your v1 strategy.">
                                        <span className="flex items-center gap-1.5 cursor-help">
                                            Recommended for most users. You can edit everything.
                                            <Info className="h-3 w-3 text-muted-foreground/80" />
                                        </span>
                                    </InfoTooltip>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {strategyTemplates.map(template => (
                                    <Card key={template.id} onClick={() => handleTemplateSelect(template.id)} className="cursor-pointer hover:border-primary transition-colors bg-muted">
                                        <CardHeader>
                                            <CardTitle className="text-base">{template.name}</CardTitle>
                                            <CardDescription>{template.description}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </CardContent>
                            <CardFooter className="flex-col items-start gap-4">
                                <Separator />
                                <Button variant="link" className="p-0 h-auto" onClick={() => setWizardStarted(true)}>Or start from scratch</Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <RulebookPreview form={form} />
                </div>
            </div>
            
            <div className="flex justify-between items-center">
                <Button type="button" variant="ghost" onClick={handleBack}>{wizardStarted ? "Back" : "Cancel"}</Button>
                {wizardStarted && (
                     <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => onSaveDraft(form.getValues())}><Save className="mr-2 h-4 w-4"/>Save as Draft</Button>
                        <Button type="button" onClick={handleNext}>{currentStep === creationSteps.length - 1 ? (editingId ? "Save New Version" : "Save Strategy") : "Next"}</Button>
                    </div>
                )}
            </div>
        </div>
    );
}


export function StrategyManagementModule({ onSetModule }: StrategyManagementModuleProps) {
    const [strategies, setStrategies] = useState<StrategyGroup[]>([]);
    const [viewingStrategy, setViewingStrategy] = useState<StrategyGroup | null>(null);
    const [editingStrategy, setEditingStrategy] = useState<StrategyGroup | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
    const { toast } = useToast();
    const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
    const [strategyToDuplicate, setStrategyToDuplicate] = useState<StrategyGroup | null>(null);
    const [newStrategyName, setNewStrategyName] = useState('');

    const [filters, setFilters] = useState<StrategyFilters>({
        search: '',
        type: 'All',
        timeframe: 'All',
        sort: 'recentlyUsed',
    });

    const updateStrategies = (updatedStrategies: StrategyGroup[]) => {
        setStrategies(updatedStrategies);
        if(typeof window !== "undefined") {
            localStorage.setItem("ec_strategies", JSON.stringify(updatedStrategies));
        }
    };

    const loadStrategies = (forceSeed = false) => {
        if (typeof window !== "undefined") {
            try {
                const savedStrategies = localStorage.getItem("ec_strategies");
                if (!savedStrategies || forceSeed) {
                    localStorage.setItem("ec_strategies", JSON.stringify(seedStrategies));
                    setStrategies(seedStrategies);
                    if(forceSeed) toast({ title: "Demo strategies generated." });
                } else {
                    setStrategies(JSON.parse(savedStrategies));
                }
            } catch (e) {
                console.error("Failed to parse strategies from localStorage", e);
                setStrategies(seedStrategies);
            }
        }
    };

    useEffect(() => {
        loadStrategies();

        if (typeof window !== "undefined") {
            try {
                const savedUiState = localStorage.getItem("ec_strategy_ui_state");
                if (savedUiState) {
                    setFilters(JSON.parse(savedUiState));
                }
            } catch (e) {
                console.error("Failed to parse strategy UI state from localStorage", e);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem("ec_strategy_ui_state", JSON.stringify(filters));
            } catch (e) {
                console.error("Failed to save strategy UI state to localStorage", e);
            }
        }
    }, [filters]);

    const handleFilterChange = (key: keyof StrategyFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    
    const handleArchive = () => {
        if (!viewingStrategy) return;
        const newStatus = viewingStrategy.status === 'active' ? 'archived' : 'active';
        const updatedStrategies = strategies.map(s => 
            s.strategyId === viewingStrategy.strategyId ? { ...s, status: newStatus } : s
        );
        updateStrategies(updatedStrategies);
        setViewingStrategy(prev => prev ? { ...prev, status: newStatus } : null);
        toast({ title: `Strategy ${newStatus === 'archived' ? 'Archived' : 'Restored'}` });
    };

    const handleMakeActive = (versionId: string) => {
        if (!viewingStrategy) return;
        const updatedStrategies = strategies.map(s => {
            if (s.strategyId === viewingStrategy.strategyId) {
                const newVersions = s.versions.map(v => ({
                    ...v,
                    isActiveVersion: v.versionId === versionId
                }));
                return { ...s, versions: newVersions };
            }
            return s;
        });
        updateStrategies(updatedStrategies);
        const updatedStrategy = updatedStrategies.find(s => s.strategyId === viewingStrategy.strategyId);
        if(updatedStrategy) {
            setViewingStrategy(updatedStrategy);
        }
        toast({ title: "Active version updated" });
    };

    const handleSaveStrategy = (data: StrategyCreationValues, status: 'active' | 'draft', editingId?: string) => {
        if (editingId) {
            // This is an edit, so we create a new version.
            const updatedStrategies = strategies.map(s => {
                if (s.strategyId === editingId) {
                    const latestVersionNumber = Math.max(...s.versions.map(v => v.versionNumber));
                    const newVersion: StrategyVersion = {
                        versionId: `sv_${s.strategyId}_${latestVersionNumber + 1}`,
                        versionNumber: latestVersionNumber + 1,
                        isActiveVersion: true,
                        createdAt: new Date().toISOString(),
                        changeNotes: data.changeNotes,
                        description: data.description,
                        difficulty: data.difficulty as any,
                        ruleSet: data.ruleSet,
                        usageCount: 0,
                        lastUsedAt: null,
                    };

                    const updatedVersions = s.versions.map(v => ({...v, isActiveVersion: false}));
                    
                    const updatedStrategy = {
                        ...s,
                        name: data.name,
                        type: data.type as any,
                        timeframes: data.timeframes,
                        status: 'active' as 'active', // Ensure it's active on edit
                        versions: [...updatedVersions, newVersion],
                    };
                    
                    setViewingStrategy(updatedStrategy);
                    return updatedStrategy;
                }
                return s;
            });

            updateStrategies(updatedStrategies);
            toast({
                title: `Strategy saved as v${Math.max(...updatedStrategies.find(s => s.strategyId === editingId)!.versions.map(v => v.versionNumber))}`,
                description: "Historical trades will still reference older versions.",
            });
        } else {
            // This is a new strategy.
            const newStrategy: StrategyGroup = {
                strategyId: `strat_${Date.now()}`,
                name: data.name,
                type: data.type as any,
                timeframes: data.timeframes,
                createdAt: new Date().toISOString(),
                status,
                versions: [
                    {
                        versionId: `sv_${Date.now()}_1`,
                        versionNumber: 1,
                        isActiveVersion: true,
                        createdAt: new Date().toISOString(),
                        changeNotes: "Initial creation.",
                        description: data.description,
                        difficulty: data.difficulty as any,
                        ruleSet: data.ruleSet,
                        usageCount: 0,
                        lastUsedAt: null,
                    }
                ]
            };
            const updatedStrategies = [...strategies, newStrategy];
            updateStrategies(updatedStrategies);
            
            if (status === 'active') {
                toast({ title: "Strategy saved", description: "Trade Planning can now enforce this rulebook." });
                setViewingStrategy(newStrategy);
            } else {
                toast({ title: "Draft saved" });
            }
        }
        
        setViewMode('list');
        setEditingStrategy(null);
    };

    const handleEdit = (strategy: StrategyGroup) => {
        setViewingStrategy(null);
        setEditingStrategy(strategy);
        setViewMode('edit');
    };

    const handleDelete = () => {
        if (!viewingStrategy) return;
        
        const isUsed = viewingStrategy.versions.some(v => v.usageCount > 0);
        if (isUsed) {
            toast({
                variant: 'destructive',
                title: "Cannot delete strategy",
                description: "This strategy has been used in executed trades and cannot be deleted."
            });
            return;
        }

        const updatedStrategies = strategies.filter(s => s.strategyId !== viewingStrategy.strategyId);
        updateStrategies(updatedStrategies);
        setViewingStrategy(null);
        toast({ title: "Strategy deleted" });
    };

    const openDuplicateDialog = (strategy: StrategyGroup) => {
        setStrategyToDuplicate(strategy);
        setNewStrategyName(`${strategy.name} (Copy)`);
        setIsDuplicateDialogOpen(true);
    };

    const confirmDuplicate = () => {
        if (!strategyToDuplicate) return;

        const activeVersion = strategyToDuplicate.versions.find(v => v.isActiveVersion);
        if (!activeVersion) {
            toast({ variant: 'destructive', title: "Cannot duplicate", description: "Source strategy has no active version." });
            return;
        }
        
        const newStrategyData: StrategyCreationValues = {
            name: newStrategyName,
            type: strategyToDuplicate.type,
            timeframes: strategyToDuplicate.timeframes,
            description: activeVersion.description,
            difficulty: activeVersion.difficulty,
            changeNotes: `Copied from ${strategyToDuplicate.name} v${activeVersion.versionNumber}`,
            ruleSet: JSON.parse(JSON.stringify(activeVersion.ruleSet)), // deep copy
        };
        
        // This is a bit of a hack: Pass data via state to the create view
        setEditingStrategy({ 
            ...strategyToDuplicate,
            strategyId: 'temp_duplicate_id', // Temporary ID
            versions: [ // Fake a version to pass data
                {
                    ...activeVersion,
                    ruleSet: { ...newStrategyData.ruleSet }
                }
            ],
            name: newStrategyName,
        });

        setViewMode('create');
        
        setIsDuplicateDialogOpen(false);
        setStrategyToDuplicate(null);
    };

    const filteredStrategies = useMemo(() => {
        if (!strategies) return [];
        return strategies.filter(s => {
            if (!s.timeframes) s.timeframes = []; // Data correction
            const searchMatch = s.name.toLowerCase().includes(filters.search.toLowerCase()) || s.type.toLowerCase().includes(filters.search.toLowerCase());
            const typeMatch = filters.type === 'All' || s.type === filters.type;
            const timeframeMatch = filters.timeframe === 'All' || (s.timeframes && s.timeframes.includes(filters.timeframe));
            return searchMatch && typeMatch && timeframeMatch;
        }).sort((a, b) => {
            const aLastUsed = a.versions.find(v => v.isActiveVersion)?.lastUsedAt;
            const bLastUsed = b.versions.find(v => v.isActiveVersion)?.lastUsedAt;
            
            switch (filters.sort) {
                case 'mostUsed':
                    return b.versions.reduce((acc, v) => acc + v.usageCount, 0) - a.versions.reduce((acc, v) => acc + v.usageCount, 0);
                case 'recentlyCreated':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'recentlyUsed':
                default:
                    if (aLastUsed && bLastUsed) {
                        return new Date(bLastUsed).getTime() - new Date(aLastUsed).getTime();
                    }
                    if (aLastUsed) return -1;
                    if (bLastUsed) return 1;
                    return 0;
            }
        });
    }, [strategies, filters]);
    
    const activeStrategies = filteredStrategies.filter(s => s.status === 'active' || s.status === 'draft');
    const archivedStrategies = filteredStrategies.filter(s => s.status === 'archived');
    
    const strategyTypes = ['All', 'Breakout', 'Pullback', 'Reversal', 'Scalping', 'SMC', 'Custom'];
    const timeframes = ['All', '1m', '5m', '15m', '1H', '4H', '1D'];
    
    useEffect(() => {
        if(viewMode === 'create' && editingStrategy && editingStrategy.strategyId === 'temp_duplicate_id') {
            const initialData: StrategyCreationValues = {
                name: editingStrategy.name,
                type: editingStrategy.type,
                timeframes: editingStrategy.timeframes,
                description: editingStrategy.versions[0].description,
                difficulty: editingStrategy.versions[0].difficulty,
                ruleSet: { ...editingStrategy.versions[0].ruleSet }
            };

            const event = new CustomEvent('populate-creator-form', { detail: initialData });
            window.dispatchEvent(event);
            setEditingStrategy(null); // Clear temp state
        }
    }, [viewMode, editingStrategy]);

    if (viewMode === 'create' || viewMode === 'edit') {
        let initialData: StrategyCreationValues | null = null;
        if(viewMode === 'edit' && editingStrategy) {
            const activeVersion = editingStrategy.versions.find(v => v.isActiveVersion);
            if (activeVersion) {
                initialData = { 
                    name: editingStrategy.name, 
                    type: editingStrategy.type, 
                    timeframes: editingStrategy.timeframes, 
                    changeNotes: '',
                    description: activeVersion.description,
                    difficulty: activeVersion.difficulty,
                    ruleSet: activeVersion.ruleSet
                }
            }
        }
        
        if(viewMode === 'create' && editingStrategy && editingStrategy.strategyId === 'temp_duplicate_id'){
            const activeVersion = editingStrategy.versions[0];
            initialData = {
                name: editingStrategy.name,
                type: editingStrategy.type,
                timeframes: editingStrategy.timeframes,
                description: activeVersion.description,
                difficulty: activeVersion.difficulty,
                ruleSet: activeVersion.ruleSet
            };
        }

        return <StrategyCreatorView 
            onBack={() => { setViewMode('list'); setEditingStrategy(null); }} 
            onSave={(data) => handleSaveStrategy(data, 'active', viewMode === 'edit' ? editingStrategy?.strategyId : undefined)}
            onSaveDraft={(data) => handleSaveStrategy(data, 'draft', viewMode === 'edit' ? editingStrategy?.strategyId : undefined)}
            initialData={initialData}
            editingId={viewMode === 'edit' ? editingStrategy?.strategyId : undefined}
        />;
    }


    if (viewingStrategy) {
        return <StrategyDetailView 
            strategy={viewingStrategy} 
            onBack={() => setViewingStrategy(null)}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onMakeActive={handleMakeActive}
            onEdit={handleEdit}
            onSetModule={onSetModule}
        />;
    }

    return (
        <div className="space-y-8">
            <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
                 <DialogContentNonAlertDialog>
                    <DialogHeaderNonAlertDialog>
                        <DialogTitleNonAlertDialog>Duplicate Strategy</DialogTitleNonAlertDialog>
                    </DialogHeaderNonAlertDialog>
                    <div className="py-4">
                        <Label htmlFor="new-strategy-name">New Strategy Name</Label>
                        <Input 
                            id="new-strategy-name" 
                            value={newStrategyName}
                            onChange={(e) => setNewStrategyName(e.target.value)}
                        />
                    </div>
                    <DialogFooterNonAlertDialog>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="button" onClick={confirmDuplicate}>Duplicate and Edit</Button>
                    </DialogFooterNonAlertDialog>
                </DialogContentNonAlertDialog>
            </Dialog>

            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Strategy Management</h1>
                <p className="text-muted-foreground">Your rulebook. Every trade must belong to a strategy.</p>
            </div>

            <Card className="bg-muted/30 border-dashed border-2">
                 <CardContent className="p-6 text-center flex flex-col items-center">
                    <h2 className="text-xl font-bold">Define Your Playbook</h2>
                    <div className="text-muted-foreground mt-2 max-w-2xl text-center space-y-1 text-sm">
                        <p>Create strategies as templates with strict, repeatable rules for entries, exits, and risk.</p>
                        <p>The Trade Planning module validates every plan against these rules to enforce discipline.</p>
                        <p>Edits create new versions of a strategy, preserving historical analytics to track what works over time.</p>
                    </div>
                </CardContent>
            </Card>

            {strategies.length === 0 ? (
                <Card className="bg-muted/30 text-center py-12">
                    <CardHeader>
                        <CardTitle>No strategies yet</CardTitle>
                        <CardDescription>Create your first rulebook so Arjun can enforce discipline in Trade Planning.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center gap-4">
                        <Button onClick={() => setViewMode('create')}><PlusCircle className="mr-2 h-4 w-4" /> Create Strategy</Button>
                        <Button variant="outline" onClick={() => loadStrategies(true)}>
                            <Zap className="mr-2 h-4 w-4" />
                            Generate demo strategies
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <CardTitle>Your Playbook</CardTitle>
                            <Button className="w-full md:w-auto" onClick={() => setViewMode('create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Strategy
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or type..."
                                    className="pl-9"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
                                    <SelectTrigger><SelectValue placeholder="Filter by type..." /></SelectTrigger>
                                    <SelectContent>
                                        {strategyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.timeframe} onValueChange={(v) => handleFilterChange('timeframe', v)}>
                                    <SelectTrigger><SelectValue placeholder="Filter by timeframe..." /></SelectTrigger>
                                    <SelectContent>
                                        {timeframes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.sort} onValueChange={(v) => handleFilterChange('sort', v as SortOption)}>
                                    <SelectTrigger><SelectValue placeholder="Sort by..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="recentlyUsed">Recently Used</SelectItem>
                                        <SelectItem value="mostUsed">Most Used</SelectItem>
                                        <SelectItem value="recentlyCreated">Recently Created</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Tabs defaultValue="active" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 max-w-md">
                                <TabsTrigger value="active">Active & Drafts ({activeStrategies.length})</TabsTrigger>
                                <TabsTrigger value="archived">Archived ({archivedStrategies.length})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="active" className="mt-6">
                                {activeStrategies.length > 0 ? (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activeStrategies.map(strategy => (
                                            <StrategyCard 
                                                key={strategy.strategyId} 
                                                strategy={strategy} 
                                                onOpen={setViewingStrategy} 
                                                onEdit={handleEdit} 
                                                onDuplicate={openDuplicateDialog}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm text-center py-8">No active strategies match your filters.</p>
                                )}
                            </TabsContent>
                            <TabsContent value="archived" className="mt-6">
                                {archivedStrategies.length > 0 ? (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {archivedStrategies.map(strategy => (
                                            <StrategyCard 
                                                key={strategy.strategyId} 
                                                strategy={strategy} 
                                                onOpen={setViewingStrategy} 
                                                onEdit={handleEdit}
                                                onDuplicate={openDuplicateDialog}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm text-center py-8">No archived strategies.</p>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}



    