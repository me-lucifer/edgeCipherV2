
"use client";

import { useState, useEffect } from "react";
import { BarChartHorizontal, Check, ChevronsUpDown, Send, Sun, Moon, Maximize, Minimize, LineChart, Bot, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { useDeltaProducts, type Product } from "@/hooks/use-delta-products";

interface ChartModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const intervals = [
    { label: "1m", value: "1" },
    { label: "5m", value: "5" },
    { label: "15m", value: "15" },
    { label: "1h", value: "60" },
    { label: "4h", value: "240" },
    { label: "1D", value: "D" },
];

const arjunTips = [
    "Mark major swing highs and lows before planning a trade.",
    "Check multiple timeframes before committing.",
    "Combine chart with your Strategy rules — no random trades.",
    "Use this chart to spot clean, logical setups, not to chase candles.",
]

export function ChartModule({ onSetModule }: ChartModuleProps) {
    const { products, isLoading: isProductsLoading, error: productsError } = useDeltaProducts();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [tvSymbol, setTvSymbol] = useState<string>("");
    const [interval, setInterval] = useState<string>("60");
    const [chartTheme, setChartTheme] = useState<"dark" | "light">("dark");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [chartAvailability, setChartAvailability] = useState<'unknown' | 'ok' | 'unavailable'>('unknown');


    useEffect(() => {
        if (typeof window !== "undefined" && products.length > 0 && !selectedProduct) {
            const savedProduct = localStorage.getItem("ec_chart_last_product");
            const savedInterval = localStorage.getItem("ec_chart_last_interval");
            const savedTheme = localStorage.getItem("ec_chart_theme") as "dark" | "light";

            let productToSet = products[0];
            if (savedProduct) {
                try {
                    const parsedProduct = JSON.parse(savedProduct);
                    const foundProduct = products.find(p => p.id === parsedProduct.id);
                    if (foundProduct) {
                        productToSet = foundProduct;
                    }
                } catch (e) {
                    // Fallback to default
                }
            }
            handleProductSelect(productToSet);
            
            if (savedInterval && intervals.some(i => i.value === savedInterval)) {
                setInterval(savedInterval);
            }

            if (savedTheme) {
                setChartTheme(savedTheme);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products]);

    useEffect(() => {
        if (typeof window !== "undefined" && selectedProduct) {
            localStorage.setItem("ec_chart_last_product", JSON.stringify(selectedProduct));
        }
    }, [selectedProduct]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("ec_chart_last_interval", interval);
        }
    }, [interval]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("ec_chart_theme", chartTheme);
        }
    }, [chartTheme]);
    
    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        const newTvSymbol = mapDeltaToTradingView(product);
        setTvSymbol(newTvSymbol);
        setIsSelectorOpen(false);

        // Simulate availability check based on the mapped symbol
        if (newTvSymbol.includes("UNKNOWN")) {
            setChartAvailability('unavailable');
        } else {
            setChartAvailability('ok');
        }
    };

    const mapDeltaToTradingView = (product: Product): string => {
        if (product.symbol.endsWith("USDT")) {
            return `BINANCE:${product.symbol}`;
        }
        if (product.id.endsWith("-PERP")) {
            const base = product.id.replace("-PERP", "");
            return `BINANCE:${base}USDT`;
        }
        return `BINANCE:${product.symbol || "UNKNOWN"}`;
    };

    const handleSendToPlanning = () => {
        if (selectedProduct) {
            onSetModule('tradePlanning', { 
                planContext: { 
                    instrument: selectedProduct.id,
                    origin: 'Chart Module'
                }
            });
        }
    };

    const selectedIntervalLabel = intervals.find(i => i.value === interval)?.label || interval;

    return (
        <div className={cn("flex flex-col h-full space-y-4 transition-all duration-300", isFullscreen && "fixed inset-0 bg-background z-50 p-4")}>
            <div className={cn("flex items-center justify-between", !isFullscreen && "hidden")}>
                {selectedProduct && (
                    <div className="text-left">
                        <h3 className="font-semibold text-foreground">{tvSymbol}</h3>
                        <p className="text-sm text-muted-foreground">
                            <Badge variant="secondary">{selectedIntervalLabel}</Badge>
                        </p>
                    </div>
                )}
                 <div className="flex-1" />
                 <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}>
                    <Minimize className="h-4 w-4" />
                </Button>
            </div>
             <div className={cn(isFullscreen && "hidden")}>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Chart</h1>
                <p className="text-muted-foreground">
                    Use the chart to analyze, then hand off to Trade Planning.
                </p>
            </div>
            
            <Card className="h-16 bg-muted/30 border-border/50">
                <CardContent className="p-2 h-full flex items-center gap-4">
                    {/* Instrument Selector */}
                    <Popover open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isSelectorOpen}
                                className="w-[200px] justify-between"
                                disabled={isProductsLoading}
                            >
                                {isProductsLoading ? "Loading..." : selectedProduct ? selectedProduct.name : "Select instrument..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Search instrument..." />
                                <CommandList>
                                    {productsError && <CommandEmpty>{productsError}</CommandEmpty>}
                                    {!productsError && products.length === 0 && <CommandEmpty>No products found.</CommandEmpty>}
                                    <CommandGroup>
                                        {products.map((product) => (
                                            <CommandItem
                                                key={product.id}
                                                value={product.id}
                                                onSelect={() => handleProductSelect(product)}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", selectedProduct?.id === product.id ? "opacity-100" : "opacity-0")} />
                                                {product.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Interval Selector */}
                    <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                        {intervals.map(item => (
                            <Button
                                key={item.value}
                                size="sm"
                                variant={interval === item.value ? 'secondary' : 'ghost'}
                                onClick={() => setInterval(item.value)}
                                className="rounded-full h-8 px-3 text-xs"
                            >
                                {item.label}
                            </Button>
                        ))}
                    </div>
                    
                     {/* Theme Toggle */}
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="chart-theme" className="text-sm text-muted-foreground">Theme</Label>
                        <Switch id="chart-theme" checked={chartTheme === 'dark'} onCheckedChange={(checked) => setChartTheme(checked ? 'dark' : 'light')} />
                        {chartTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Button onClick={handleSendToPlanning} disabled={!selectedProduct}>
                            <Send className="mr-2 h-4 w-4" />
                            Send to Trade Planning
                        </Button>
                    </div>

                </CardContent>
            </Card>

            <div className="flex-1 min-h-0">
                <Card className="h-full bg-muted/30 border-border/50 flex flex-col items-center justify-center relative border-2 border-dashed">
                     {selectedProduct ? (
                        <>
                            {chartAvailability === 'unavailable' && (
                                <div className="absolute top-0 inset-x-0 z-10 p-2 bg-amber-900/90 text-amber-200 text-center text-sm">
                                    <div className="flex items-center justify-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        <div>
                                            <p className="font-semibold">Chart not available for this instrument.</p>
                                            <p className="text-xs">You can still proceed with Trade Planning.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={cn("absolute top-4 left-4 text-left", isFullscreen && "hidden")}>
                                <h3 className="font-semibold text-foreground">{tvSymbol}</h3>
                                <p className="text-sm text-muted-foreground">
                                    <Badge variant="secondary">{selectedIntervalLabel}</Badge>
                                </p>
                            </div>
                            
                            {chartAvailability === 'ok' ? (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground flex-1">
                                    <LineChart className="mx-auto h-24 w-24 opacity-10" />
                                    <p className="mt-4">TradingView Widget Placeholder</p>
                                </div>
                            ) : chartAvailability === 'unavailable' ? (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground flex-1">
                                    <BarChartHorizontal className="mx-auto h-16 w-16 opacity-10" />
                                    <p className="mt-4">No chart data available for this instrument.</p>
                                </div>
                            ) : null}

                            <p className="absolute bottom-4 text-xs text-muted-foreground/50">
                                Phase 1 prototype: replace this box with real TradingView widget integration.
                            </p>
                        </>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <BarChartHorizontal className="mx-auto h-12 w-12" />
                            <p className="mt-4">Choose an instrument from the toolbar to load its chart.</p>
                        </div>
                    )}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="absolute bottom-4 left-4 z-10 rounded-full shadow-lg bg-background/50 backdrop-blur-sm">
                                <Bot className="h-5 w-5 text-primary" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start" className="w-80">
                            <div className="space-y-4">
                                <h4 className="font-semibold leading-none">Arjun's Chart Tips</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                    {arjunTips.map((tip, i) => <li key={i}>{tip}</li>)}
                                </ul>
                                <p className="text-xs text-muted-foreground/80 italic">In future phases, Arjun will analyze your charts and volatility for you.</p>
                            </div>
                        </PopoverContent>
                    </Popover>
                </Card>
            </div>
        </div>
    );
}
