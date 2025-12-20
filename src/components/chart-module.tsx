
"use client";

import { useState, useEffect } from "react";
import { BarChartHorizontal, Check, ChevronsUpDown, Send, Sun, Moon, Maximize, Minimize, LineChart, Bot, AlertTriangle, Loader2, RefreshCw, ArrowRight, Info, XCircle } from "lucide-react";
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
import { Skeleton } from "./ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { ModuleContext } from "./authenticated-app-shell";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ChartModuleProps {
    onSetModule: (module: any, context?: ModuleContext) => void;
    planContext?: ModuleContext['planContext'];
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

function ChartWidgetShell({ tvSymbol, interval, chartTheme }: { tvSymbol: string; interval: string; chartTheme: 'dark' | 'light' }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, [tvSymbol, interval, chartTheme]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground flex-1 p-4">
                <Skeleton className="h-full w-full" />
            </div>
        );
    }
    
    return (
        <>
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground flex-1">
                <LineChart className="mx-auto h-24 w-24 opacity-10" />
                <p className="mt-4">TradingView Widget Placeholder</p>
            </div>
             <p className="absolute bottom-4 left-4 text-xs text-muted-foreground/50">
                Recreated for {tvSymbol} · {interval} · {chartTheme}
            </p>
            <p className="absolute bottom-4 right-4 text-xs text-muted-foreground/50">
                Phase 1 prototype: replace this box with real TradingView widget integration.
            </p>
        </>
    );
}

function Phase1InfoBox({ onDismiss }: { onDismiss: () => void }) {
    const checkItems = [
        { text: "Use standard TradingView tools to draw and mark levels.", isDone: true },
        { text: "Quickly switch instruments and timeframes.", isDone: true },
        { text: "Send the selected symbol into Trade Planning.", isDone: true },
        { text: "Does not save drawings when you refresh.", isDone: false },
        { text: "Does not auto-draw Entry/SL/TP yet.", isDone: false },
    ];
    return (
        <Alert className="bg-muted/30 border-border/50">
            <Info className="h-4 w-4" />
            <div className="flex justify-between items-start">
                <div>
                    <AlertTitle>What this chart can do in Phase 1</AlertTitle>
                    <AlertDescription>
                        <ul className="mt-2 space-y-1 text-xs">
                        {checkItems.map((item, i) => (
                            <li key={i} className="flex items-center gap-2">
                                {item.isDone ? <Check className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-amber-500" />}
                                <span>{item.text}</span>
                            </li>
                        ))}
                        </ul>
                        <p className="text-xs mt-3 italic">Later phases will connect this more deeply with Arjun and your strategies.</p>
                    </AlertDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={onDismiss}>Got it</Button>
            </div>
        </Alert>
    );
}

export function ChartModule({ onSetModule, planContext }: ChartModuleProps) {
    const { products, isLoading: isProductsLoading, error: productsError, loadProducts, cacheInfo } = useDeltaProducts();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [tvSymbol, setTvSymbol] = useState<string>("");
    const [interval, setInterval] = useState<string>("60");
    const [chartTheme, setChartTheme] = useState<"dark" | "light">("dark");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [chartAvailability, setChartAvailability] = useState<'unknown' | 'ok' | 'unavailable'>('unknown');
    const [isInfoBoxVisible, setIsInfoBoxVisible] = useState(false);


    useEffect(() => {
        if (typeof window !== "undefined") {
            const infoBoxDismissed = localStorage.getItem("ec_chart_phase1_info_dismissed");
            if (!infoBoxDismissed) {
                setIsInfoBoxVisible(true);
            }
            
            if (products.length > 0) {
                let productToSet: Product | null = null;
                
                // 1. Check for context from another module
                if (planContext?.instrument) {
                    const productFromContext = products.find(p => p.id === planContext.instrument);
                    if (productFromContext) {
                        productToSet = productFromContext;
                    }
                }
                
                // 2. If no context, check localStorage
                if (!productToSet) {
                    const savedProduct = localStorage.getItem("ec_chart_last_product");
                    if (savedProduct) {
                        try {
                            const parsedProduct = JSON.parse(savedProduct);
                            const foundProduct = products.find(p => p.id === parsedProduct.id);
                            if (foundProduct) {
                                productToSet = foundProduct;
                            }
                        } catch (e) { /* fallback to default */ }
                    }
                }
                
                // 3. Set the product (or do nothing if none is found/set)
                if (productToSet) {
                    handleProductSelect(productToSet);
                }

                const savedInterval = localStorage.getItem("ec_chart_last_interval");
                const savedTheme = localStorage.getItem("ec_chart_theme") as "dark" | "light";
                
                if (savedInterval && intervals.some(i => i.value === savedInterval)) {
                    setInterval(savedInterval);
                }

                if (savedTheme) {
                    setChartTheme(savedTheme);
                }
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products, planContext]);

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
    
    const handleSelectDefault = () => {
        const btcProduct = products.find(p => p.id === 'BTC-PERP');
        if (btcProduct) {
            handleProductSelect(btcProduct);
        }
    };
    
    const dismissInfoBox = () => {
        setIsInfoBoxVisible(false);
        localStorage.setItem("ec_chart_phase1_info_dismissed", "true");
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
            
            {isInfoBoxVisible && !isFullscreen && <Phase1InfoBox onDismiss={dismissInfoBox} />}
            
            <Card className="h-auto md:h-16 bg-muted/30 border-border/50">
                <CardContent className="p-2 h-full flex flex-col md:flex-row items-start md:items-center gap-4">
                    {/* Instrument Selector */}
                    <Popover open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isSelectorOpen}
                                className="w-full md:w-[200px] justify-between"
                                disabled={isProductsLoading && products.length === 0}
                            >
                                {isProductsLoading && products.length === 0 ? "Loading..." : selectedProduct ? selectedProduct.name : "Select instrument..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Search instrument..." />
                                <CommandList>
                                    {productsError && products.length === 0 && <CommandEmpty>{productsError}</CommandEmpty>}
                                    {!productsError && products.length === 0 && <CommandEmpty>No products found.</CommandEmpty>}
                                    <CommandGroup>
                                        {products.map((product) => (
                                            <CommandItem
                                                key={product.id}
                                                value={product.name}
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

                     {productsError && (
                        <div className="flex items-center gap-2 text-xs">
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant="destructive" className="gap-1.5">
                                            <AlertTriangle className="h-3 w-3"/>
                                            Error loading list
                                            {cacheInfo.isStale && ' (using cache)'}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">{productsError} {cacheInfo.isStale && `Displaying stale data from ${formatDistanceToNow(new Date(cacheInfo.fetchedAt!))} ago.`}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => loadProducts(true)}>
                                <RefreshCw className="mr-2 h-3 w-3" />
                                Retry
                            </Button>
                        </div>
                    )}

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
                                <ChartWidgetShell 
                                    key={`${tvSymbol}_${interval}_${chartTheme}`}
                                    tvSymbol={tvSymbol}
                                    interval={selectedIntervalLabel}
                                    chartTheme={chartTheme}
                                />
                            ) : chartAvailability === 'unavailable' ? (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground flex-1">
                                    <BarChartHorizontal className="mx-auto h-16 w-16 opacity-10" />
                                    <p className="mt-4">No chart data available for this instrument.</p>
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div className="text-center text-muted-foreground p-8">
                            {isProductsLoading ? (
                                <>
                                    <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                                    <p className="mt-4">Loading instruments...</p>
                                </>
                            ) : (
                                <>
                                    <BarChartHorizontal className="mx-auto h-12 w-12 opacity-50" />
                                    <h3 className="mt-4 text-lg font-semibold text-foreground">No instrument selected</h3>
                                    <p className="mt-1 text-sm">
                                        Pick an instrument from the toolbar to load its TradingView chart.
                                    </p>
                                    <div className="mt-6 flex justify-center gap-2">
                                        <Button onClick={handleSelectDefault}>Use BTC-PERP (default)</Button>
                                        <Button variant="ghost" onClick={() => onSetModule('dashboard')}>
                                            Back to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
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

    