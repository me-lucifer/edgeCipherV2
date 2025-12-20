
"use client";

import { BarChartHorizontal } from "lucide-react";

interface ChartModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

export function ChartModule({ onSetModule }: ChartModuleProps) {
    return (
        <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8 h-full">
            <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-border">
                    <BarChartHorizontal className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                    Chart
                </h2>
                <p className="mt-2 text-muted-foreground">
                    Visual workspace to identify setups before trade planning.
                </p>
                <p className="mt-4 text-sm font-semibold text-primary/80">
                    This feature is coming soon!
                </p>
            </div>
        </div>
    );
}
