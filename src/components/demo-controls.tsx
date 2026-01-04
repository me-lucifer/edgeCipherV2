

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
import { Paintbrush, Check, SlidersHorizontal, Sun, Moon, Waves, User, TrendingUp, BarChartHorizontal, Activity, Zap, AlertTriangle } from "lucide-react"
import { useTheme, type Theme } from "./theme-provider"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { useState, useEffect, useCallback } from "react"
import type { DemoScenario, ChartMarketMode } from "./dashboard-module"
import { useEventLog } from "@/context/event-log-provider"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import type { RiskEvent } from "@/hooks/use-risk-state"
import { useVixState } from "@/hooks/use-vix-state"


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
    recoveryMode?: boolean;
    growthPlan: string[];
    riskEvents: RiskEvent[];
};

const scenarios: ScenarioData[] = [
    { 
        id: "normal", 
        name: "Green Day: Calm & Disciplined", 
        description: "Normal VIX, no losses, high discipline.", 
        icon: Sun,
        vixValue: 35,
        lossStreak: 0,
        tradesExecuted: 0,
        overrideCount: 0,
        growthPlan: ["Stick to your A+ setups.", "Journal trades promptly.", "Review yesterday's session."],
        riskEvents: [
            { time: "09:01", description: "Market VIX is 'Normal'. Conditions are stable.", level: 'green' },
            { time: "09:05", description: "Trade plan for BTC-PERP validated. Status: PASS", level: 'green' }
        ]
    },
    { 
        id: "high_vol", 
        name: "Yellow Day: Elevated VIX", 
        description: "VIX is up, risk is higher. Caution needed.", 
        icon: Waves,
        vixValue: 65,
        lossStreak: 0,
        tradesExecuted: 1,
        overrideCount: 0,
        growthPlan: ["Reduce size by 50% in high VIX.", "Widen stops to account for volatility.", "Wait for clear A+ setups; avoid chasing wicks."],
        riskEvents: [
            { time: "10:00", description: "VIX entered 'Elevated' zone. Risk posture updated.", level: 'yellow' },
            { time: "10:15", description: "Leverage cap warning triggered on SOL-PERP plan.", level: 'yellow' },
            { time: "10:22", description: "Trade executed: Long SOL-PERP with reduced size.", level: 'green' }
        ]
    },
    { 
        id: "drawdown", 
        name: "Revenge Trap", 
        description: "On a loss streak, Revenge Risk is high.", 
        icon: Moon,
        vixValue: 60,
        lossStreak: 2,
        tradesExecuted: 2,
        overrideCount: 0,
        growthPlan: ["Take a mandatory 1-hour break.", "Only trade your single most profitable setup.", "Reduce risk per trade to 0.5%."],
        riskEvents: [
            { time: "11:00", description: "Trade closed: -1R loss. Loss streak at 1.", level: 'yellow' },
            { time: "11:30", description: "Trade closed: -1R loss. Loss streak at 2. Cooldown warning active.", level: 'red' },
            { time: "11:32", description: "Revenge Risk Index is now 'High'.", level: 'yellow' },
        ]
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
    const { updateVixValue } = useVixState();
    
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedScenario = localStorage.getItem('ec_demo_scenario') as DemoScenario;
            if (savedScenario && scenarios.some(s => s.id === savedScenario)) {
                setScenario(savedScenario);
            }
            const savedMarketMode = localStorage.getItem('ec_chart_market_mode') as ChartMarketMode;
            if (savedMarketMode) {
                setMarketMode(savedMarketMode);
            }
        }
    }, []);

    const dispatchStorageEvent = (key: string, newValue: string | null) => {
        window.dispatchEvent(new StorageEvent('storage', { key, newValue }));
    };

    const handleScenarioChange = useCallback((newScenarioId: string) => {
        const scenarioData = scenarios.find(s => s.id === newScenarioId);
        if (!scenarioData) return;

        localStorage.setItem('ec_demo_scenario', scenarioData.id);
        
        // Use the centralized VIX update function
        if (updateVixValue) {
            updateVixValue(scenarioData.vixValue);
        } else {
            // Fallback for safety, though updateVixValue should always be available
            localStorage.setItem('ec_vix_override', String(scenarioData.vixValue));
            dispatchStorageEvent('ec_vix_override', String(scenarioData.vixValue));
        }
        
        localStorage.setItem('ec_growth_plan_today', JSON.stringify(scenarioData.growthPlan));
        localStorage.setItem('ec_risk_events_today', JSON.stringify(scenarioData.riskEvents));
        localStorage.setItem('ec_recovery_mode', String(!!scenarioData.recoveryMode));

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
        
        localStorage.removeItem("ec_simulated_pnl_today");

        dispatchStorageEvent('ec_demo_scenario', scenarioData.id);
        dispatchStorageEvent('ec_daily_counters', JSON.stringify(allCounters));
        dispatchStorageEvent('ec_recovery_mode', String(!!scenarioData.recoveryMode));
        dispatchStorageEvent('ec_simulated_pnl_today', null);
        
        setScenario(scenarioData.id);
        addLog(`Demo Scenario Engine: Set to "${scenarioData.name}". State updated.`);
        toast({
            title: "Scenario Changed",
            description: `Switched to "${scenarioData.name}" scenario.`
        });
    }, [addLog, toast, updateVixValue]);

    const handleMarketModeChange = (newMarketMode: string) => {
        const mode = newMarketMode as ChartMarketMode;
        localStorage.setItem('ec_chart_market_mode', mode);
        setMarketMode(mode);
        dispatchStorageEvent('ec_chart_market_mode', mode);
    };

    const handleRunDisciplineDemo = () => {
        handleScenarioChange('drawdown');
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

        dispatchStorageEvent('ec_daily_counters', JSON.stringify(allCounters));
        dispatchStorageEvent('ec_simulated_pnl_today', String(newPnl));

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
                <DropdownMenuContent align="end" className="w-80">
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
