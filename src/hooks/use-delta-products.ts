
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

    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const cachedData = localStorage.getItem(CACHE_KEY);
            if (cachedData) {
                const { products: cachedProducts, fetchedAt } = JSON.parse(cachedData);
                if (new Date().getTime() - new Date(fetchedAt).getTime() < TTL) {
                    setProducts(cachedProducts);
                    setIsLoading(false);
                    return;
                }
            }
        } catch (e) {
            console.error("Failed to read from product cache", e);
            localStorage.removeItem(CACHE_KEY);
        }

        // Simulate API call
        setTimeout(() => {
            try {
                setProducts(mockProducts);
                localStorage.setItem(
                    CACHE_KEY,
                    JSON.stringify({ products: mockProducts, fetchedAt: new Date().toISOString() })
                );
            } catch (e) {
                console.error("Failed to write to product cache", e);
                setError("Unable to save products (prototype).");
            } finally {
                setIsLoading(false);
            }
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

    return { products, isLoading, error, loadProducts, getProductById, getProductBySymbol };
}
