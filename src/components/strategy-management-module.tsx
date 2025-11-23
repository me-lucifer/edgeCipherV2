
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
    description: string;
    entryCriteria: string[];
    exitCriteria: string[];
    riskRules: string[];
};

const mockStrategies: Strategy[] = [
    {
        id: '1',
        name: "London Reversal",
        status: "Active",
        timeframe: "M15",
        trades: 112,
        winRate: 62,
        description: "A mean-reversion strategy played during the first 2 hours of the London session, targeting overnight sweeps.",
        entryCriteria: ["Price sweeps Asia high/low.", "Divergence on 5-min RSI.", "Entry on first 15-min candle to close back inside the range."],
        exitCriteria: ["Target is the opposing side of the daily range.", "Stop-loss is 2x ATR above/below the wick."],
        riskRules: ["Max risk 1% of account.", "Not valid during major news events."],
    },
    {
        id: '2',
        name: "BTC Trend Breakout",
        status: "Active",
        timeframe: "H1",
        trades: 78,
        winRate: 48,
        description: "A trend-following strategy on the 1-hour chart for BTC, looking for breakouts from consolidations.",
        entryCriteria: ["4+ hours of consolidation.", "Breakout candle closes with high volume.", "Enter on retest of the breakout level."],
        exitCriteria: ["Target is 2R.", "Stop-loss is below the consolidation range."],
        riskRules: ["Max size 0.5 BTC.", "Only trade during NY session."],
    },
    {
        id: '3',
        name: "ETH Range Play",
        status: "Paused",
        timeframe: "H4",
        trades: 34,
        winRate: 71,
        description: "Playing the established range on ETH/USD on the 4-hour chart. Currently paused due to high volatility.",
        entryCriteria: ["Price reaches established range high/low.", "Confirmation of rejection on lower timeframe."],
        exitCriteria: ["Target is the opposing side of the range.", "Stop-loss is outside the range."],
        riskRules: ["Not valid if VIX is in 'Extreme' zone."],
    },
];

export function StrategyManagementModule({ onSetModule }: StrategyManagementModuleProps) {
    const [strategies] = useState<Strategy[]>(mockStrategies);
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(strategies[0]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Strategy Management</h1>
                <p className="text-muted-foreground">Your playbook for disciplined trading. Define, review, and refine your edge.</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Left: Strategy List */}
                <div className="lg:col-span-1 space-y-4">
                    <Button variant="outline" className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Define new strategy (Prototype)
                    </Button>
                    <div className="space-y-2">
                        {strategies.map(strategy => (
                            <Card
                                key={strategy.id}
                                onClick={() => setSelectedStrategy(strategy)}
                                className={cn(
                                    "cursor-pointer transition-all bg-muted/30 border-l-4",
                                    selectedStrategy?.id === strategy.id 
                                        ? "border-primary bg-muted/50" 
                                        : "border-transparent hover:bg-muted/50 hover:border-primary/50"
                                )}
                            >
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-foreground">{strategy.name}</h3>
                                        <Badge variant={strategy.status === "Active" ? "secondary" : "outline"} className={cn(
                                            "text-xs",
                                            strategy.status === 'Active' && 'bg-green-500/20 text-green-400 border-green-500/30'
                                        )}>
                                            {strategy.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                        <span><Badge variant="outline">{strategy.timeframe}</Badge></span>
                                        <span>{strategy.trades} trades</span>
                                        <span>{strategy.winRate}% WR</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
                
                {/* Right: Detail View */}
                <div className="lg:col-span-2">
                    {selectedStrategy ? (
                        <Card className="bg-muted/30 border-border/50 sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-2xl">{selectedStrategy.name}</CardTitle>
                                <CardDescription>{selectedStrategy.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">Entry Criteria</h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                        {selectedStrategy.entryCriteria.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">Exit Criteria</h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                        {selectedStrategy.exitCriteria.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">Risk Rules</h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                        {selectedStrategy.riskRules.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <Button variant="link" className="px-0 text-primary/90 hover:text-primary" onClick={() => onSetModule('tradeJournal')}>
                                    View trades using this strategy <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center p-8 border-2 border-dashed border-border/50 rounded-lg">
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

    