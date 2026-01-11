
"use client";

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';

const NEWS_CACHE_KEY = "ec_news_state_v2";
const TTL_MS = 5 * 60 * 1000; // 5 minutes

type IntelStatus = 'Fresh' | 'Stale' | 'Loading';

export function useIntelStatus() {
    const [status, setStatus] = useState<IntelStatus>('Loading');
    const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

    const checkStatus = useCallback(() => {
        try {
            const storedData = localStorage.getItem(NEWS_CACHE_KEY);
            if (!storedData) {
                setStatus('Stale');
                setLastFetchedAt(null);
                return;
            }
            const cachedData = JSON.parse(storedData);
            const fetchedDate = new Date(cachedData.lastFetchedAt);
            const isExpired = new Date().getTime() - fetchedDate.getTime() > TTL_MS;

            setStatus(isExpired ? 'Stale' : 'Fresh');
            setLastFetchedAt(formatDistanceToNow(fetchedDate, { addSuffix: true }));

        } catch (e) {
            console.error("Failed to check intel status", e);
            setStatus('Stale');
            setLastFetchedAt(null);
        }
    }, []);

    useEffect(() => {
        checkStatus();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === NEWS_CACHE_KEY) {
                checkStatus();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(checkStatus, 60 * 1000); // Check every minute

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [checkStatus]);

    return { status, lastFetchedAt };
}
