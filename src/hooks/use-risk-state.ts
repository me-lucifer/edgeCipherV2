

"use client";

import { useState, useEffect, useCallback } from 'react';
import type { DemoScenario } from '@/components/dashboard-module';
import { format } from 'date-fns';


// Types for the consolidated risk state
export type VixZone = "Extremely Calm" | "Normal" | "Volatile" | "High Volatility" | "Extreme";

export type RiskDecision = {
    level: "green" | "yellow" | "red";
    message: string;
    reasons: string[];
};

export type RiskEvent = {
    time: string;
    description: string;
    level: 'green' | 'yellow' | 'red';
};

export type ActiveNudge = {
    id: string;
    title: string;
    message: string;
    severity: 'warn' | 'info';
    status: 'new' | 'acknowledged' | 'snoozed';
};

export type SLDisciplineData = {
    name: string;
    respected: number;
    moved: number;
    removed: number;
};

export type LeverageDistributionData = {
    name: string;
    count: number;
};

export type DisciplineLeaksData = {
    overridesToday: number;
    overrides7d: number;
    breachesToday: number;
    breaches7d: number;
    topBreachTypes: string[];
};

export type RiskHeatmapData = {
    sessions: {
        name: string;
        blocks: {
            time: string;
            metrics: {
                lossStreak: number;
                highLeverage: number;
                slMoved: number;
                overrides: number;
            },
            topSymbol: string;
            topEmotion: string;
        }[];
    }[];
    timeBlocks: string[];
};

export type TopRiskDriver = {
    id: string;
    title: string;
    severity: 'High' | 'Medium' | 'Low';
    why: string;
    action: {
        label: string;
        module: string;
        context?: any;
    };
};


export type RiskState = {
    marketRisk: {
        vixValue: number;
        vixZone: VixZone;
        message: string;
    };
    personalRisk: {
        disciplineScore: number;
        disciplineScoreDelta: number;
        emotionalScore: number;
        emotionalScoreDelta: number;
        consistencyScore: number;
        consistencyScoreDelta: number;
        revengeRiskIndex: number;
        revengeRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
        slMovedRate: number;
        riskLeakageRate: number;
        pnlTrend7d: { value: number }[];
        slMovedTrend7d: { value: number }[];
        overridesTrend7d: { value: number }[];
        slDisciplineToday: SLDisciplineData[];
        slDiscipline7d: SLDisciplineData[];
        leverageDistribution: LeverageDistributionData[];
        mostCommonLeverageBucket: string;
        highLeverageTradesToday: number;
        leverageDistributionWarning: boolean;
        disciplineLeaks: DisciplineLeaksData;
        riskHeatmapData: RiskHeatmapData;
    };
    todaysLimits: {
        maxTrades: number;
        tradesExecuted: number;
        maxDailyLossPct: number;
        lossStreak: number;
        cooldownActive: boolean;
        riskPerTradePct: number;
        leverageCap: number;
        recoveryMode: boolean;
        dailyBudgetRemaining: number;
        maxSafeTradesRemaining: number;
        hasActiveStrategy: boolean;
        activeStrategyName: string | null;
        limitSource: 'default' | 'lastUsed' | 'draft' | 'none';
    };
    decision: RiskDecision;
    riskEventsToday: RiskEvent[];
    activeNudge: ActiveNudge | null;
    topRiskDrivers: TopRiskDriver[];
};

// Helper to get VIX zone from value
const getVixZone = (vix: number): VixZone => {
    if (vix <= 20) return "Extremely Calm";
    if (vix <= 40) return "Normal";
    if (vix <= 60) return "Volatile";
    if (vix <= 80) return "High Volatility";
    return "Extreme";
};

const mockPositions = [
    { symbol: 'BTC-PERP', direction: 'Long', size: 0.5, pnl: 234.50, leverage: 10, risk: 'Medium', price: 68500 },
    { symbol: 'ETH-PERP', direction: 'Short', size: 12, pnl: -88.12, leverage: 50, risk: 'High', price: 3600 },
    { symbol: 'SOL-PERP', direction: 'Long', size: 100, pnl: 45.20, leverage: 5, risk: 'Low', price: 150 },
];

const generateDefaultState = (): RiskState => {
    return {
        marketRisk: { vixValue: 45, vixZone: 'Normal', message: 'Volatility is Normal.' },
        personalRisk: {
            disciplineScore: 70, disciplineScoreDelta: 0, emotionalScore: 50, emotionalScoreDelta: 0,
            consistencyScore: 60, consistencyScoreDelta: 0, revengeRiskIndex: 0, revengeRiskLevel: 'Low',
            slMovedRate: 0, riskLeakageRate: 0,
            pnlTrend7d: [], slMovedTrend7d: [], overridesTrend7d: [], slDisciplineToday: [], slDiscipline7d: [],
            leverageDistribution: [], mostCommonLeverageBucket: 'N/A', highLeverageTradesToday: 0, leverageDistributionWarning: false,
            disciplineLeaks: { overridesToday: 0, overrides7d: 0, breachesToday: 0, breaches7d: 0, topBreachTypes: [] },
            riskHeatmapData: { sessions: [], timeBlocks: [] }
        },
        todaysLimits: {
            maxTrades: 5, tradesExecuted: 0, maxDailyLossPct: 3, lossStreak: 0, cooldownActive: false,
            riskPerTradePct: 1, leverageCap: 20, recoveryMode: false, dailyBudgetRemaining: 300,
            maxSafeTradesRemaining: 3, hasActiveStrategy: false, activeStrategyName: null, limitSource: 'none'
        },
        decision: { level: 'green', message: 'Execute your plan.', reasons: ['No major risk factors detected.'] },
        riskEventsToday: [],
        activeNudge: null,
        topRiskDrivers: [],
    };
};

export function useRiskState() {
    const [riskState, setRiskState] = useState<RiskState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const computeRiskState = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            // 1. Gather data from various localStorage sources
            const scenario = localStorage.getItem('ec_demo_scenario') as DemoScenario || 'normal';
            const personaData = JSON.parse(localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base") || "{}");
            const todayKey = new Date().toISOString().split('T')[0];
            const allCounters = JSON.parse(localStorage.getItem("ec_daily_counters") || '{}');
            const dailyCounters = allCounters[todayKey] || { lossStreak: 0, tradesExecuted: 0, overrideCount: 0 };
            const strategies = JSON.parse(localStorage.getItem("ec_strategies") || "[]");
            const recoveryMode = localStorage.getItem('ec_recovery_mode') === 'true';
            const guardrails = JSON.parse(localStorage.getItem("ec_guardrails") || "{}");
            const assumedCapital = parseFloat(localStorage.getItem("ec_assumed_capital") || "10000");
            const sensitivitySetting = localStorage.getItem("ec_risk_sensitivity") || 'balanced';
            
            const alertStates = JSON.parse(localStorage.getItem('ec_risk_alert_states') || '{}');

            const storedEvents = JSON.parse(localStorage.getItem('ec_risk_events_today') || '[]');
            const riskEventsToday: RiskEvent[] = [...storedEvents];
            
            const now = new Date();

            // 2. Compute Market Risk from ec_vix_state
            const vixStateString = localStorage.getItem("ec_vix_state");
            let vixValue = 37;
            let vixZone: VixZone = 'Normal';

            if (vixStateString) {
                const storedVixState = JSON.parse(vixStateString);
                vixValue = storedVixState.value;
                vixZone = storedVixState.zoneLabel;
            }
            
            const marketRisk = {
                vixValue,
                vixZone,
                message: `Volatility is ${vixZone}.`,
            };

            // 3. Compute Personal Risk & Revenge Risk
            let revengeRiskIndex = 0;
            if (dailyCounters.lossStreak >= 2) revengeRiskIndex += 30;
            if (dailyCounters.lossStreak >= 3) revengeRiskIndex += 20; // Additional penalty
            if (dailyCounters.overrideCount > 0) revengeRiskIndex += 25;
            if (dailyCounters.tradesExecuted >= ((strategies.find((s: any) => s.status === 'active')?.versions.find((v:any) => v.isActiveVersion)?.ruleSet?.riskRules.maxDailyTrades || 5) - 1)) revengeRiskIndex += 15;
            if (vixZone === 'Elevated' || vixZone === 'Volatile') revengeRiskIndex += 10;
            if (vixZone === 'High Volatility' || vixZone === 'Extreme') revengeRiskIndex += 25;

            revengeRiskIndex = Math.min(100, revengeRiskIndex);
            
            let revengeRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
            if (revengeRiskIndex >= 75) revengeRiskLevel = 'Critical';
            else if (revengeRiskIndex >= 50) revengeRiskLevel = 'High';
            else if (revengeRiskIndex >= 25) revengeRiskLevel = 'Medium';
            
            const pnlTrendBase = scenario === 'drawdown' ? -200 : 100;
            
            const slDisciplineTodayData = (() => {
                if(scenario === 'drawdown') return [{ name: 'Today', respected: 1, moved: 2, removed: 1 }];
                if(scenario === 'high_vol') return [{ name: 'Today', respected: 3, moved: 1, removed: 0 }];
                return [{ name: 'Today', respected: 4, moved: 0, removed: 0 }];
            })();

            const slDiscipline7dData = Array.from({ length: 7 }, (_, i) => {
                const day = new Date();
                day.setDate(day.getDate() - (6 - i));
                const total = 5 + Math.floor(Math.random() * 5);
                const moved = Math.floor(Math.random() * (scenario === 'drawdown' ? 4 : 2));
                const removed = Math.random() > 0.8 ? 1 : 0;
                const respected = total - moved - removed;
                return { name: format(day, 'MMM d'), respected, moved, removed };
            });

            const leverageDistribution = [
                { name: '1-5x', count: scenario === 'drawdown' ? 15 : 8 },
                { name: '6-10x', count: scenario === 'drawdown' ? 8 : 15 },
                { name: '11-20x', count: scenario === 'high_vol' ? 5 : 10 },
                { name: '20x+', count: scenario === 'high_vol' ? 8 : 2 },
            ];
            
            const highLeverageTradesToday = leverageDistribution.find(b => b.name === '20x+')?.count || 0;

             const disciplineLeaks: DisciplineLeaksData = {
                overridesToday: dailyCounters.overrideCount || 0,
                overrides7d: (dailyCounters.overrideCount || 0) + (scenario === 'drawdown' ? 5 : 2),
                breachesToday: (dailyCounters.tradesExecuted || 0) > 3 ? 1 : 0,
                breaches7d: (scenario === 'drawdown' ? 8 : 3),
                topBreachTypes: ['RR below min', 'Risk too high', 'VIX policy violated'],
            };
            
            const timeBlocks = ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"];
            const riskHeatmapData: RiskHeatmapData = {
                sessions: ["Asia", "London", "New York"].map(session => ({
                    name: session,
                    blocks: timeBlocks.map(time => {
                        const isRisky = (session === "London" && scenario === "drawdown") || (session === "New York" && scenario === "high_vol");
                        return {
                            time,
                            metrics: {
                                lossStreak: isRisky && Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0,
                                highLeverage: isRisky && Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0,
                                slMoved: isRisky && Math.random() > 0.4 ? Math.floor(Math.random() * 4) : 0,
                                overrides: isRisky && Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0,
                            },
                            topSymbol: isRisky ? 'ETH-PERP' : 'BTC-PERP',
                            topEmotion: isRisky ? 'Anxious' : 'Focused',
                        };
                    })
                })),
                timeBlocks: timeBlocks,
            };

            const personalRisk = {
                disciplineScore: personaData.disciplineScore || 70,
                disciplineScoreDelta: -5, // Mock data
                emotionalScore: personaData.emotionScore || 50,
                emotionalScoreDelta: 10, // Mock data
                consistencyScore: 65, // Mock data
                consistencyScoreDelta: 2, // Mock data
                revengeRiskIndex,
                revengeRiskLevel,
                slMovedRate: scenario === 'drawdown' ? 25 : 8, // Mock
                riskLeakageRate: scenario === 'drawdown' ? 1.5 : 0.2, // Mock
                pnlTrend7d: Array.from({ length: 7 }, (_, i) => ({ value: pnlTrendBase + (Math.random() - 0.5) * 150 * (i + 1) })),
                slMovedTrend7d: Array.from({ length: 7 }, () => ({ value: Math.random() > 0.7 ? 1 : 0 })),
                overridesTrend7d: Array.from({ length: 7 }, () => ({ value: Math.random() > 0.8 ? 1 : 0 })),
                slDisciplineToday: slDisciplineTodayData,
                slDiscipline7d: slDiscipline7dData,
                leverageDistribution,
                mostCommonLeverageBucket: '6-10x',
                highLeverageTradesToday,
                leverageDistributionWarning: highLeverageTradesToday > 5 && (vixZone === 'Elevated' || vixZone === 'High Volatility' || vixZone === 'Extreme'),
                disciplineLeaks,
                riskHeatmapData,
            };

            // 4. Compute Today's Limits & Risk Budget
            const limitSource = (localStorage.getItem("ec_limits_source_mode") as RiskState['todaysLimits']['limitSource']) || 'lastUsed';
            let activeStrategy: any = null;

            if (limitSource === 'draft') {
                const draftString = localStorage.getItem("ec_trade_plan_draft");
                if (draftString) {
                    const draft = JSON.parse(draftString);
                    activeStrategy = strategies.find((s:any) => s.strategyId === draft.formData.strategyId);
                }
            } else if (limitSource === 'default') {
                const defaultId = localStorage.getItem("ec_default_strategy_id");
                if (defaultId) {
                    activeStrategy = strategies.find((s:any) => s.strategyId === defaultId);
                }
            }
            
            if (!activeStrategy && limitSource === 'lastUsed') {
                const sortedByLastUsed = [...strategies].sort((a: any, b: any) => {
                    const aDate = a.versions.find((v:any) => v.isActiveVersion)?.lastUsedAt;
                    const bDate = b.versions.find((v:any) => v.isActiveVersion)?.lastUsedAt;
                    if (aDate && bDate) return new Date(bDate).getTime() - new Date(aDate).getTime();
                    return aDate ? -1 : 1;
                });
                activeStrategy = sortedByLastUsed[0];
            }

            const hasActiveStrategy = !!activeStrategy;
            const baseRules = activeStrategy?.versions.find((v:any) => v.isActiveVersion)?.ruleSet?.riskRules;
            const accountCapital = assumedCapital;
            
            const currentPnlToday = parseFloat(localStorage.getItem('ec_simulated_pnl_today') || '0');
            
            const defaultRules = { maxDailyLossPct: 3, riskPerTradePct: 1, maxDailyTrades: 5, leverageCap: 20 };
            
            const maxDailyLossPct = recoveryMode ? Math.min(baseRules?.maxDailyLossPct || defaultRules.maxDailyLossPct, 2) : (baseRules?.maxDailyLossPct || defaultRules.maxDailyLossPct);
            
            const riskPerTradePct = recoveryMode ? Math.min(baseRules?.riskPerTradePct || defaultRules.riskPerTradePct, 0.5) : (baseRules?.riskPerTradePct || defaultRules.riskPerTradePct);
            localStorage.setItem("ec_active_risk_pct", String(riskPerTradePct));

            
            const maxDailyLossValue = accountCapital * (maxDailyLossPct / 100);
            const dailyBudgetRemaining = Math.max(0, maxDailyLossValue + Math.min(0, currentPnlToday));
            const riskPerTradeValue = accountCapital * (riskPerTradePct / 100);
            const maxSafeTradesRemaining = riskPerTradeValue > 0 ? Math.floor(dailyBudgetRemaining / riskPerTradeValue) : 0;
            
            const todaysLimits = {
                maxTrades: recoveryMode ? 2 : (baseRules?.maxDailyTrades || defaultRules.maxDailyTrades),
                tradesExecuted: dailyCounters.tradesExecuted || 0,
                maxDailyLossPct,
                lossStreak: dailyCounters.lossStreak || 0,
                cooldownActive: recoveryMode || (guardrails.cooldownAfterLosses !== false && (dailyCounters.lossStreak || 0) >= 2),
                riskPerTradePct,
                leverageCap: recoveryMode ? 10 : (baseRules?.leverageCap || defaultRules.leverageCap),
                recoveryMode: recoveryMode,
                dailyBudgetRemaining,
                maxSafeTradesRemaining,
                hasActiveStrategy,
                activeStrategyName: activeStrategy?.name || null,
                limitSource: hasActiveStrategy ? limitSource : 'none',
            };

            // 5. Compute Final Decision
            const reasons: string[] = [];
            let level: "green" | "yellow" | "red" = "green";
            
            // Apply sensitivity modifiers
            let vixYellowThreshold = 60;
            let vixRedThreshold = 80; 
            let leverageWarnThreshold = 20;
            let leverageFailThreshold = 50;

            if (sensitivitySetting === 'conservative') {
                vixYellowThreshold = 50;
                vixRedThreshold = 70;
                leverageWarnThreshold = 15;
                leverageFailThreshold = 30;
            } else if (sensitivitySetting === 'aggressive') {
                vixYellowThreshold = 70;
                vixRedThreshold = 90;
                leverageWarnThreshold = 30;
                leverageFailThreshold = 75;
            }


            if (recoveryMode && level !== 'red') {
                level = 'yellow';
                reasons.push("Recovery Mode is active, enforcing stricter risk protocols.");
            }

            if (todaysLimits.cooldownActive) {
                level = "red";
                reasons.push(`Cooldown Active: Loss streak limit of 2 was met.`);
            }
            if (dailyBudgetRemaining <= 0) {
                level = "red";
                reasons.push(`Daily Budget Exceeded: Daily loss limit of ${maxDailyLossPct}% has been reached.`);
            }
             if (vixValue >= vixRedThreshold) {
                level = "red";
                reasons.push(`Extreme Volatility: Market VIX is in the 'Extreme' zone (Threshold: >${vixRedThreshold}).`);
            } else if (vixValue >= vixYellowThreshold) {
                if (level !== 'red') level = 'yellow';
                reasons.push(`Elevated Volatility: Market VIX is '${vixZone}' (Threshold: >${vixYellowThreshold}).`);
            }

            if (revengeRiskLevel === 'Critical') {
                level = "red";
                reasons.push("Critical Revenge Risk: Index is at a critical level, indicating high probability of emotional trading.");
            }
            if (revengeRiskLevel === 'High') {
                if(level !== 'red') level = 'yellow';
                reasons.push("High Revenge Risk: Index is high; caution advised.");
            }
            if (personalRisk.disciplineScore < 50) {
                if (level !== 'red') level = "yellow";
                reasons.push(`Low Discipline Score: Recent score of ${personalRisk.disciplineScore} suggests rule-breaking tendency.`);
            }
            
            const maxLeverage = Math.max(...mockPositions.map(p => p.leverage), 0);
            if (maxLeverage >= leverageFailThreshold || (maxLeverage >= leverageWarnThreshold && (vixZone === 'High Volatility' || vixZone === 'Extreme'))) {
                if (level !== 'red') {
                    level = 'yellow';
                    reasons.push(`Excessive Leverage: High leverage (${maxLeverage}x) detected in high volatility (${vixZone}), increasing liquidation risk.`);
                }
            } else if (maxLeverage >= leverageWarnThreshold) {
                if (level !== 'red') level = 'yellow';
                reasons.push(`High Leverage: Open position with ${maxLeverage}x leverage detected.`);
            }
            
            const decisionMessages = {
                red: "Arjun's analysis strongly suggests reviewing and planning, not trading.",
                yellow: "Conditions are challenging. Reduce size, be selective, and stick strictly to A+ setups.",
                green: "Market conditions and your personal risk posture are aligned. Execute your plan."
            };

            if (reasons.length === 0) {
                reasons.push("No major risk factors detected.");
            }

            // 6. Generate Active Nudge
            let activeNudge: ActiveNudge | null = null;
            const nudgeCandidates: {id: string, condition: boolean, nudge: Omit<ActiveNudge, 'id' | 'status'>}[] = [
                {
                    id: 'loss_streak_2',
                    condition: todaysLimits.lossStreak === 2,
                    nudge: { title: "You're on a 2-trade losing streak.", message: "This is a critical point. Your brain will try to 'get it back'. Stop trading now, review your journal, and reset for the next session.", severity: 'warn' }
                },
                {
                    id: 'override_used',
                    condition: dailyCounters.overrideCount > 0,
                    nudge: { title: "Rule Override Detected", message: "You consciously broke your rules today. Ensure you've journaled the 'why'. Overrides are a red flag for discipline decay.", severity: 'warn' }
                },
                {
                    id: 'vix_elevated',
                    condition: vixZone === 'Elevated' || vixZone === 'Volatile',
                    nudge: { title: "Volatility is Elevated", message: "Today is choppy. Consider reducing your trade size by 50% or only taking your absolute A+ setups.", severity: 'info' }
                },
            ];

            for (const candidate of nudgeCandidates) {
                const today = format(new Date(), 'yyyy-MM-dd');
                const alertState = alertStates[candidate.id];

                if (candidate.condition) {
                    if (!alertState || alertState.date !== today || alertState.status === 'new') {
                        activeNudge = { ...candidate.nudge, id: candidate.id, status: alertState?.status || 'new' };
                        break;
                    } else if (alertState.status === 'snoozed') {
                         // It's snoozed for today, do nothing.
                    } else if (alertState.status === 'acknowledged') {
                         // It's acknowledged, but we can still show it without forcing interaction.
                        activeNudge = { ...candidate.nudge, id: candidate.id, status: 'acknowledged' };
                        break;
                    }
                }
            }
            

            // 7. Compute Top Risk Drivers
            const drivers: TopRiskDriver[] = [];
            if (todaysLimits.lossStreak >= 2) {
                drivers.push({
                    id: 'loss_streak',
                    title: 'Consecutive Losses',
                    severity: 'High',
                    why: 'Increases chance of revenge trading & further losses.',
                    action: { label: 'Review Journal', module: 'tradeJournal' }
                });
            }
            if (vixZone === 'Extreme') {
                drivers.push({
                    id: 'vix_extreme',
                    title: 'Extreme Volatility',
                    severity: 'High',
                    why: 'Market is highly unpredictable, risk of slippage is high.',
                    action: { label: 'View VIX', module: 'cryptoVix' }
                });
            } else if (vixZone === 'High Volatility') {
                 drivers.push({
                    id: 'vix_elevated',
                    title: 'High Volatility',
                    severity: 'Medium',
                    why: 'Increased chop & risk of stop-hunts.',
                    action: { label: 'View VIX', module: 'cryptoVix' }
                });
            }
            if (dailyCounters.overrideCount > 0) {
                 drivers.push({
                    id: 'overrides',
                    title: 'Rule Overrides Used',
                    severity: 'Medium',
                    why: 'Consciously breaking your plan is a discipline leak.',
                    action: { label: 'Review Breaches', module: 'analytics' }
                });
            }

            const sortedDrivers = drivers.sort((a,b) => {
                const severityOrder = { High: 1, Medium: 2, Low: 3 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            }).slice(0, 3);


            const finalEvents = riskEventsToday.sort((a, b) => {
                const timeA = a.time.split(':').map(Number);
                const timeB = b.time.split(':').map(Number);
                if (timeA[0] !== timeB[0]) return timeB[0] - timeA[0];
                if (timeA[1] !== timeB[1]) return timeB[1] - timeA[1];
                return 0; // Or compare seconds if available
            });


            const computedState: RiskState = {
                marketRisk,
                personalRisk,
                todaysLimits,
                decision: {
                    level,
                    message: decisionMessages[level],
                    reasons
                },
                riskEventsToday: finalEvents,
                activeNudge,
                topRiskDrivers: sortedDrivers,
            };
            
            setRiskState(computedState);

        } catch (error) {
            console.error("Failed to compute risk state:", error);
            setRiskState(generateDefaultState()); // Set a default state on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        computeRiskState();
        // Listen for storage changes to re-compute
        window.addEventListener('storage', computeRiskState);
        return () => {
            window.removeEventListener('storage', computeRiskState);
        };
    }, [computeRiskState]);

    return { riskState, isLoading, refresh: computeRiskState };
}
