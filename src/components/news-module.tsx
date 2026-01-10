
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Filter, Clock, Loader2, ArrowRight, TrendingUp, Zap, Sparkles } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";

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


const mockNewsSource: NewsItem[] = [
    {
        id: '1',
        headline: "Fed hints at slower rate hikes, crypto market rallies",
        sourceName: "Blocksource",
        publishedAt: "2 hours ago",
        summaryBullets: [
            "Fed Chair cites cooling inflation data as a reason for a potential policy shift.",
            "BTC briefly touched $70,000 following the announcement.",
            "Risk assets, including crypto, are expected to benefit from a more dovish stance."
        ],
        sentiment: "Positive",
        volatilityImpact: "High",
        impactedCoins: ["BTC", "ETH"],
        category: "Macro",
        arjunMeaning: "This is a significant macro tailwind. A pause in rate hikes reduces the 'risk-free' rate, making riskier assets like crypto more attractive. Expect increased capital inflows if this narrative holds.",
        recommendedAction: "Re-evaluate short positions. Look for trend-following long setups on major coins if the market shows sustained strength.",
        linkUrl: "#"
    },
    {
        id: '2',
        headline: "Major exchange announces new security upgrades after hack",
        sourceName: "CryptoWire",
        publishedAt: "8 hours ago",
        summaryBullets: [
            "The exchange is partnering with a leading cybersecurity firm to overhaul its infrastructure.",
            "Features include multi-signature wallets and stricter internal controls.",
            "Market reaction has been muted as traders wait to see if the measures restore confidence."
        ],
        sentiment: "Neutral",
        volatilityImpact: "Low",
        impactedCoins: ["BNB", "OKB"],
        category: "Security",
        arjunMeaning: "While a positive step for the specific exchange, this news is unlikely to have a market-wide impact unless it signals a broader trend in exchange security improvements. It primarily reduces platform-specific risk.",
        recommendedAction: "No immediate action required for most traders. If you use this exchange, review the new security features.",
        linkUrl: "#"
    },
    {
        id: '3',
        headline: "Regulatory uncertainty in Asia spooks investors",
        sourceName: "Asia Crypto Today",
        publishedAt: "1 day ago",
        summaryBullets: [
            "Draft regulations could impact stablecoin issuance and DeFi protocols.",
            "A risk-off sentiment has led to a broad sell-off in tokens associated with the region.",
            "Clarity is not expected for several weeks, leading to prolonged uncertainty."
        ],
        sentiment: "Negative",
        volatilityImpact: "Medium",
        impactedCoins: ["NEO", "TRX", "VET"],
        category: "Regulatory",
        arjunMeaning: "Regulatory news is a primary driver of volatility. This uncertainty creates a headwind for specific projects and can cause contagious fear in the market, even for unrelated assets.",
        recommendedAction: "Reduce exposure to the impacted coins. Be cautious of new long positions until there is more regulatory clarity.",
        linkUrl: "#"
    },
    {
        id: '4',
        headline: "Ethereum's Dencun upgrade leads to significantly lower layer-2 fees",
        sourceName: "The Defiant",
        publishedAt: "2 days ago",
        summaryBullets: [
            "The network upgrade has successfully reduced transaction costs on major L2s like Arbitrum and Optimism by over 90%.",
            "Lower fees are expected to spur adoption and user activity on layer-2 protocols.",
            "ETH price has seen a moderate increase, but L2 tokens have rallied significantly."
        ],
        sentiment: "Positive",
        volatilityImpact: "Medium",
        impactedCoins: ["ETH", "ARB", "OP"],
        category: "Tech",
        arjunMeaning: "This is a fundamental improvement for the Ethereum ecosystem. Reduced transaction costs make DeFi and other on-chain activities more accessible, which is a long-term bullish catalyst for ETH and its L2 ecosystem.",
        recommendedAction: "Look for strength in L2 tokens. This could be a sustained narrative trade. Consider it a bullish factor in any ETH-related analysis.",
        linkUrl: "#"
    },
    {
        id: '5',
        headline: "US Spot Bitcoin ETFs See Record Inflow Day",
        sourceName: "ETF Weekly",
        publishedAt: "3 hours ago",
        summaryBullets: [
            "Over $1 billion in net inflows recorded yesterday across all spot Bitcoin ETFs.",
            "BlackRock's IBIT led the pack with over $800M in single-day inflows.",
            "This marks the largest single day of inflows since the ETFs launched in January."
        ],
        sentiment: "Positive",
        volatilityImpact: "High",
        impactedCoins: ["BTC"],
        category: "ETF",
        arjunMeaning: "Massive institutional demand is a strong bullish signal. This level of inflow suggests large players are accumulating, which can absorb selling pressure and potentially lead to price appreciation.",
        recommendedAction: "This validates a long-term bullish thesis. For short-term traders, be aware of potential volatility as large orders are filled.",
        linkUrl: "#"
    },
    {
        id: '6',
        headline: "$300M in Longs Liquidated as BTC Dips to $62k",
        sourceName: "Liquidations.info",
        publishedAt: "1 hour ago",
        summaryBullets: [
            "A sudden market dip triggered a cascade of long liquidations.",
            "The majority of liquidations occurred on Bybit and Binance.",
            "Funding rates have reset, indicating a healthier, less-leveraged market."
        ],
        sentiment: "Negative",
        volatilityImpact: "High",
        impactedCoins: ["BTC", "ETH", "SOL"],
        category: "Liquidations",
        arjunMeaning: "A liquidation cascade cleans out over-leveraged positions, which is painful short-term but healthy long-term. It often marks a local bottom as forced selling is exhausted.",
        recommendedAction: "Look for potential bounce or reversal setups now that the leverage has been flushed. Be cautious of immediate re-leveraging.",
        linkUrl: "#"
    },
    {
        id: '7',
        headline: "Coinbase Announces Support for New Solana-Based Token",
        sourceName: "ExchangeWire",
        publishedAt: "12 hours ago",
        summaryBullets: [
            "Coinbase will list the WIF token on its spot market.",
            "Trading is expected to begin tomorrow if liquidity conditions are met.",
            "This is part of a broader push to list more Solana ecosystem assets."
        ],
        sentiment: "Positive",
        volatilityImpact: "Medium",
        impactedCoins: ["SOL", "WIF"],
        category: "Exchange",
        arjunMeaning: "A 'Coinbase listing' is a powerful short-term catalyst. It dramatically increases accessibility and perceived legitimacy for a token, often leading to a price pump.",
        recommendedAction: "This is a classic catalyst trade. High-risk, but often profitable if timed well. Be wary of 'buy the rumor, sell the news' price action.",
        linkUrl: "#"
    },
    {
        id: '8',
        headline: "US CPI data comes in slightly cooler than expected",
        sourceName: "MacroScope",
        publishedAt: "5 hours ago",
        summaryBullets: [
            "Consumer Price Index rose 3.1% year-over-year, below the 3.2% consensus.",
            "Core CPI also showed signs of easing inflationary pressures.",
            "The data gives the Federal Reserve more flexibility on future rate decisions."
        ],
        sentiment: "Positive",
        volatilityImpact: "Medium",
        impactedCoins: ["BTC", "ETH"],
        category: "Macro",
        arjunMeaning: "Cooler inflation is bullish for risk assets like crypto. It decreases the likelihood of hawkish Fed policy (rate hikes), which tends to suppress asset prices.",
        recommendedAction: "This supports a risk-on sentiment. Look for strength in major assets. This could be the macro backdrop for a leg up.",
        linkUrl: "#"
    },
    {
        id: '9',
        headline: "Uniswap Foundation Delays Fee Switch Vote",
        sourceName: "DeFi Pulse",
        publishedAt: "22 hours ago",
        summaryBullets: [
            "The vote to turn on the 'fee switch' for UNI holders has been postponed.",
            "Concerns were raised by a major stakeholder regarding implementation details.",
            "The UNI token price dipped 5% on the news."
        ],
        sentiment: "Negative",
        volatilityImpact: "Medium",
        impactedCoins: ["UNI"],
        category: "Tech",
        arjunMeaning: "This is a governance-related catalyst. The fee switch is a key part of UNI's value proposition, so a delay introduces uncertainty and is bearish in the short term.",
        recommendedAction: "Monitor governance forums for updates. The long-term thesis might be intact, but short-term price action will be choppy.",
        linkUrl: "#"
    },
    {
        id: '10',
        headline: "Binance Completes System Upgrade, Trading Resumes",
        sourceName: "Binance Blog",
        publishedAt: "14 hours ago",
        summaryBullets: [
            "A scheduled system upgrade was completed successfully with minimal downtime.",
            "All deposits, withdrawals, and trading functions are now fully operational.",
            "The upgrade aims to improve system performance and stability."
        ],
        sentiment: "Neutral",
        volatilityImpact: "Low",
        impactedCoins: ["BNB"],
        category: "Exchange",
        arjunMeaning: "This is routine operational news. It's a sign of a healthy and improving exchange, but typically has no direct, tradable impact on price.",
        recommendedAction: "No action required. This is background noise, not a trading signal.",
        linkUrl: "#"
    }
];


const NEWS_CACHE_KEY = "ec_news_state_v2"; // Changed key for new data structure
const NEWS_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function NewsModule({ onSetModule }: NewsModuleProps) {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sentimentFilter, setSentimentFilter] = useState<Sentiment | "All">("All");
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

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
                const newItems = [...mockNewsSource].sort(() => 0.5 - Math.random()); // Shuffle to simulate new data
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
        if (sentimentFilter === "All") return newsItems;
        return newsItems.filter(item => item.sentiment === sentimentFilter);
    }, [sentimentFilter, newsItems]);

    const discussWithArjun = (item: NewsItem) => {
        const prompt = `Arjun, how should I think about this news headline: "${item.headline}"? My current focus is on [your current strategy/coin]. Does this news impact my plan?`;
        onSetModule('aiCoaching', { initialMessage: prompt });
        setSelectedNews(null); // Close drawer
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">News Intelligence</h1>
                <p className="text-muted-foreground">AI-curated crypto futures news with sentiment + volatility impact—so you don’t trade blind.</p>
            </div>
            
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>News Feed</CardTitle>
                        <div className="flex items-center gap-2">
                             <Filter className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Filter by sentiment:</p>
                             <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                                {(["All", "Positive", "Neutral", "Negative"] as const).map(s => (
                                    <Button
                                        key={s}
                                        size="sm"
                                        variant={sentimentFilter === s ? 'secondary' : 'ghost'}
                                        onClick={() => setSentimentFilter(s as Sentiment | "All")}
                                        className="rounded-full h-8 px-3 text-xs"
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredNews.map(item => (
                                <Card 
                                    key={item.id}
                                    onClick={() => setSelectedNews(item)}
                                    className="bg-muted/30 border-border/50 cursor-pointer transition-all hover:border-primary/40 hover:bg-muted/50 flex flex-col"
                                >
                                    <CardHeader>
                                        <div className="flex justify-between items-start gap-4">
                                            <CardTitle className="text-base leading-tight">{item.headline}</CardTitle>
                                        </div>
                                         <CardDescription className="flex items-center gap-2 text-xs pt-1">
                                            <span>{item.sourceName}</span>
                                            <span className="text-muted-foreground/50">&bull;</span>
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.publishedAt}</span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-between">
                                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                            {item.summaryBullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
                                        </ul>
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
                </CardContent>
            </Card>

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
                                    <span className="flex items-center gap-2 text-muted-foreground text-sm"><Clock className="h-4 w-4" />{selectedNews.publishedAt}</span>
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
