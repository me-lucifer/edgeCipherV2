
      "use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Filter, Clock, Loader2, ArrowRight, TrendingUp, Zap, Sparkles, Search, X, AlertTriangle, CheckCircle, Bookmark, Timer } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow } from 'date-fns';
import type { VixState, RiskEvent } from "@/hooks/use-risk-state";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useToast } from "@/hooks/use-toast";

interface NewsModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

type Sentiment = "Positive" | "Negative" | "Neutral";
type VolatilityImpact = "Low" | "Medium" | "High";
type NewsCategory = "Regulatory" | "Macro" | "Exchange" | "ETF" | "Liquidations" | "Altcoins" | "Security" | "Tech";
type PersonaType = "Impulsive Sprinter" | "Fearful Analyst" | "Disciplined Scalper" | "Beginner";
type EventType = "Scheduled" | "Breaking" | "Developing";

export type NewsItem = {
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
    riskWindowMins: number;
    eventType: EventType;
    volatilityRiskScore: number;
    linkUrl?: string;
};

const getRiskWindow = (category: NewsCategory, impact: VolatilityImpact): { riskWindowMins: number; eventType: EventType; volatilityRiskScore: number } => {
    let riskWindowMins = 30;
    let eventType: EventType = 'Developing';
    let baseScore = impact === 'Low' ? 20 : impact === 'Medium' ? 50 : 80;

    switch (category) {
        case 'Macro':
        case 'Regulatory':
        case 'ETF':
            riskWindowMins = impact === 'High' ? 120 : 60;
            eventType = category === 'Macro' ? 'Scheduled' : 'Developing';
            baseScore += 15;
            break;
        case 'Liquidations':
        case 'Security':
            riskWindowMins = impact === 'High' ? 60 : 30;
            eventType = 'Breaking';
            baseScore += 20;
            break;
        case 'Exchange':
            riskWindowMins = 45;
            eventType = 'Developing';
            baseScore += 5;
            break;
        default:
            riskWindowMins = 30;
            eventType = 'Developing';
            break;
    }

    return {
        riskWindowMins,
        eventType,
        volatilityRiskScore: Math.min(100, Math.round(baseScore)),
    };
};

const mockNewsSource: Omit<NewsItem, 'riskWindowMins' | 'eventType' | 'volatilityRiskScore' | 'arjunMeaning' | 'recommendedAction'>[] = Array.from({ length: 25 }, (_, i) => {
    const categories: NewsCategory[] = ["Regulatory", "Macro", "Exchange", "ETF", "Liquidations", "Altcoins", "Security", "Tech"];
    const sentiments: Sentiment[] = ["Positive", "Negative", "Neutral"];
    const sources = ["Blocksource", "CryptoWire", "Asia Crypto Today", "The Defiant", "ETF Weekly", "Liquidations.info", "ExchangeWire", "MacroScope", "DeFi Pulse", "Binance Blog"];
    const coins = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "DOT", "MATIC", "LINK", "TRX", "SHIB"];
    
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
    const randomImpact = (): VolatilityImpact => (Math.random() < 0.25 ? 'High' : Math.random() < 0.6 ? 'Medium' : 'Low');
    const randomNumberOfCoins = Math.floor(Math.random() * 5) + 1;
    const impactedCoins = [...new Set(Array.from({ length: randomNumberOfCoins }, () => randomElement(coins)))];

    return {
        id: `${Date.now()}-${i}`,
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
        impactedCoins: impactedCoins,
        category: randomElement(categories),
        linkUrl: "#"
    };
});

const personaBasedMeanings: Record<PersonaType, Record<VolatilityImpact, { meaning: string; action: string }>> = {
    "Impulsive Sprinter": {
        "High": { meaning: "This is a high-risk environment where FOMO is strongest. Chasing candles now is a direct path to giving back profits. Your edge is patience.", action: "Do not trade based on this news. Reduce open leverage and wait for a clean A+ setup based on your own plan." },
        "Medium": { meaning: "This news will cause chop and noise. Your impulse might be to jump in, but the real risk is getting stopped out on a random wick.", action: "Wait for the market to digest the news. If you trade, use half your normal size." },
        "Low": { meaning: "This news is unlikely to cause a major directional move. It's a distraction, not a signal. Your biggest risk is overtrading out of boredom.", action: "Ignore this and stick to your trading plan. This is not a reason to take a trade." },
    },
    "Fearful Analyst": {
        "High": { meaning: "This is a period of high uncertainty where even good analysis can fail. It is okay to feel hesitant; that's your risk management instinct kicking in.", action: "Protect your capital. Watching from the sidelines is a professional decision. Do not feel pressured to participate." },
        "Medium": { meaning: "Expect noise and potentially failed breakouts. Your fear of getting stopped out is valid here. The key is to trade small if you trade at all.", action: "If you have a high-conviction A+ setup, trade it with 25% of your normal size. Otherwise, wait for clarity." },
        "Low": { meaning: "This news is unlikely to invalidate your current trade theses. Your analysis is more important than this headline.", action: "Trust the analysis you've already done. This news should not cause you to second-guess a well-planned trade." },
    },
    "Disciplined Scalper": {
        "High": { meaning: "Your strategy is at high risk. Liquidity is thin and spreads widen, making clean entries/exits difficult. Your discipline is best shown by not participating.", action: "Switch to 'wait-and-see' mode. Preserve capital until volatility returns to normal levels." },
        "Medium": { meaning: "Volatility is increasing, which can be good for scalping, but also riskier. Your rules are critical now.", action: "Adhere strictly to your entry/exit rules. Take profits quickly and do not let small winners turn into losers." },
        "Low": { meaning: "This news is unlikely to create the volatility your strategy needs. Price action may be choppy and directionless.", action: "Be patient. Wait for price to reach a key level before considering a trade. Avoid trading in the middle of a range." },
    },
    "Beginner": {
        "High": { meaning: "This is a 'danger zone' for new traders. Professionals are either sitting out or managing risk carefully. You should not be trading.", action: "Do not trade. Open the charts and watch how price reacts. This is a live lesson in market chaos." },
        "Medium": { meaning: "The market is unpredictable right now. It's very easy to lose money by guessing the direction.", action: "Stay flat. Review your trading plan or watch educational videos. Don't risk capital in uncertain conditions." },
        "Low": { meaning: "This news is minor. It's more important to focus on learning your strategy and following your rules.", action: "Focus on your process. If you have a planned trade, this news is not a reason to change it." },
    },
};


const NEWS_CACHE_KEY = "ec_news_state_v2";
const VIX_CACHE_KEY = "ec_vix_state";
const RISK_EVENTS_KEY = "ec_risk_events_today";
const NEWS_RISK_CONTEXT_KEY = "ec_news_risk_context";
const NEWS_TTL_MS = 5 * 60 * 1000; // 5 minutes

const READ_IDS_KEY = "ec_news_read_ids";
const SAVED_IDS_KEY = "ec_news_saved_ids";

interface NewsFilters {
    search: string;
    sentiment: Sentiment | "All";
    highImpactOnly: boolean;
    category: NewsCategory | "All";
    coins: string[];
    sortBy: "newest" | "highestImpact" | "mostNegative";
}

const ITEMS_PER_PAGE = 9;

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
    const [readNewsIds, setReadNewsIds] = useState<string[]>([]);
    const [savedNewsIds, setSavedNewsIds] = useState<string[]>([]);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [persona, setPersona] = useState<PersonaType | null>(null);
    const [isWarningActive, setIsWarningActive] = useState(false);
    const { toast } = useToast();

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
                setTimeout(() => {
                    const newItems = [...mockNewsSource].sort(() => 0.5 - Math.random()).map(item => {
                        const riskWindow = getRiskWindow(item.category, item.volatilityImpact);
                        return { 
                            ...item, 
                            ...riskWindow,
                            arjunMeaning: "Default meaning", // These will be dynamically generated
                            recommendedAction: "Default action",
                         };
                    });

                    const newCache = {
                        items: newItems,
                        lastFetchedAt: new Date().toISOString(),
                    };
                    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(newCache));
                    setNewsItems(newItems);

                    let vixState: VixState | null = null;
                    try {
                        const vixStateString = localStorage.getItem(VIX_CACHE_KEY);
                        if (vixStateString) {
                            vixState = JSON.parse(vixStateString);
                        }
                    } catch (e) {
                        console.error("Failed to parse VIX state for news integration", e);
                    }

                    // Compute news sentiment score and update VIX state
                    let newsSentimentScore = 50; // Start neutral
                    const impactMap = { Low: 1, Medium: 2, High: 4 };
                    
                    newItems.slice(0, 10).forEach(item => { // Consider top 10 recent items
                        if (item.sentiment === 'Negative') {
                            newsSentimentScore -= 2 * impactMap[item.volatilityImpact];
                        } else if (item.sentiment === 'Positive') {
                            newsSentimentScore += 1 * impactMap[item.volatilityImpact];
                        }
                    });
                    
                    newsSentimentScore = Math.max(0, Math.min(100, newsSentimentScore));

                    if (vixState) {
                        vixState.components.newsSentiment = newsSentimentScore;
                        localStorage.setItem(VIX_CACHE_KEY, JSON.stringify(vixState));
                        window.dispatchEvent(new StorageEvent('storage', { key: VIX_CACHE_KEY }));
                    }

                    // Add high-impact news to risk events
                    const existingEvents: RiskEvent[] = JSON.parse(localStorage.getItem(RISK_EVENTS_KEY) || '[]');
                    const newRiskEvents: RiskEvent[] = [];
                    
                    const recentHighImpactNews = newItems.filter(
                        item => item.volatilityImpact === 'High' && 
                        (new Date().getTime() - new Date(item.publishedAt).getTime() < 60 * 60 * 1000) // Within the last hour
                    );

                    recentHighImpactNews.forEach(item => {
                        const eventExists = existingEvents.some(e => e.description.includes(item.headline));
                        if (!eventExists) {
                            const severity = (vixState?.marketRisk.vixZone === 'Volatile' || vixState?.marketRisk.vixZone === 'High Volatility' || vixState?.marketRisk.vixZone === 'Extreme') ? 'red' : 'yellow';
                            newRiskEvents.push({
                                time: format(new Date(), 'HH:mm'),
                                description: `High-impact news: ${item.headline}`,
                                level: severity,
                            });
                        }
                    });

                    if (newRiskEvents.length > 0) {
                        localStorage.setItem(RISK_EVENTS_KEY, JSON.stringify([...existingEvents, ...newRiskEvents]));
                        window.dispatchEvent(new StorageEvent('storage', { key: RISK_EVENTS_KEY }));
                    }

                    setIsLoading(false);
                }, 1000);

            } catch (error) {
                console.error("Failed to load or cache news data:", error);
                setNewsItems([]);
                setIsLoading(false);
            }
        };

        loadNews();

        try {
            const storedReadIds = localStorage.getItem(READ_IDS_KEY);
            const storedSavedIds = localStorage.getItem(SAVED_IDS_KEY);
            if (storedReadIds) setReadNewsIds(JSON.parse(storedReadIds));
            if (storedSavedIds) setSavedNewsIds(JSON.parse(storedSavedIds));
        } catch (error) {
            console.error("Failed to parse read/saved news IDs:", error);
        }

        try {
            const storedPersona = localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base");
            if (storedPersona) {
                setPersona(JSON.parse(storedPersona).primaryPersonaName || "Beginner");
            } else {
                setPersona("Beginner");
            }
        } catch (e) {
            setPersona("Beginner");
        }
    }, []);

    useEffect(() => {
        if (selectedNews) {
            const context = localStorage.getItem(NEWS_RISK_CONTEXT_KEY);
            if(context) {
                const parsedContext = JSON.parse(context);
                if (parsedContext.active && parsedContext.headline === selectedNews.headline) {
                    setIsWarningActive(true);
                } else {
                     setIsWarningActive(false);
                }
            } else {
                 setIsWarningActive(false);
            }
        }
    }, [selectedNews]);

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
    
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [filters]);

    const handleCoinToggle = (coin: string) => {
        setFilters(prev => {
            const newCoins = prev.coins.includes(coin)
                ? prev.coins.filter(c => c !== coin)
                : [...prev.coins, coin];
            return { ...prev, coins: newCoins };
        });
    };

    const discussWithArjun = (item: NewsItem) => {
        const insight = getPersonaInsight(item, persona);
        const prompt = `Arjun, this news came up: "${item.headline}". Your advice was: "${insight.action}". Can you elaborate on why this is the right move for my ${persona} persona?`;
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
    
    const showHighImpact = () => {
        setFilters(prev => ({
            ...prev,
            highImpactOnly: true,
            sentiment: 'All',
            category: 'All'
        }));
    };

    const handleToggleRead = (id: string) => {
        setReadNewsIds(prev => {
            const newIds = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
            localStorage.setItem(READ_IDS_KEY, JSON.stringify(newIds));
            return newIds;
        });
    };

    const handleToggleSave = (id: string) => {
        setSavedNewsIds(prev => {
            const newIds = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
            localStorage.setItem(SAVED_IDS_KEY, JSON.stringify(newIds));
            return newIds;
        });
    };

    const getPersonaInsight = (newsItem: NewsItem, persona: PersonaType | null) => {
        const defaultPersona: PersonaType = 'Beginner';
        const p = persona || defaultPersona;
        return personaBasedMeanings[p][newsItem.volatilityImpact] || personaBasedMeanings[defaultPersona][newsItem.volatilityImpact];
    };

    const handleWarningToggle = (checked: boolean, newsItem: NewsItem) => {
        setIsWarningActive(checked);
        if (checked) {
            const newsRiskContext = {
                active: true,
                headline: newsItem.headline,
                volatilityImpact: newsItem.volatilityImpact,
                riskWindowMins: newsItem.riskWindowMins,
                expiresAt: new Date().getTime() + newsItem.riskWindowMins * 60 * 1000,
                impactedCoins: newsItem.impactedCoins,
                sentiment: newsItem.sentiment,
            };
            localStorage.setItem(NEWS_RISK_CONTEXT_KEY, JSON.stringify(newsRiskContext));
            toast({
                title: "Risk Warning Activated",
                description: `A warning will be shown in Trade Planning for the next ${newsItem.riskWindowMins} minutes.`,
            });
        } else {
            localStorage.removeItem(NEWS_RISK_CONTEXT_KEY);
            toast({
                title: "Risk Warning Deactivated",
                variant: 'destructive',
            });
        }
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
                        {[...Array(6)].map((_, i) => (
                             <Card key={i} className="bg-muted/30 border-border/50">
                                <CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-1/2 mt-2" /></CardHeader>
                                <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                                <CardFooter className="flex flex-wrap gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-12 rounded-full" /></CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : filteredNews.length === 0 ? (
                    <Card className="text-center py-12 bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>No items match these filters.</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center gap-4">
                            <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                            <Button onClick={showHighImpact}>Show High Impact</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredNews.slice(0, visibleCount).map(item => {
                                const isRead = readNewsIds.includes(item.id);
                                const isSaved = savedNewsIds.includes(item.id);
                                return (
                                    <Card 
                                        key={item.id}
                                        className={cn(
                                            "bg-muted/30 border-border/50 flex flex-col transition-all",
                                            isRead ? "opacity-60 hover:opacity-100" : "hover:border-primary/40 hover:bg-muted/50"
                                        )}
                                    >
                                        <div onClick={() => setSelectedNews(item)} className="cursor-pointer flex-1 flex flex-col">
                                            <CardHeader>
                                                <CardTitle className="text-base leading-tight">{item.headline}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 text-xs pt-1">
                                                    <span>{item.sourceName}</span>
                                                    <span className="text-muted-foreground/50">&bull;</span>
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}</span>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1">
                                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                                    {item.summaryBullets.slice(0,2).map((bullet, i) => <li key={i}>{bullet}</li>)}
                                                </ul>
                                            </CardContent>
                                        </div>
                                        <CardFooter className="flex-col items-start gap-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline" className={cn(
                                                    'text-xs whitespace-nowrap',
                                                    item.sentiment === 'Positive' && 'bg-green-500/20 text-green-300 border-green-500/30',
                                                    item.sentiment === 'Negative' && 'bg-red-500/20 text-red-300 border-red-500/30',
                                                    item.sentiment === 'Neutral' && 'bg-secondary text-secondary-foreground border-border'
                                                )}>{item.sentiment}</Badge>
                                                <Badge variant="outline" className={cn(
                                                    "text-xs",
                                                    item.volatilityImpact === 'High' && 'border-red-500/50 text-red-400',
                                                    item.volatilityImpact === 'Medium' && 'border-amber-500/50 text-amber-400',
                                                    item.volatilityImpact === 'Low' && 'border-green-500/50 text-green-400',
                                                )}>
                                                    <TrendingUp className="mr-1 h-3 w-3"/>
                                                    {item.volatilityImpact} Impact
                                                </Badge>
                                                {item.impactedCoins.slice(0, 3).map(coin => <Badge key={coin} variant="secondary" className="font-mono">{coin}</Badge>)}
                                                {item.impactedCoins.length > 3 && (
                                                    <Badge variant="secondary" className="font-mono">+{item.impactedCoins.length - 3}</Badge>
                                                )}
                                            </div>
                                            <div className="w-full pt-2 border-t border-border/50 flex justify-end items-center gap-1">
                                                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => handleToggleRead(item.id)}>
                                                    <CheckCircle className={cn("mr-2 h-4 w-4", isRead && "text-primary")} /> {isRead ? "Unread" : "Mark read"}
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => handleToggleSave(item.id)}>
                                                    <Bookmark className={cn("mr-2 h-4 w-4", isSaved && "text-primary fill-primary")} /> {isSaved ? "Unsave" : "Save"}
                                                </Button>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                )
                            })}
                        </div>
                        {visibleCount < filteredNews.length && (
                            <div className="mt-8 text-center">
                                <Button variant="outline" onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}>
                                    Load More ({filteredNews.length - visibleCount} remaining)
                                </Button>
                            </div>
                        )}
                    </>
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
                                        selectedNews.sentiment === 'Positive' && 'bg-green-500/20 text-green-300 border-green-500/30',
                                        selectedNews.sentiment === 'Negative' && 'bg-red-500/20 text-red-300 border-red-500/30',
                                        selectedNews.sentiment === 'Neutral' && 'bg-secondary text-secondary-foreground border-border'
                                    )}>{selectedNews.sentiment}</Badge>
                                    <Badge variant="outline" className={cn(
                                        "text-xs",
                                        selectedNews.volatilityImpact === 'High' && 'border-red-500/50 text-red-400',
                                        selectedNews.volatilityImpact === 'Medium' && 'border-amber-500/50 text-amber-400',
                                        selectedNews.volatilityImpact === 'Low' && 'border-green-500/50 text-green-400',
                                    )}>
                                        <TrendingUp className="mr-1 h-3 w-3"/>
                                        {selectedNews.volatilityImpact} Impact
                                    </Badge>
                                     <Badge variant="secondary" className="text-xs">{selectedNews.category}</Badge>
                                    <span className="flex items-center gap-2 text-muted-foreground text-sm"><Clock className="h-4 w-4" />{new Date(selectedNews.publishedAt).toLocaleString()}</span>
                                </DrawerDescription>
                            </DrawerHeader>
                             
                            {(selectedNews.volatilityImpact === 'High' || selectedNews.volatilityRiskScore > 70) && (
                                <div className="px-4 pt-4">
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <div className="flex items-center justify-between w-full">
                                        <div>
                                            <AlertTitle>High-Impact Window: Next {selectedNews.riskWindowMins} minutes</AlertTitle>
                                            <AlertDescription>
                                                Arjun recommends caution.
                                            </AlertDescription>
                                        </div>
                                        <Badge variant="outline" className="border-destructive/50 text-destructive-foreground bg-destructive/80">
                                            Reduce Size
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-destructive/30">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="send-warning"
                                                checked={isWarningActive}
                                                onCheckedChange={(checked) => handleWarningToggle(checked, selectedNews)}
                                            />
                                            <Label htmlFor="send-warning" className="text-xs">Send warning to Trade Planning</Label>
                                        </div>
                                    </div>
                                </Alert>
                                </div>
                            )}

                            <div className="px-4 py-6 grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                     <Card className="bg-muted/30 border-border/50">
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2"><Timer className="h-5 w-5"/>Risk Window Analysis</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Event Type:</span><Badge variant="outline">{selectedNews.eventType}</Badge></div>
                                            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Risk Duration:</span><span className="font-semibold">{selectedNews.riskWindowMins} minutes</span></div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Volatility Risk Score: {selectedNews.volatilityRiskScore}</Label>
                                                <Progress value={selectedNews.volatilityRiskScore} indicatorClassName={cn(
                                                    selectedNews.volatilityRiskScore > 75 && "bg-red-500",
                                                    selectedNews.volatilityRiskScore > 50 && selectedNews.volatilityRiskScore <= 75 && "bg-amber-500",
                                                    selectedNews.volatilityRiskScore <= 50 && "bg-green-500",
                                                )} className="h-2 mt-1" />
                                            </div>
                                        </CardContent>
                                    </Card>
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
                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
                                         <Button variant="outline" className="flex-1" asChild>
                                            <a href={selectedNews.linkUrl || "#"} target="_blank" rel="noopener noreferrer">
                                                View Original Article <ArrowRight className="ml-2 h-4 w-4"/>
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                                <Card className="bg-primary/10 border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/>Arjun's Insight</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-foreground mb-1">What this means for you ({persona || 'Beginner'}):</h4>
                                            <p className="text-sm text-primary/90 italic">"{getPersonaInsight(selectedNews, persona).meaning}"</p>
                                        </div>
                                        <Separator />
                                        <div>
                                            <h4 className="text-sm font-semibold text-foreground mb-1">Recommended Action:</h4>
                                            <p className="text-sm font-semibold text-primary/90">{getPersonaInsight(selectedNews, persona).action}</p>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                         <Button className="w-full" onClick={() => discussWithArjun(selectedNews)}>
                                            <Bot className="mr-2 h-4 w-4" />
                                            Discuss with Arjun
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}
