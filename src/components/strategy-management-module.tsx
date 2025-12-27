
"use client";

import { Button } from "@/components/ui/button";
import { BrainCircuit, PlusCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    type: 'Reversal' | 'Trend-Following' | 'Scalping';
    createdAt: string;
    status: 'active' | 'archived';
    versions: StrategyVersion[];
};


const seedStrategies: StrategyGroup[] = [
    {
        strategyId: 'strat_1',
        name: "London Reversal",
        type: 'Reversal',
        createdAt: new Date().toISOString(),
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
                    riskManagementRules: ["Max risk 1% of account", "Not valid during major news events"]
                },
                usageCount: 28,
                lastUsedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            }
        ]
    },
    {
        strategyId: 'strat_2',
        name: "BTC Trend Breakout",
        type: 'Trend-Following',
        createdAt: new Date().toISOString(),
        status: 'active',
        versions: [
            {
                versionId: 'sv_2_1',
                versionNumber: 1,
                isActiveVersion: true,
                createdAt: new Date().toISOString(),
                fields: {
                    entryConditions: ["4+ hours of consolidation", "Breakout candle closes with high volume", "Enter on retest of the breakout level"],
                    exitConditions: ["Target is 2R minimum", "Stop-loss is below the consolidation range"],
                    riskManagementRules: ["Max size 0.5 BTC", "Only trade during NY session"]
                },
                usageCount: 45,
                lastUsedAt: new Date(Date.now() - 86400000).toISOString(),
            }
        ]
    }
];


export function StrategyManagementModule({ onSetModule }: StrategyManagementModuleProps) {
    const [strategies, setStrategies] = useState<StrategyGroup[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedStrategies = localStorage.getItem("ec_strategies");
            if (!savedStrategies) {
                localStorage.setItem("ec_strategies", JSON.stringify(seedStrategies));
                setStrategies(seedStrategies);
            } else {
                setStrategies(JSON.parse(savedStrategies));
            }
        }
    }, []);
    
    const activeStrategies = strategies.filter(s => s.status === 'active');
    const archivedStrategies = strategies.filter(s => s.status === 'archived');

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Strategy Management</h1>
                <p className="text-muted-foreground">Your rulebook. Every trade must belong to a strategy.</p>
            </div>

            <div className="flex flex-col items-start justify-center text-center p-6 border-2 border-dashed rounded-lg min-h-[20vh] bg-muted/30">
                <h2 className="text-xl font-bold text-left">Define Your Playbook</h2>
                <div className="text-muted-foreground mt-2 max-w-xl text-left space-y-2">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <p>Create strategies as templates with strict, repeatable rules for entries, exits, and risk.</p>
                    </div>
                     <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <p>The Trade Planning module validates every plan against these rules to enforce discipline.</p>
                    </div>
                     <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <p>Edits create new versions of a strategy, preserving historical analytics to track what works over time.</p>
                    </div>
                </div>
                <Button className="mt-6" disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Define New Strategy (Prototype)
                </Button>
            </div>
            
             <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="active">Active Strategies</TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-6">
                    {activeStrategies.length > 0 ? (
                        <div className="space-y-4">
                            {activeStrategies.map(strategy => (
                                <Card key={strategy.strategyId} className="bg-muted/30">
                                    <CardHeader>
                                        <CardTitle>{strategy.name}</CardTitle>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No active strategies.</p>
                    )}
                </TabsContent>
                <TabsContent value="archived" className="mt-6">
                    {archivedStrategies.length > 0 ? (
                         <div className="space-y-4">
                            {archivedStrategies.map(strategy => (
                                <Card key={strategy.strategyId} className="bg-muted/30 opacity-60">
                                     <CardHeader>
                                        <CardTitle>{strategy.name}</CardTitle>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No archived strategies.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
