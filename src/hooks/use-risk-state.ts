
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { DemoScenario } from '@/components/dashboard-module';
import { format } from 'date-fns';


// Types for the consolidated risk state
export type VixZone = "Calm" | "Normal" | "Elevated" | "Extreme";

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
        // Mocked for now
        slMovedRate: number;
        riskLeakageRate: number;
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
    };
    decision: RiskDecision;
    riskEventsToday: RiskEvent[];
};

// Helper to get VIX zone from value
const getVixZone = (vix: number): VixZone => {
    if (vix > 75) return "Extreme";
    if (vix > 50) return "Elevated";
    if (vix > 25) return "Normal";
    return "Calm";
};

const mockPositions = [
    { symbol: 'BTC-PERP', direction: 'Long', size: 0.5, pnl: 234.50, leverage: 10, risk: 'Medium' },
    { symbol: 'ETH-PERP', direction: 'Short', size: 12, pnl: -88.12, leverage: 50, risk: 'High' },
    { symbol: 'SOL-PERP', direction: 'Long', size: 100, pnl: 45.20, leverage: 5, risk: 'Low' },
];

export function useRiskState() {
    const [riskState, setRiskState] = useState<RiskState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const computeRiskState = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            // 1. Gather data from various localStorage sources
            const scenario = localStorage.getItem('ec_demo_scenario') as DemoScenario || 'normal';
            const personaData = JSON.parse(localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base") || "{}");
            const dailyCounters = JSON.parse(localStorage.getItem("ec_daily_counters") || '{}')[new Date().toISOString().split('T')[0]] || { lossStreak: 0, tradesExecuted: 0, overrideCount: 0 };
            const strategies = JSON.parse(localStorage.getItem("ec_strategies") || "[]");
            const activeStrategy = strategies.find((s: any) => s.status === 'active'); // Simplified: gets first active
            const recoveryMode = localStorage.getItem('ec_recovery_mode') === 'true';
            const guardrails = JSON.parse(localStorage.getItem("ec_guardrails") || "{}");
            const assumedCapital = parseFloat(localStorage.getItem("ec_assumed_capital") || "10000");

            const riskEventsToday: RiskEvent[] = [];
            const now = new Date();

            // 2. Compute Market Risk
            const vixOverride = localStorage.getItem("ec_vix_override");
            let vixValue = 45;
            if (vixOverride) {
                vixValue = parseInt(vixOverride, 10);
            } else if (scenario === 'high_vol') {
                vixValue = 82;
            } else if (scenario === 'drawdown') {
                vixValue = 65;
            }
            const vixZone = getVixZone(vixValue);
            const marketRisk = {
                vixValue,
                vixZone,
                message: `Volatility is ${vixZone}.`,
            };
            if (vixZone === 'Elevated' || vixZone === 'Extreme') {
                riskEventsToday.push({ time: format(now, 'HH:mm'), description: `VIX entered ${vixZone} zone`, level: 'yellow'});
            }


            // 3. Compute Personal Risk & Revenge Risk
            let revengeRiskIndex = 0;
            if (dailyCounters.lossStreak >= 2) revengeRiskIndex += 30;
            if (dailyCounters.lossStreak >= 3) revengeRiskIndex += 20; // Additional penalty
            if (dailyCounters.overrideCount > 0) revengeRiskIndex += 25;
            if (dailyCounters.tradesExecuted >= (activeStrategy?.versions.find((v:any) => v.isActiveVersion)?.ruleSet?.riskRules.maxDailyTrades || 5) - 1) revengeRiskIndex += 15;
            if (vixZone === 'Elevated') revengeRiskIndex += 10;
            if (vixZone === 'Extreme') revengeRiskIndex += 25;

            revengeRiskIndex = Math.min(100, revengeRiskIndex);
            
            let revengeRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
            if (revengeRiskIndex >= 75) revengeRiskLevel = 'Critical';
            else if (revengeRiskIndex >= 50) revengeRiskLevel = 'High';
            else if (revengeRiskIndex >= 25) revengeRiskLevel = 'Medium';
            
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
            };

            // 4. Compute Today's Limits & Risk Budget
            const baseRules = activeStrategy?.versions.find((v:any) => v.isActiveVersion)?.ruleSet?.riskRules;
            const accountCapital = assumedCapital;
            const currentPnLToday = scenario === 'drawdown' ? -450 : (dailyCounters.tradesExecuted > 0 ? 150 : 0); // Mock PnL
            
            const maxDailyLossPct = recoveryMode ? Math.min(baseRules?.maxDailyLossPct || 3, 2) : (baseRules?.maxDailyLossPct || 3);
            const riskPerTradePct = recoveryMode ? Math.min(baseRules?.riskPerTradePct || 1, 0.5) : (baseRules?.riskPerTradePct || 1);
            
            const maxDailyLossValue = accountCapital * (maxDailyLossPct / 100);
            const dailyBudgetRemaining = Math.max(0, maxDailyLossValue - Math.abs(Math.min(0, currentPnLToday)));
            const riskPerTradeValue = accountCapital * (riskPerTradePct / 100);
            const maxSafeTradesRemaining = riskPerTradeValue > 0 ? Math.floor(dailyBudgetRemaining / riskPerTradeValue) : 0;
            
            const todaysLimits = {
                maxTrades: recoveryMode ? 2 : (baseRules?.maxDailyTrades || 5),
                tradesExecuted: dailyCounters.tradesExecuted || 0,
                maxDailyLossPct,
                lossStreak: dailyCounters.lossStreak || 0,
                cooldownActive: recoveryMode || (guardrails.cooldownAfterLosses !== false && (dailyCounters.lossStreak || 0) >= 2),
                riskPerTradePct,
                leverageCap: recoveryMode ? 10 : (baseRules?.leverageCap || 20),
                recoveryMode: recoveryMode,
                dailyBudgetRemaining,
                maxSafeTradesRemaining,
            };

             if (todaysLimits.lossStreak >= 2) {
                riskEventsToday.push({ time: format(now, 'HH:mm'), description: `Loss streak reached ${todaysLimits.lossStreak}, cooldown recommended`, level: 'yellow' });
            }
             const overrideUsed = localStorage.getItem('ec_override_used_flag');
            if (overrideUsed) {
                riskEventsToday.push({ time: format(now, 'HH:mm'), description: `Rule override used: ${overrideUsed}`, level: 'yellow' });
                localStorage.removeItem('ec_override_used_flag');
            }


            // 5. Compute Final Decision
            const reasons: string[] = [];
            let level: "green" | "yellow" | "red" = "green";
            
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
            if (vixZone === "Extreme") {
                level = "red";
                reasons.push("Extreme Volatility: Market VIX is in the 'Extreme' zone.");
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
             if (guardrails.warnOnHighVIX && vixZone === "Elevated") {
                if (level !== 'red') level = "yellow";
                reasons.push("Elevated Volatility: Your guardrails warn against trading in 'Elevated' VIX.");
            }

            // Leverage Check from open positions
            const maxLeverage = Math.max(...mockPositions.map(p => p.leverage));
            if (maxLeverage >= todaysLimits.leverageCap || (maxLeverage >= 15 && (vixZone === 'Elevated' || vixZone === 'Extreme'))) {
                level = 'red';
                reasons.push(`Excessive Leverage: High leverage (${maxLeverage}x) detected in high volatility (${vixZone}), increasing liquidation risk.`);
            } else if (maxLeverage >= 15) {
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

            const computedState: RiskState = {
                marketRisk,
                personalRisk,
                todaysLimits,
                decision: {
                    level,
                    message: decisionMessages[level],
                    reasons
                },
                riskEventsToday,
            };
            
            setRiskState(computedState);
            localStorage.setItem("ec_risk_state", JSON.stringify(computedState));

        } catch (error) {
            console.error("Failed to compute risk state:", error);
            setRiskState(null);
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
