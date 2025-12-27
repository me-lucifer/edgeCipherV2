
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ArrowRight, Bot, ShieldCheck, Zap, Sun, Award, Info, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "./ui/table";

interface StrategyManagementModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

type Strategy = {
    id: string;
    name: string;
    status: "Active" | "Paused";
    timeframe: string;
    trades: number;
    winRate: number;
    pnl: number;
    mistakeRate: number;
    emotionMix: { emotion: string, percentage: number }[];
    description: string;
    entryCriteria: string[];
    exitCriteria: string[];
    riskRules: string[];
    bestConditions: {
        session: string;
        vixZone: string;
        timeframe: string;
    };
    failureSignature: {
        topMistake: string;
        topEmotion: string;
        ruleBreach: string;
    };
    arjunPrescription: string[];
};

const mockStrategies: Strategy[] = [
    {
        id: '1',
        name: "London Reversal",
        status: "Active",
        timeframe: "M15",
        trades: 112,
        winRate: 62,
        pnl: 4520,
        mistakeRate: 15,
        emotionMix: [{ emotion: "Impatience", percentage: 40 }, { emotion: "Focused", percentage: 35 }],
        description: "A mean-reversion strategy played during the first 2 hours of the London session, targeting overnight sweeps.",
        entryCriteria: ["Price sweeps Asia high/low.", "Divergence on 5-min RSI.", "Entry on first 15-min candle to close back inside the range."],
        exitCriteria: ["Target is the opposing side of the daily range.", "Stop-loss is 2x ATR above/below the wick."],
        riskRules: ["Max risk 1% of account.", "Not valid during major news events."],
        bestConditions: { session: "London", vixZone: "Normal", timeframe: "M15" },
        failureSignature: { topMistake: "Forced Entry", topEmotion: "Impatience", ruleBreach: "Traded outside session" },
        arjunPrescription: ["Only trade between 8-10 AM GMT.", "Wait for a clean 15m close back inside the range.", "If VIX is Elevated, skip this setup."]
    },
    {
        id: '2',
        name: "BTC Trend Breakout",
        status: "Active",
        timeframe: "H1",
        trades: 78,
        winRate: 48,
        pnl: 8900,
        mistakeRate: 25,
        emotionMix: [{ emotion: "FOMO", percentage: 35 }, { emotion: "Confident", percentage: 30 }],
        description: "A trend-following strategy on the 1-hour chart for BTC, looking for breakouts from consolidations.",
        entryCriteria: ["4+ hours of consolidation.", "Breakout candle closes with high volume.", "Enter on retest of the breakout level."],
        exitCriteria: ["Target is 2R.", "Stop-loss is below the consolidation range."],
        riskRules: ["Max size 0.5 BTC.", "Only trade during NY session."],
        bestConditions: { session: "New York", vixZone: "Normal", timeframe: "H1" },
        failureSignature: { topMistake: "Exited early", topEmotion: "FOMO", ruleBreach: "Risk oversized" },
        arjunPrescription: ["Use a trailing stop after 1R.", "Set a minimum 4-hour consolidation period.", "Do not take if R:R is below 1.5."]
    },
    {
        id: '3',
        name: "ETH Range Play",
        status: "Paused",
        timeframe: "H4",
        trades: 34,
        winRate: 71,
        pnl: -1250,
        mistakeRate: 45,
        emotionMix: [{ emotion: "Hope", percentage: 50 }, { emotion: "Anxious", percentage: 25 }],
        description: "Playing the established range on ETH/USD on the 4-hour chart. Currently paused due to high volatility.",
        entryCriteria: ["Price reaches established range high/low.", "Confirmation of rejection on lower timeframe."],
        exitCriteria: ["Target is the opposing side of the range.", "Stop-loss is outside the range."],
        riskRules: ["Not valid if VIX is in 'Extreme' zone."],
        bestConditions: { session: "Any", vixZone: "Calm", timeframe: "H4" },
        failureSignature: { topMistake: "SL moved", topEmotion: "Hope", ruleBreach: "SL moved" },
        arjunPrescription: ["Use a fixed SL outside the range and do not move it.", "Only take setups with clear rejection wicks.", "Pause this strategy if VIX is above 'Normal'."]
    },
];

const DrilldownCard = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <Card className="bg-muted/50 border-border/50">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

type SortKey = "name" | "pnl" | "winRate" | "mistakeRate";

const SortableHeader = ({
  sortKey,
  label,
  sortConfig,
  onSort,
}: {
  sortKey: SortKey;
  label: string;
  sortConfig: { key: SortKey; direction: 'ascending' | 'descending' };
  onSort: (key: SortKey) => void;
}) => {
  const isSorted = sortConfig.key === sortKey;
  return (
    <TableHead>
      <Button variant="ghost" onClick={() => onSort(sortKey)} className="-ml-4">
        {label}
        {isSorted && (
          <ChevronsUpDown
            className={cn(
              "ml-2 h-4 w-4 transform",
              sortConfig.direction === 'descending' && "rotate-180"
            )}
          />
        )}
      </Button>
    </TableHead>
  );
};


export function StrategyManagementModule({ onSetModule }: StrategyManagementModuleProps) {
    const { toast } = useToast();
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(mockStrategies[1]);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'pnl', direction: 'descending' });

    const sortedStrategies = useMemo(() => {
        const sortableStrategies = [...mockStrategies];
        sortableStrategies.sort((a, b) => {
            if (sortConfig.key === 'name') {
                return a.name.localeCompare(b.name) * (sortConfig.direction === 'ascending' ? 1 : -1);
            }
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableStrategies;
    }, [sortConfig]);

    const handleSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        // Default PnL to descending, Mistake Rate to ascending
        if (key !== sortConfig.key) {
            if (key === 'pnl') direction = 'descending';
            if (key === 'mistakeRate') direction = 'ascending';
        }

        setSortConfig({ key, direction });
    };

    const handleApplyGuardrails = () => {
        if (!selectedStrategy) return;
        
        const guardrails = {
            strategyId: selectedStrategy.id,
            strategyName: selectedStrategy.name,
            rules: selectedStrategy.arjunPrescription,
        };

        localStorage.setItem(`ec_strategy_guardrails_${selectedStrategy.id}`, JSON.stringify(guardrails));

        toast({
            title: "Guardrails Applied",
            description: `Rules for "${selectedStrategy.name}" will now appear as a checklist in Trade Planning.`,
        });
    };


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Strategy Management</h1>
                <p className="text-muted-foreground">Your playbook for disciplined trading. Define, review, and refine your edge.</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Left: Strategy List */}
                <div className="lg:col-span-2 space-y-4">
                     <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>Strategy Leaderboard</CardTitle>
                            <CardDescription>Compare your strategies across key performance and behavioral metrics.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableHeader sortKey="name" label="Strategy" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableHeader sortKey="pnl" label="Total PnL ($)" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableHeader sortKey="winRate" label="Win Rate" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableHeader sortKey="mistakeRate" label="Mistake Rate" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead>Emotion Mix</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedStrategies.map(strategy => (
                                        <TableRow 
                                            key={strategy.id} 
                                            className={cn("cursor-pointer", selectedStrategy?.id === strategy.id && "bg-primary/10")}
                                            onClick={() => setSelectedStrategy(strategy)}
                                        >
                                            <TableCell>
                                                <div className="font-medium text-foreground">{strategy.name}</div>
                                                <div className="text-xs text-muted-foreground">{strategy.trades} trades</div>
                                            </TableCell>
                                            <TableCell className={cn("font-mono", strategy.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                                                {strategy.pnl >= 0 ? `+$${strategy.pnl.toLocaleString()}` : `-$${Math.abs(strategy.pnl).toLocaleString()}`}
                                            </TableCell>
                                            <TableCell className="font-mono">{strategy.winRate}%</TableCell>
                                            <TableCell className={cn("font-mono", strategy.mistakeRate > 20 ? "text-amber-400" : "text-muted-foreground")}>
                                                {strategy.mistakeRate}%
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    {strategy.emotionMix.map(mix => (
                                                        <div key={mix.emotion} className="flex items-center gap-2 text-xs">
                                                            <Badge variant="outline" className="w-24 justify-center">{mix.emotion}</Badge>
                                                            <span className="text-muted-foreground font-mono">{mix.percentage}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <div className="text-center">
                        <Button variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Define new strategy (Prototype)
                        </Button>
                    </div>
                </div>
                
                {/* Right: Detail View */}
                <div className="lg:col-span-1">
                    {selectedStrategy ? (
                        <div className="space-y-6 sticky top-24">
                            <Card className="bg-muted/30 border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-xl">{selectedStrategy.name}</CardTitle>
                                    <CardDescription>{selectedStrategy.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="link" className="px-0 text-primary/90 hover:text-primary" onClick={() => onSetModule('tradeJournal', { filters: { strategy: selectedStrategy.name } })}>
                                        View all {selectedStrategy.trades} trades using this strategy <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                            
                            <div className="grid gap-6">
                                <DrilldownCard title="Best Conditions" icon={Sun}>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li>Session: <span className="font-semibold text-foreground">{selectedStrategy.bestConditions.session}</span></li>
                                        <li>VIX Zone: <span className="font-semibold text-foreground">{selectedStrategy.bestConditions.vixZone}</span></li>
                                        <li>Timeframe: <span className="font-semibold text-foreground">{selectedStrategy.bestConditions.timeframe}</span></li>
                                    </ul>
                                </DrilldownCard>

                                <DrilldownCard title="Failure Signature" icon={Zap}>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li>Top Mistake: <Badge variant="destructive">{selectedStrategy.failureSignature.topMistake}</Badge></li>
                                        <li>Top Emotion: <Badge variant="outline" className="border-amber-500/30 text-amber-300">{selectedStrategy.failureSignature.topEmotion}</Badge></li>
                                        <li>Rule Breach: <span className="font-semibold text-foreground">{selectedStrategy.failureSignature.ruleBreach}</span></li>
                                    </ul>
                                </DrilldownCard>
                            </div>
                            
                            <DrilldownCard title="Arjun's Prescription" icon={Bot}>
                                 <Alert className="mb-4 bg-muted/50">
                                    <Info className="h-4 w-4" />
                                    <AlertTitle className="text-xs">Turn analysis into action</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        This prescription is generated from your historical performance with this strategy. Applying it as guardrails will warn you in Trade Planning if you deviate.
                                    </AlertDescription>
                                </Alert>
                                <ul className="space-y-3 text-sm text-muted-foreground list-disc list-inside">
                                    {selectedStrategy.arjunPrescription.map((item, i) => <li key={i}><span className="font-semibold text-foreground">{item}</span></li>)}
                                </ul>
                                <div className="mt-6">
                                    <Button onClick={handleApplyGuardrails}>
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Apply as Strategy Guardrails
                                    </Button>
                                </div>
                            </DrilldownCard>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center p-8 border-2 border-dashed border-border/50 rounded-lg min-h-[500px]">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Select a strategy</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Select a strategy from the list to view its details, or define a new one.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
