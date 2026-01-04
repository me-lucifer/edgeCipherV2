
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

const generateVixSeries = (baseValue: number, mode: 'normal' | 'choppy' = 'normal'): VixSeries => {
    const seed = new Date().toISOString().split('T')[0].length + (mode === 'choppy' ? 100 : 0); // Change seed for choppy
    const random = seededRandom(seed);
    
    const series24h = [...Array(7)].map((_, i) => {
        const hour = i === 6 ? 'Now' : `${24 - i * 4}h`;
        const volatilityFactor = mode === 'choppy' ? 40 : 20;
        let value = baseValue + (random() - 0.5) * volatilityFactor;
        if (mode === 'choppy' && Math.random() < 0.4) {
            value += (Math.random() - 0.5) * 30; // Add extra spikes
        }
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

                // Check for override
                const vixOverride = localStorage.getItem("ec_vix_override");
                if (vixOverride) {
                    const newValue = parseInt(vixOverride, 10);
                    if (!isNaN(newValue) && newValue !== state.value) {
                        state.value = newValue;
                        state.zoneLabel = getVixZone(newValue);
                        state.updatedAt = new Date().toISOString();
                        // Update the last point in the series
                        state.series.series24h[state.series.series24h.length - 1].value = newValue;
                        state.series.series7d[state.series.series7d.length - 1].value = newValue;
                    }
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

    const updateVixValue = useCallback((newValue: number, mode: 'normal' | 'choppy' = 'normal') => {
        if (typeof window === "undefined") return;

        try {
            const currentStateString = localStorage.getItem(VIX_STATE_CACHE_KEY);
            const currentState = currentStateString ? JSON.parse(currentStateString) : generateDefaultState();
            
            const newSeries = generateVixSeries(newValue, mode);
            
            const newState: VixState = {
                ...currentState,
                value: newValue,
                zoneLabel: getVixZone(newValue),
                updatedAt: new Date().toISOString(),
                series: newSeries,
                components: {
                    btcVol: newValue * 0.8 + Math.random() * 10,
                    ethVol: newValue * 0.9 + Math.random() * 15,
                    fundingPressure: newValue * 0.5 + Math.random() * 20,
                    liquidationSpike: newValue > 60 ? newValue * 0.7 + Math.random() * 30 : 10,
                    newsSentiment: 50 - (newValue * 0.3) + (Math.random() - 0.5) * 20,
                },
            };

            localStorage.setItem(VIX_STATE_CACHE_KEY, JSON.stringify(newState));
            
            // This is the crucial part: dispatch a storage event to notify other tabs/hooks
            window.dispatchEvent(new StorageEvent('storage', {
                key: VIX_STATE_CACHE_KEY,
                newValue: JSON.stringify(newState),
            }));

            // Also update the local state for immediate feedback in the current component
            setVixState(newState);

        } catch (e) {
            console.error("Failed to update VIX state:", e);
        }
    }, []);
    
    const generateChoppyDay = useCallback(() => {
        if (typeof window === "undefined") return;
        const currentStateString = localStorage.getItem(VIX_STATE_CACHE_KEY);
        const currentState = currentStateString ? JSON.parse(currentStateString) : generateDefaultState();
        
        const newSeries = generateVixSeries(currentState.value, 'choppy');
        const newState = { ...currentState, series: newSeries };
        
        localStorage.setItem(VIX_STATE_CACHE_KEY, JSON.stringify(newState));
        window.dispatchEvent(new StorageEvent('storage', {
            key: VIX_STATE_CACHE_KEY,
            newValue: JSON.stringify(newState),
        }));
        setVixState(newState);
    }, []);

    useEffect(() => {
        loadVixState();
        
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === VIX_STATE_CACHE_KEY || e.key === "ec_vix_override" || e.key === 'ec_demo_scenario') {
                loadVixState();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadVixState]);

    return { vixState, isLoading, updateVixValue, generateChoppyDay, refresh: loadVixState };
}
