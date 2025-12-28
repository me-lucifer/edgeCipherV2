
"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { Paintbrush, Check, SlidersHorizontal, Sun, Moon, Waves, User, TrendingUp, BarChartHorizontal, Activity, Zap } from "lucide-react"
import { useTheme, type Theme } from "./theme-provider"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { useState, useEffect } from "react"
import type { DemoScenario, ChartMarketMode } from "./dashboard-module"
import { useEventLog } from "@/context/event-log-provider"

const themes: { name: string, id: Theme, color: string }[] = [
    { name: "Aurora Teal", id: "teal", color: "bg-[#22d3ee]" },
    { name: "Royal Purple", id: "purple", color: "bg-[#a855f7]" },
    { name: "Neon Lime", id: "lime", color: "bg-[#a3e635]" },
    { name: "Steel Gold", id: "gold", color: "bg-[#fbbf24]" },
]

const scenarios: {id: DemoScenario, label: string, description: string, icon: React.ElementType }[] = [
    { id: "normal", label: "Normal Day", description: "Balanced results, normal volatility.", icon: Sun },
    { id: "high_vol", label: "High Volatility", description: "Extreme Crypto VIX, wild swings.", icon: Waves },
    { id: "drawdown", label: "In Drawdown", description: "Recent losses, tight risk required.", icon: Moon },
    { id: "no_positions", label: "New User / No Data", description: "No broker / no history – learning mode.", icon: User },
];

const chartModes: { id: ChartMarketMode, label: string, description: string, icon: React.ElementType }[] = [
    { id: 'trend', label: "Trend Day", description: "Clean swings, good for breakouts.", icon: TrendingUp },
    { id: 'range', label: "Rangebound Day", description: "Chop, good for mean reversion.", icon: BarChartHorizontal },
    { id: 'volatile', label: "Volatile Day", description: "Wicky candles, high risk.", icon: Activity },
];


export function DemoControls() {
    const { theme: activeTheme, setTheme } = useTheme();
    const [scenario, setScenario] = useState<DemoScenario>('normal');
    const [marketMode, setMarketMode] = useState<ChartMarketMode>('trend');
    
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedScenario = localStorage.getItem('ec_demo_scenario') as DemoScenario;
            if (savedScenario) {
                setScenario(savedScenario);
            }
            const savedMarketMode = localStorage.getItem('ec_chart_market_mode') as ChartMarketMode;
            if (savedMarketMode) {
                setMarketMode(savedMarketMode);
            }
        }
    }, []);

    const handleScenarioChange = (newScenario: string) => {
        const scenario = newScenario as DemoScenario;
        // The event listener in DashboardModule will pick this up
        localStorage.setItem('ec_demo_scenario', scenario);
        // We also need to manually update state here for the radio group to reflect the change
        setScenario(scenario);
    };

    const handleMarketModeChange = (newMarketMode: string) => {
        const mode = newMarketMode as ChartMarketMode;
        localStorage.setItem('ec_chart_market_mode', mode);
        setMarketMode(mode);
    };

    const handleRunDisciplineDemo = () => {
        localStorage.setItem('ec_discipline_demo_flow', 'start');
        // Trigger a custom event that the AuthenticatedAppShell can listen for
        window.dispatchEvent(new CustomEvent('start-discipline-demo'));
    }


    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={handleRunDisciplineDemo} aria-label="Run Discipline Loop Demo">
                           <Zap className="h-[1.2rem] w-[1.2rem] mr-2" />
                           Run Discipline Demo
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p>Walk through the core Plan -> Validate -> Execute -> Journal loop.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" aria-label="Select Scenario">
                                    <SlidersHorizontal className="h-[1.2rem] w-[1.2rem]" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p>Change demo context</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Account Scenario</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={scenario} onValueChange={handleScenarioChange}>
                        {scenarios.map((s) => (
                            <DropdownMenuRadioItem key={s.id} value={s.id} className="gap-2">
                                <s.icon className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col">
                                    <span>{s.label}</span>
                                    <span className="text-xs text-muted-foreground">{s.description}</span>
                                </div>
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Chart Market Mode</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={marketMode} onValueChange={handleMarketModeChange}>
                        {chartModes.map((m) => (
                             <DropdownMenuRadioItem key={m.id} value={m.id} className="gap-2">
                                <m.icon className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col">
                                    <span>{m.label}</span>
                                    <span className="text-xs text-muted-foreground">{m.description}</span>
                                </div>
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" aria-label="Select Theme">
                                    <Paintbrush className="h-[1.2rem] w-[1.2rem]" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p>Change color theme</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {themes.map((theme) => (
                         <DropdownMenuItem key={theme.id} onClick={() => setTheme(theme.id)}>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-4 h-4 rounded-full", theme.color)} />
                                <span>{theme.name}</span>
                                {activeTheme === theme.id && <Check className="ml-auto h-4 w-4" />}
                            </div>
                         </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
