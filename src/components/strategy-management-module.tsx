
"use client";

import { Button } from "@/components/ui/button";
import { BrainCircuit, PlusCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Strategy Management</h1>
                <p className="text-muted-foreground">Your rulebook. Every trade must belong to a strategy.</p>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg min-h-[60vh]">
                <BrainCircuit className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-2xl font-bold">Define Your Playbook</h2>
                <div className="text-muted-foreground mt-4 max-w-xl mx-auto space-y-4 text-left">
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
                <Button className="mt-8" disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Define New Strategy (Prototype)
                </Button>
            </div>
        </div>
    );
}
