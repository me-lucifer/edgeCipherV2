
"use client";

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

type DailyCounters = {
    totalTradesPlanned: number;
    totalTradesExecuted: number;
    lossStreak: number;
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
        tradesByStrategyId: {},
    });

    useEffect(() => {
        setCounters(getCountersForToday());
    }, []);

    const incrementTrades = useCallback((strategyId: string) => {
        const newCounters = {
            ...counters,
            totalTradesExecuted: counters.totalTradesExecuted + 1,
            tradesByStrategyId: {
                ...counters.tradesByStrategyId,
                [strategyId]: (counters.tradesByStrategyId[strategyId] || 0) + 1,
            }
        };
        saveCountersForToday(newCounters);
        setCounters(newCounters);
    }, [counters]);

    const updateLossStreak = useCallback((isLoss: boolean) => {
        const newCounters = {
            ...counters,
            lossStreak: isLoss ? counters.lossStreak + 1 : 0,
        };
        saveCountersForToday(newCounters);
        setCounters(newCounters);
    }, [counters]);

    const resetCounters = useCallback(() => {
        const freshCounters = {
            totalTradesPlanned: 0,
            totalTradesExecuted: 0,
            lossStreak: 0,
            tradesByStrategyId: {},
        };
        saveCountersForToday(freshCounters);
        setCounters(freshCounters);
    }, []);

    return { ...counters, incrementTrades, updateLossStreak, resetCounters };
}
