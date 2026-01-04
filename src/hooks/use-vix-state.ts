
"use client";

import { useState, useEffect, useCallback } from 'react';

export type VixZone = "Extremely Calm" | "Normal" | "Volatile" | "High Volatility" | "Extreme";

export interface VixComponents {
    btcVol: number;
    ethVol: number;
    fundingPressure: number;
    liquidationSpike: number;
    newsSentiment: number;
}

export interface VixSeries {
    series24h: { hour: string; value: number }[];
    series7d: { day: string; value: number }[];
}

export interface VixState {
    value: number;
    zoneLabel: VixZone;
    updatedAt: string;
    components: VixComponents;
    series: VixSeries;
}

const VIX_STATE_CACHE_KEY = "ec_vix_state";
const VIX_SERIES_CACHE_KEY = "ec_vix_series";

const getVixZone = (vix: number): VixZone => {
    if (vix <= 20) return "Extremely Calm";
    if (vix <= 40) return "Normal";
    if (vix <= 60) return "Volatile";
    if (vix <= 80) return "High Volatility";
    return "Extreme";
};

// Seeded random for deterministic data
function seededRandom(seed: number) {
    let state = seed;
    return function() {
      state = (state * 1103515245 + 12345) % 2147483648;
      return state / 2147483648;
    };
}

const generateVixSeries = (baseValue: number): VixSeries => {
    const seed = new Date().toISOString().split('T')[0].length; // Daily stable seed
    const random = seededRandom(seed);
    
    const series24h = [...Array(7)].map((_, i) => {
        const hour = i === 6 ? 'Now' : `${24 - i * 4}h`;
        const value = baseValue + (random() - 0.5) * 20;
        return { hour, value: Math.max(0, Math.min(100, Math.round(value))) };
    }).reverse();
    series24h[6].value = baseValue;


    const series7d = [...Array(7)].map((_, i) => {
        const day = i === 6 ? 'Today' : `${7 - i -1}d ago`;
        const value = baseValue + (random() - 0.5) * 40;
         return { day, value: Math.max(0, Math.min(100, Math.round(value))) };
    });
    series7d[6].value = baseValue;

    return { series24h, series7d };
};

const generateDefaultState = (): VixState => {
    const value = 37;
    const series = generateVixSeries(value);
    return {
        value,
        zoneLabel: getVixZone(value),
        updatedAt: new Date().toISOString(),
        components: {
            btcVol: 35,
            ethVol: 45,
            fundingPressure: 20,
            liquidationSpike: 10,
            newsSentiment: 40,
        },
        series,
    };
};

export function useVixState() {
    const [vixState, setVixState] = useState<VixState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadVixState = useCallback(() => {
        setIsLoading(true);
        if (typeof window !== "undefined") {
            try {
                let state: VixState;
                const storedState = localStorage.getItem(VIX_STATE_CACHE_KEY);
                if (storedState) {
                    state = JSON.parse(storedState);
                    // Ensure series data is present
                    if (!state.series) {
                         state.series = generateVixSeries(state.value);
                    }
                } else {
                    state = generateDefaultState();
                }
                
                localStorage.setItem(VIX_STATE_CACHE_KEY, JSON.stringify(state));
                setVixState(state);

            } catch (e) {
                console.error("Failed to load VIX state from localStorage", e);
                setVixState(generateDefaultState());
            } finally {
                setIsLoading(false);
            }
        }
    }, []);

    const updateVixValue = useCallback((newValue: number) => {
        const newSeries = generateVixSeries(newValue);
        const newState: VixState = {
            value: newValue,
            zoneLabel: getVixZone(newValue),
            updatedAt: new Date().toISOString(),
            components: {
                btcVol: newValue * 0.8 + Math.random() * 10,
                ethVol: newValue * 0.9 + Math.random() * 15,
                fundingPressure: newValue * 0.5 + Math.random() * 20,
                liquidationSpike: newValue > 60 ? newValue * 0.7 + Math.random() * 30 : 10,
                newsSentiment: 50 - (newValue * 0.3) + (Math.random() - 0.5) * 20,
            },
            series: newSeries
        };
        setVixState(newState);
        if (typeof window !== "undefined") {
            localStorage.setItem(VIX_STATE_CACHE_KEY, JSON.stringify(newState));
        }
    }, []);

    useEffect(() => {
        loadVixState();
        
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === VIX_STATE_CACHE_KEY) {
                loadVixState();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadVixState]);

    return { vixState, isLoading, updateVixValue, refresh: loadVixState };
}
