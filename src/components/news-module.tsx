
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Filter, Clock } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface NewsModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

type Sentiment = "Bullish" | "Bearish" | "Neutral";

type NewsItem = {
    id: string;
    headline: string;
    summary: string;
    fullText: string;
    timestamp: string;
    sentiment: Sentiment;
    impact: "High" | "Medium" | "Low";
};

const mockNews: NewsItem[] = [
    { id: '1', headline: "Fed hints at slower rate hikes, crypto market rallies", summary: "The market reacted positively to the recent announcement about potential changes in monetary policy.", fullText: "In a much-anticipated speech, the Federal Reserve Chair hinted at a slower pace for future interest rate hikes, citing cooling inflation data. The crypto market, along with traditional equities, saw a significant rally, with Bitcoin briefly touching $70,000.", timestamp: "2 hours ago", sentiment: "Bullish", impact: "High" },
    { id: '2', headline: "Major exchange announces new security upgrades after hack", summary: "The exchange aims to restore user confidence with the move, partnering with a leading cybersecurity firm.", fullText: "Following a recent security breach that resulted in the loss of user funds, a major cryptocurrency exchange has announced a complete overhaul of its security infrastructure. This includes multi-signature wallets, stricter internal controls, and a partnership with a top-tier cybersecurity firm. The market reaction has been muted.", timestamp: "8 hours ago", sentiment: "Neutral", impact: "Medium" },
    { id: '3', headline: "Regulatory uncertainty in Asia spooks investors", summary: "New draft regulations have caused a sell-off in regional markets as traders await clarity.", fullText: "Draft regulations proposed by financial authorities in a key Asian market have introduced significant uncertainty. The proposed rules could impact stablecoin issuance and DeFi protocols, leading to a risk-off sentiment and a broad sell-off in tokens associated with the region.", timestamp: "1 day ago", sentiment: "Bearish", impact: "High" },
    { id: '4', headline: "Ethereum's Dencun upgrade leads to significantly lower layer-2 fees", summary: "The much-anticipated network upgrade has successfully reduced transaction costs on major L2s.", fullText: "The activation of the Dencun upgrade on the Ethereum mainnet has resulted in an immediate and drastic reduction in transaction fees for layer-2 rollups. Arbitrum and Optimism have reported fee reductions of over 90%, a move that is expected to spur adoption and user activity.", timestamp: "2 days ago", sentiment: "Bullish", impact: "High" },
    { id: '5', headline: "Stablecoin issuer partners with major payment processor", summary: "The partnership will allow millions of merchants to accept USDC payments globally.", fullText: "A leading stablecoin issuer has announced a landmark partnership with a global payment processing giant. The integration will enable merchants to accept USDC payments directly, potentially bridging the gap between traditional finance and the digital asset economy.", timestamp: "3 days ago", sentiment: "Bullish", impact: "Medium" },
    { id: '6', headline: "SEC delays decision on spot Bitcoin ETF application again", summary: "The commission has once again pushed back the deadline, citing the need for further review.", fullText: "The U.S. Securities and Exchange Commission has extended the review period for another spot Bitcoin ETF application, a move that was widely expected by market analysts. The continued delays have dampened some institutional interest, though the long-term outlook remains positive for many.", timestamp: "4 days ago", sentiment: "Neutral", impact: "Low" },
];

export function NewsModule({ onSetModule }: NewsModuleProps) {
    const [sentimentFilter, setSentimentFilter] = useState<Sentiment | "All">("All");
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    const filteredNews = useMemo(() => {
        if (sentimentFilter === "All") return mockNews;
        return mockNews.filter(item => item.sentiment === sentimentFilter);
    }, [sentimentFilter]);

    const discussWithArjun = (item: NewsItem) => {
        const prompt = `Arjun, how should I think about this news headline: "${item.headline}"? Does it impact my open trades or current strategy?`;
        onSetModule('aiCoaching', { initialMessage: prompt });
        setSelectedNews(null); // Close drawer
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Crypto News</h1>
                <p className="text-muted-foreground">Stay updated on market-moving events.</p>
            </div>
            
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>News Feed</CardTitle>
                        <div className="flex items-center gap-2">
                             <Filter className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Filter by sentiment:</p>
                             <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                                {(["All", "Bullish", "Neutral", "Bearish"] as const).map(s => (
                                    <Button
                                        key={s}
                                        size="sm"
                                        variant={sentimentFilter === s ? 'secondary' : 'ghost'}
                                        onClick={() => setSentimentFilter(s)}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNews.map(item => (
                            <Card 
                                key={item.id}
                                onClick={() => setSelectedNews(item)}
                                className="bg-muted/30 border-border/50 cursor-pointer transition-all hover:border-primary/40 hover:bg-muted/50"
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <CardTitle className="text-base leading-tight">{item.headline}</CardTitle>
                                        <Badge variant="secondary" className={cn(
                                            'text-xs whitespace-nowrap',
                                            item.sentiment === 'Bullish' && 'bg-green-500/20 text-green-400 border-green-500/30',
                                            item.sentiment === 'Bearish' && 'bg-red-500/20 text-red-400 border-red-500/30'
                                        )}>{item.sentiment}</Badge>
                                    </div>
                                    <CardDescription className="flex items-center gap-2 text-xs pt-1">
                                        <Clock className="h-3 w-3" />
                                        {item.timestamp}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{item.summary}</p>
                                     <Badge variant="outline" className={cn(
                                         "mt-4 text-xs",
                                         item.impact === 'High' && 'border-red-500/50 text-red-400',
                                         item.impact === 'Medium' && 'border-amber-500/50 text-amber-400',
                                     )}>
                                        {item.impact} Impact
                                    </Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Drawer open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
                <DrawerContent>
                    {selectedNews && (
                        <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
                            <DrawerHeader>
                                <DrawerTitle className="text-2xl">{selectedNews.headline}</DrawerTitle>
                                <DrawerDescription className="flex items-center gap-4 pt-2">
                                     <Badge variant="secondary" className={cn(
                                        'text-xs whitespace-nowrap',
                                        selectedNews.sentiment === 'Bullish' && 'bg-green-500/20 text-green-400 border-green-500/30',
                                        selectedNews.sentiment === 'Bearish' && 'bg-red-500/20 text-red-400 border-red-500/30'
                                    )}>{selectedNews.sentiment}</Badge>
                                    <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />{selectedNews.timestamp}</span>
                                </DrawerDescription>
                            </DrawerHeader>
                            <div className="px-4 py-6 space-y-4 text-muted-foreground">
                                <p>{selectedNews.fullText}</p>
                                <p className="text-xs italic">In a real application, this would contain the full article text, but for this prototype, it's an extended summary.</p>
                            </div>
                            <div className="p-4 border-t border-border/50">
                                <Button className="w-full" onClick={() => discussWithArjun(selectedNews)}>
                                    <Bot className="mr-2 h-4 w-4" />
                                    Discuss with Arjun
                                </Button>
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}
