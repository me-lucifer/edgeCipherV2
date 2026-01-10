
      "use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Filter, Clock, Loader2, ArrowRight, TrendingUp, Zap, Sparkles, Search, X, AlertTriangle, CheckCircle, Bookmark, Timer, Gauge, Star, Calendar, Copy, Clipboard, ThumbsUp, ThumbsDown, Meh, PlusCircle, MoreHorizontal, Save } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow, formatDistance } from 'date-fns';
import type { VixState } from "@/hooks/use-risk-state";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";


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
            riskWindowMins = impact === 'High' ? 240 : 60;
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

type VixZone = "Extremely Calm" | "Normal" | "Volatile" | "High Volatility" | "Extreme";

const postureSuggestions: Record<VixZone, Record<PersonaType, { meaning: string; action: string }>> = {
    "Extremely Calm": {
        "Impulsive Sprinter": { meaning: "Calm markets can feel slow, which may trigger your impulse to force trades. Patience is your primary edge today.", action: "Do not invent setups; wait for the market to present a clear opportunity." },
        "Fearful Analyst": { meaning: "These low-stress conditions are perfect for building confidence. Use this time to observe and plan without pressure.", action: "Focus on planning and analysis, not forced execution." },
        "Disciplined Scalper": { meaning: "Range-bound strategies often perform well. Trust your system but be quick to cut trades that don't show immediate follow-through.", action: "Execute your plan, but protect your capital from choppy price action." },
        "Beginner": { meaning: "This is the ideal environment to study market structure without high risk. Observe and learn, don't trade.", action: "Today is for learning and observation, not for aggressive trading." },
    },
    "Normal": {
        "Impulsive Sprinter": { meaning: "Normal conditions can still trigger impatience. Your biggest risk is deviating from your plan. The goal is consistent execution.", action: "Follow your plan without exception; no adding to losers or revenge trading." },
        "Fearful Analyst": { meaning: "The market is providing good conditions for well-planned trades. Now is the time to trust your analysis.", action: "Trust your analysis and execute your A+ setups with confidence." },
        "Disciplined Scalper": { meaning: "These are your prime conditions. Your edge is sharpest now. Focus on disciplined execution of your best setups.", action: "Execute your A+ setups without hesitation and adhere to your rules." },
        "Beginner": { meaning: "This is a good environment to practice. Focus on executing one or two simple setups with very small size.", action: "Practice disciplined execution with a minimal position size." },
    },
    "Volatile": {
        "Impulsive Sprinter": { meaning: "This is a danger zone for you. Volatility can feel like a constant stream of opportunities, but it's where your impulses are most costly.", action: "Cut position size by 50%. Wait for crystal-clear A+ setups." },
        "Fearful Analyst": { meaning: "Analysis is difficult in choppy markets. It is perfectly acceptable to sit out. A flat day is a winning day.", action: "If you are not 100% confident in a setup, the best trade is no trade." },
        "Disciplined Scalper": { meaning: "Your strategy is at high risk. Widen stops, reduce size, or wait for the market to normalize.", action: "Adapt your parameters for volatility or wait for calmer conditions." },
        "Beginner": { meaning: "This is a 'sit on your hands' day. Watching the chaos from the sidelines is the most valuable lesson.", action: "Observe the market, do not participate." },
    },
    "High Volatility": {
        "Impulsive Sprinter": { meaning: "This is a 'red alert' for your persona. The market is erratic. Trying to trade in these conditions is gambling.", action: "Your only job today is to protect your capital by not trading." },
        "Fearful Analyst": { meaning: "Your analysis is unreliable in these conditions. The market is driven by liquidations and fear. The pros are waiting.", action: "Stay flat. Pros are waiting, and so should you." },
        "Disciplined Scalper": { meaning: "Your edge does not exist in these market conditions. Your discipline is best expressed by not participating.", action: "Cash is the strongest position right now. Preserve your capital." },
        "Beginner": { meaning: "This is the environment where new traders lose their accounts. Do not trade. Your only job is to watch from a distance.", action: "Do not trade. Your goal is to survive to trade another day." },
    },
    "Extreme": {
        "Impulsive Sprinter": { meaning: "Catastrophic risk is present. Close your platform and walk away. The only winning move is not to play.", action: "DO NOT TRADE. The only trade that matters is protecting your account." },
        "Fearful Analyst": { meaning: "The market is completely irrational. Your analysis does not apply. Trust your fear and stay flat.", action: "Stay flat. This is a spectator sport right now." },
        "Disciplined Scalper": { meaning: "There is no edge here. Any position taken is a gamble. Stepping aside is the highest form of discipline.", action: "Stay flat. There is no trading edge in a liquidation cascade." },
        "Beginner": { meaning: "DO NOT TRADE. DANGER. Watch from a distance to learn that sometimes the best action is no action.", action: "Observe the chaos from the sidelines. Survive to trade another day." },
    }
};

const getImpactHorizon = (riskWindowMins: number): "Immediate" | "Today" | "Multi-day" => {
  if (riskWindowMins <= 60) return "Immediate";
  if (riskWindowMins <= 240) return "Today";
  return "Multi-day";
};

const getVixZone = (vix: number): VixZone => {
    if (vix <= 20) return "Extremely Calm";
    if (vix <= 40) return "Normal";
    if (vix <= 60) return "Volatile";
    if (vix <= 80) return "High Volatility";
    return "Extreme";
};

const NEWS_CACHE_KEY = "ec_news_state_v2";
const VIX_CACHE_KEY = "ec_vix_state";
const NEWS_RISK_CONTEXT_KEY = "ec_news_risk_context";
const NEWS_TTL_MS = 5 * 60 * 1000; // 5 minutes

const READ_IDS_KEY = "ec_news_read_ids";
const SAVED_IDS_KEY = "ec_news_saved_ids";
const FOLLOWED_COINS_KEY = "ec_followed_coins";
const PRESETS_KEY = "ec_news_filter_presets";
const LAST_PRESET_KEY = "ec_news_last_preset_id";


interface NewsFilters {
    search: string;
    sentiment: Sentiment | "All";
    highImpactOnly: boolean;
    category: NewsCategory | "All";
    coins: string[];
    sortBy: "newest" | "highestImpact" | "mostNegative";
    followedOnly: boolean;
}

interface NewsFilterPreset {
    id: string;
    name: string;
    filters: NewsFilters;
}

const ITEMS_PER_PAGE = 9;

function UpcomingEventsCard({ onSetRiskWindow }: { onSetRiskWindow: (event: any) => void }) {
    const mockEvents = useMemo(() => [
        { name: "US CPI Data Release", date: new Date(Date.now() + 2 * 60 * 60 * 1000), impact: 'High' },
        { name: "FOMC Meeting Minutes", date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), impact: 'High' },
        { name: "ETH ETF Final Deadline", date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), impact: 'High' },
        { name: "Major Protocol Upgrade", date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), impact: 'Medium' },
    ], []);

    const [timers, setTimers] = useState<string[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimers(mockEvents.map(event => formatDistanceToNow(event.date, { addSuffix: true })));
        }, 1000);
        return () => clearInterval(interval);
    }, [mockEvents]);

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-5 w-5" /> Upcoming Risk Events</CardTitle>
                <CardDescription className="text-xs">Prototype data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {mockEvents.map((event, index) => (
                    <div key={event.name} className="space-y-2">
                        <div>
                            <p className="font-semibold text-sm text-foreground">{event.name}</p>
                            <p className="text-xs text-muted-foreground">{timers[index]}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <Badge variant="outline" className={cn(
                                event.impact === 'High' && 'border-red-500/50 text-red-400',
                                event.impact === 'Medium' && 'border-amber-500/50 text-amber-400',
                            )}>
                                {event.impact} Impact
                            </Badge>
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onSetRiskWindow(event)}>
                                Set as active risk window
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function DailyBriefCard({ newsItems }: { newsItems: NewsItem[] }) {
    const { toast } = useToast();
    const { mood, volatilityRisk, topRisks } = useMemo(() => {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentNews = newsItems.filter(item => new Date(item.publishedAt) > last24h);

        if (recentNews.length === 0) {
            return {
                mood: 'Neutral',
                volatilityRisk: 'Low',
                topRisks: ["No major news events in the last 24 hours."]
            };
        }

        const sentimentScore = recentNews.reduce((acc, item) => {
            if (item.sentiment === 'Positive') return acc + 1;
            if (item.sentiment === 'Negative') return acc - 1;
            return acc;
        }, 0);

        const mood = sentimentScore > 1 ? 'Bullish' : sentimentScore < -1 ? 'Bearish' : 'Neutral';

        const hasHighImpact = recentNews.some(item => item.volatilityImpact === 'High');
        const hasMediumImpact = recentNews.some(item => item.volatilityImpact === 'Medium');
        const volatilityRisk = hasHighImpact ? 'High' : hasMediumImpact ? 'Medium' : 'Low';
        
        const topRisks = recentNews
            .filter(item => item.sentiment === 'Negative' || item.volatilityImpact === 'High')
            .sort((a, b) => b.volatilityRiskScore - a.volatilityRiskScore)
            .slice(0, 3)
            .map(item => item.headline);
            
        if (topRisks.length === 0) {
            topRisks.push("No significant risk drivers detected in recent news.");
        }

        return { mood, volatilityRisk, topRisks };
    }, [newsItems]);

    const handleCopyBrief = () => {
        const briefText = `
### Daily News Brief ###
Mood: ${mood}
Volatility Risk: ${volatilityRisk}

Top Risks Today:
${topRisks.map(risk => `- ${risk}`).join('\n')}
        `.trim();
        navigator.clipboard.writeText(briefText);
        toast({ title: "Brief copied to clipboard" });
    };

    const moodConfig = {
        Bullish: { icon: ThumbsUp, color: 'text-green-400' },
        Neutral: { icon: Meh, color: 'text-muted-foreground' },
        Bearish: { icon: ThumbsDown, color: 'text-red-400' },
    };
    const { icon: MoodIcon, color: moodColor } = moodConfig[mood];

    const volConfig = {
        Low: { color: 'text-green-400' },
        Medium: { color: 'text-amber-400' },
        High: { color: 'text-red-400' },
    };

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Daily Intelligence Brief</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleCopyBrief}>
                        <Clipboard className="mr-2 h-4 w-4" /> Copy Brief
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center text-center p-4 bg-muted rounded-lg border">
                    <p className="text-sm font-semibold text-muted-foreground">Market Mood</p>
                    <div className={cn("flex items-center gap-2 text-lg font-bold mt-2", moodColor)}>
                        <MoodIcon className="h-5 w-5" />
                        <span>{mood}</span>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-4 bg-muted rounded-lg border">
                    <p className="text-sm font-semibold text-muted-foreground">Volatility Risk</p>
                    <div className={cn("flex items-center gap-2 text-lg font-bold mt-2", volConfig[volatilityRisk].color)}>
                        <TrendingUp className="h-5 w-5" />
                        <span>{volatilityRisk}</span>
                    </div>
                </div>
                <div className="md:col-span-1 space-y-2 p-4 bg-muted rounded-lg border">
                    <h4 className="text-sm font-semibold text-muted-foreground">Top Risks Today</h4>
                    <ul className="space-y-1 list-disc list-inside text-xs text-foreground">
                        {topRisks.map((risk, i) => <li key={i} className="truncate">{risk}</li>)}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
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
        followedOnly: false,
    });
    const [readNewsIds, setReadNewsIds] = useState<string[]>([]);
    const [savedNewsIds, setSavedNewsIds] = useState<string[]>([]);
    const [followedCoins, setFollowedCoins] = useState<string[]>([]);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [persona, setPersona] = useState<PersonaType | null>(null);
    const [isWarningActive, setIsWarningActive] = useState(false);
    const { toast } = useToast();
    const [filterPresets, setFilterPresets] = useState<NewsFilterPreset[]>([]);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
    const [newPresetName, setNewPresetName] = useState("");


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
                            arjunMeaning: "Default meaning",
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

                    if (vixState) {
                        vixState.components.newsSentiment = 50; // Reset on new fetch
                        localStorage.setItem(VIX_CACHE_KEY, JSON.stringify(vixState));
                        window.dispatchEvent(new StorageEvent('storage', { key: VIX_CACHE_KEY }));
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
            const storedFollowedCoins = localStorage.getItem(FOLLOWED_COINS_KEY);
            const storedPresets = localStorage.getItem(PRESETS_KEY);
            const lastPresetId = localStorage.getItem(LAST_PRESET_KEY);
            
            if (storedReadIds) setReadNewsIds(JSON.parse(storedReadIds));
            if (storedSavedIds) setSavedNewsIds(JSON.parse(storedSavedIds));
            if (storedFollowedCoins) setFollowedCoins(JSON.parse(storedFollowedCoins));
            if (storedPresets) {
                const parsedPresets = JSON.parse(storedPresets);
                setFilterPresets(parsedPresets);
                if (lastPresetId) {
                    const presetToLoad = parsedPresets.find((p: NewsFilterPreset) => p.id === lastPresetId);
                    if (presetToLoad) {
                        setFilters(presetToLoad.filters);
                        setActivePresetId(presetToLoad.id);
                    }
                }
            }

        } catch (error) {
            console.error("Failed to parse persisted news states:", error);
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

    const handleNewsSelect = (item: NewsItem) => {
        setSelectedNews(item);
        if (!readNewsIds.includes(item.id)) {
            handleToggleRead(item.id);
        }

        if (item.volatilityImpact === 'High' && item.sentiment === 'Negative') {
            const vixStateString = localStorage.getItem(VIX_CACHE_KEY);
            if (vixStateString) {
                try {
                    const vixState: VixState = JSON.parse(vixStateString);
                    vixState.components.newsSentiment = 20; // More bearish
                    localStorage.setItem(VIX_CACHE_KEY, JSON.stringify(vixState));
                    window.dispatchEvent(new StorageEvent('storage', { key: VIX_CACHE_KEY, newValue: JSON.stringify(vixState) }));
                } catch (e) {
                    console.error("Failed to update VIX state on news select", e);
                }
            }
        }
    };

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
                if (filters.followedOnly && !item.impactedCoins.some(coin => followedCoins.includes(coin))) return false;
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
    }, [filters, newsItems, followedCoins]);

    const relatedNews = useMemo(() => {
        if (!selectedNews) return [];
        
        return newsItems
            .filter(item => {
                if (item.id === selectedNews.id) return false;
                const hasCommonCoin = item.impactedCoins.some(coin => selectedNews.impactedCoins.includes(coin));
                const hasSameCategory = item.category === selectedNews.category;
                return hasCommonCoin || hasSameCategory;
            })
            .slice(0, 4);
    }, [selectedNews, newsItems]);
    
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
        setActivePresetId(null);
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
            followedOnly: false,
        });
        setActivePresetId(null);
        localStorage.removeItem(LAST_PRESET_KEY);
    };
    
    const handleFilterChange = (key: keyof NewsFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setActivePresetId(null);
        localStorage.removeItem(LAST_PRESET_KEY);
    };

    const handleQuickFilterToggle = (filter: {type: string, key?: keyof NewsFilters, value?: any}) => {
        if (filter.type === 'toggle' && filter.key) {
            handleFilterChange(filter.key, !filters[filter.key]);
        } else if (filter.type === 'category' && filter.value) {
            const currentCategory = filters.category;
            handleFilterChange('category', currentCategory === filter.value ? 'All' : filter.value);
        } else if (filter.type === 'coin' && filter.value) {
            const currentCoins = filters.coins;
            const newCoins = currentCoins.includes(filter.value)
                ? currentCoins.filter(c => c !== filter.value)
                : [...currentCoins, filter.value];
            handleFilterChange('coins', newCoins);
        }
    };

    const showHighImpact = () => {
        handleFilterChange('highImpactOnly', true);
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

    const handleToggleFollow = (coin: string) => {
        setFollowedCoins(prev => {
            const newCoins = prev.includes(coin) ? prev.filter(c => c !== coin) : [...prev, coin];
            localStorage.setItem(FOLLOWED_COINS_KEY, JSON.stringify(newCoins));
            toast({
                title: newCoins.includes(coin) ? `Following ${coin}` : `Unfollowed ${coin}`,
            });
            return newCoins;
        });
    };
    
    const getPersonaInsight = (newsItem: NewsItem, persona: PersonaType | null): { meaning: string; action: string } => {
        const defaultPersona: PersonaType = 'Beginner';
        const p = persona || defaultPersona;
        const zone = getVixZone(newsItem.volatilityRiskScore);

        return postureSuggestions[zone]?.[p] || postureSuggestions.Normal[defaultPersona];
    };

    const setRiskWindowFromEvent = (event: { name: string; impact: VolatilityImpact }) => {
        const riskWindowMins = event.impact === 'High' ? 120 : 60;
        const context = {
            active: true,
            headline: event.name,
            volatilityImpact: event.impact,
            riskWindowMins: riskWindowMins,
            expiresAt: new Date().getTime() + riskWindowMins * 60 * 1000,
            impactedCoins: ['BTC', 'ETH'], // Assume broad market impact
            sentiment: 'Neutral',
        };
        handleWarningToggle(true, context as any);
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
    
    // Preset logic
    const handleSavePreset = () => {
        if (!newPresetName) {
            toast({ variant: 'destructive', title: "Preset name required" });
            return;
        }

        let updatedPresets;
        if (activePresetId) {
            // Update existing preset
            updatedPresets = filterPresets.map(p => 
                p.id === activePresetId ? { ...p, name: newPresetName, filters: { ...filters } } : p
            );
            toast({ title: `Preset "${newPresetName}" updated` });
        } else {
            // Create new preset
            const newPreset: NewsFilterPreset = {
                id: `preset-${Date.now()}`,
                name: newPresetName,
                filters: { ...filters }
            };
            updatedPresets = [...filterPresets, newPreset];
            setActivePresetId(newPreset.id);
            localStorage.setItem(LAST_PRESET_KEY, newPreset.id);
            toast({ title: `Preset "${newPresetName}" saved` });
        }

        setFilterPresets(updatedPresets);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
        setShowSavePresetDialog(false);
        setNewPresetName("");
    };
    
    const handleLoadPreset = (preset: NewsFilterPreset) => {
        setFilters(preset.filters);
        setActivePresetId(preset.id);
        localStorage.setItem(LAST_PRESET_KEY, preset.id);
        toast({ title: `Preset "${preset.name}" loaded` });
    };

    const handleDeletePreset = (presetId: string) => {
        const updatedPresets = filterPresets.filter(p => p.id !== presetId);
        setFilterPresets(updatedPresets);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
        if (activePresetId === presetId) {
            setActivePresetId(null);
            localStorage.removeItem(LAST_PRESET_KEY);
        }
        toast({ title: "Preset deleted", variant: 'destructive' });
    };

    const quickFilters = [
        { label: 'High Impact', type: 'toggle', key: 'highImpactOnly' },
        { label: 'Regulatory', type: 'category', value: 'Regulatory' },
        { label: 'ETF', type: 'category', value: 'ETF' },
        { label: 'Liquidations', type: 'category', value: 'Liquidations' },
        { label: 'Macro', type: 'category', value: 'Macro' },
        { label: 'BTC', type: 'coin', value: 'BTC' },
        { label: 'ETH', type: 'coin', value: 'ETH' },
        { label: 'SOL', type: 'coin', value: 'SOL' },
    ];
    
    const isQuickFilterActive = (filter: any) => {
        if (filter.type === 'toggle') return filters[filter.key as keyof NewsFilters];
        if (filter.type === 'category') return filters.category === filter.value;
        if (filter.type === 'coin') return filters.coins.includes(filter.value);
        return false;
    }


    return (
        <div className="space-y-8">
             <Dialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{activePresetId ? 'Update' : 'Save'} Filter Preset</DialogTitle>
                        <DialogDescription>
                            Save your current filter and sort settings as a workspace for quick access later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="preset-name">Preset Name</Label>
                        <Input
                            id="preset-name"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="e.g., 'High Impact BTC'"
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleSavePreset}>{activePresetId ? 'Update' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">News Intelligence</h1>
                <p className="text-muted-foreground">AI-curated crypto futures news with sentiment + volatility impact—so you don’t trade blind.</p>
            </div>

            <DailyBriefCard newsItems={newsItems} />
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-muted/30 border-border/50 sticky top-[72px] z-20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filters & Sorting</CardTitle>
                                <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-2 h-4 w-4"/>Clear all</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <div className="relative md:col-span-2 lg:col-span-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search headline or source..." 
                                        className="pl-9"
                                        value={filters.search}
                                        onChange={e => handleFilterChange('search', e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch 
                                        id="high-impact" 
                                        checked={filters.highImpactOnly}
                                        onCheckedChange={checked => handleFilterChange('highImpactOnly', checked)}
                                    />
                                    <Label htmlFor="high-impact">High Impact Only</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="followed-only"
                                        checked={filters.followedOnly}
                                        onCheckedChange={checked => handleFilterChange('followedOnly', checked)}
                                    />
                                    <Label htmlFor="followed-only">My Followed Coins</Label>
                                </div>
                                <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v as any)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                 <Select value={filters.sortBy} onValueChange={(v) => handleFilterChange('sortBy', v as any)}>
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
                                            onClick={() => handleFilterChange('sentiment', s as Sentiment | "All")}
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
                                        onClick={() => handleFilterChange('coins', [])}
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
                                <div className="flex-1" />
                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="w-40 justify-between">
                                                <span>{activePresetId ? filterPresets.find(p => p.id === activePresetId)?.name : 'Presets'}</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuSeparator />
                                            {filterPresets.map(preset => (
                                                <DropdownMenuItem key={preset.id} onSelect={() => handleLoadPreset(preset)}>
                                                    <span className="flex-1">{preset.name}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset.id); }}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuItem>
                                            ))}
                                            {filterPresets.length === 0 && <DropdownMenuItem disabled>No presets saved</DropdownMenuItem>}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={clearFilters}>
                                                Clear Active Preset
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                     <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (activePresetId) {
                                                const preset = filterPresets.find(p => p.id === activePresetId);
                                                setNewPresetName(preset?.name || "");
                                                setShowSavePresetDialog(true);
                                            } else {
                                                setNewPresetName("");
                                                setShowSavePresetDialog(true);
                                            }
                                        }}
                                    >
                                        <Save className="mr-2 h-4 w-4" /> {activePresetId ? 'Update' : 'Save'}
                                    </Button>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex flex-wrap gap-2 pt-2">
                                {quickFilters.map((qf, i) => (
                                    <Button
                                        key={i}
                                        variant={isQuickFilterActive(qf) ? 'secondary' : 'outline'}
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleQuickFilterToggle(qf)}
                                    >
                                        {qf.label}
                                    </Button>
                                ))}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                <div onClick={() => handleNewsSelect(item)} className="cursor-pointer flex-1 flex flex-col">
                                                    <CardHeader>
                                                        <CardTitle className="text-base leading-tight">{item.headline}</CardTitle>
                                                        <CardDescription className="flex items-center gap-2 text-xs pt-1">
                                                            <span>{item.sourceName}</span>
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
                                                        <Badge variant="outline" className="text-xs">
                                                            <Clock className="mr-1 h-3 w-3"/>
                                                            {getImpactHorizon(item.riskWindowMins)}
                                                        </Badge>
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
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <UpcomingEventsCard onSetRiskWindow={setRiskWindowFromEvent} />
                </div>
            </div>

            <Drawer open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
                <DrawerContent>
                    {selectedNews && (
                        <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
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
                                    <span className="flex items-center gap-2 text-muted-foreground text-sm"><Clock className="h-4 w-4" />{formatDistanceToNow(new Date(selectedNews.publishedAt), { addSuffix: true })} via {selectedNews.sourceName}</span>
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

                            <div className="px-4 py-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                     <Card className="bg-muted/30 border-border/50">
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2"><Timer className="h-5 w-5"/>Risk Window Analysis</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Event Type:</span><Badge variant="outline">{selectedNews.eventType}</Badge></div>
                                            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Impact Horizon:</span><Badge variant="outline">{getImpactHorizon(selectedNews.riskWindowMins)}</Badge></div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Volatility Risk Score: {selectedNews.volatilityRiskScore}</Label>
                                                <Progress value={selectedNews.volatilityRiskScore} indicatorClassName={cn(
                                                    selectedNews.volatilityRiskScore > 75 && "bg-red-500",
                                                    selectedNews.volatilityRiskScore > 50 && selectedNews.volatilityRiskScore <= 75 && "bg-amber-500",
                                                    selectedNews.volatilityRiskScore <= 50 && "bg-green-500",
                                                )} className="h-2 mt-1" />
                                            </div>
                                             <Separator className="my-3"/>
                                            <div className="space-y-2">
                                                <p className="text-xs text-muted-foreground">This event may increase market volatility.</p>
                                                <Button variant="outline" size="sm" className="w-full" onClick={() => onSetModule('cryptoVix')}>
                                                    <Gauge className="mr-2 h-4 w-4" />
                                                    Open EdgeCipher Crypto VIX (0-100)
                                                </Button>
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
                                            {selectedNews.impactedCoins.map(coin => (
                                                <Popover key={coin}>
                                                    <PopoverTrigger asChild>
                                                        <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10 hover:text-primary">{coin}</Badge>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start"
                                                            onClick={() => handleToggleFollow(coin)}
                                                        >
                                                            {followedCoins.includes(coin) ? 'Unfollow' : 'Follow'} {coin}
                                                        </Button>
                                                    </PopoverContent>
                                                </Popover>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
                                        <Button variant="outline" className="flex-1" onClick={() => handleToggleRead(selectedNews.id)}>
                                            <CheckCircle className={cn("mr-2 h-4 w-4", readNewsIds.includes(selectedNews.id) && "text-primary")} /> {readNewsIds.includes(selectedNews.id) ? 'Mark as Unread' : 'Mark as Read'}
                                        </Button>
                                        <Button variant="outline" className="flex-1" onClick={() => handleToggleSave(selectedNews.id)}>
                                            <Bookmark className={cn("mr-2 h-4 w-4", savedNewsIds.includes(selectedNews.id) && "text-primary fill-primary")} /> {savedNewsIds.includes(selectedNews.id) ? 'Unsave' : 'Save'}
                                        </Button>
                                         <Button variant="outline" className="flex-1" asChild>
                                            <a href={selectedNews.linkUrl || "#"} target="_blank" rel="noopener noreferrer">
                                                View Original Article <ArrowRight className="ml-2 h-4 w-4"/>
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-6">
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
                                    <Card className="bg-muted/30 border-border/50">
                                        <CardHeader>
                                            <CardTitle className="text-base">Related Intelligence</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {relatedNews.length > 0 ? relatedNews.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleNewsSelect(item)}
                                                    className="block w-full text-left p-2 rounded-md hover:bg-muted"
                                                >
                                                    <p className="text-sm font-medium text-foreground truncate">{item.headline}</p>
                                                    <p className="text-xs text-muted-foreground">{item.sourceName} &bull; <Badge variant="secondary" className="text-xs">{item.category}</Badge></p>
                                                </button>
                                            )) : (
                                                <p className="text-sm text-muted-foreground">No related items found.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}
