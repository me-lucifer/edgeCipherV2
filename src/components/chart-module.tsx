
"use client";

import { useState } from "react";
import { BarChartHorizontal, Check, ChevronsUpDown, Send, Sun, Moon, Maximize, Minimize, LineChart } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";

interface ChartModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

type Product = {
    id: string;
    symbol: string;
    name?: string;
};

const mockProducts: Product[] = [
    { id: "BTC-PERP", symbol: "BTCUSDT", name: "Bitcoin Perpetual" },
    { id: "ETH-PERP", symbol: "ETHUSDT", name: "Ethereum Perpetual" },
    { id: "SOL-PERP", symbol: "SOLUSDT", name: "Solana Perpetual" },
];

const intervals = [
    { label: "1m", value: "1" },
    { label: "5m", value: "5" },
    { label: "15m", value: "15" },
    { label: "1h", value: "60" },
    { label: "4h", value: "240" },
    { label: "1D", value: "D" },
];

export function ChartModule({ onSetModule }: ChartModuleProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(mockProducts[0]);
    const [tvSymbol, setTvSymbol] = useState<string>("BINANCE:BTCUSDT");
    const [interval, setInterval] = useState<string>("60");
    const [chartTheme, setChartTheme] = useState<"dark" | "light">("dark");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isProductsLoading, setIsProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    
    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setTvSymbol(`BINANCE:${product.symbol}`);
        setIsSelectorOpen(false);
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
        <div className={cn("flex flex-col h-full space-y-4", isFullscreen && "fixed inset-0 bg-background z-50 p-4")}>
            <div className={cn(isFullscreen && "flex justify-end")}>
                <div className={cn(isFullscreen ? "w-full" : "w-0")}></div>
                 <div className={cn(!isFullscreen && "hidden")}>
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
                            >
                                {selectedProduct ? selectedProduct.name : "Select instrument..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Search instrument..." />
                                <CommandList>
                                    <CommandEmpty>No products found.</CommandEmpty>
                                    <CommandGroup>
                                        {mockProducts.map((product) => (
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
                            <div className="absolute top-4 left-4 text-left">
                                <h3 className="font-semibold text-foreground">{tvSymbol}</h3>
                                <p className="text-sm text-muted-foreground">
                                    <Badge variant="secondary">{selectedIntervalLabel}</Badge>
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground flex-1">
                                <LineChart className="mx-auto h-24 w-24 opacity-10" />
                                <p className="mt-4">TradingView Widget Placeholder</p>
                            </div>
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
                </Card>
            </div>
        </div>
    );
}
