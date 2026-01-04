
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

export interface VixState {
    value: number;
    zoneLabel: VixZone;
    updatedAt: string;
    components: VixComponents;
}

const CACHE_KEY = "ec_vix_state";

const getVixZone = (vix: number): VixZone => {
    if (vix <= 20) return "Extremely Calm";
    if (vix <= 40) return "Normal";
    if (vix <= 60) return "Volatile";
    if (vix <= 80) return "High Volatility";
    return "Extreme";
};

const generateDefaultState = (): VixState => {
    const value = 37;
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
        }
    };
};

export function useVixState() {
    const [vixState, setVixState] = useState<VixState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadVixState = useCallback(() => {
        setIsLoading(true);
        if (typeof window !== "undefined") {
            try {
                const storedState = localStorage.getItem(CACHE_KEY);
                if (storedState) {
                    setVixState(JSON.parse(storedState));
                } else {
                    const defaultState = generateDefaultState();
                    setVixState(defaultState);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(defaultState));
                }
            } catch (e) {
                console.error("Failed to load VIX state from localStorage", e);
                setVixState(generateDefaultState());
            } finally {
                setIsLoading(false);
            }
        }
    }, []);

    const updateVixValue = useCallback((newValue: number) => {
        const newState: VixState = {
            value: newValue,
            zoneLabel: getVixZone(newValue),
            updatedAt: new Date().toISOString(),
            // Mock component updates for realism
            components: {
                btcVol: newValue * 0.8 + Math.random() * 10,
                ethVol: newValue * 0.9 + Math.random() * 15,
                fundingPressure: newValue * 0.5 + Math.random() * 20,
                liquidationSpike: newValue > 60 ? newValue * 0.7 + Math.random() * 30 : 10,
                newsSentiment: 50 - (newValue * 0.3) + (Math.random() - 0.5) * 20,
            }
        };
        setVixState(newState);
        if (typeof window !== "undefined") {
            localStorage.setItem(CACHE_KEY, JSON.stringify(newState));
        }
    }, []);

    useEffect(() => {
        loadVixState();
        
        // Listen for storage events to sync across tabs/components
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === CACHE_KEY) {
                loadVixState();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadVixState]);

    return { vixState, isLoading, updateVixValue, refresh: loadVixState };
}
