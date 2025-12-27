

"use client";

import { Button } from "@/components/ui/button";
import { BrainCircuit, PlusCircle, CheckCircle, Search, Filter as FilterIcon, Clock, ListOrdered, FileText, Gauge, Calendar, ShieldCheck, Zap, MoreHorizontal, ArrowLeft, Edit, Archive, Star, BookOpen, BarChartHorizontal, Trash2, ChevronsUpDown, Info, Check, Save, Copy, CircleDashed, ArrowRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";


interface StrategyManagementModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

// Data models based on user request
type StrategyVersion = {
    versionId: string;
    versionNumber: number;
    isActiveVersion: boolean;
    createdAt: string;
    fields: {
        description?: string;
        difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
        entryConditions: string[];
        stopLossRules: string[];
        takeProfitRules: string[];
        riskManagementRules: string[];
        contextRules: string[];
    };
    usageCount: number;
    lastUsedAt: string | null;
};

type StrategyGroup = {
    strategyId: string;
    name: string;
    type: 'Reversal' | 'Trend-Following' | 'Scalping' | 'Breakout' | 'Pullback' | 'SMC' | 'Custom';
    timeframes: string[];
    createdAt: string;
    status: 'active' | 'archived';
    versions: StrategyVersion[];
};


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
                fields: {
                    description: "A classic breakout strategy for trending markets.",
                    difficulty: "Intermediate",
                    entryConditions: ["Price breaks out of a 4-hour consolidation range", "Breakout candle has above-average volume", "Enter on a retest of the broken level"],
                    stopLossRules: ["Stop-loss is below the mid-point of the consolidation range"],
                    takeProfitRules: ["Target is the next major liquidity level"],
                    riskManagementRules: ["Max risk 1% of account", "Max daily loss 3%", "Max daily trades 4", "Leverage cap 20x"],
                    contextRules: ["Only trade during NY session", "Avoid trading during major news events (e.g., FOMC)"]
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
                fields: {
                    description: "Entering a strong existing trend on a dip.",
                    difficulty: "Intermediate",
                    entryConditions: ["Market is in a clear uptrend/downtrend on 4H", "Price pulls back to the 1H 21 EMA", "Enter on a bullish/bearish candle that respects the EMA"],
                    stopLossRules: ["Stop-loss is behind the most recent swing structure"],
                    takeProfitRules: ["Target is the previous swing high/low"],
                    riskManagementRules: ["Max risk 1.5% of account", "Max daily loss 4%", "Max daily trades 3"],
                    contextRules: ["Only valid when 1H and 4H timeframes are aligned", "Avoid if VIX is in 'Extreme' zone"]
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
                fields: {
                    description: "Trading mean reversion in a range-bound market.",
                    difficulty: "Advanced",
                    entryConditions: ["Price is in a clearly defined range on 1H", "Price sweeps the high/low of the range on 5m", "Enter when 5m candle closes back inside the range"],
                    stopLossRules: ["Stop-loss is above/below the wick of the sweep candle"],
                    takeProfitRules: ["Target is the mid-point of the range (0.5 level)"],
                    riskManagementRules: ["Max risk 0.75% of account", "Max daily loss 2.5%", "Leverage cap 50x"],
                    contextRules: ["Only valid when VIX is 'Normal' or 'Calm'", "Do not trade this during trend-following days"]
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

const RuleItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{label}: <span className="font-semibold text-foreground">{value}</span></p>
        </div>
    );
};

function StrategyCard({ strategy, onOpen }: { strategy: StrategyGroup, onOpen: (strategy: StrategyGroup) => void }) {
    const activeVersion = strategy.versions.find(v => v.isActiveVersion);
    const totalUsage = strategy.versions.reduce((sum, v) => sum + v.usageCount, 0);

    const parseRule = (rules: string[], keyword: string): string | null => {
        const rule = rules.find(r => r.toLowerCase().includes(keyword.toLowerCase()));
        if (!rule) return null;
        const value = rule.split(' ').find(part => part.includes('%') || part.includes('x') || Number.isInteger(Number(part)));
        return value || null;
    };

    const riskRules = activeVersion?.fields.riskManagementRules || [];
    const contextRules = activeVersion?.fields.contextRules || [];

    const riskPerTrade = parseRule(riskRules, "Max risk");
    const maxDailyLoss = parseRule(riskRules, "Max daily loss");
    const maxDailyTrades = parseRule(riskRules, "Max daily trades");
    const leverageCap = parseRule(riskRules, "Leverage cap");

    const timeRestriction = contextRules.find(r => r.toLowerCase().includes('session'));
    const vixRestriction = contextRules.find(r => r.toLowerCase().includes('vix'));
    
    return (
        <Card className="bg-muted/40 hover:bg-muted/60 transition-colors flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{strategy.name}</CardTitle>
                    <Badge variant={strategy.status === 'active' ? 'secondary' : 'outline'} className={cn(
                        strategy.status === 'active' && 'bg-green-500/10 text-green-400 border-green-500/20'
                    )}>
                        {strategy.status === 'active' ? 'Active' : 'Archived'}
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
                        <RuleItem icon={ShieldCheck} label="Risk/trade" value={riskPerTrade} />
                        <RuleItem icon={Gauge} label="Max loss/day" value={maxDailyLoss} />
                        <RuleItem icon={ListOrdered} label="Max trades/day" value={maxDailyTrades} />
                        <RuleItem icon={FileText} label="Leverage cap" value={leverageCap} />
                    </div>
                </div>
                <div className="p-3 rounded-md bg-muted border space-y-3">
                    <h4 className="font-semibold text-xs text-muted-foreground">Context Rules Snapshot</h4>
                     <div className="grid grid-cols-2 gap-2">
                        <RuleItem icon={Clock} label="Time" value={timeRestriction ? timeRestriction.split(' ').slice(-2).join(' ') : 'Any'} />
                        <RuleItem icon={Calendar} label="Volatility" value={vixRestriction ? vixRestriction.split(' ').slice(1,3).join(' ') : 'Any'} />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                <div className="w-full text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Active version:</span> <span>v{activeVersion?.versionNumber || '-'}</span></div>
                    <div className="flex justify-between"><span>Total trades:</span> <span>{totalUsage}</span></div>
                </div>
                <div className="w-full flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => onOpen(strategy)}>Open</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="px-2">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
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

const RulesCard = ({ title, rules }: { title: string; rules: string[] }) => (
    <Card className="bg-muted/50 border-border/50">
        <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {rules && rules.length > 0 ? (
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    {rules.map((rule, i) => <li key={i}>{rule}</li>)}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground italic">Not defined (add in next version)</p>
            )}
        </CardContent>
    </Card>
);

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
    onSetModule,
}: { 
    strategy: StrategyGroup; 
    onBack: () => void;
    onArchive: () => void;
    onDelete: () => void;
    onMakeActive: (versionId: string) => void;
    onSetModule: (module: any, context?: any) => void;
}) {
    const [selectedVersion, setSelectedVersion] = useState<StrategyVersion | undefined>(strategy.versions.find(v => v.isActiveVersion));

    if (!selectedVersion) return null; // Should not happen if data is correct

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <Button variant="ghost" onClick={onBack} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Playbook
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" disabled>
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
                                                disabled
                                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                                onSelect={(e) => e.preventDefault()}
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
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="version-selector">Viewing Version</Label>
                                        <Select
                                            value={selectedVersion.versionId}
                                            onValueChange={(vId) => setSelectedVersion(strategy.versions.find(v => v.versionId === vId))}
                                        >
                                            <SelectTrigger id="version-selector">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {strategy.versions.map(v => (
                                                    <SelectItem key={v.versionId} value={v.versionId}>
                                                        <div className="flex items-center gap-2">
                                                            {v.isActiveVersion && <Star className="h-4 w-4 text-primary" />}
                                                            <span>Version {v.versionNumber} {v.isActiveVersion && '(Active)'}</span>
                                                            <span className="ml-auto text-xs text-muted-foreground">({new Date(v.createdAt).toLocaleDateString()})</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-2 pt-2">
                                        <div className="flex justify-between"><span>Created:</span> <span className="font-medium text-foreground">{new Date(selectedVersion.createdAt).toLocaleDateString()}</span></div>
                                        <div className="flex justify-between"><span>Trades with this version:</span> <span className="font-medium text-foreground">{selectedVersion.usageCount}</span></div>
                                    </div>
                                    {!selectedVersion.isActiveVersion && (
                                        <Button className="w-full" variant="outline" onClick={() => onMakeActive(selectedVersion.versionId)}>
                                            <Star className="mr-2 h-4 w-4" />
                                            Make this version active
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <RulesCard title="Description / When to Use" rules={selectedVersion.fields.description ? [selectedVersion.fields.description] : []} />
                        <RulesCard title="Entry Rules" rules={selectedVersion.fields.entryConditions} />
                        <RulesCard title="Stop Loss Rules" rules={selectedVersion.fields.stopLossRules} />
                        <RulesCard title="Take Profit Rules" rules={selectedVersion.fields.takeProfitRules} />
                        <RulesCard title="Risk Management Rules" rules={selectedVersion.fields.riskManagementRules} />
                        <RulesCard title="Context Rules" rules={selectedVersion.fields.contextRules} />
                    </div>
                </div>
            </div>
        </div>
    );
}

const strategyCreationSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters."),
    type: z.string().min(1, "Please select a type."),
    timeframes: z.array(z.string()).min(1, "Select at least one timeframe."),
    description: z.string().optional(),
    difficulty: z.string().optional(),
    entryConditions: z.array(z.string()).min(1, "At least one entry rule is required."),
    stopLossRules: z.array(z.string()).min(1, "At least one stop loss rule is required."),
    takeProfitRules: z.array(z.string()),
    riskManagementRules: z.array(z.string()),
    contextRules: z.array(z.string()),
});

type StrategyCreationValues = z.infer<typeof strategyCreationSchema>;

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
    if (text.length < 12) return { status: 'vague', hint: "This seems too short to be a testable rule." };

    const vagueWords = ['good', 'nice', 'strong', 'weak', 'seems', 'looks like', 'feel', 'maybe', 'probably', 'might'];
    if (vagueWords.some(word => lowerText.includes(word))) {
        return { status: 'vague', hint: "Try to avoid subjective words like 'good' or 'strong'. Use measurable terms." };
    }

    const clearWords = ['ema', 'rsi', 'macd', 'volume', 'break', 'retest', 'high', 'low', 'close', 'above', 'below', 'cross', 'divergence', 'consolidation', 'range', 'wick', 'sweep'];
    if (clearWords.some(word => lowerText.includes(word))) {
        return { status: 'clear', hint: "Good job! This rule includes specific, testable conditions." };
    }

    return { status: 'neutral', hint: null };
};

const RuleEditor = ({ value, onChange, placeholder }: { value: string[]; onChange: (value: string[]) => void; placeholder: string; }) => {
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
  
const strategyTemplates: (Omit<StrategyCreationValues, 'name'> & {id: string, name: string, description: string})[] = [
    {
        id: 'breakout',
        name: "Breakout Trend",
        description: "For clear trends after consolidation.",
        type: 'Breakout',
        timeframes: ['15m'],
        entryConditions: ["Price breaks out of a 4-hour consolidation range", "Breakout candle has above-average volume"],
        stopLossRules: ["Stop-loss is below the mid-point of the consolidation range"],
        takeProfitRules: ["Target is the next major liquidity level"],
        riskManagementRules: ["Max risk 1% of account", "Leverage cap 20x"],
        contextRules: ["Only trade during NY session"]
    },
    {
        id: 'pullback',
        name: "Pullback Continuation",
        description: "For entering an existing strong trend.",
        type: 'Pullback',
        timeframes: ['1H'],
        entryConditions: ["Market is in a clear uptrend on 4H", "Price pulls back to the 1H 21 EMA"],
        stopLossRules: ["Stop-loss is behind the most recent swing structure"],
        takeProfitRules: ["Target is the previous swing high/low"],
        riskManagementRules: ["Max risk 1.5% of account"],
        contextRules: ["Avoid if VIX is in 'Extreme' zone"]
    },
    {
        id: 'range',
        name: "Range Fade",
        description: "For non-trending, range-bound markets.",
        type: 'Reversal',
        timeframes: ['5m'],
        entryConditions: ["Price is in a clearly defined range on 1H", "Price sweeps the high/low of the range on 5m"],
        stopLossRules: ["Stop-loss is above/below the wick of the sweep candle"],
        takeProfitRules: ["Target is the mid-point of the range"],
        riskManagementRules: ["Max risk 0.75% of account", "Max daily loss 2.5%"],
        contextRules: ["Only valid when VIX is 'Normal' or 'Calm'"]
    },
    {
        id: 'beginner',
        name: "Simple Beginner Strategy",
        description: "A basic, easy-to-follow plan.",
        type: 'Custom',
        timeframes: ['15m'],
        entryConditions: ["Price is above the 200 EMA", "RSI is not overbought/oversold"],
        stopLossRules: ["Stop-loss is 1.5x ATR below entry"],
        takeProfitRules: ["Take profit at 1.5R"],
        riskManagementRules: ["Max risk 1% of account"],
        contextRules: ["Only trade BTC or ETH", "Do not trade on weekends"]
    }
];

const RulebookPreview = ({ form }: { form: any }) => {
    const values = useWatch({ control: form.control }) as StrategyCreationValues;

    const allRules = [
        ...(values.entryConditions || []),
        ...(values.stopLossRules || []),
        ...(values.takeProfitRules || []),
        ...(values.riskManagementRules || []),
        ...(values.contextRules || []),
    ];
    
    const strengthScore = Math.min(100, (allRules.length / 10) * 100);
    let strengthLabel: 'Weak' | 'Medium' | 'Strong' = 'Weak';
    let strengthColor = 'bg-red-500';

    if (strengthScore > 66) {
        strengthLabel = 'Strong';
        strengthColor = 'bg-green-500';
    } else if (strengthScore > 33) {
        strengthLabel = 'Medium';
        strengthColor = 'bg-amber-500';
    }

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
                    <Label className="text-xs text-muted-foreground">Discipline Strength</Label>
                    <Progress value={strengthScore} indicatorClassName={strengthColor} className="h-2" />
                    <p className="text-xs font-semibold mt-1" style={{ color: strengthColor.replace('bg-', 'text-') }}>
                        {strengthLabel} ({allRules.length} rules defined)
                    </p>
                </div>

                <Separator />
                
                <div className="space-y-3 text-xs max-h-60 overflow-y-auto pr-2">
                    {allRules.length > 0 ? (
                        allRules.map((rule, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{rule}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground italic">
                            <CircleDashed className="h-3 w-3" />
                            <span>Your rules will appear here as you add them.</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

function StrategyCreatorView({ onBack, onSave }: { onBack: () => void; onSave: (data: StrategyCreationValues) => void; }) {
    const [currentStep, setCurrentStep] = useState(0);
    const { toast } = useToast();
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [wizardStarted, setWizardStarted] = useState(false);

    const creationSteps = [
        { name: "Basic Info", fields: ["name", "type", "timeframes"] },
        { name: "Entry Rules", fields: ["entryConditions"] },
        { name: "Stop Loss Rules", fields: ["stopLossRules"] },
        { name: "Take Profit Rules" },
        { name: "Risk Rules", fields: ["riskManagementRules"] },
        { name: "Context Rules", fields: ["contextRules"] },
        { name: "Review & Save" },
    ];
    
    const strategyTypes = ['Breakout', 'Pullback', 'Reversal', 'Scalping', 'SMC', 'Custom'];
    const timeframeOptions = ['1m', '5m', '15m', '1H', '4H', '1D'];
    const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced'];

    const form = useForm<StrategyCreationValues>({
        resolver: zodResolver(strategyCreationSchema),
        defaultValues: {
            name: '',
            type: '',
            timeframes: [],
            description: '',
            difficulty: '',
            entryConditions: [],
            stopLossRules: [],
            takeProfitRules: [],
            riskManagementRules: [],
            contextRules: [],
        },
    });

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
        } else {
            if (form.formState.isDirty) {
                setShowCancelDialog(true);
            } else {
                onBack();
            }
        }
    };
    
    const handleSaveDraft = () => {
        localStorage.setItem('ec_strategy_draft', JSON.stringify(form.getValues()));
        toast({ title: 'Draft saved!' });
    };
    
    const handleTemplateSelect = (templateId: string) => {
        const template = strategyTemplates.find(t => t.id === templateId);
        if(template) {
            form.reset({
                name: template.name,
                type: template.type,
                timeframes: template.timeframes,
                description: template.description,
                difficulty: '',
                entryConditions: template.entryConditions,
                stopLossRules: template.stopLossRules,
                takeProfitRules: template.takeProfitRules,
                riskManagementRules: template.riskManagementRules,
                contextRules: template.contextRules,
            });
            setWizardStarted(true);
        }
    };

    useEffect(() => {
        const draft = localStorage.getItem('ec_strategy_draft');
        if (draft) {
            form.reset(JSON.parse(draft));
            setWizardStarted(true);
        }
    }, [form]);

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
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Strategy</h1>
                <p className="text-muted-foreground">Build a rulebook Arjun can enforce.</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {wizardStarted ? (
                        <>
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
                                                        <FormField control={form.control} name="difficulty" render={({ field }) => (<FormItem><FormLabel>Difficulty (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger></FormControl><SelectContent>{difficultyOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
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
                                                                            const isSelected = field.value.includes(tf);
                                                                            return (
                                                                                <Button
                                                                                    key={tf}
                                                                                    type="button"
                                                                                    variant={isSelected ? "secondary" : "outline"}
                                                                                    onClick={() => {
                                                                                        const newValue = isSelected
                                                                                            ? field.value.filter(v => v !== tf)
                                                                                            : [...field.value, tf];
                                                                                        field.onChange(newValue);
                                                                                    }}
                                                                                >
                                                                                    {tf}
                                                                                </Button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </FormControl>
                                                                <FormDescription>Timeframe focus helps Arjun detect where you tend to break discipline.</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}
                                            {currentStep === 1 && <FormField control={form.control} name="entryConditions" render={({ field }) => (<FormItem><FormLabel>Entry Rules</FormLabel><FormControl><RuleEditor {...field} placeholder="e.g., Price breaks 4H consolidation..." /></FormControl><FormMessage /></FormItem>)} />}
                                            {currentStep === 2 && (
                                                <div className="space-y-4">
                                                    <FormField control={form.control} name="stopLossRules" render={({ field }) => (<FormItem><FormLabel>Stop Loss Rules</FormLabel><FormControl><RuleEditor {...field} placeholder="e.g., Below previous swing low OR fixed 0.8% from entry" /></FormControl><FormMessage /></FormItem>)} />
                                                    <p className="text-xs text-muted-foreground p-3 rounded-md bg-amber-950/20 border border-amber-500/20">
                                                        <span className="font-semibold text-amber-300">Why this matters:</span> Your Stop Loss is your psychological anchor. It's your promise to yourself about how much you're willing to risk. No SL = no EdgeCipher trade.
                                                    </p>
                                                </div>
                                            )}
                                            {currentStep === 3 && <FormField control={form.control} name="takeProfitRules" render={({ field }) => (<FormItem><FormLabel>Take Profit Rules (Optional)</FormLabel><FormDescription className="mb-2">It's highly recommended to define at least one exit condition for taking profit.</FormDescription><FormControl><RuleEditor {...field} placeholder="e.g., Target next major liquidity level or 2R" /></FormControl><FormMessage /></FormItem>)} />}
                                            {currentStep === 4 && <FormField control={form.control} name="riskManagementRules" render={({ field }) => (<FormItem><FormLabel>Risk Management Rules</FormLabel><FormControl><RuleEditor {...field} placeholder="e.g., Max risk 1% of account..." /></FormControl><FormMessage /></FormItem>)} />}
                                            {currentStep === 5 && <FormField control={form.control} name="contextRules" render={({ field }) => (<FormItem><FormLabel>Context Rules (when to trade/not trade)</FormLabel><FormControl><RuleEditor {...field} placeholder="e.g., Only trade during NY session..." /></FormControl><FormMessage /></FormItem>)} />}
                                            {currentStep === 6 && (
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold">Review & Save</h3>
                                                    <RulesCard title="Basic Info" rules={[`Name: ${form.getValues().name}`, `Type: ${form.getValues().type}`, `Timeframes: ${form.getValues().timeframes.join(', ')}`]} />
                                                    <RulesCard title="Entry Rules" rules={form.getValues().entryConditions} />
                                                    <RulesCard title="Stop Loss Rules" rules={form.getValues().stopLossRules} />
                                                    <RulesCard title="Take Profit Rules" rules={form.getValues().takeProfitRules} />
                                                    <RulesCard title="Risk Rules" rules={form.getValues().riskManagementRules} />
                                                    <RulesCard title="Context Rules" rules={form.getValues().contextRules} />
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
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="flex items-center gap-1.5 cursor-help">
                                                    Recommended for most users. You can edit everything.
                                                    <Info className="h-3 w-3 text-muted-foreground/80" />
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Templates are editable. Saving creates your v1 strategy.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
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
                        <Button type="button" variant="outline" onClick={handleSaveDraft}><Save className="mr-2 h-4 w-4"/>Save as Draft</Button>
                        <Button type="button" onClick={handleNext}>{currentStep === creationSteps.length - 1 ? "Save Strategy" : "Next"}</Button>
                    </div>
                )}
            </div>
        </div>
    );
}


export function StrategyManagementModule({ onSetModule }: StrategyManagementModuleProps) {
    const [strategies, setStrategies] = useState<StrategyGroup[]>([]);
    const [viewingStrategy, setViewingStrategy] = useState<StrategyGroup | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
    const { toast } = useToast();

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

    const handleSaveNewStrategy = (data: StrategyCreationValues) => {
        const newStrategy: StrategyGroup = {
            strategyId: `strat_${Date.now()}`,
            name: data.name,
            type: data.type as any,
            timeframes: data.timeframes,
            createdAt: new Date().toISOString(),
            status: 'active',
            versions: [
                {
                    versionId: `sv_${Date.now()}_1`,
                    versionNumber: 1,
                    isActiveVersion: true,
                    createdAt: new Date().toISOString(),
                    fields: {
                        description: data.description,
                        difficulty: data.difficulty as any,
                        entryConditions: data.entryConditions,
                        stopLossRules: data.stopLossRules,
                        takeProfitRules: data.takeProfitRules,
                        riskManagementRules: data.riskManagementRules,
                        contextRules: data.contextRules,
                    },
                    usageCount: 0,
                    lastUsedAt: null,
                }
            ]
        };
        const updatedStrategies = [...strategies, newStrategy];
        updateStrategies(updatedStrategies);
        toast({ title: "Strategy created!", description: `${data.name} has been added to your playbook.` });
        setViewMode('list');
        localStorage.removeItem('ec_strategy_draft');
    };

    const filteredStrategies = useMemo(() => {
        return strategies.filter(s => {
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
    
    const activeStrategies = filteredStrategies.filter(s => s.status === 'active');
    const archivedStrategies = filteredStrategies.filter(s => s.status === 'archived');
    
    const strategyTypes = ['All', 'Breakout', 'Pullback', 'Reversal', 'Scalping', 'SMC', 'Custom'];
    const timeframes = ['All', '1m', '5m', '15m', '1H', '4H', '1D'];

    if (viewMode === 'create') {
        return <StrategyCreatorView onBack={() => setViewMode('list')} onSave={handleSaveNewStrategy} />;
    }

    if (viewingStrategy) {
        return <StrategyDetailView 
            strategy={viewingStrategy} 
            onBack={() => setViewingStrategy(null)}
            onArchive={handleArchive}
            onDelete={() => { /* no-op for now */ }}
            onMakeActive={handleMakeActive}
            onSetModule={onSetModule}
        />;
    }

    return (
        <div className="space-y-8">
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
                                <TabsTrigger value="active">Active Strategies ({activeStrategies.length})</TabsTrigger>
                                <TabsTrigger value="archived">Archived ({archivedStrategies.length})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="active" className="mt-6">
                                {activeStrategies.length > 0 ? (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activeStrategies.map(strategy => (
                                            <StrategyCard key={strategy.strategyId} strategy={strategy} onOpen={setViewingStrategy} />
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
                                            <StrategyCard key={strategy.strategyId} strategy={strategy} onOpen={setViewingStrategy} />
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
