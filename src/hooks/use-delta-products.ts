
"use client";

import { useState, useEffect, useCallback } from "react";

export type Product = {
    id: string;
    symbol: string;
    name?: string;
};

const CACHE_KEY = "ec_delta_products_cache";
const TTL = 6 * 60 * 60 * 1000; // 6 hours

const mockProducts: Product[] = [
    { id: "BTC-PERP", symbol: "BTCUSDT", name: "Bitcoin Perpetual" },
    { id: "ETH-PERP", symbol: "ETHUSDT", name: "Ethereum Perpetual" },
    { id: "SOL-PERP", symbol: "SOLUSDT", name: "Solana Perpetual" },
];

export function useDeltaProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cacheInfo, setCacheInfo] = useState<{ isStale: boolean, fetchedAt: string | null }>({ isStale: false, fetchedAt: null });

    const loadProducts = useCallback(async (forceRefresh = false) => {
        setIsLoading(true);
        setError(null);
        setCacheInfo({ isStale: false, fetchedAt: null });

        let cachedData = null;
        try {
            const storedData = localStorage.getItem(CACHE_KEY);
            if (storedData) {
                cachedData = JSON.parse(storedData);
            }
        } catch (e) {
            console.error("Failed to read from product cache", e);
            localStorage.removeItem(CACHE_KEY);
        }

        if (cachedData && !forceRefresh) {
            const { products: cachedProducts, fetchedAt } = cachedData;
            const isExpired = new Date().getTime() - new Date(fetchedAt).getTime() > TTL;
            if (!isExpired) {
                setProducts(cachedProducts);
                setIsLoading(false);
                setCacheInfo({ isStale: false, fetchedAt });
                return;
            }
        }

        // Simulate API call
        setTimeout(() => {
            // Simulate a fetch error for demonstration
            const shouldFail = Math.random() < 0.2 && forceRefresh;

            if (shouldFail) {
                const errorMessage = "Failed to fetch products from Delta API (simulated).";
                setError(errorMessage);
                if (cachedData) {
                    setProducts(cachedData.products); // Use stale data
                    setCacheInfo({ isStale: true, fetchedAt: cachedData.fetchedAt });
                }
            } else {
                try {
                    const newFetchedAt = new Date().toISOString();
                    setProducts(mockProducts);
                    localStorage.setItem(
                        CACHE_KEY,
                        JSON.stringify({ products: mockProducts, fetchedAt: newFetchedAt })
                    );
                    setCacheInfo({ isStale: false, fetchedAt: newFetchedAt });
                } catch (e) {
                    console.error("Failed to write to product cache", e);
                    setError("Unable to save products (prototype).");
                }
            }
            setIsLoading(false);
        }, 800);

    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const getProductById = (id: string) => {
        return products.find(p => p.id === id);
    };

    const getProductBySymbol = (symbol: string) => {
        return products.find(p => p.symbol === symbol);
    };

    return { products, isLoading, error, loadProducts, getProductById, getProductBySymbol, cacheInfo };
}
