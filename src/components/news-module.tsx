
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Filter, Clock, Loader2, ArrowRight, TrendingUp, Zap, Sparkles, Search, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface NewsModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

type Sentiment = "Positive" | "Negative" | "Neutral";
type VolatilityImpact = "Low" | "Medium" | "High";
type NewsCategory = "Regulatory" | "Macro" | "Exchange" | "ETF" | "Liquidations" | "Altcoins" | "Security" | "Tech";

type NewsItem = {
    id: string;
    headline: string;
    sourceName: string;
    publishedAt: string;
    summaryBullets: string[];
    sentiment: Sentiment;
    volatilityImpact: VolatilityImpact;
    impactedCoins: string[];
    category: NewsCategory;
    arjunMeaning: string;
    recommendedAction: string;
    linkUrl?: string;
};


const mockNewsSource: NewsItem[] = Array.from({ length: 25 }, (_, i) => {
    const categories: NewsCategory[] = ["Regulatory", "Macro", "Exchange", "ETF", "Liquidations", "Altcoins", "Security", "Tech"];
    const sentiments: Sentiment[] = ["Positive", "Negative", "Neutral"];
    const impacts: VolatilityImpact[] = ["Low", "Medium", "High"];
    const sources = ["Blocksource", "CryptoWire", "Asia Crypto Today", "The Defiant", "ETF Weekly", "Liquidations.info", "ExchangeWire", "MacroScope", "DeFi Pulse", "Binance Blog"];
    const coins = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "DOT", "MATIC"];
    
    const headlines = [
        "Fed hints at slower rate hikes, crypto market rallies",
        "Major exchange announces new security upgrades after hack",
        "Regulatory uncertainty in Asia spooks investors",
        "Ethereum's Dencun upgrade leads to significantly lower layer-2 fees",
        "US Spot Bitcoin ETFs See Record Inflow Day",
        "$300M in Longs Liquidated as BTC Dips to $62k",
        "Coinbase Announces Support for New Solana-Based Token",
        "US CPI data comes in slightly cooler than expected",
        "Uniswap Foundation Delays Fee Switch Vote",
        "Binance Completes System Upgrade, Trading Resumes",
        "New AI-focused altcoin protocol raises $50M in seed funding",
        "Report shows decline in DeFi TVL for second consecutive month",
        "German government moves large BTC stash, causing market jitters",
        "Polygon announces new zkEVM development toolkit",
        "Tether prints another $1B USDT amid market demand"
    ];

    const randomElement = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const randomImpact = () => (Math.random() < 0.25 ? 'High' : Math.random() < 0.6 ? 'Medium' : 'Low');

    return {
        id: `${i + 1}`,
        headline: randomElement(headlines),
        sourceName: randomElement(sources),
        publishedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 3).toISOString(),
        summaryBullets: [
            "This is a generated summary bullet point for realism.",
            "Another detail providing more context on the event.",
            "A third point to round out the summary."
        ],
        sentiment: randomElement(sentiments),
        volatilityImpact: randomImpact(),
        impactedCoins: [randomElement(coins), randomElement(coins.slice(1))].filter((v, i, a) => a.indexOf(v) === i),
        category: randomElement(categories),
        arjunMeaning: "This is Arjun's mock interpretation of the news event, explaining what it means in the context of trading psychology and market dynamics.",
        recommendedAction: "This is a mock recommended action. It provides a clear, concise next step for a trader to consider based on the news.",
        linkUrl: "#"
    };
});


const NEWS_CACHE_KEY = "ec_news_state_v2";
const NEWS_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface NewsFilters {
    search: string;
    sentiment: Sentiment | "All";
    highImpactOnly: boolean;
    category: NewsCategory | "All";
    coins: string[];
    sortBy: "newest" | "highestImpact" | "mostNegative";
}

export function NewsModule({ onSetModule }: NewsModuleProps) {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const [filters, setFilters] = useState<NewsFilters>({
        search: '',
        sentiment: 'All',
        highImpactOnly: false,
        category: 'All',
        coins: [],
        sortBy: 'newest',
    });

    const allCategories = useMemo(() => ['All', ...[...new Set(mockNewsSource.map(item => item.category))]], []);
    const popularCoins = ["BTC", "ETH", "SOL", "BNB", "XRP"];

    useEffect(() => {
        const loadNews = () => {
            setIsLoading(true);
            try {
                const storedData = localStorage.getItem(NEWS_CACHE_KEY);
                if (storedData) {
                    const cachedData = JSON.parse(storedData);
                    const isExpired = new Date().getTime() - new Date(cachedData.lastFetchedAt).getTime() > NEWS_TTL_MS;
                    if (!isExpired) {
                        setNewsItems(cachedData.items);
                        setIsLoading(false);
                        return;
                    }
                }

                // If cache is expired or doesn't exist, regenerate
                const newItems = [...mockNewsSource].sort(() => 0.5 - Math.random());
                const newCache = {
                    items: newItems,
                    lastFetchedAt: new Date().toISOString(),
                };
                localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(newCache));
                setNewsItems(newItems);

            } catch (error) {
                console.error("Failed to load or cache news data:", error);
                setNewsItems(mockNewsSource); // Fallback to default
            } finally {
                setIsLoading(false);
            }
        };

        loadNews();
    }, []);

    const filteredNews = useMemo(() => {
        let items = newsItems
            .filter(item => {
                const searchLower = filters.search.toLowerCase();
                if (filters.search && !item.headline.toLowerCase().includes(searchLower) && !item.sourceName.toLowerCase().includes(searchLower)) return false;
                if (filters.sentiment !== "All" && item.sentiment !== filters.sentiment) return false;
                if (filters.highImpactOnly && item.volatilityImpact !== 'High') return false;
                if (filters.category !== 'All' && item.category !== filters.category) return false;
                if (filters.coins.length > 0 && !filters.coins.some(coin => item.impactedCoins.includes(coin))) return false;
                return true;
            });

        items.sort((a, b) => {
            switch (filters.sortBy) {
                case 'highestImpact':
                    const impactOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                    return impactOrder[b.volatilityImpact] - impactOrder[a.volatilityImpact];
                case 'mostNegative':
                     const sentimentOrder = { 'Negative': 3, 'Neutral': 2, 'Positive': 1 };
                    return sentimentOrder[b.sentiment] - sentimentOrder[a.sentiment];
                case 'newest':
                default:
                    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
            }
        });
        
        return items;
    }, [filters, newsItems]);
    
    const handleCoinToggle = (coin: string) => {
        setFilters(prev => {
            const newCoins = prev.coins.includes(coin)
                ? prev.coins.filter(c => c !== coin)
                : [...prev.coins, coin];
            return { ...prev, coins: newCoins };
        });
    };

    const discussWithArjun = (item: NewsItem) => {
        const prompt = `Arjun, how should I think about this news headline: "${item.headline}"? My current focus is on [your current strategy/coin]. Does this news impact my plan?`;
        onSetModule('aiCoaching', { initialMessage: prompt });
        setSelectedNews(null); // Close drawer
    }
    
    const clearFilters = () => {
        setFilters({
            search: '',
            sentiment: 'All',
            highImpactOnly: false,
            category: 'All',
            coins: [],
            sortBy: 'newest',
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">News Intelligence</h1>
                <p className="text-muted-foreground">AI-curated crypto futures news with sentiment + volatility impact—so you don’t trade blind.</p>
            </div>
            
            <Card className="bg-muted/30 border-border/50 sticky top-[72px] z-20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filters & Sorting</CardTitle>
                         <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-2 h-4 w-4"/>Clear all</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search headline or source..." 
                                className="pl-9"
                                value={filters.search}
                                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="high-impact" 
                                checked={filters.highImpactOnly}
                                onCheckedChange={checked => setFilters(prev => ({ ...prev, highImpactOnly: checked }))}
                            />
                            <Label htmlFor="high-impact">High Impact Only</Label>
                        </div>
                        <Select value={filters.category} onValueChange={(v) => setFilters(prev => ({...prev, category: v as any}))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by category..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.sortBy} onValueChange={(v) => setFilters(prev => ({ ...prev, sortBy: v as any}))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest</SelectItem>
                                <SelectItem value="highestImpact">Highest Impact</SelectItem>
                                <SelectItem value="mostNegative">Most Negative</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                         <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                            {(["All", "Positive", "Neutral", "Negative"] as const).map(s => (
                                <Button
                                    key={s}
                                    size="sm"
                                    variant={filters.sentiment === s ? 'secondary' : 'ghost'}
                                    onClick={() => setFilters(prev => ({ ...prev, sentiment: s as Sentiment | "All" }))}
                                    className="rounded-full h-8 px-3 text-xs"
                                >
                                    {s}
                                </Button>
                            ))}
                        </div>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-1">
                            <Button
                                size="sm"
                                variant={filters.coins.length === 0 ? 'secondary' : 'ghost'}
                                onClick={() => setFilters(prev => ({ ...prev, coins: [] }))}
                                className="rounded-full h-8 px-3 text-xs"
                            >
                                All
                            </Button>
                            {popularCoins.map(coin => (
                                <Button
                                    key={coin}
                                    size="sm"
                                    variant={filters.coins.includes(coin) ? 'secondary' : 'ghost'}
                                    onClick={() => handleCoinToggle(coin)}
                                    className="rounded-full h-8 px-3 text-xs"
                                >
                                    {coin}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-56" />)}
                    </div>
                ) : filteredNews.length === 0 ? (
                    <Card className="text-center py-12 bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>No news found</CardTitle>
                            <CardDescription>Try adjusting your filters or check back later.</CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNews.map(item => (
                            <Card 
                                key={item.id}
                                onClick={() => setSelectedNews(item)}
                                className="bg-muted/30 border-border/50 cursor-pointer transition-all hover:border-primary/40 hover:bg-muted/50 flex flex-col"
                            >
                                <CardHeader>
                                    <CardTitle className="text-base leading-tight">{item.headline}</CardTitle>
                                     <CardDescription className="flex items-center gap-2 text-xs pt-1">
                                        <span>{item.sourceName}</span>
                                        <span className="text-muted-foreground/50">&bull;</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-between">
                                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                        {item.summaryBullets.slice(0,2).map((bullet, i) => <li key={i}>{bullet}</li>)}
                                    </ul>
                                </CardContent>
                                <CardContent>
                                    <div className="flex flex-wrap items-center gap-2 mt-4">
                                            <Badge variant="outline" className={cn(
                                            'text-xs whitespace-nowrap',
                                            item.sentiment === 'Positive' && 'bg-green-500/20 text-green-400 border-green-500/30',
                                            item.sentiment === 'Negative' && 'bg-red-500/20 text-red-400 border-red-500/30'
                                        )}>{item.sentiment}</Badge>
                                            <Badge variant="outline" className={cn(
                                            "text-xs",
                                            item.volatilityImpact === 'High' && 'border-red-500/50 text-red-400',
                                            item.volatilityImpact === 'Medium' && 'border-amber-500/50 text-amber-400',
                                        )}>
                                            <TrendingUp className="mr-1 h-3 w-3"/>
                                            {item.volatilityImpact} Impact
                                        </Badge>
                                            <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Drawer open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
                <DrawerContent>
                    {selectedNews && (
                        <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
                            <DrawerHeader>
                                <DrawerTitle className="text-2xl">{selectedNews.headline}</DrawerTitle>
                                <DrawerDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                                     <Badge variant="outline" className={cn(
                                        'text-xs whitespace-nowrap',
                                        selectedNews.sentiment === 'Positive' && 'bg-green-500/20 text-green-400 border-green-500/30',
                                        selectedNews.sentiment === 'Negative' && 'bg-red-500/20 text-red-400 border-red-500/30'
                                    )}>{selectedNews.sentiment}</Badge>
                                    <Badge variant="outline" className={cn(
                                        "text-xs",
                                        selectedNews.volatilityImpact === 'High' && 'border-red-500/50 text-red-400',
                                        selectedNews.volatilityImpact === 'Medium' && 'border-amber-500/50 text-amber-400',
                                    )}>
                                        <TrendingUp className="mr-1 h-3 w-3"/>
                                        {selectedNews.volatilityImpact} Impact
                                    </Badge>
                                     <Badge variant="secondary" className="text-xs">{selectedNews.category}</Badge>
                                    <span className="flex items-center gap-2 text-muted-foreground text-sm"><Clock className="h-4 w-4" />{new Date(selectedNews.publishedAt).toLocaleString()}</span>
                                </DrawerDescription>
                            </DrawerHeader>
                            <div className="px-4 py-6 grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                     <div>
                                        <h3 className="font-semibold text-foreground mb-2">Key points from {selectedNews.sourceName}</h3>
                                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2">
                                            {selectedNews.summaryBullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-2">Impacted Coins</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedNews.impactedCoins.map(coin => <Badge key={coin} variant="secondary">{coin}</Badge>)}
                                        </div>
                                    </div>
                                </div>
                                <Card className="bg-primary/10 border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/>Arjun's Interpretation</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-foreground mb-1">What this means for you:</h4>
                                            <p className="text-sm text-primary/90 italic">"{selectedNews.arjunMeaning}"</p>
                                        </div>
                                        <Separator />
                                        <div>
                                            <h4 className="text-sm font-semibold text-foreground mb-1">Recommended Action:</h4>
                                            <p className="text-sm font-semibold text-primary/90">{selectedNews.recommendedAction}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="p-4 border-t border-border/50 flex flex-col sm:flex-row gap-2">
                                <Button className="w-full sm:w-auto flex-1" onClick={() => discussWithArjun(selectedNews)}>
                                    <Bot className="mr-2 h-4 w-4" />
                                    Discuss with Arjun
                                </Button>
                                <Button variant="outline" className="w-full sm:w-auto flex-1" asChild>
                                    <a href={selectedNews.linkUrl || "#"} target="_blank" rel="noopener noreferrer">
                                        View Original Article <ArrowRight className="ml-2 h-4 w-4"/>
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}
