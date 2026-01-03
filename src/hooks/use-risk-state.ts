
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { DemoScenario } from '@/components/dashboard-module';

// Types for the consolidated risk state
export type VixZone = "Calm" | "Normal" | "Elevated" | "Extreme";

export type RiskDecision = {
    level: "green" | "yellow" | "red";
    message: string;
    reasons: string[];
};

export type RiskState = {
    marketRisk: {
        vixValue: number;
        vixZone: VixZone;
        message: string;
    };
    personalRisk: {
        disciplineScore: number;
        emotionalScore: number;
        // Mocked for now
        slMovedRate: number;
        riskLeakageRate: number;
    };
    todaysLimits: {
        maxTrades: number;
        tradesExecuted: number;
        maxDailyLoss: number;
        lossStreak: number;
        cooldownActive: boolean;
    };
    decision: RiskDecision;
};

// Helper to get VIX zone from value
const getVixZone = (vix: number): VixZone => {
    if (vix > 75) return "Extreme";
    if (vix > 50) return "Elevated";
    if (vix > 25) return "Normal";
    return "Calm";
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
            const dailyCounters = JSON.parse(localStorage.getItem("ec_daily_counters") || '{}')[new Date().toISOString().split('T')[0]] || { lossStreak: 0, tradesExecuted: 0 };
            const strategies = JSON.parse(localStorage.getItem("ec_strategies") || "[]");
            const activeStrategy = strategies.find((s: any) => s.status === 'active'); // Simplified: gets first active
            
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

            // 3. Compute Personal Risk
            const personalRisk = {
                disciplineScore: personaData.disciplineScore || 70,
                emotionalScore: personaData.emotionScore || 50,
                slMovedRate: scenario === 'drawdown' ? 25 : 8, // Mock
                riskLeakageRate: scenario === 'drawdown' ? 1.5 : 0.2, // Mock
            };

            // 4. Compute Today's Limits
            const todaysLimits = {
                maxTrades: activeStrategy?.ruleSet?.riskRules?.maxDailyTrades || 5,
                tradesExecuted: dailyCounters.tradesExecuted || 0,
                maxDailyLoss: activeStrategy?.ruleSet?.riskRules?.maxDailyLossPct || 3,
                lossStreak: dailyCounters.lossStreak || 0,
                cooldownActive: (activeStrategy?.ruleSet?.riskRules?.cooldownAfterLosses && (dailyCounters.lossStreak || 0) >= 2),
            };

            // 5. Compute Final Decision
            const reasons: string[] = [];
            let level: "green" | "yellow" | "red" = "green";

            if (todaysLimits.cooldownActive) {
                level = "red";
                reasons.push(`Cooldown is active due to a ${todaysLimits.lossStreak}-trade losing streak.`);
            }
            if (vixZone === "Extreme") {
                level = "red";
                reasons.push("Market volatility is 'Extreme'.");
            }
            if (personalRisk.disciplineScore < 50) {
                if (level !== 'red') level = "yellow";
                reasons.push(`Recent discipline score is low (${personalRisk.disciplineScore}).`);
            }
             if (vixZone === "Elevated") {
                if (level !== 'red') level = "yellow";
                reasons.push("Market volatility is 'Elevated'.");
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
                }
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
