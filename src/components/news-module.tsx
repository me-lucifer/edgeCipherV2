
      "use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Filter, Clock, Loader2, ArrowRight, TrendingUp, Zap, Sparkles, Search, X, AlertTriangle, CheckCircle, Bookmark, Timer, Gauge, Star, Calendar, Copy, Clipboard, ThumbsUp, ThumbsDown, Meh, PlusCircle, MoreHorizontal, Save, Grid, Eye, Radio, RefreshCw, Layers, BarChart, FileText, ShieldAlert, Info } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow, isToday, isYesterday, differenceInHours } from 'date-fns';
import type { VixState } from "@/hooks/use-risk-state";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";


interface NewsModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

type Sentiment = "Positive" | "Negative" | "Neutral";
type VolatilityImpact = "Low" | "Medium" | "High";
type NewsCategory = "Regulatory" | "Macro" | "Exchange" | "ETF" | "Liquidations" | "Altcoins" | "Security" | "Tech";
type PersonaType = "Impulsive Sprinter" | "Fearful Analyst" | "Disciplined Scalper" | "Beginner";
type EventType = "Scheduled" | "Breaking" | "Developing";
type SourceTier = 'A' | 'B' | 'C';

export type NewsItem = {
    id: string;
    headline: string;
    sourceName: string;
    sourceTier: SourceTier;
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

type StoryCluster = {
    type: 'cluster';
    id: string;
    primary: NewsItem;
    related: NewsItem[];
    category: NewsCategory;
    sentiment: Sentiment;
    impact: VolatilityImpact;
};

type DisplayItem = NewsItem | StoryCluster;


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

const summaryBulletPool = [
    "The analysis emphasizes risk management and adherence to pre-defined trading plans, not speculation.",
    "This development could influence transaction fees but does not constitute a direct trading signal.",
    "The event is correlated with a short-term increase in market volatility; review risk parameters.",
    "A new date for an upcoming protocol upgrade has been confirmed by the core development team.",
    "The announcement has sparked debate on the future of decentralized finance regulation among policymakers.",
    "On-chain data indicates a shift in capital flows following the news. This is an observation, not a predictive signal.",
    "The incident raises concerns about network security and the safety of user funds. Review your own security practices.",
    "The report outlines a multi-year roadmap for protocol development and ecosystem growth.",
    "This change is projected to affect staking rewards for token holders in the upcoming epoch.",
    "A new governance proposal has been submitted for community review and voting; the outcome is uncertain."
];


const mockNewsSource: Omit<NewsItem, 'riskWindowMins' | 'eventType' | 'volatilityRiskScore' | 'arjunMeaning' | 'recommendedAction'>[] = Array.from({ length: 25 }, (_, i) => {
    const categories: NewsCategory[] = ["Regulatory", "Macro", "Exchange", "ETF", "Liquidations", "Altcoins", "Security", "Tech"];
    const sentiments: Sentiment[] = ["Positive", "Negative", "Neutral"];
    
    const sourceTiers: Record<string, SourceTier> = {
        "Blocksource": 'A', "CryptoWire": 'A', "The Defiant": 'A', "ETF Weekly": 'B',
        "Liquidations.info": 'B', "ExchangeWire": 'A', "MacroScope": 'A', "DeFi Pulse": 'B',
        "Binance Blog": 'B', "Asia Crypto Today": 'C'
    };
    const sources = Object.keys(sourceTiers);

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
    
    const headline = randomElement(headlines);
    const lowerHeadline = headline.toLowerCase();

    // Smart coin parsing
    const impactedCoinsSet = new Set<string>();
    if (lowerHeadline.includes('btc') || lowerHeadline.includes('bitcoin')) impactedCoinsSet.add('BTC');
    if (lowerHeadline.includes('eth') || lowerHeadline.includes('ethereum') || lowerHeadline.includes('layer-2')) impactedCoinsSet.add('ETH');
    if (lowerHeadline.includes('sol') || lowerHeadline.includes('solana')) impactedCoinsSet.add('SOL');
    if (lowerHeadline.includes('etf') && lowerHeadline.includes('bitcoin')) impactedCoinsSet.add('BTC');
    
    // Add some random coins for variety
    const randomNumberOfCoins = Math.floor(Math.random() * 3); // 0 to 2 random coins
    for(let j=0; j<randomNumberOfCoins; j++) {
        impactedCoinsSet.add(randomElement(coins));
    }
    // Ensure there's at least one coin if none were parsed
    if (impactedCoinsSet.size === 0) {
        impactedCoinsSet.add(randomElement(coins));
    }


    const numBullets = Math.random() < 0.7 ? 2 : 3;
    const shuffledBullets = [...summaryBulletPool].sort(() => 0.5 - Math.random());
    const summaryBullets = shuffledBullets.slice(0, numBullets);
    
    const sourceName = randomElement(sources);

    return {
        id: `${Date.now()}-${i}`,
        headline: headline,
        sourceName: sourceName,
        sourceTier: sourceTiers[sourceName],
        publishedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 3).toISOString(),
        summaryBullets,
        sentiment: randomElement(sentiments),
        volatilityImpact: randomImpact(),
        impactedCoins: Array.from(impactedCoinsSet),
        category: randomElement(categories),
        linkUrl: "#"
    };
});

type VixZone = "Extremely Calm" | "Normal" | "Volatile" | "High Volatility" | "Extreme";

const postureSuggestions: Record<VixZone, Record<PersonaType, { meaning: string; action: string }>> = {
    "Extremely Calm": {
        "Impulsive Sprinter": { meaning: "Low volatility can lead to impatience and forced trades. Adherence to your plan is key.", action: "Do not invent setups; wait for the market to present a clear opportunity." },
        "Fearful Analyst": { meaning: "These conditions are ideal for building confidence without excessive market noise. Focus on analysis.", action: "Focus on planning and analysis, not forced execution." },
        "Disciplined Scalper": { meaning: "Range-bound strategies may perform well, but be wary of choppy price action eroding small gains.", action: "Execute your plan, but protect your capital from chop." },
        "Beginner": { meaning: "This is the ideal environment to study market structure without high risk. Observe and learn, do not trade aggressively.", action: "Today is for learning and observation, not for aggressive trading." },
    },
    "Normal": {
        "Impulsive Sprinter": { meaning: "Even in normal conditions, impatience can lead to rule-breaking. The goal is consistent execution.", action: "Follow your plan without exception; no adding to losers or revenge trading." },
        "Fearful Analyst": { meaning: "The market is providing favorable conditions for well-planned trades. Trust your analysis.", action: "Trust your analysis and execute your A+ setups with confidence." },
        "Disciplined Scalper": { meaning: "These are your prime conditions. The market has direction but isn't overly chaotic. Your edge is sharpest now.", action: "Execute your A+ setups without hesitation and adhere to your rules." },
        "Beginner": { meaning: "This is a good environment to practice. Focus on executing one or two simple setups with a minimal, controlled position size.", action: "Practice disciplined execution with a minimal position size." },
    },
    "Volatile": {
        "Impulsive Sprinter": { meaning: "This is a danger zone. Volatility feels like opportunity, but it's where impulsive errors are most costly.", action: "Cut position size by 50%. Wait for crystal-clear A+ setups." },
        "Fearful Analyst": { meaning: "Analysis is difficult in choppy markets. It is acceptable to sit out. A flat day is a winning day.", action: "If you are not 100% confident in a setup, the best trade is no trade." },
        "Disciplined Scalper": { meaning: "Your strategy is at high risk. Wider wicks can invalidate setups. Adapt or wait.", action: "Adapt your parameters for volatility or wait for calmer conditions." },
        "Beginner": { meaning: "This is a 'sit on your hands' day. Watching the chaos from the sidelines is a valuable lesson.", action: "Observe the market; do not participate. Preserve your capital." },
    },
    "High Volatility": {
        "Impulsive Sprinter": { meaning: "This is a red alert. The market is erratic. Trading now is gambling, not executing an edge.", action: "Your only job today is to protect your capital by not trading." },
        "Fearful Analyst": { meaning: "Your analysis is unreliable in these conditions. Pros are waiting on the sidelines, and so should you.", action: "Stay flat. Pros are waiting, and so should you." },
        "Disciplined Scalper": { meaning: "Your edge does not exist here. The noise is too high. Stepping aside is the highest form of discipline.", action: "Cash is the strongest position right now. Preserve your capital." },
        "Beginner": { meaning: "This is where new traders lose accounts. Do not trade. Your only job is to watch and learn.", action: "Do not trade. Your goal is to survive to trade another day." },
    },
    "Extreme": {
        "Impulsive Sprinter": { meaning: "Catastrophic risk is present. Close your platform and walk away.", action: "DO NOT TRADE. The only trade that matters is protecting your account." },
        "Fearful Analyst": { meaning: "The market is irrational. Your analysis does not apply. Trust your fear and stay flat.", action: "Stay flat. This is a spectator sport right now." },
        "Disciplined Scalper": { meaning: "There is no edge here. The market is in a state of cascading liquidations. Any position is a gamble.", action: "Stay flat. There is no trading edge in a liquidation cascade." },
        "Beginner": { meaning: "DO NOT TRADE. DANGER. This is where new traders lose accounts.", action: "Observe the chaos from the sidelines. Survive to trade another day." },
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
const NEWS_DAY_SIGNAL_KEY = "ec_news_day_signal";
const NEWS_TOP_COINS_KEY = "ec_news_top_coins_today";
const NEWS_TTL_MS = 5 * 60 * 1000; // 5 minutes

const READ_IDS_KEY = "ec_news_read_ids";
const SAVED_IDS_KEY = "ec_news_saved_ids";
const FOLLOWED_COINS_KEY = "ec_followed_coins";
const PRESETS_KEY = "ec_news_filter_presets";
const LAST_PRESET_KEY = "ec_news_last_preset_id";
const WATCH_REGULATORY_KEY = "ec_watch_regulatory";
const WATCH_EXCHANGE_KEY = "ec_watch_exchange";
const BREAKING_MODE_KEY = "ec_news_breaking_mode";
const REGULATORY_MODE_KEY = "ec_news_regulatory_mode";
const EXCHANGE_MODE_KEY = "ec_news_exchange_mode";


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

function ActiveRiskWindowsCard({ newsItems, onNewsSelect, onSetWarning }: { newsItems: NewsItem[], onNewsSelect: (item: NewsItem) => void, onSetWarning: (item: NewsItem) => void }) {
    const [activeWindows, setActiveWindows] = useState<NewsItem[]>([]);

    useEffect(() => {
        const updateWindows = () => {
            const now = new Date().getTime();
            const active = newsItems
                .filter(item => item.riskWindowMins > 0)
                .filter(item => {
                    const expiresAt = new Date(item.publishedAt).getTime() + item.riskWindowMins * 60 * 1000;
                    return expiresAt > now;
                })
                .sort((a,b) => (new Date(a.publishedAt).getTime() + a.riskWindowMins * 60000) - (new Date(b.publishedAt).getTime() + b.riskWindowMins * 60000));
            
            setActiveWindows(active);
        };
        
        updateWindows();
        const interval = setInterval(updateWindows, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [newsItems]);

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Timer className="h-5 w-5" /> Active Risk Windows</CardTitle>
                <CardDescription className="text-xs">Time-sensitive events to be aware of.</CardDescription>
            </CardHeader>
            <CardContent>
                {activeWindows.length > 0 ? (
                    <div className="space-y-4">
                        {activeWindows.slice(0, 3).map(item => {
                             const expiresAt = new Date(item.publishedAt).getTime() + item.riskWindowMins * 60 * 1000;
                            return (
                                <div key={item.id} className="p-3 bg-muted rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-sm text-foreground truncate pr-2">{item.headline}</p>
                                        <Badge variant="outline" className={cn(
                                            item.volatilityImpact === 'High' && 'border-red-500/50 text-red-400',
                                            item.volatilityImpact === 'Medium' && 'border-amber-500/50 text-amber-400',
                                        )}>{item.volatilityImpact}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Time left: <span className="font-semibold">{formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}</span></p>
                                    <div className="flex gap-2 mt-3">
                                        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => onNewsSelect(item)}>Open Item</Button>
                                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onSetWarning(item)}>Set as Warning</Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">No active risk windows currently.</p>
                )}
            </CardContent>
        </Card>
    );
}

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

function IntelligenceBriefCard({ allNews, filteredNews }: { allNews: NewsItem[], filteredNews: NewsItem[] }) {
    const [view, setView] = useState<'filtered' | 'global'>('filtered');

    const sentimentData = useMemo(() => {
        const calculateMetrics = (items: NewsItem[]) => {
            const now = new Date();
            const relevantItems = items.filter(item => new Date(item.publishedAt).getTime() > now.getTime() - 24 * 60 * 60 * 1000);
            
            if (relevantItems.length === 0) {
                return {
                    mood: 'Neutral',
                    distribution: { Positive: 0, Negative: 0, Neutral: 100 },
                    confidence: 'Low',
                    topRisks: ["No recent news to analyze."]
                };
            }

            const sentimentCounts = { Positive: 0, Negative: 0, Neutral: 0 };
            relevantItems.forEach(item => {
                sentimentCounts[item.sentiment]++;
            });
            const total = relevantItems.length;
            const distribution = {
                Positive: (sentimentCounts.Positive / total) * 100,
                Negative: (sentimentCounts.Negative / total) * 100,
                Neutral: (sentimentCounts.Neutral / total) * 100,
            };

            const score = distribution.Positive - distribution.Negative;
            const mood = score > 20 ? 'Bullish' : score < -20 ? 'Bearish' : 'Neutral';

            const confidence = total < 5 ? 'Low' : total < 15 ? 'Medium' : 'High';
            
            const topRisks = relevantItems
                .filter(item => item.sentiment === 'Negative' || item.volatilityImpact === 'High')
                .sort((a, b) => b.volatilityRiskScore - a.volatilityRiskScore)
                .slice(0, 3)
                .map(item => item.headline);

            if (topRisks.length === 0) topRisks.push("No significant risk drivers detected.");

            return { mood, distribution, confidence, topRisks };
        };

        return {
            filtered: calculateMetrics(filteredNews),
            global: calculateMetrics(allNews),
        };
    }, [allNews, filteredNews]);
    
    const data = sentimentData[view];
    const { mood, distribution, confidence, topRisks } = data;
    
    const moodConfig = {
        Bullish: { icon: ThumbsUp, color: 'text-green-400' },
        Neutral: { icon: Meh, color: 'text-muted-foreground' },
        Bearish: { icon: ThumbsDown, color: 'text-red-400' },
    };
    const { icon: MoodIcon, color: moodColor } = moodConfig[mood];

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Intelligence Brief</CardTitle>
                    <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                        <Button
                            size="sm"
                            variant={view === 'filtered' ? 'secondary' : 'ghost'}
                            onClick={() => setView('filtered')}
                            className="rounded-full h-8 px-3 text-xs"
                        >
                            Filtered View
                        </Button>
                        <Button
                            size="sm"
                            variant={view === 'global' ? 'secondary' : 'ghost'}
                            onClick={() => setView('global')}
                            className="rounded-full h-8 px-3 text-xs"
                        >
                            Global View
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className={cn("flex items-center gap-2 text-lg font-bold", moodColor)}>
                            <MoodIcon className="h-5 w-5" />
                            <span>Market Mood: {mood}</span>
                        </div>
                        <Badge variant="outline">Confidence: {confidence}</Badge>
                    </div>
                    <div>
                        <div className="flex w-full h-2 rounded-full overflow-hidden bg-muted">
                            <div className="bg-green-500" style={{ width: `${distribution.Positive}%` }} />
                            <div className="bg-gray-500" style={{ width: `${distribution.Neutral}%` }} />
                            <div className="bg-red-500" style={{ width: `${distribution.Negative}%` }} />
                        </div>
                        <div className="flex justify-between text-xs mt-1.5">
                            <span className="text-green-400">{distribution.Positive.toFixed(0)}% Pos</span>
                            <span className="text-muted-foreground">{distribution.Neutral.toFixed(0)}% Neu</span>
                            <span className="text-red-400">{distribution.Negative.toFixed(0)}% Neg</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-2 p-4 bg-muted rounded-lg border">
                    <h4 className="text-sm font-semibold text-muted-foreground">Top Risks Today</h4>
                    <ul className="space-y-1 list-disc list-inside text-xs text-foreground">
                        {topRisks.map((risk, i) => <li key={i} className="truncate">{risk}</li>)}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}

function VolatilityRiskCard({ newsItems }: { newsItems: NewsItem[] }) {
    const { score, distribution, level, isNewsDrivenDay, topReasons, mood } = useMemo(() => {
        if (newsItems.length === 0) {
            return {
                score: 0,
                distribution: { High: 0, Medium: 0, Low: 100 },
                level: 'Low',
                isNewsDrivenDay: false,
                topReasons: [],
                mood: 'Neutral' as 'Neutral',
            };
        }

        let rawScore = 0;
        const counts = { High: 0, Medium: 0, Low: 0 };
        const sentimentCounts = { Positive: 0, Negative: 0, Neutral: 0 };
        let highImpactCount = 0;

        newsItems.forEach(item => {
            counts[item.volatilityImpact]++;
            sentimentCounts[item.sentiment]++;
            if (item.volatilityImpact === 'High') highImpactCount++;
            let itemScore = 0;
            if (item.volatilityImpact === 'High') itemScore = 100;
            if (item.volatilityImpact === 'Medium') itemScore = 50;
            if (item.volatilityImpact === 'Low') itemScore = 10;

            if (item.sentiment === 'Negative') itemScore *= 1.2;
            if (['Regulatory', 'Macro', 'Liquidations'].includes(item.category)) {
                itemScore *= 1.3;
            }
            rawScore += itemScore;
        });
        
        const total = newsItems.length;
        const sentimentDistribution = {
            Positive: (sentimentCounts.Positive / total) * 100,
            Negative: (sentimentCounts.Negative / total) * 100,
            Neutral: (sentimentCounts.Neutral / total) * 100,
        };
        const sentimentScore = sentimentDistribution.Positive - sentimentDistribution.Negative;
        const mood = sentimentScore > 20 ? 'Bullish' : sentimentScore < -20 ? 'Bearish' : 'Neutral';

        const score = Math.min(100, Math.round(rawScore / newsItems.length));
        
        const distribution = {
            High: (counts.High / total) * 100,
            Medium: (counts.Medium / total) * 100,
            Low: (counts.Low / total) * 100,
        };

        const level = score > 75 ? 'High' : score > 40 ? 'Medium' : 'Low';
        const isNewsDrivenDay = highImpactCount >= 3 || score >= 70;
        const topReasons = newsItems
            .filter(item => item.volatilityImpact === 'High' || item.sentiment === 'Negative')
            .sort((a, b) => b.volatilityRiskScore - a.volatilityRiskScore)
            .slice(0, 3)
            .map(item => item.headline);

        return { score, distribution, level, isNewsDrivenDay, topReasons, mood };
    }, [newsItems]);

    // Side effect to update global state
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                // Update VIX component
                const vixStateString = localStorage.getItem(VIX_CACHE_KEY);
                if (vixStateString) {
                    const vixState: VixState = JSON.parse(vixStateString);
                    const newsSentimentScore = Math.round(50 + (score / -2)); // Invert score
                    
                    if (vixState.components.newsSentimentScore !== newsSentimentScore) {
                        vixState.components.newsSentimentScore = newsSentimentScore;
                        vixState.components.newsMood = mood;
                        localStorage.setItem(VIX_CACHE_KEY, JSON.stringify(vixState));
                        window.dispatchEvent(new StorageEvent('storage', { key: VIX_CACHE_KEY }));
                    }
                }

                // Update News Day Signal
                const newsDaySignal = {
                    isNewsDrivenDay,
                    score,
                    topReasons,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(NEWS_DAY_SIGNAL_KEY, JSON.stringify(newsDaySignal));
                window.dispatchEvent(new StorageEvent('storage', { key: NEWS_DAY_SIGNAL_KEY }));

            } catch (e) {
                console.error("Failed to update global news state", e);
            }
        }
    }, [score, isNewsDrivenDay, topReasons, mood]);
    
    const levelConfig = {
        High: { label: 'High', color: 'text-red-400' },
        Medium: { label: 'Medium', color: 'text-amber-400' },
        Low: { label: 'Low', color: 'text-green-400' },
    };
    const { label, color } = levelConfig[level];

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Volatility Risk
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground/80 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">This score is a VIX driver. It's calculated from the impact and sentiment of the active news feed.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className={cn("flex items-center gap-2 text-lg font-bold", color)}>
                        <span>Risk Level: {label}</span>
                    </div>
                    <div className="font-mono text-3xl font-bold text-foreground">{score}</div>
                </div>
                 <div>
                    <div className="flex w-full h-2 rounded-full overflow-hidden bg-muted">
                        <div className="bg-red-500" style={{ width: `${distribution.High}%` }} />
                        <div className="bg-amber-500" style={{ width: `${distribution.Medium}%` }} />
                        <div className="bg-green-500" style={{ width: `${distribution.Low}%` }} />
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                        <span className="text-red-400">{distribution.High.toFixed(0)}% High</span>
                        <span className="text-amber-400">{distribution.Medium.toFixed(0)}% Med</span>
                        <span className="text-green-400">{distribution.Low.toFixed(0)}% Low</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function WatchlistCard({ followedCoins, onFilter, filters, setWatchRegulatory, watchRegulatory, setWatchExchange, watchExchange }: { followedCoins: string[]; onFilter: (key: keyof NewsFilters, value: any) => void; filters: NewsFilters; watchRegulatory: boolean; setWatchRegulatory: (val: boolean) => void; watchExchange: boolean; setWatchExchange: (val: boolean) => void; }) {

    const handleTopicClick = (category: NewsCategory) => {
        onFilter('category', filters.category === category ? 'All' : category);
    };

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Star className="h-5 w-5" /> Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="coins" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="coins">Coins</TabsTrigger>
                        <TabsTrigger value="topics">Topics</TabsTrigger>
                    </TabsList>
                    <TabsContent value="coins" className="pt-4">
                        {followedCoins.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {followedCoins.map(coin => (
                                    <Button
                                        key={coin}
                                        variant={filters.coins.includes(coin) ? 'secondary' : 'outline'}
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => onFilter('coins', filters.coins.includes(coin) ? [] : [coin])}
                                    >
                                        {coin}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No followed coins. Click a coin in a news item to follow it.
                            </p>
                        )}
                    </TabsContent>
                    <TabsContent value="topics" className="pt-4 space-y-2">
                        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                            <Label htmlFor="watch-regulatory" className="text-sm">Regulatory News</Label>
                            <Switch id="watch-regulatory" checked={watchRegulatory} onCheckedChange={setWatchRegulatory} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                            <Label htmlFor="watch-exchange" className="text-sm">Exchange News</Label>
                            <Switch id="watch-exchange" checked={watchExchange} onCheckedChange={setWatchExchange} />
                        </div>
                        <div className="pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                    const categories: NewsCategory[] = [];
                                    if (watchRegulatory) categories.push('Regulatory');
                                    if (watchExchange) categories.push('Exchange');
                                    handleTopicClick(categories.length > 0 ? categories[0] : 'All'); // Simplified for now
                                }}
                                disabled={!watchRegulatory && !watchExchange}
                            >
                                Apply Watched Topics
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

const impactOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
type ImpactLevel = keyof typeof impactOrder;

function TopImpactedCoinsCard({ newsItems, onFilter, onCoinClick }: { newsItems: NewsItem[]; onFilter: (key: keyof NewsFilters, value: any) => void; onCoinClick: (coin: string) => void; }) {
    const topCoins = useMemo(() => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const coinCounts: Record<string, { count: number; highestImpact: ImpactLevel }> = {};

        newsItems.forEach(item => {
            if (new Date(item.publishedAt) < twentyFourHoursAgo) return;

            item.impactedCoins.forEach(coin => {
                if (!coinCounts[coin]) {
                    coinCounts[coin] = { count: 0, highestImpact: 'Low' };
                }
                coinCounts[coin].count++;
                if (impactOrder[item.volatilityImpact] > impactOrder[coinCounts[coin].highestImpact]) {
                    coinCounts[coin].highestImpact = item.volatilityImpact;
                }
            });
        });

        return Object.entries(coinCounts)
            .map(([coin, data]) => ({ coin, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [newsItems]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(NEWS_TOP_COINS_KEY, JSON.stringify(topCoins));
            } catch (e) {
                console.error("Failed to save top coins to localStorage", e);
            }
        }
    }, [topCoins]);

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Top Impacted Coins (24h)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {topCoins.map(({ coin, count, highestImpact }) => (
                        <div key={coin} className="flex items-center justify-between">
                            <Button
                                variant="link"
                                className="p-0 h-auto font-semibold text-foreground"
                                onClick={() => onCoinClick(coin)}
                            >
                                {coin}
                            </Button>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{count} mentions</span>
                                <Badge variant="outline" className={cn(
                                    highestImpact === 'High' && 'border-red-500/50 text-red-400',
                                    highestImpact === 'Medium' && 'border-amber-500/50 text-amber-400',
                                    highestImpact === 'Low' && 'border-green-500/50 text-green-400'
                                )}>
                                    {highestImpact}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function CategoryHeatmapCard({
    newsItems,
    onCellClick,
}: {
    newsItems: NewsItem[];
    onCellClick: (category: NewsCategory, impact: VolatilityImpact) => void;
}) {
    const categories: NewsCategory[] = [
        "Regulatory",
        "Macro",
        "Exchange",
        "ETF",
        "Liquidations",
        "Security",
        "Altcoins",
        "Tech",
    ];
    const impacts: VolatilityImpact[] = ["Low", "Medium", "High"];

    const heatmapData = useMemo(() => {
        const data = new Map<NewsCategory, Record<VolatilityImpact, number>>();
        categories.forEach(cat => data.set(cat, { Low: 0, Medium: 0, High: 0 }));

        newsItems.forEach(item => {
            const categoryData = data.get(item.category);
            if (categoryData) {
                categoryData[item.volatilityImpact]++;
            }
        });
        return data;
    }, [newsItems]);

    const maxCount = useMemo(() => {
        let max = 0;
        heatmapData.forEach(impacts => {
            Object.values(impacts).forEach(count => {
                if (count > max) max = count;
            });
        });
        return max || 1; // Avoid division by zero
    }, [heatmapData]);

    const getCellColor = (count: number) => {
        if (count === 0) return 'bg-muted/30';
        const opacity = Math.min(1, 0.2 + (count / maxCount) * 0.8);
        return `bg-primary/10 border-primary/20`; // Simplified color
    };

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Grid className="h-5 w-5" />News Telemetry Heatmap</CardTitle>
                <CardDescription>Volume of news by category and impact. Click a cell to filter.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-px" style={{ gridTemplateColumns: 'auto repeat(3, 1fr)' }}>
                    <div />
                    {impacts.map(impact => (
                        <div key={impact} className="text-center text-xs font-semibold text-muted-foreground pb-2">{impact}</div>
                    ))}
                    {categories.map(category => (
                        <React.Fragment key={category}>
                            <div className="text-xs text-muted-foreground text-right pr-2 py-2 flex items-center justify-end">{category}</div>
                            {impacts.map(impact => {
                                const count = heatmapData.get(category)?.[impact] || 0;
                                return (
                                    <div
                                        key={impact}
                                        onClick={() => onCellClick(category, impact)}
                                        className={cn(
                                            "h-12 flex items-center justify-center rounded-md cursor-pointer transition-colors hover:border-primary",
                                            "border",
                                            count > 0 ? "border-primary/20" : "border-border/30",
                                            getCellColor(count),
                                        )}
                                        style={{ opacity: count > 0 ? 0.4 + (count / maxCount) * 0.6 : 0.4 }}
                                    >
                                        <span className="font-mono font-bold text-foreground">{count}</span>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function SentimentImpactMatrix({ newsItems, onCellClick }: { newsItems: NewsItem[]; onCellClick: (sentiment: Sentiment, impact: VolatilityImpact) => void; }) {
    const sentiments: Sentiment[] = ["Positive", "Neutral", "Negative"];
    const impacts: VolatilityImpact[] = ["Low", "Medium", "High"];

    const matrixData = useMemo(() => {
        const data: Record<Sentiment, Record<VolatilityImpact, number>> = {
            Positive: { Low: 0, Medium: 0, High: 0 },
            Neutral: { Low: 0, Medium: 0, High: 0 },
            Negative: { Low: 0, Medium: 0, High: 0 },
        };
        newsItems.forEach(item => {
            data[item.sentiment][item.volatilityImpact]++;
        });
        return data;
    }, [newsItems]);

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Eye className="h-5 w-5" /> Risk Smell Test</CardTitle>
                <CardDescription className="text-xs">Sentiment vs. Volatility Impact</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-px" style={{ gridTemplateColumns: 'auto repeat(3, 1fr)' }}>
                    <div />
                    {impacts.map(impact => (
                        <div key={impact} className="text-center text-xs font-semibold text-muted-foreground pb-2">{impact}</div>
                    ))}
                    {sentiments.map(sentiment => (
                        <React.Fragment key={sentiment}>
                            <div className="text-xs text-muted-foreground text-right pr-2 py-2 flex items-center justify-end">{sentiment}</div>
                            {impacts.map(impact => {
                                const count = matrixData[sentiment][impact];
                                const isHighRiskCell = sentiment === 'Negative' && impact === 'High';
                                return (
                                    <TooltipProvider key={impact}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    onClick={() => onCellClick(sentiment, impact)}
                                                    className={cn(
                                                        "h-12 flex items-center justify-center rounded-md cursor-pointer transition-colors hover:border-primary",
                                                        "border",
                                                        isHighRiskCell && count > 0 ? "bg-destructive/20 border-destructive" : "border-border/30",
                                                    )}
                                                >
                                                    <span className="font-mono font-bold text-foreground">{count}</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{count} items with {sentiment} sentiment and {impact} impact.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function VolatilityBriefCard({ newsItems, persona }: { newsItems: NewsItem[], persona: PersonaType | null }) {
    const { toast } = useToast();

    const { score, currentZone, topHeadlines, posture } = useMemo(() => {
        if (newsItems.length === 0) return { score: 0, currentZone: getVixZone(0), topHeadlines: [], posture: null };

        let rawScore = 0;
        newsItems.forEach(item => {
            let itemScore = 0;
            if (item.volatilityImpact === 'High') itemScore = 100;
            if (item.volatilityImpact === 'Medium') itemScore = 50;
            if (item.volatilityImpact === 'Low') itemScore = 10;
            if (item.sentiment === 'Negative') itemScore *= 1.2;
            rawScore += itemScore;
        });

        const score = Math.min(100, Math.round(rawScore / newsItems.length));
        const currentZone = getVixZone(score);

        const topHeadlines = newsItems
            .filter(item => item.volatilityImpact === 'High')
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
            .slice(0, 3);
            
        const p = persona || 'Beginner';
        const posture = postureSuggestions[currentZone]?.[p] || postureSuggestions.Normal[p];

        return { score, currentZone, topHeadlines, posture };
    }, [newsItems, persona]);


    const generateReportText = (short = false): string => {
        const title = `### Volatility Brief: ${new Date().toLocaleDateString()} ###`;
        const currentStatus = `News Risk Score: ${score} (${currentZone})`;
        
        if (short) {
            return `${title}\n${currentStatus}\n**Top Recommendation**: ${posture?.action || 'Review market conditions carefully.'}`;
        }

        const headlinesText = topHeadlines.map(h => `- ${h.headline}\n  - ${h.summaryBullets[0]}`).join('\n');

        return `
${title}

**Current Status**: ${currentStatus}

**Arjun's Recommended Stance**:
${posture?.action || 'Review market conditions carefully.'}
${posture ? `(Reason: ${posture.meaning})` : ''}

**Top High-Impact Headlines**:
${headlinesText || "- None"}
        `.trim();
    };

    const handleCopy = (short: boolean) => {
        navigator.clipboard.writeText(generateReportText(short));
        toast({ title: "Brief copied to clipboard!" });
    };

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clipboard className="h-5 w-5" /> Volatility Brief</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg border">
                    <p className="text-xs text-muted-foreground">News-driven Risk Score</p>
                    <p className="font-bold text-lg">{score} ({currentZone})</p>
                </div>
                 <div className="text-xs">
                    <p className="font-semibold text-muted-foreground mb-1">Arjun's Stance:</p>
                    <p className="italic text-muted-foreground">{posture?.action || "Select a persona for tailored advice."}</p>
                </div>
                 <div>
                    <p className="font-semibold text-muted-foreground text-xs mb-2">Top Headlines:</p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                       {topHeadlines.slice(0,3).map((item, i) => (
                           <li key={i} className="truncate">{item.headline}</li>
                       ))}
                    </ul>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                 <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCopy(true)}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Short
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCopy(false)}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Full
                </Button>
            </CardFooter>
        </Card>
    );
}

const HighlightMatches = ({ text, query }: { text: string; query: string }) => {
    if (!query) {
        return <>{text}</>;
    }
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <span key={i} className="underline decoration-primary decoration-2 underline-offset-2">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

function StoryClusterCard({ cluster, onNewsSelect, query }: { cluster: StoryCluster, onNewsSelect: (item: NewsItem) => void, query: string }) {
    const summaryBullets = [
        cluster.primary.summaryBullets[0],
        cluster.related[0]?.summaryBullets[0]
    ].filter(Boolean);

    return (
        <Collapsible>
            <Card className="bg-muted/40 border-primary/20 flex flex-col h-full">
                <CollapsibleTrigger asChild>
                    <div className="flex-1 cursor-pointer">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-base leading-tight pr-4 line-clamp-2">
                                     <HighlightMatches text={cluster.primary.headline} query={query} />
                                </CardTitle>
                                <Badge variant="outline" className="flex-shrink-0 bg-muted border-primary/20 text-primary">
                                    <Layers className="mr-2 h-3 w-3" />
                                    +{cluster.related.length} related
                                </Badge>
                            </div>
                            <CardDescription className="text-xs pt-1">
                                {cluster.primary.sourceName} &bull; {formatDistanceToNow(new Date(cluster.primary.publishedAt), { addSuffix: true })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-2">
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                    {summaryBullets.slice(0, 2).map((bullet, i) => bullet && <li key={i} className="line-clamp-2">{bullet}</li>)}
                                </ul>
                            </div>
                        </CardContent>
                    </div>
                </CollapsibleTrigger>
                <CardFooter className="flex-col items-start gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn(
                            'text-xs whitespace-nowrap',
                            cluster.sentiment === 'Positive' && 'bg-green-500/20 text-green-300 border-green-500/30',
                            cluster.sentiment === 'Negative' && 'bg-red-500/20 text-red-300 border-red-500/30',
                        )}>{cluster.sentiment}</Badge>
                        <Badge variant="outline" className={cn(
                            "text-xs",
                            cluster.impact === 'High' && 'border-red-500/50 text-red-400',
                            cluster.impact === 'Medium' && 'border-amber-500/50 text-amber-400',
                        )}>
                            <TrendingUp className="mr-1 h-3 w-3"/>
                            {cluster.impact} Impact
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{cluster.category}</Badge>
                    </div>
                </CardFooter>
                <CollapsibleContent>
                    <CardContent>
                        <div className="space-y-3">
                            {cluster.related.map(item => (
                                <div key={item.id} className="p-3 bg-muted/50 border rounded-md cursor-pointer hover:bg-muted" onClick={() => onNewsSelect(item)}>
                                    <p className="text-sm font-medium text-foreground line-clamp-1">{item.headline}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{item.sourceName} &bull; {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                     <CardFooter>
                        <Button variant="link" className="p-0 h-auto text-xs" onClick={() => onNewsSelect(cluster.primary)}>
                            View primary story details
                        </Button>
                    </CardFooter>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}

function CoinDetailDrawer({ coin, newsItems, followedCoins, onOpenChange, onSetModule, onToggleFollow }: { coin: string | null; newsItems: NewsItem[]; followedCoins: string[]; onOpenChange: (open: boolean) => void; onSetModule: (module: string, context?: any) => void; onToggleFollow: (coin: string) => void; }) {
    const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);

    useEffect(() => {
        if (coin) {
            setRelatedNews(
                newsItems
                .filter(item => item.impactedCoins.includes(coin))
                .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                .slice(0, 5)
            );
        }
    }, [coin, newsItems]);

    const { coinSentiment, coinNewsRiskScore } = useMemo(() => {
        if (relatedNews.length === 0) return { coinSentiment: { Positive: 0, Negative: 0, Neutral: 100 }, coinNewsRiskScore: 0 };
        
        let sentimentCounts = { Positive: 0, Negative: 0, Neutral: 0 };
        let riskScore = 0;

        relatedNews.forEach(item => {
            sentimentCounts[item.sentiment]++;
            if (item.volatilityImpact === 'High') riskScore += 25;
            if (item.volatilityImpact === 'Medium') riskScore += 10;
            if (item.sentiment === 'Negative') riskScore += 15;
        });

        const total = relatedNews.length;
        const coinSentiment = {
            Positive: (sentimentCounts.Positive / total) * 100,
            Negative: (sentimentCounts.Negative / total) * 100,
            Neutral: (sentimentCounts.Neutral / total) * 100,
        };

        const coinNewsRiskScore = Math.min(100, Math.round((riskScore / total) * (20 / relatedNews.length) * 10)); // Normalized score


        return { coinSentiment, coinNewsRiskScore };
    }, [relatedNews]);

    if (!coin) return null;

    return (
        <Drawer open={!!coin} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl">News for {coin}</DrawerTitle>
                        <DrawerDescription>A summary of recent news impacting {coin}.</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 py-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="font-semibold text-foreground">Latest Headlines</h3>
                            {relatedNews.length > 0 ? relatedNews.map(item => (
                                <Card key={item.id} className="bg-muted/30">
                                    <CardContent className="p-3">
                                        <p className="font-semibold text-sm leading-tight">{item.headline}</p>
                                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                                            <span>{item.sourceName} (Tier {item.sourceTier})</span>
                                            <span>&bull;</span>
                                            <span>{formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}</span>
                                            <Badge variant="outline" className={cn(
                                                item.volatilityImpact === 'High' && 'border-red-500/50 text-red-400',
                                                item.volatilityImpact === 'Medium' && 'border-amber-500/50 text-amber-400',
                                            )}>{item.volatilityImpact}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            )) : <p className="text-sm text-muted-foreground">No recent news found for {coin}.</p>}
                        </div>
                        <div className="space-y-6">
                             <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="text-base">{coin} News Risk Score</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-5xl font-bold font-mono">{coinNewsRiskScore}</p>
                                    <p className="text-sm text-muted-foreground">{getVixZone(coinNewsRiskScore)}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="text-base">Sentiment Mood</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div>
                                        <div className="flex w-full h-2 rounded-full overflow-hidden bg-muted">
                                            <div className="bg-green-500" style={{ width: `${coinSentiment.Positive}%` }} />
                                            <div className="bg-gray-500" style={{ width: `${coinSentiment.Neutral}%` }} />
                                            <div className="bg-red-500" style={{ width: `${coinSentiment.Negative}%` }} />
                                        </div>
                                        <div className="flex justify-between text-xs mt-1.5">
                                            <span className="text-green-400">{coinSentiment.Positive.toFixed(0)}% Pos</span>
                                            <span className="text-muted-foreground">{coinSentiment.Neutral.toFixed(0)}% Neu</span>
                                            <span className="text-red-400">{coinSentiment.Negative.toFixed(0)}% Neg</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="text-base">Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                     <Button className="w-full" variant="outline" onClick={() => onToggleFollow(coin)}>
                                        <Star className={cn("mr-2 h-4 w-4", followedCoins.includes(coin) && "fill-primary text-primary")} />
                                        {followedCoins.includes(coin) ? `Unfollow ${coin}` : `Follow ${coin}`}
                                    </Button>
                                    <Button className="w-full" variant="outline" onClick={() => onSetModule('chart', { planContext: { instrument: `${coin}-PERP` } })}>
                                        <BarChart className="mr-2 h-4 w-4" />
                                        Open Chart
                                    </Button>
                                    <Button className="w-full" onClick={() => onSetModule('tradePlanning', { planContext: { instrument: `${coin}-PERP` } })}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Send to Trade Planning
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

export function NewsModule({ onSetModule }: NewsModuleProps) {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
    const [filters, setFilters] = useState<NewsFilters>({
        search: '',
        sentiment: 'All',
        highImpactOnly: false,
        category: 'All',
        coins: [],
        sortBy: 'newest',
        followedOnly: false,
    });
    const [activeList, setActiveTab] = useState<'all' | 'saved' | 'read'>('all');
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
    const [watchRegulatory, setWatchRegulatory] = useState(false);
    const [watchExchange, setWatchExchange] = useState(false);
    const [isBreakingMode, setIsBreakingMode] = useState(false);
    const [isRegulatoryMode, setIsRegulatoryMode] = useState(false);
    const [isExchangeMode, setIsExchangeMode] = useState(false);
    const [selectedCoinForDrawer, setSelectedCoinForDrawer] = useState<string | null>(null);


    const allCategories = useMemo(() => ['All', ...[...new Set(mockNewsSource.map(item => item.category))]], []);
    const popularCoins = ["BTC", "ETH", "SOL", "BNB", "XRP"];

    const loadNews = useCallback((forceRefresh = false) => {
        setIsLoading(true);
        try {
            const storedData = localStorage.getItem(NEWS_CACHE_KEY);
            if (storedData && !forceRefresh) {
                const cachedData = JSON.parse(storedData);
                const isExpired = new Date().getTime() - new Date(cachedData.lastFetchedAt).getTime() > NEWS_TTL_MS;
                if (!isExpired) {
                    setNewsItems(cachedData.items);
                    setLastFetchedAt(cachedData.lastFetchedAt);
                    setIsLoading(false);
                    return;
                }
            }

            // If cache is expired or doesn't exist, regenerate
            setTimeout(() => {
                const newItems = [...mockNewsSource].sort(() => 0.5 - Math.random()).map(item => {
                    const riskWindow = getRiskWindow(item.category, item.volatilityImpact);
                    const personaInsight = getPersonaInsight({ ...item, ...riskWindow }, persona);
                    return { 
                        ...item, 
                        ...riskWindow,
                        arjunMeaning: personaInsight.meaning,
                        recommendedAction: personaInsight.action,
                     };
                });

                const newCache = {
                    items: newItems,
                    lastFetchedAt: new Date().toISOString(),
                };
                localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(newCache));
                setNewsItems(newItems);
                setLastFetchedAt(newCache.lastFetchedAt);

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
                    vixState.components.newsSentimentScore = 50; // Reset on new fetch
                    localStorage.setItem(VIX_CACHE_KEY, JSON.stringify(vixState));
                    window.dispatchEvent(new StorageEvent('storage', { key: VIX_CACHE_KEY }));
                }

                setIsLoading(false);
                toast({ title: 'Intelligence Refreshed', description: 'The latest news feed has been loaded.' });
            }, 800);

        } catch (error) {
            console.error("Failed to load or cache news data:", error);
            setNewsItems([]);
            setIsLoading(false);
        }
    }, [toast, persona]);
    
    const handleSimulateShock = () => {
        try {
            const shockItems: NewsItem[] = [
                {
                    id: `shock-${Date.now()}-1`,
                    headline: "BREAKING: US Treasury announces emergency measures targeting self-custody crypto wallets",
                    sourceName: "Blocksource",
                    sourceTier: 'A',
                    publishedAt: new Date().toISOString(),
                    summaryBullets: ["Treasury statement hints at potential for new, stricter KYC/AML regulations for decentralized protocols.", "Market reacts with immediate sell-off across major assets."],
                    sentiment: "Negative",
                    volatilityImpact: "High",
                    impactedCoins: ["BTC", "ETH", "USDC"],
                    category: "Regulatory",
                    eventType: "Breaking",
                    riskWindowMins: 240,
                    volatilityRiskScore: 95,
                    arjunMeaning: "This is a significant market-moving event. The risk of unpredictable, cascading price action is extremely high.",
                    recommendedAction: "Cease all new trade planning. Protect capital. Wait for clarity.",
                },
                {
                    id: `shock-${Date.now()}-2`,
                    headline: "Reports of major exchange halting withdrawals due to technical issues",
                    sourceName: "CryptoWire",
                    sourceTier: 'A',
                    publishedAt: new Date().toISOString(),
                    summaryBullets: ["The exchange has confirmed they are investigating 'system irregularities' but has not given an ETA for a fix.", "This event adds to market uncertainty and may cause contagion fear."],
                    sentiment: "Negative",
                    volatilityImpact: "High",
                    impactedCoins: ["BTC", "ETH"],
                    category: "Exchange",
                    eventType: "Breaking",
                    riskWindowMins: 120,
                    volatilityRiskScore: 90,
                    arjunMeaning: "An exchange outage during a volatile period introduces execution risk and can exacerbate price swings.",
                    recommendedAction: "Avoid trading on affected exchanges. Be aware of potential for wider market impact."
                }
            ];

            // 1. Inject news
            setNewsItems(prev => [...shockItems, ...prev]);
            const newCache = { items: [ ...shockItems, ...newsItems ], lastFetchedAt: new Date().toISOString() };
            localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(newCache));

            // 2. Push VIX up
            const vixStateString = localStorage.getItem(VIX_CACHE_KEY);
            if (vixStateString) {
                const vixState = JSON.parse(vixStateString);
                const newVixValue = Math.min(100, vixState.value + 20 + Math.random() * 10);
                vixState.value = newVixValue;
                vixState.zoneLabel = getVixZone(newVixValue);
                vixState.components.newsSentimentScore = 20; // More bearish
                vixState.components.newsMood = 'Bearish';
                localStorage.setItem(VIX_CACHE_KEY, JSON.stringify(vixState));
                window.dispatchEvent(new StorageEvent('storage', { key: VIX_CACHE_KEY }));
            }
            
            // 3. Add risk event
            const riskEventsString = localStorage.getItem('ec_risk_events_today');
            const riskEvents = riskEventsString ? JSON.parse(riskEventsString) : [];
            const newEvent = {
                time: format(new Date(), "HH:mm"),
                description: "Regime shift likely due to breaking news shock.",
                level: 'red'
            };
            localStorage.setItem('ec_risk_events_today', JSON.stringify([...riskEvents, newEvent]));
             window.dispatchEvent(new StorageEvent('storage', { key: 'ec_risk_events_today' }));

            toast({
                title: "News Shock Simulated",
                description: "High-impact news injected, VIX increased. Check Risk Center.",
                variant: 'destructive',
            });
            setActiveTab('all');
            setFilters(prev => ({...prev, search: 'BREAKING'}));
        } catch (e) {
            console.error("Failed to simulate news shock:", e);
            toast({ title: "Simulation failed", variant: "destructive" });
        }
    };

    useEffect(() => {
        loadNews();

        try {
            const storedReadIds = localStorage.getItem(READ_IDS_KEY);
            const storedSavedIds = localStorage.getItem(SAVED_IDS_KEY);
            const storedFollowedCoins = localStorage.getItem(FOLLOWED_COINS_KEY);
            const storedPresets = localStorage.getItem(PRESETS_KEY);
            const lastPresetId = localStorage.getItem(LAST_PRESET_KEY);
            const storedWatchRegulatory = localStorage.getItem(WATCH_REGULATORY_KEY);
            const storedWatchExchange = localStorage.getItem(WATCH_EXCHANGE_KEY);
            const storedBreakingMode = localStorage.getItem(BREAKING_MODE_KEY);
            const storedRegulatoryMode = localStorage.getItem(REGULATORY_MODE_KEY);
            const storedExchangeMode = localStorage.getItem(EXCHANGE_MODE_KEY);
            
            if (storedReadIds) setReadNewsIds(JSON.parse(storedReadIds));
            if (storedSavedIds) setSavedNewsIds(JSON.parse(storedSavedIds));
            if (storedFollowedCoins) setFollowedCoins(JSON.parse(storedFollowedCoins));
            if (storedWatchRegulatory) setWatchRegulatory(JSON.parse(storedWatchRegulatory));
            if (storedWatchExchange) setWatchExchange(JSON.parse(storedWatchExchange));
            if (storedBreakingMode) setIsBreakingMode(JSON.parse(storedBreakingMode));
            if (storedRegulatoryMode) setIsRegulatoryMode(JSON.parse(storedRegulatoryMode));
            if (storedExchangeMode) setIsExchangeMode(JSON.parse(storedExchangeMode));

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
    }, [loadNews]);
    
     useEffect(() => {
        localStorage.setItem(WATCH_REGULATORY_KEY, JSON.stringify(watchRegulatory));
    }, [watchRegulatory]);

    useEffect(() => {
        localStorage.setItem(WATCH_EXCHANGE_KEY, JSON.stringify(watchExchange));
    }, [watchExchange]);

    useEffect(() => {
        localStorage.setItem(BREAKING_MODE_KEY, JSON.stringify(isBreakingMode));
    }, [isBreakingMode]);

     useEffect(() => {
        localStorage.setItem(REGULATORY_MODE_KEY, JSON.stringify(isRegulatoryMode));
    }, [isRegulatoryMode]);

    useEffect(() => {
        localStorage.setItem(EXCHANGE_MODE_KEY, JSON.stringify(isExchangeMode));
    }, [isExchangeMode]);


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
                    vixState.components.newsSentimentScore = 20; // More bearish
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
    }, [selectedNews, newsItems]);

    const filteredNews = useMemo(() => {
        let items = newsItems;

        if (activeList === 'saved') {
            items = items.filter(item => savedNewsIds.includes(item.id));
        } else if (activeList === 'read') {
            items = items.filter(item => readNewsIds.includes(item.id));
        }

        if (isBreakingMode) {
            items = items.filter(item => 
                item.volatilityImpact === 'High' ||
                item.eventType === 'Breaking' ||
                item.riskWindowMins <= 60
            );
        }

        let effectiveFilters = { ...filters };
        if (isRegulatoryMode) {
            effectiveFilters.category = "Regulatory";
            effectiveFilters.sortBy = 'highestImpact';
        }
        if (isExchangeMode) {
            const exchangeCategories: NewsCategory[] = ['Exchange', 'Security', 'Liquidations'];
            items = items.filter(item => exchangeCategories.includes(item.category));
            effectiveFilters.sortBy = 'highestImpact';
        }

        items = items.filter(item => {
            if (effectiveFilters.followedOnly && !item.impactedCoins.some(coin => followedCoins.includes(coin))) return false;
            const searchLower = effectiveFilters.search.toLowerCase();
            if (effectiveFilters.search && !item.headline.toLowerCase().includes(searchLower) && !item.sourceName.toLowerCase().includes(searchLower)) return false;
            if (effectiveFilters.sentiment !== "All" && item.sentiment !== effectiveFilters.sentiment) return false;
            if (effectiveFilters.highImpactOnly && item.volatilityImpact !== 'High') return false;
            if (effectiveFilters.category !== 'All' && item.category !== effectiveFilters.category) return false;
            if (effectiveFilters.coins.length > 0 && !effectiveFilters.coins.some(coin => item.impactedCoins.includes(coin))) return false;
            return true;
        });

        items.sort((a, b) => {
            switch (effectiveFilters.sortBy) {
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
    }, [filters, newsItems, followedCoins, isBreakingMode, activeList, savedNewsIds, readNewsIds, isRegulatoryMode, isExchangeMode]);
    
    const clusteredItems = useMemo(() => {
        const STOP_WORDS = new Set(['a', 'an', 'the', 'is', 'in', 'on', 'of', 'for', 'to', 'with']);
        const getKeywords = (headline: string) => 
            new Set(headline.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ').filter(word => !STOP_WORDS.has(word) && word.length > 2));
        
        const clustered: DisplayItem[] = [];
        const processedIds = new Set<string>();
    
        const sentimentOrder: Record<Sentiment, number> = { 'Negative': 3, 'Neutral': 2, 'Positive': 1 };
        const impactOrder: Record<VolatilityImpact, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };

        for (const item of filteredNews) {
            if (processedIds.has(item.id)) continue;

            const cluster: NewsItem[] = [];
            const itemKeywords = getKeywords(item.headline);

            for (const otherItem of filteredNews) {
                if (processedIds.has(otherItem.id) || item.id === otherItem.id) continue;

                const timeDiff = Math.abs(differenceInHours(new Date(item.publishedAt), new Date(otherItem.publishedAt)));
                if (timeDiff > 3) continue;

                if (item.category !== otherItem.category) continue;

                const hasCommonCoin = item.impactedCoins.some(coin => otherItem.impactedCoins.includes(coin));
                if (!hasCommonCoin) continue;
                
                const otherKeywords = getKeywords(otherItem.headline);
                const intersection = new Set([...itemKeywords].filter(x => otherKeywords.has(x)));
                const overlap = intersection.size / Math.min(itemKeywords.size, otherKeywords.size);

                if (overlap >= 0.5) { // 50% keyword overlap
                    cluster.push(otherItem);
                }
            }

            if (cluster.length > 0) {
                processedIds.add(item.id);
                cluster.forEach(c => processedIds.add(c.id));
                
                const allItems = [item, ...cluster];
                const highestImpact = allItems.reduce((max, item) => impactOrder[item.volatilityImpact] > impactOrder[max] ? item.volatilityImpact : max, 'Low');
                const mostNegativeSentiment = allItems.reduce((max, item) => sentimentOrder[item.sentiment] > sentimentOrder[max] ? item.sentiment : max, 'Positive');
                
                clustered.push({
                    type: 'cluster',
                    id: `cluster-${item.id}`,
                    primary: item,
                    related: cluster,
                    category: item.category,
                    impact: highestImpact,
                    sentiment: mostNegativeSentiment,
                });
            } else {
                clustered.push(item);
                processedIds.add(item.id);
            }
        }
        
        return clustered;

    }, [filteredNews]);

    const groupedAndFilteredNews = useMemo(() => {
        const itemsToDisplay = clusteredItems.slice(0, visibleCount);
        const groups: { [key: string]: DisplayItem[] } = {
            Today: [],
            Yesterday: [],
            Earlier: [],
        };

        itemsToDisplay.forEach(item => {
            const itemDate = new Date(item.type === 'cluster' ? item.primary.publishedAt : item.publishedAt);
            if (isToday(itemDate)) {
                groups.Today.push(item);
            } else if (isYesterday(itemDate)) {
                groups.Yesterday.push(item);
            } else {
                groups.Earlier.push(item);
            }
        });

        return Object.entries(groups).filter(([, items]) => items.length > 0);

    }, [clusteredItems, visibleCount]);
    
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [filters, isBreakingMode, activeList, isRegulatoryMode, isExchangeMode]);

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
        setIsRegulatoryMode(false);
        setIsExchangeMode(false);
        setActivePresetId(null);
        localStorage.removeItem(LAST_PRESET_KEY);
    };
    
    const handleFilterChange = (key: keyof NewsFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setActivePresetId(null);
        localStorage.removeItem(LAST_PRESET_KEY);
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
                variant: "destructive",
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

            <CoinDetailDrawer 
                coin={selectedCoinForDrawer}
                onOpenChange={(open) => !open && setSelectedCoinForDrawer(null)}
                newsItems={newsItems}
                followedCoins={followedCoins}
                onToggleFollow={handleToggleFollow}
                onSetModule={onSetModule}
            />

            <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">News Intelligence</h1>
                        <p className="text-muted-foreground">AI-curated crypto futures news with sentiment + volatility impact—so you don’t trade blind.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleSimulateShock}>
                            <Zap className="mr-2 h-4 w-4" /> Simulate Shock
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => loadNews(true)} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Refresh
                        </Button>
                        {lastFetchedAt && (
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="text-xs text-muted-foreground cursor-help">
                                            Updated {formatDistanceToNow(new Date(lastFetchedAt), { addSuffix: true })}
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>In production, news is cached for 5 minutes to reduce cost and keep speed.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            </div>

            {isRegulatoryMode && (
                <Alert variant="default" className="bg-amber-950/40 border-amber-500/20 text-amber-300">
                    <Layers className="h-4 w-4 text-amber-400" />
                    <AlertTitle className="text-amber-400">Regulatory Mode is Active</AlertTitle>
                    <AlertDescription>
                        The feed is filtered for Regulatory news and sorted by highest impact. Trade cautiously as this news can trigger sudden volatility.
                    </AlertDescription>
                </Alert>
            )}
             {isExchangeMode && (
                <Alert variant="default" className="bg-blue-950/40 border-blue-500/20 text-blue-300">
                    <ShieldAlert className="h-4 w-4 text-blue-400" />
                    <AlertTitle className="text-blue-400">Exchange & Infrastructure Mode is Active</AlertTitle>
                    <AlertDescription>
                        The feed is filtered for news about exchanges, security, and liquidations. Pay attention to execution risk.
                    </AlertDescription>
                </Alert>
            )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <IntelligenceBriefCard allNews={newsItems} filteredNews={filteredNews} />
                <VolatilityRiskCard newsItems={filteredNews} />
            </div>

            <CategoryHeatmapCard
                newsItems={filteredNews}
                onCellClick={(category, impact) => {
                    setFilters(prev => ({
                        ...prev,
                        category,
                        highImpactOnly: impact === 'High',
                        sentiment: 'All', // Reset other filters for clarity
                        coins: []
                    }));
                    setActivePresetId(null);
                }}
            />
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-muted/30 border-border/50 sticky top-[72px] z-20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2"><Filter /> Filters & Sorting ({clusteredItems.length})</CardTitle>
                                <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-2 h-4 w-4"/>Clear all</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <div className={cn("relative md:col-span-2 lg:col-span-4", (isRegulatoryMode || isExchangeMode) && "opacity-50 pointer-events-none")}>
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search headline or source..." 
                                        className="pl-9"
                                        value={filters.search}
                                        onChange={e => handleFilterChange('search', e.target.value)}
                                        disabled={isRegulatoryMode || isExchangeMode}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="breaking-mode"
                                        checked={isBreakingMode}
                                        onCheckedChange={setIsBreakingMode}
                                    />
                                    <Label htmlFor="breaking-mode" className="flex items-center gap-1.5"><Radio className="h-4 w-4 text-red-500" /> Breaking</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="regulatory-mode"
                                        checked={isRegulatoryMode}
                                        onCheckedChange={(checked) => { setIsRegulatoryMode(checked); if (checked) setIsExchangeMode(false); }}
                                    />
                                    <Label htmlFor="regulatory-mode" className="flex items-center gap-1.5"><Layers className="h-4 w-4 text-amber-500" /> Regulatory</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="exchange-mode"
                                        checked={isExchangeMode}
                                        onCheckedChange={(checked) => { setIsExchangeMode(checked); if (checked) setIsRegulatoryMode(false); }}
                                    />
                                    <Label htmlFor="exchange-mode" className="flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-blue-500" /> Exchange & Infra</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <Switch
                                        id="followed-only"
                                        checked={filters.followedOnly}
                                        onCheckedChange={checked => handleFilterChange('followedOnly', checked)}
                                        disabled={isRegulatoryMode || isExchangeMode}
                                    />
                                    <Label htmlFor="followed-only">My Followed Coins</Label>
                                </div>
                                 <Select value={filters.sortBy} onValueChange={(v) => handleFilterChange('sortBy', v as any)} disabled={isRegulatoryMode || isExchangeMode}>
                                    <SelectTrigger disabled={isRegulatoryMode || isExchangeMode}>
                                        <SelectValue placeholder="Sort by..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest</SelectItem>
                                        <SelectItem value="highestImpact">Highest Impact</SelectItem>
                                        <SelectItem value="mostNegative">Most Negative</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className={cn("flex flex-wrap items-center gap-2", (isRegulatoryMode || isExchangeMode) && "opacity-50 pointer-events-none")}>
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
                        </CardContent>
                    </Card>

                    <Tabs value={activeList} onValueChange={(value) => setActiveTab(value as any)}>
                        <TabsList className="grid w-full grid-cols-3 max-w-lg">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="saved">Saved ({savedNewsIds.length})</TabsTrigger>
                            <TabsTrigger value="read">Read ({readNewsIds.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-6">
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
                            ) : clusteredItems.length === 0 ? (
                                <Card className="text-center py-12 bg-muted/30 border-border/50">
                                    <CardHeader>
                                        <CardTitle>No items match these filters.</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex justify-center gap-4">
                                        <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-8">
                                    {groupedAndFilteredNews.map(([groupName, items]) => (
                                        <div key={groupName}>
                                            <h2 className="text-lg font-semibold text-foreground mb-4 pl-1">{groupName}</h2>
                                            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", isBreakingMode && "md:grid-cols-3")}>
                                                {items.map(item => {
                                                    if (item.type === 'cluster') {
                                                        return <StoryClusterCard key={item.id} cluster={item} onNewsSelect={handleNewsSelect} query={filters.search} />
                                                    }
                                                    
                                                    const newsItem = item as NewsItem;
                                                    const isRead = readNewsIds.includes(newsItem.id);
                                                    const isSaved = savedNewsIds.includes(newsItem.id);

                                                    return (
                                                        <Card 
                                                            key={newsItem.id}
                                                            className={cn(
                                                                "bg-muted/30 border-border/50 flex flex-col transition-all",
                                                                isRead ? "opacity-60 hover:opacity-100" : "hover:border-primary/40 hover:bg-muted/50",
                                                                newsItem.sourceTier === 'C' && 'opacity-70'
                                                            )}
                                                        >
                                                            <div onClick={() => handleNewsSelect(newsItem)} className="cursor-pointer flex-1 flex flex-col">
                                                                <CardHeader className="pb-4">
                                                                    <CardTitle className="text-base leading-tight line-clamp-2">
                                                                        <HighlightMatches text={newsItem.headline} query={filters.search} />
                                                                    </CardTitle>
                                                                    <CardDescription className="flex items-center gap-2 text-xs pt-1">
                                                                        <span>{newsItem.sourceName} (Tier {newsItem.sourceTier})</span>
                                                                    </CardDescription>
                                                                </CardHeader>
                                                                {!isBreakingMode && (
                                                                    <CardContent className="flex-1">
                                                                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                                                            {newsItem.summaryBullets.slice(0,2).map((bullet, i) => <li key={i} className="line-clamp-2">{bullet}</li>)}
                                                                        </ul>
                                                                    </CardContent>
                                                                )}
                                                            </div>
                                                            <CardFooter className="flex-col items-start gap-4">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <Badge variant="outline" className={cn(
                                                                        'text-xs whitespace-nowrap',
                                                                        newsItem.sentiment === 'Positive' && 'bg-green-500/20 text-green-300 border-green-500/30',
                                                                        newsItem.sentiment === 'Negative' && 'bg-red-500/20 text-red-300 border-red-500/30',
                                                                        newsItem.sentiment === 'Neutral' && 'bg-secondary text-secondary-foreground border-border'
                                                                    )}>{newsItem.sentiment}</Badge>
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-xs",
                                                                        newsItem.volatilityImpact === 'High' && 'border-red-500/50 text-red-400',
                                                                        newsItem.volatilityImpact === 'Medium' && 'border-amber-500/50 text-amber-400',
                                                                        newsItem.volatilityImpact === 'Low' && 'border-green-500/50 text-green-400',
                                                                    )}>
                                                                        <TrendingUp className="mr-1 h-3 w-3"/>
                                                                        {newsItem.volatilityImpact} Impact
                                                                    </Badge>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        <Clock className="mr-1 h-3 w-3"/>
                                                                        {getImpactHorizon(newsItem.riskWindowMins)}
                                                                    </Badge>
                                                                </div>
                                                                <div className="w-full pt-2 border-t border-border/50 flex justify-end items-center gap-1">
                                                                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => handleToggleRead(newsItem.id)}>
                                                                        <CheckCircle className={cn("mr-2 h-4 w-4", isRead && "text-primary")} /> {isRead ? "Unread" : "Mark read"}
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => handleToggleSave(newsItem.id)}>
                                                                        <Bookmark className={cn("mr-2 h-4 w-4", isSaved && "text-primary fill-primary")} /> {isSaved ? "Unsave" : "Save"}
                                                                    </Button>
                                                                </div>
                                                            </CardFooter>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {visibleCount < clusteredItems.length && (
                                        <div className="mt-8 text-center">
                                            <Button variant="outline" onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}>
                                                Load More ({clusteredItems.length - visibleCount} remaining)
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="saved" className="mt-6">
                            {/* Content for Saved tab */}
                            <p className="text-muted-foreground text-sm">Showing saved items.</p>
                        </TabsContent>
                         <TabsContent value="read" className="mt-6">
                            {/* Content for Read tab */}
                            <p className="text-muted-foreground text-sm">Showing read items.</p>
                        </TabsContent>
                    </Tabs>
                </div>

                 <div className="lg:col-span-1 space-y-6 sticky top-24">
                    <ActiveRiskWindowsCard newsItems={newsItems} onNewsSelect={handleNewsSelect} onSetWarning={handleWarningToggle} />
                    <VolatilityBriefCard newsItems={filteredNews} persona={persona} />
                    <WatchlistCard 
                        followedCoins={followedCoins} 
                        onFilter={handleFilterChange}
                        filters={filters}
                        watchRegulatory={watchRegulatory}
                        setWatchRegulatory={setWatchRegulatory}
                        watchExchange={watchExchange}
                        setWatchExchange={setWatchExchange}
                    />
                    <TopImpactedCoinsCard newsItems={newsItems} onFilter={handleFilterChange} onCoinClick={setSelectedCoinForDrawer} />
                    <SentimentImpactMatrix newsItems={filteredNews} onCellClick={(sentiment, impact) => { setFilters(prev => ({...prev, sentiment, highImpactOnly: impact === 'High'})) }} />
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
                                    <span className="flex items-center gap-2 text-muted-foreground text-sm"><Clock className="h-4 w-4" />{formatDistanceToNow(new Date(selectedNews.publishedAt), { addSuffix: true })} via {selectedNews.sourceName} (Tier {selectedNews.sourceTier})</span>
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
                                        <CardContent className="space-y-4">
                                            <div className="space-y-3">
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
                                            </div>
                                             <Separator className="my-4"/>
                                            <div className="space-y-2">
                                                <p className="text-xs text-muted-foreground">VIX Impact: This event may increase market volatility.</p>
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
                                                        <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10 hover:text-primary" onClick={(e) => { e.stopPropagation(); }}>{coin}</Badge>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start"
                                                            onClick={() => handleToggleFollow(coin)}
                                                        >
                                                            {followedCoins.includes(coin) ? 'Unfollow' : 'Follow'} {coin}
                                                        </Button>
                                                         <Button
                                                            variant="ghost"
                                                            className="w-full justify-start"
                                                            onClick={() => setSelectedCoinForDrawer(coin)}
                                                        >
                                                            View {coin} details
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
                                            {newsItems.filter(item => item.id !== selectedNews.id && item.category === selectedNews.category).slice(0, 3).length > 0 ? newsItems.filter(item => item.id !== selectedNews.id && item.category === selectedNews.category).slice(0, 3).map(item => (
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

    
