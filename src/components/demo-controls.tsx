
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
import { useState, useEffect, useCallback } from "react"
import type { DemoScenario, ChartMarketMode } from "./dashboard-module"
import { useEventLog } from "@/context/event-log-provider"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

const themes: { name: string, id: Theme, color: string }[] = [
    { name: "Aurora Teal", id: "teal", color: "bg-[#22d3ee]" },
    { name: "Royal Purple", id: "purple", color: "bg-[#a855f7]" },
    { name: "Neon Lime", id: "lime", color: "bg-[#a3e635]" },
    { name: "Steel Gold", id: "gold", color: "bg-[#fbbf24]" },
]

type ScenarioData = {
    id: DemoScenario;
    name: string;
    description: string;
    icon: React.ElementType;
    vixValue: number;
    lossStreak: number;
    tradesExecuted: number;
    overrideCount: number;
    growthPlan: string[];
    riskEvents: { time: string; description: string; level: 'green' | 'yellow' | 'red' }[];
};

const scenarios: ScenarioData[] = [
    { 
        id: "normal", 
        name: "Normal Day", 
        description: "Balanced results, normal volatility.", 
        icon: Sun,
        vixValue: 45,
        lossStreak: 0,
        tradesExecuted: 2,
        overrideCount: 0,
        growthPlan: ["Limit yourself to 5 trades per day.", "Only trade your best A+ setup for the next 2 weeks.", "Complete a daily journal review for at least 10 days."],
        riskEvents: [
            { time: "09:05", description: "Trade plan for BTC-PERP validated. Status: PASS", level: 'green' },
            { time: "09:31", description: "Trade executed: Long BTC-PERP", level: 'green' }
        ]
    },
    { 
        id: "high_vol", 
        name: "High Volatility", 
        description: "Extreme Crypto VIX, wild swings.", 
        icon: Waves,
        vixValue: 82,
        lossStreak: 1,
        tradesExecuted: 4,
        overrideCount: 1,
        growthPlan: ["Reduce size by 50% in high VIX.", "Widen stops to account for volatility.", "Wait for clear A+ setups; avoid chasing wicks."],
        riskEvents: [
            { time: "10:15", description: "VIX entered 'Extreme' zone.", level: 'red' },
            { time: "10:20", description: "Leverage cap warning triggered on SOL-PERP plan.", level: 'yellow' },
            { time: "10:22", description: "Rule override used for high leverage.", level: 'red' }
        ]
    },
    { 
        id: "drawdown", 
        name: "In Drawdown", 
        description: "Recent losses, tight risk required.", 
        icon: Moon,
        vixValue: 65,
        lossStreak: 3,
        tradesExecuted: 3,
        overrideCount: 0,
        growthPlan: ["Enable Recovery Mode.", "Focus on capital preservation, not making back losses.", "Only trade your single most profitable setup."],
        riskEvents: [
            { time: "08:45", description: "Loss streak limit of 2 reached. Cooldown rule is now active.", level: 'red' },
            { time: "08:50", description: "Execution blocked: Cooldown active.", level: 'red' }
        ]
    },
    { 
        id: "no_positions", 
        name: "New User / No Data", 
        description: "No broker / no history – learning mode.", 
        icon: User,
        vixValue: 30,
        lossStreak: 0,
        tradesExecuted: 0,
        overrideCount: 0,
        growthPlan: ["Connect your broker or start logging trades manually.", "Draft your initial trading plan.", "Watch the 'Intro to Journaling' video."],
        riskEvents: []
    },
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
    const { toast } = useToast();
    const { addLog } = useEventLog();
    
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

    const handleScenarioChange = useCallback((newScenarioId: string) => {
        const scenarioData = scenarios.find(s => s.id === newScenarioId);
        if (!scenarioData) return;

        // 1. Update primary scenario ID
        localStorage.setItem('ec_demo_scenario', scenarioData.id);
        
        // 2. Update dependent localStorage values
        localStorage.setItem('ec_vix_override', String(scenarioData.vixValue));
        localStorage.setItem('ec_growth_plan_today', JSON.stringify(scenarioData.growthPlan));
        localStorage.setItem('ec_risk_events_today', JSON.stringify(scenarioData.riskEvents));

        const todayKey = format(new Date(), 'yyyy-MM-dd');
        const allCounters = JSON.parse(localStorage.getItem("ec_daily_counters") || '{}');
        allCounters[todayKey] = {
            lossStreak: scenarioData.lossStreak,
            tradesExecuted: scenarioData.tradesExecuted,
            overrideCount: scenarioData.overrideCount,
            totalTradesPlanned: (allCounters[todayKey]?.totalTradesPlanned || 0),
            tradesByStrategyId: (allCounters[todayKey]?.tradesByStrategyId || {}),
        };
        localStorage.setItem("ec_daily_counters", JSON.stringify(allCounters));
        
        // Reset simulation PnL when scenario changes
        localStorage.removeItem("ec_simulated_pnl_today");

        // Manually dispatch storage events to ensure all hooks react
        window.dispatchEvent(new StorageEvent('storage', { key: 'ec_demo_scenario' }));
        window.dispatchEvent(new StorageEvent('storage', { key: 'ec_vix_override' }));
        window.dispatchEvent(new StorageEvent('storage', { key: 'ec_daily_counters' }));
        
        setScenario(scenarioData.id);
        addLog(`Demo Scenario Engine: Set to "${scenarioData.name}". State updated.`);
        toast({
            title: "Scenario Changed",
            description: `Switched to "${scenarioData.name}" scenario.`
        });
    }, [addLog, toast]);

    const handleMarketModeChange = (newMarketMode: string) => {
        const mode = newMarketMode as ChartMarketMode;
        localStorage.setItem('ec_chart_market_mode', mode);
        setMarketMode(mode);
    };

    const handleRunDisciplineDemo = () => {
        localStorage.setItem('ec_discipline_demo_flow', 'start');
        window.dispatchEvent(new CustomEvent('start-discipline-demo'));
    }

    const handleSimulateLoss = () => {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        const allCounters = JSON.parse(localStorage.getItem("ec_daily_counters") || '{}');
        const todayCounters = allCounters[todayKey] || { lossStreak: 0, tradesExecuted: 0 };
        
        todayCounters.lossStreak = (todayCounters.lossStreak || 0) + 1;
        todayCounters.tradesExecuted = (todayCounters.tradesExecuted || 0) + 1;
        allCounters[todayKey] = todayCounters;
        
        localStorage.setItem("ec_daily_counters", JSON.stringify(allCounters));

        const assumedCapital = parseFloat(localStorage.getItem("ec_assumed_capital") || "10000");
        const riskPerTradePct = parseFloat(localStorage.getItem("ec_active_risk_pct") || "1");
        const lossAmount = assumedCapital * (riskPerTradePct / 100);

        const currentPnl = parseFloat(localStorage.getItem("ec_simulated_pnl_today") || "0");
        const newPnl = currentPnl - lossAmount;
        localStorage.setItem("ec_simulated_pnl_today", String(newPnl));

        window.dispatchEvent(new StorageEvent('storage', { key: 'ec_daily_counters' }));
        window.dispatchEvent(new StorageEvent('storage', { key: 'ec_simulated_pnl_today' }));

        toast({
            title: "Simulated a -1R Loss",
            description: `Loss streak is now ${todayCounters.lossStreak}. Daily budget has been reduced.`,
            variant: "destructive"
        });
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button onClick={handleSimulateLoss} variant="destructive" aria-label="Simulate 1R Loss">
                           <Zap className="h-[1.2rem] w-[1.2rem] mr-2" />
                           Simulate -1R Loss
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p>Simulate a losing trade to see how the risk center reacts.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
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
                                    <span>{s.name}</span>
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

    