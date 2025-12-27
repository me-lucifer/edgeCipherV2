

"use client";

import { Button } from "@/components/ui/button";
import { BrainCircuit, PlusCircle, CheckCircle, Search, Filter as FilterIcon, Clock, ListOrdered, FileText, Gauge, Calendar, ShieldCheck, Zap, MoreHorizontal, ArrowLeft, Edit, Archive, Star } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Label } from "./ui/label";

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
                createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
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
                createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
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
                fields: { 
                    entryConditions: ["Older entry condition", "Volume must be decreasing during consolidation"], 
                    exitConditions: ["Older exit condition", "Partial TP at 1R"], 
                    riskManagementRules: ["Max risk 2% of account"] 
                },
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
                fields: { 
                    entryConditions: ["Scalp entry"], 
                    exitConditions: ["Scalp exit"], 
                    riskManagementRules: ["Max risk 0.5% of account", "Max daily loss 2%"] 
                },
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

function StrategyCard({ strategy, onOpen }: { strategy: StrategyGroup, onOpen: (strategy: StrategyGroup) => void }) {
    const activeVersion = strategy.versions.find(v => v.isActiveVersion);
    const totalUsage = strategy.versions.reduce((sum, v) => sum + v.usageCount, 0);

    const parseRule = (rules: string[], keyword: string): string | null => {
        const rule = rules.find(r => r.toLowerCase().includes(keyword.toLowerCase()));
        if (!rule) return null;
        const value = rule.replace(new RegExp(keyword, 'i'), '').trim();
        // Extract just the core value, e.g., "1%" from "Max risk 1% of account"
        return value.split(' ')[0];
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
                    <Badge variant="outline" className="ml-2">{strategy.timeframe}</Badge>
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
            {rules.length > 0 ? (
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    {rules.map((rule, i) => <li key={i}>{rule}</li>)}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground italic">No rules defined for this section in this version.</p>
            )}
        </CardContent>
    </Card>
);

function StrategyDetailView({ 
    strategy, 
    onBack,
    onArchive,
    onDelete,
    onMakeActive,
}: { 
    strategy: StrategyGroup; 
    onBack: () => void;
    onArchive: () => void;
    onDelete: () => void;
    onMakeActive: (versionId: string) => void;
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

             <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6 sticky top-24">
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>{strategy.name}</CardTitle>
                            <CardDescription>
                                <Badge variant="outline">{strategy.type}</Badge>
                                <Badge variant="outline" className="ml-2">{strategy.timeframe}</Badge>
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
                    <RulesCard title="Entry Conditions" rules={selectedVersion.fields.entryConditions} />
                    <RulesCard title="Exit Conditions" rules={selectedVersion.fields.exitConditions} />
                    <RulesCard title="Risk Management Rules" rules={selectedVersion.fields.riskManagementRules} />
                </div>
             </div>
        </div>
    );
}

export function StrategyManagementModule({ onSetModule }: StrategyManagementModuleProps) {
    const [strategies, setStrategies] = useState<StrategyGroup[]>([]);
    const [viewingStrategy, setViewingStrategy] = useState<StrategyGroup | null>(null);
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
    
    const strategyTypes = ['All', ...Array.from(new Set(strategies.map(s => s.type)))];
    const timeframes = ['All', ...Array.from(new Set(strategies.map(s => s.timeframe)))];

    if (viewingStrategy) {
        return <StrategyDetailView 
            strategy={viewingStrategy} 
            onBack={() => setViewingStrategy(null)}
            onArchive={handleArchive}
            onDelete={() => { /* no-op for now */ }}
            onMakeActive={handleMakeActive}
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
                        <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Create Strategy</Button>
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
