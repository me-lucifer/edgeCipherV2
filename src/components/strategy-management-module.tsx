
"use client";

import { Button } from "@/components/ui/button";
import { BrainCircuit, PlusCircle, CheckCircle, Search, Filter as FilterIcon, Clock, ListOrdered, FileText, Gauge, Calendar, ShieldCheck } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
        entryConditions: string[];
        exitConditions: string[];
        riskManagementRules: string[];
    };
    usageCount: number;
    lastUsedAt: string | null;
};

type StrategyGroup = {
    strategyId: string;
    name: string;
    type: 'Reversal' | 'Trend-Following' | 'Scalping' | 'Breakout' | 'Pullback' | 'SMC' | 'Custom';
    timeframe: '5m' | '15m' | '1H' | '4H';
    createdAt: string;
    status: 'active' | 'archived';
    versions: StrategyVersion[];
};


const seedStrategies: StrategyGroup[] = [
    {
        strategyId: 'strat_1',
        name: "London Reversal",
        type: 'Reversal',
        timeframe: '15m',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        status: 'active',
        versions: [
            {
                versionId: 'sv_1_1',
                versionNumber: 1,
                isActiveVersion: true,
                createdAt: new Date().toISOString(),
                fields: {
                    entryConditions: ["Price sweeps Asia high/low", "Divergence on 5-min RSI", "Entry on first 15-min candle to close back inside range"],
                    exitConditions: ["Target is opposing side of daily range", "Stop-loss is 2x ATR above/below the wick"],
                    riskManagementRules: ["Max risk 1% of account", "Max daily loss 3%", "Max daily trades 5", "Leverage cap 20x", "Avoid Elevated/Extreme VIX"]
                },
                usageCount: 28,
                lastUsedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            }
        ]
    },
    {
        strategyId: 'strat_2',
        name: "BTC Trend Breakout",
        type: 'Breakout',
        timeframe: '1H',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        status: 'active',
        versions: [
             {
                versionId: 'sv_2_2',
                versionNumber: 2,
                isActiveVersion: true,
                createdAt: new Date().toISOString(),
                fields: {
                    entryConditions: ["4+ hours of consolidation", "Breakout candle closes with high volume", "Enter on retest of the breakout level"],
                    exitConditions: ["Target is 2R minimum", "Stop-loss is below the consolidation range"],
                    riskManagementRules: ["Max risk 1.5% of account", "Max daily loss 4%", "Max daily trades 3", "Leverage cap 10x", "Only trade during NY session"]
                },
                usageCount: 18,
                lastUsedAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
                versionId: 'sv_2_1',
                versionNumber: 1,
                isActiveVersion: false,
                createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
                fields: { entryConditions: [], exitConditions: [], riskManagementRules: [] },
                usageCount: 27,
                lastUsedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            }
        ]
    },
    {
        strategyId: 'strat_3',
        name: "Old Scalping System",
        type: 'Scalping',
        timeframe: '5m',
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        status: 'archived',
        versions: [
            {
                versionId: 'sv_3_1',
                versionNumber: 1,
                isActiveVersion: true,
                createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
                fields: { entryConditions: [], exitConditions: [], riskManagementRules: ["Max risk 0.5% of account", "Max daily loss 2%"] },
                usageCount: 102,
                lastUsedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
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

function StrategyCard({ strategy }: { strategy: StrategyGroup }) {
    const activeVersion = strategy.versions.find(v => v.isActiveVersion);
    const totalUsage = strategy.versions.reduce((sum, v) => sum + v.usageCount, 0);

    const parseRule = (rules: string[], keyword: string): string | null => {
        const rule = rules.find(r => r.toLowerCase().includes(keyword.toLowerCase()));
        if (!rule) return null;
        return rule.replace(new RegExp(keyword, 'i'), '').trim();
    };

    const riskRules = activeVersion?.fields.riskManagementRules || [];
    const contextRules = activeVersion?.fields.riskManagementRules || [];

    const riskPerTrade = parseRule(riskRules, "Max risk");
    const maxDailyLoss = parseRule(riskRules, "Max daily loss");
    const maxDailyTrades = parseRule(riskRules, "Max daily trades");
    const leverageCap = parseRule(riskRules, "Leverage cap");

    const timeRestriction = parseRule(contextRules, "Only trade during");
    const vixRestriction = parseRule(contextRules, "Avoid");
    
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
                        <RuleItem icon={Clock} label="Time" value={timeRestriction} />
                        <RuleItem icon={Calendar} label="Volatility" value={vixRestriction} />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                <div className="w-full text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Active version:</span> <span>v{activeVersion?.versionNumber || '-'}</span></div>
                    <div className="flex justify-between"><span>Total trades:</span> <span>{totalUsage}</span></div>
                </div>
                <div className="w-full grid grid-cols-3 gap-2">
                    <Button size="sm" className="col-span-3">Open</Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground" disabled>Duplicate</Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground" disabled>
                        {strategy.status === 'active' ? "Archive" : "Unarchive"}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

export function StrategyManagementModule({ onSetModule }: StrategyManagementModuleProps) {
    const [strategies, setStrategies] = useState<StrategyGroup[]>([]);
    const [filters, setFilters] = useState<StrategyFilters>({
        search: '',
        type: 'All',
        timeframe: 'All',
        sort: 'recentlyUsed',
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const savedStrategies = localStorage.getItem("ec_strategies");
                if (!savedStrategies) {
                    localStorage.setItem("ec_strategies", JSON.stringify(seedStrategies));
                    setStrategies(seedStrategies);
                } else {
                    setStrategies(JSON.parse(savedStrategies));
                }

                const savedUiState = localStorage.getItem("ec_strategy_ui_state");
                if (savedUiState) {
                    setFilters(JSON.parse(savedUiState));
                }
            } catch (e) {
                console.error("Failed to parse strategies from localStorage", e);
                setStrategies(seedStrategies);
            }
        }
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

    const filteredStrategies = useMemo(() => {
        return strategies.filter(s => {
            const searchMatch = s.name.toLowerCase().includes(filters.search.toLowerCase()) || s.type.toLowerCase().includes(filters.search.toLowerCase());
            const typeMatch = filters.type === 'All' || s.type === filters.type;
            const timeframeMatch = filters.timeframe === 'All' || s.timeframe === filters.timeframe;
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
    
    const strategyTypes = ['All', ...new Set(strategies.map(s => s.type))];
    const timeframes = ['All', ...new Set(strategies.map(s => s.timeframe))];

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

             <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <CardTitle>Your Playbook</CardTitle>
                        <Button className="w-full md:w-auto" disabled>
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
                                        <StrategyCard key={strategy.strategyId} strategy={strategy} />
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
                                        <StrategyCard key={strategy.strategyId} strategy={strategy} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm text-center py-8">No archived strategies.</p>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
             </Card>
        </div>
    );
}
