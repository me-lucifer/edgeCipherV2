
"use client";

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

type DailyCounters = {
    totalTradesPlanned: number;
    totalTradesExecuted: number;
    lossStreak: number;
    overrideCount: number;
    tradesByStrategyId: { [key: string]: number };
};

const COUNTERS_KEY = "ec_daily_counters";

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

const getCountersForToday = (): DailyCounters => {
    const todayKey = getTodayKey();
    try {
        const allCounters = JSON.parse(localStorage.getItem(COUNTERS_KEY) || '{}');
        if (allCounters[todayKey]) {
            return allCounters[todayKey];
        }
    } catch (e) {
        console.error("Failed to parse daily counters", e);
    }
    // Return default if not found or error
    return {
        totalTradesPlanned: 0,
        totalTradesExecuted: 0,
        lossStreak: 0,
        overrideCount: 0,
        tradesByStrategyId: {},
    };
};

const saveCountersForToday = (counters: DailyCounters) => {
    const todayKey = getTodayKey();
    try {
        const allCounters = JSON.parse(localStorage.getItem(COUNTERS_KEY) || '{}');
        // Clean up old dates to prevent localStorage from growing indefinitely (optional but good practice)
        const newCountersState: { [key: string]: DailyCounters } = { [todayKey]: counters };
        localStorage.setItem(COUNTERS_KEY, JSON.stringify(newCountersState));
    } catch (e) {
        console.error("Failed to save daily counters", e);
    }
};

export function useDailyCounters() {
    const [counters, setCounters] = useState<DailyCounters>({
        totalTradesPlanned: 0,
        totalTradesExecuted: 0,
        lossStreak: 0,
        overrideCount: 0,
        tradesByStrategyId: {},
    });

    useEffect(() => {
        setCounters(getCountersForToday());
    }, []);

    const incrementTrades = useCallback((strategyId: string) => {
        setCounters(prevCounters => {
            const newCounters = {
                ...prevCounters,
                totalTradesExecuted: prevCounters.totalTradesExecuted + 1,
                tradesByStrategyId: {
                    ...prevCounters.tradesByStrategyId,
                    [strategyId]: (prevCounters.tradesByStrategyId[strategyId] || 0) + 1,
                }
            };
            saveCountersForToday(newCounters);
            return newCounters;
        });
    }, []);

    const incrementOverrides = useCallback(() => {
        setCounters(prevCounters => {
            const newCounters = {
                ...prevCounters,
                overrideCount: prevCounters.overrideCount + 1,
            };
            saveCountersForToday(newCounters);
            return newCounters;
        });
    }, []);

    const updateLossStreak = useCallback((isLoss: boolean) => {
        setCounters(prevCounters => {
            const newCounters = {
                ...prevCounters,
                lossStreak: isLoss ? prevCounters.lossStreak + 1 : 0,
            };
            saveCountersForToday(newCounters);
            return newCounters;
        });
    }, []);

    const resetCounters = useCallback(() => {
        const freshCounters: DailyCounters = {
            totalTradesPlanned: 0,
            totalTradesExecuted: 0,
            lossStreak: 0,
            overrideCount: 0,
            tradesByStrategyId: {},
        };
        saveCountersForToday(freshCounters);
        setCounters(freshCounters);
    }, []);

    return { ...counters, incrementTrades, updateLossStreak, incrementOverrides, resetCounters };
}
