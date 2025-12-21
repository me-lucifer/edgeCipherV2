/*
  ================================================================================
  DEVELOPER NOTE: PHASE 1 CHART MODULE IMPLEMENTATION
  ================================================================================
  This component serves as a prototype for the charting module and has several
  key limitations and design choices for Phase 1:

  1.  **Frontend-Only**: This is a frontend-only simulation. The TradingView
      widget is a placeholder (`ChartWidgetShell`) and does not load any real
      charting library.

  2.  **No Persistence**: Drawings, selected tools, and chart layouts are not
      saved. They are lost on page refresh or when changing key parameters.

  3.  **Widget Re-creation**: The chart widget is intentionally given a new `key`
      and re-created whenever the symbol, interval, or theme changes. This
      simulates the behavior of re-initializing a real charting library with
      new parameters and clears any "drawings" in the mock UI.

  4.  **Product List Caching**: The list of tradable products from Delta Exchange
      is fetched via a mock hook (`useDeltaProducts`). This hook implements a
      localStorage cache with a 6-hour TTL to simulate API data fetching
      without making repeated calls during a demo.

  5.  **Two-Symbol Strategy**: A distinction is maintained between the internal
      product ID (e.g., "BTC-PERP") used within EdgeCipher and the display
      symbol required by the charting library (e.g., "BINANCE:BTCUSDT"). The
      `mapDeltaToTradingView` function handles this mock conversion.

  6.  **Context Handoff**: When a user clicks "Send to Trade Planning", only the
      product ID and a source identifier are passed via localStorage. No specific
      price levels, drawings, or analysis from the chart are included in this
      Phase 1 handoff.
*/

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { BarChartHorizontal, Check, ChevronsUpDown, Send, Sun, Moon, Maximize, Minimize, LineChart, Bot, AlertTriangle, Loader2, RefreshCw, ArrowRight, Info, XCircle, X, Keyboard, HelpCircle, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
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
import type { DemoScenario, ChartMarketMode } from "./dashboard-module";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

const multiTimeframeIntervals = [
    { label: "HTF: 4h", value: "240" },
    { label: "Trading TF: 15m", value: "15" },
    { label: "Micro: 1m", value: "1" },
]

const arjunTipSets = {
    general: [
        "Mark major swing highs and lows before planning a trade.",
        "Check multiple timeframes before committing.",
        "Combine chart with your Strategy rules — no random trades.",
        "Use this chart to spot clean, logical setups, not to chase candles.",
    ],
    low_tf: [
        "Lower timeframes have more noise. Is this move significant on the 1-hour?",
        "Scalping requires extreme discipline. Stick to your plan, exit when invalidated.",
        "Avoid chasing small wicks on the 1-minute chart. Wait for clear structure."
    ],
    high_tf: [
        "On higher timeframes, be patient. Setups can take hours or days to form.",
        "Your SL might need to be wider here to account for volatility.",
        "A 4h candle closing against you is a strong signal. Respect it."
    ],
    high_vol: [
        "Wicks will be violent in high volatility. Place SL where it survives chaos, not hope.",
        "Consider reducing your size until the market calms down.",
        "Wait for clearer confirmation. Breakouts can easily fail in this environment."
    ],
    drawdown: [
        "When in a drawdown, focus on only A+ setups. Skip marginal charts, even if they ‘look interesting’.",
        "Protect your capital. The goal is to stop the bleeding, not to make it all back in one trade.",
        "Review your journal for past trades in similar conditions. What worked? What didn't?"
    ]
};

const shortcuts = [
    { keys: ["/"], label: "Focus instrument search" },
    { keys: ["Alt", "1-6"], label: "Change time interval (1m to 1D)" },
    { keys: ["Ctrl", "Enter"], label: "Send to Trade Planning" },
];


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
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground flex-1 p-4 animate-pulse">
                 <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                <p>Loading chart for {tvSymbol}...</p>
            </div>
        );
    }
    
    return (
        <div className="relative w-full h-full overflow-hidden animate-in fade-in">
            {/* Grid background */}
            <div className="absolute inset-0 bg-transparent bg-[linear-gradient(to_right,hsl(var(--border)_/_0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)_/_0.2)_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
            
            {/* Mock Y-axis labels */}
            <div className="absolute top-0 bottom-0 right-0 w-16 flex flex-col justify-around text-xs text-muted-foreground/50 text-right pr-2 pointer-events-none">
                <span>69,000</span>
                <span>68,500</span>
                <span>68,000</span>
                <span>67,500</span>
            </div>

            {/* Mock X-axis labels */}
            <div className="absolute bottom-0 left-0 right-16 h-8 flex justify-around items-center text-xs text-muted-foreground/50 pointer-events-none">
                <span>09:00</span>
                <span>12:00</span>
                <span>15:00</span>
                <span>18:00</span>
            </div>
            
            {/* Mock Candles */}
            <div className="absolute inset-0 flex items-end justify-around px-8 pointer-events-none">
                <div className="w-4 h-[40%] bg-green-500/30 rounded-t-sm" />
                <div className="w-4 h-[30%] bg-red-500/30 rounded-t-sm" />
                <div className="w-4 h-[60%] bg-green-500/30 rounded-t-sm" />
                <div className="w-4 h-[50%] bg-green-500/30 rounded-t-sm" />
                <div className="w-4 h-[70%] bg-red-500/30 rounded-t-sm" />
                <div className="w-4 h-[55%] bg-green-500/30 rounded-t-sm" />
            </div>

            {/* Mock Moving Average */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 0 60 Q 20 50, 40 65 T 80 55 T 100 70" stroke="hsl(var(--primary) / 0.4)" fill="transparent" strokeWidth="0.5" />
            </svg>

            <p className="absolute bottom-4 left-4 text-xs text-muted-foreground/50">
                This page is for analysis, not for impulsive clicks. Send to Trade Planning to execute.
            </p>
        </div>
    );
}

function ChartWalkthrough({ isOpen, onOpenChange, onDemoSelect }: { isOpen: boolean; onOpenChange: (open: boolean) => void; onDemoSelect: (demo: 'btc' | 'sol') => void }) {
    const walkthroughSteps = [
        { icon: BarChartHorizontal, title: "1. Pick an Instrument", description: "Use the search to find the crypto pair you want to analyze." },
        { icon: FileText, title: "2. Draw Manually", description: "Use standard TradingView tools to mark trendlines, levels, and fibs." },
        { icon: Send, title: "3. Send to Planning", description: "Once you have a thesis, send it to Trade Planning to structure your Entry, SL, and TP." },
    ];
    
    const limitations = [
        "This page is for analysis, not for impulsive clicks.",
        "Drawings do not save on refresh.",
        "Theme/interval changes reload the widget.",
        "No auto Entry/SL/TP lines yet.",
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-background/90 backdrop-blur-sm animate-in fade-in"
                onClick={() => onOpenChange(false)}
            />
            <Card className="relative z-10 w-full max-w-4xl bg-muted/80 border-border/50 animate-in fade-in zoom-in-95" role="dialog" aria-modal="true">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center justify-between">
                        <span>How to Use the Chart Module</span>
                         <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="-mr-2" aria-label="Close walkthrough">
                            <X className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                    <CardDescription>This is where you analyze, not where you impulse-trade.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid md:grid-cols-3 gap-6 text-center">
                        {walkthroughSteps.map((step, index) => (
                            <div key={step.title} className="relative">
                                <Card className="h-full bg-muted/50 p-6">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                        <step.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                                </Card>
                            </div>
                        ))}
                    </div>
                     <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-amber-950/30 border-amber-500/20">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base text-amber-400">Phase 1 Limitations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-amber-300/80 list-disc list-inside">
                                    {limitations.map(item => <li key={item}>{item}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/50">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base">Try a Demo Scenario</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <Button onClick={() => onDemoSelect('btc')}>Demo: BTC-PERP setup</Button>
                                <Button variant="outline" onClick={() => onDemoSelect('sol')}>Demo: SOL-PERP (unavailable chart)</Button>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function WorkflowHintBar({ isVisible, onDismiss }: { isVisible: boolean, onDismiss: () => void }) {
    if (!isVisible) return null;
    return (
        <Alert className="bg-primary/10 border-primary/20 text-foreground">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                        <span className="font-semibold text-primary">Step 1:</span> Analyze here. <span className="font-semibold text-primary">Step 2:</span> Click ‘Send to Trade Planning’ to structure your trade.
                    </AlertDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2 text-primary hover:text-primary" onClick={onDismiss}>
                    Hide
                </Button>
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
    const [isHintBarVisible, setIsHintBarVisible] = useState(false);
    const [scenario, setScenario] = useState<DemoScenario>('normal');
    const [marketMode, setMarketMode] = useState<ChartMarketMode>('trend');
    const [chartInstanceKey, setChartInstanceKey] = useState(0);
    const { toast } = useToast();
    const [showThemeChangeDialog, setShowThemeChangeDialog] = useState(false);
    const [pendingTheme, setPendingTheme] = useState<"dark" | "light" | null>(null);
    const instrumentSelectorRef = useRef<HTMLButtonElement>(null);
    const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);


    useEffect(() => {
        if (typeof window !== "undefined") {
            const hintDismissed = localStorage.getItem("ec_chart_hint_hidden");
            if (!hintDismissed) {
                setIsHintBarVisible(true);
            }
            const walkthroughSeen = localStorage.getItem("ec_chart_tour_seen");
            if (!walkthroughSeen) {
                setIsWalkthroughOpen(true);
                localStorage.setItem("ec_chart_tour_seen", "true");
            }
            
            if (products.length > 0) {
                let productToSet: Product | null = null;
                
                if (planContext?.instrument) {
                    const productFromContext = products.find(p => p.id === planContext.instrument);
                    if (productFromContext) productToSet = productFromContext;
                }
                
                if (!productToSet) {
                    const savedProduct = localStorage.getItem("ec_chart_last_product");
                    if (savedProduct) {
                        try {
                            const parsedProduct = JSON.parse(savedProduct);
                            productToSet = products.find(p => p.id === parsedProduct.id) || null;
                        } catch (e) { /* fallback */ }
                    }
                }
                
                if (!productToSet) {
                    productToSet = products.find(p => p.id === 'BTC-PERP') || products[0] || null;
                }

                if (productToSet) handleProductSelect(productToSet);

                const savedInterval = localStorage.getItem("ec_chart_last_interval");
                const savedTheme = localStorage.getItem("ec_chart_theme") as "dark" | "light";
                
                if (savedInterval && intervals.some(i => i.value === savedInterval)) setInterval(savedInterval);
                if (savedTheme) setChartTheme(savedTheme);
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
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedScenario = localStorage.getItem('ec_demo_scenario') as DemoScenario;
            if (savedScenario) setScenario(savedScenario);

            const savedMarketMode = localStorage.getItem('ec_chart_market_mode') as ChartMarketMode;
            if (savedMarketMode) setMarketMode(savedMarketMode);
            
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === 'ec_demo_scenario') setScenario((e.newValue as DemoScenario) || 'normal');
                if (e.key === 'ec_chart_market_mode') setMarketMode((e.newValue as ChartMarketMode) || 'trend');
            };
    
            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                e.preventDefault();
                setIsFullscreen(false);
            }

            if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                if (e.key !== 'Escape') return;
            }

            if (e.key === '/') {
                e.preventDefault();
                instrumentSelectorRef.current?.click();
            }

            if (e.altKey && e.key >= '1' && e.key <= '6') {
                e.preventDefault();
                const index = parseInt(e.key) - 1;
                if (intervals[index]) handleIntervalChange(intervals[index].value);
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSendToPlanning();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProduct, isFullscreen]);

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        const newTvSymbol = mapDeltaToTradingView(product);
        setTvSymbol(newTvSymbol);
        setIsSelectorOpen(false);
        setChartAvailability(isChartAvailable(product) ? 'ok' : 'unavailable');
    };

    const mapDeltaToTradingView = (product: Product): string => {
        if (product.id === "SOL-PERP") return "UNAVAILABLE:SOL-PERP"; // For demo purposes
        if (product.symbol.endsWith("USDT")) return `BINANCE:${product.symbol}`;
        if (product.id.endsWith("-PERP")) return `BINANCE:${product.id.replace("-PERP", "")}USDT`;
        return `BINANCE:${product.symbol || "UNKNOWN"}`;
    };

    const isChartAvailable = (product: Product): boolean => {
        // Deterministic rule for demo purposes
        if (product.id === "SOL-PERP") return false;
        if (product.id.includes("1000")) return false; // Mock unavailable for leveraged tokens
        return true;
    }

    const handleSendToPlanning = () => {
        if (!selectedProduct) return;
        const planningContext = {
            source: 'chart',
            instrument: selectedProduct.id,
        };
        
        if (typeof window !== 'undefined') localStorage.setItem("ec_trade_planning_context", JSON.stringify(planningContext));
        onSetModule('tradePlanning', { planContext: planningContext });
    };
    
    const handleSelectDefault = () => {
        const btcProduct = products.find(p => p.id === 'BTC-PERP');
        if (btcProduct) handleProductSelect(btcProduct);
    };

    const dismissHintBar = () => {
        setIsHintBarVisible(false);
        localStorage.setItem("ec_chart_hint_hidden", "true");
    };

    const handleResetView = () => {
        setChartInstanceKey(prev => prev + 1);
        toast({
            title: "Chart Reset",
            description: "Chart view has been reset (drawings would be cleared in a real integration).",
        });
    };
    
    const handleIntervalChange = (newInterval: string) => {
        setInterval(newInterval);
        const intervalLabel = intervals.find(i => i.value === newInterval)?.label || newInterval;
        toast({
            title: `Interval changed to: ${intervalLabel}`,
            description: "Note: In this prototype, changing interval resets drawings."
        });
    };

    const handleThemeChange = (checked: boolean) => {
        const newTheme = checked ? 'dark' : 'light';
        setPendingTheme(newTheme);
        setShowThemeChangeDialog(true);
    };

    const confirmThemeChange = () => {
        if (pendingTheme) setChartTheme(pendingTheme);
        setShowThemeChangeDialog(false);
        setPendingTheme(null);
    };

    const handleDemoSelect = (demo: 'btc' | 'sol') => {
        const product = products.find(p => p.id === (demo === 'btc' ? 'BTC-PERP' : 'SOL-PERP'));
        if (product) handleProductSelect(product);
        setIsWalkthroughOpen(false);
    };

    const selectedIntervalLabel = intervals.find(i => i.value === interval)?.label || interval;
    const scenarioLabel = {
        'normal': "Normal Day",
        'high_vol': "High Volatility",
        'drawdown': "In Drawdown",
        'no_positions': "New User"
    }[scenario];
    const marketModeLabel = {
        'trend': "Trend",
        'range': "Rangebound",
        'volatile': "Volatile",
    }[marketMode];


    const arjunTips = useMemo(() => {
        let selectedTips: string[] = [...arjunTipSets.general];
        const numInterval = Number(interval);

        if (scenario === 'high_vol') selectedTips.push(...arjunTipSets.high_vol);
        if (scenario === 'drawdown') selectedTips.push(...arjunTipSets.drawdown);
        if (!isNaN(numInterval) && numInterval <= 15) selectedTips.push(...arjunTipSets.low_tf);
        if (!isNaN(numInterval) && numInterval >= 240) selectedTips.push(...arjunTipSets.high_tf);
        
        return [...new Set(selectedTips)].sort(() => 0.5 - Math.random()).slice(0, 4);
    }, [interval, scenario]);


    return (
        <div className={cn("flex flex-col h-full space-y-4 transition-all duration-300", isFullscreen && "fixed inset-0 bg-background z-50 p-4")}>
            <ChartWalkthrough isOpen={isWalkthroughOpen} onOpenChange={setIsWalkthroughOpen} onDemoSelect={handleDemoSelect} />
            <AlertDialog open={showThemeChangeDialog} onOpenChange={setShowThemeChangeDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Switch chart theme?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reload the chart widget and reset any drawings you've made (Phase 1 prototype limitation).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingTheme(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmThemeChange}>Switch theme</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className={cn("flex items-center justify-between", !isFullscreen && "hidden")}>
                {selectedProduct && (
                    <div className="text-left">
                        <h3 className="font-semibold text-foreground">{tvSymbol}</h3>
                        <div className="text-sm text-muted-foreground"><Badge variant="secondary">{selectedIntervalLabel}</Badge></div>
                    </div>
                )}
                 <div className="flex-1" />
                 <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}><Minimize className="h-4 w-4" /></Button>
            </div>
             <div className={cn(isFullscreen && "hidden")}>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Chart</h1>
                <p className="text-muted-foreground">Use the chart to analyze, then hand off to Trade Planning.</p>
            </div>
            
            <Card className={cn("bg-muted/30 border-border/50", isFullscreen && "hidden")}>
                <CardContent className="p-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Popover open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                ref={instrumentSelectorRef}
                                variant="outline"
                                role="combobox"
                                aria-expanded={isSelectorOpen}
                                className="w-full sm:w-auto md:w-[200px] justify-between"
                                disabled={isProductsLoading && products.length === 0}
                                aria-label="Select trading instrument"
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
                                            <CommandItem key={product.id} value={product.name} onSelect={() => handleProductSelect(product)}>
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
                                    <TooltipContent><p className="max-w-xs">{productsError} {cacheInfo.isStale && `Displaying stale data from ${formatDistanceToNow(new Date(cacheInfo.fetchedAt!))} ago.`}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => loadProducts(true)}><RefreshCw className="mr-2 h-3 w-3" /> Retry</Button>
                        </div>
                    )}

                    <div role="group" aria-label="Chart time interval" className="flex items-center gap-1 rounded-full bg-muted p-1">
                        {intervals.map(item => (<Button key={item.value} size="sm" variant={interval === item.value ? 'secondary' : 'ghost'} onClick={() => handleIntervalChange(item.value)} className="rounded-full h-8 px-3 text-xs">{item.label}</Button>))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="chart-theme" className="text-sm text-muted-foreground">Chart Theme</Label>
                        <Switch id="chart-theme" checked={chartTheme === 'dark'} onCheckedChange={handleThemeChange} aria-label="Toggle chart theme" />
                        {chartTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 min-w-full sm:min-w-0" />

                    <div className="flex w-full sm:w-auto items-center gap-2">
                         <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleResetView}><RefreshCw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Reset chart view</p></TooltipContent></Tooltip></TooltipProvider>
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>{isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent><p>{isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen'}</p></TooltipContent></Tooltip></TooltipProvider>
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setIsWalkthroughOpen(true)}><HelpCircle className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>How to use chart</p></TooltipContent></Tooltip></TooltipProvider>
                        
                        <div className="text-right flex-1 sm:flex-initial">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={handleSendToPlanning} disabled={!selectedProduct} className="w-full sm:w-auto">
                                            <Send className="mr-2 h-4 w-4" /> Send to Trade Planning
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">Pre-select this instrument in the Trade Planning module. No trading from here. All execution must pass Trade Planning first.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                </CardContent>
            </Card>

            <WorkflowHintBar isVisible={isHintBarVisible && !isFullscreen} onDismiss={dismissHintBar} />
            
            <div className={cn("flex items-center gap-4", isFullscreen && "hidden")}>
                <span className="text-xs font-semibold text-muted-foreground">Multi-timeframe view (manual)</span>
                <div role="group" aria-label="Multi-timeframe chart view" className="flex items-center gap-1 rounded-full bg-muted p-1">
                    {multiTimeframeIntervals.map(item => (<Button key={item.value} size="sm" variant={interval === item.value ? 'secondary' : 'ghost'} onClick={() => handleIntervalChange(item.value)} className="rounded-full h-7 px-3 text-xs">{item.label}</Button>))}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <Card className="h-full bg-muted/30 border-border/50 flex flex-col items-center justify-center relative border-2 border-dashed">
                     {selectedProduct ? (
                        <>
                           {chartAvailability === 'unavailable' && (
                               <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/90 p-4">
                                   <Alert variant="default" className="bg-amber-950/70 border-amber-500/30 text-amber-300 max-w-lg">
                                       <AlertTriangle className="h-4 w-4 text-amber-400" />
                                       <AlertTitle className="text-amber-400">Chart not available for this instrument</AlertTitle>
                                       <AlertDescription>
                                            <p>This can happen for certain pairs on the free TradingView widget. You can still proceed with Trade Planning and enter your levels manually.</p>
                                            <div className="mt-4 flex gap-2">
                                                <Button variant="secondary" onClick={handleSendToPlanning}>Proceed to Trade Planning</Button>
                                                <Button variant="outline" onClick={() => instrumentSelectorRef.current?.click()}>Pick another instrument</Button>
                                            </div>
                                       </AlertDescription>
                                   </Alert>
                               </div>
                           )}

                            <div className={cn("absolute top-4 left-4 text-left p-2 rounded-lg bg-background/50 backdrop-blur-sm z-10", isFullscreen && "hidden")}>
                                <h3 className="font-semibold text-foreground text-sm">{tvSymbol} · {selectedIntervalLabel}</h3>
                                <p className="text-xs text-muted-foreground">Product: {selectedProduct.id} (mock)</p>
                                <p className="text-xs text-muted-foreground">Scenario: {scenarioLabel} · Market Mode: {marketModeLabel}</p>
                            </div>
                            
                            {chartAvailability === 'ok' ? (
                                <ChartWidgetShell 
                                    key={`${tvSymbol}_${interval}_${chartTheme}_${chartInstanceKey}`}
                                    tvSymbol={tvSymbol}
                                    interval={selectedIntervalLabel}
                                    chartTheme={chartTheme}
                                />
                            ) : null}
                        </>
                    ) : (
                        <div className="text-center text-muted-foreground p-8">
                            {isProductsLoading ? (
                                <>
                                    <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                                    <p className="mt-4">Loading instruments...</p>
                                </>
                            ) : productsError && products.length === 0 ? (
                                <div className="text-center text-destructive p-8">
                                    <AlertTriangle className="mx-auto h-12 w-12" />
                                    <h3 className="mt-4 text-lg font-semibold text-foreground">Couldn't load instruments</h3>
                                    <p className="mt-1 text-sm">{productsError}</p>
                                    <div className="mt-6 flex justify-center gap-2">
                                        <Button variant="outline" onClick={() => loadProducts(true)}><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
                                        <Button variant="link" onClick={handleSendToPlanning}>Proceed to Trade Planning anyway</Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <BarChartHorizontal className="mx-auto h-12 w-12 opacity-50" />
                                    <h3 className="mt-4 text-lg font-semibold text-foreground">No instrument selected</h3>
                                    <p className="mt-1 text-sm">Pick an instrument from the toolbar to load its TradingView chart.</p>
                                    <div className="mt-6 flex justify-center gap-2">
                                        <Button onClick={handleSelectDefault}>Use BTC-PERP (default)</Button>
                                        <Button variant="ghost" onClick={() => onSetModule('tradePlanning')}>Go to Trade Planning <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className={cn("absolute bottom-4 left-4 z-10 rounded-full shadow-lg bg-background/50 backdrop-blur-sm", isFullscreen && "hidden")}>
                                <Bot className="h-5 w-5 text-primary" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start" className="w-80">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold leading-none">Arjun's Chart Tips</h4>
                                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                        {arjunTips.map((tip, i) => <li key={i}>{tip}</li>)}
                                    </ul>
                                    <p className="text-xs text-muted-foreground/80 italic mt-4">In future phases, Arjun will analyze your charts and volatility for you.</p>
                                </div>
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold leading-none flex items-center gap-2"><Keyboard className="h-4 w-4" />Shortcuts</h4>
                                     <div className="space-y-2 text-sm text-muted-foreground mt-2">
                                        {shortcuts.map((shortcut, index) => (
                                            <div key={index} className="flex justify-between items-center">
                                                <span>{shortcut.label}</span>
                                                <div className="flex items-center gap-1">
                                                    {shortcut.keys.map(key => (<kbd key={key} className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md">{key}</kbd>))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </Card>
            </div>
        </div>
    );

    
}
