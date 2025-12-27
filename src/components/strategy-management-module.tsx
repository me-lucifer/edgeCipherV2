
"use client";

import { Button } from "@/components/ui/button";
import { BrainCircuit, PlusCircle, CheckCircle } from "lucide-react";

interface StrategyManagementModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

export function StrategyManagementModule({ onSetModule }: StrategyManagementModuleProps) {
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
