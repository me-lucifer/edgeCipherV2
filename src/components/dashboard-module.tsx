
"use client";

import { useAuth } from "@/context/auth-provider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Bot, FileText, Gauge, BarChart, ArrowRight, TrendingUp, TrendingDown, BookOpen, Link, ArrowRightCircle } from "lucide-react";

interface Persona {
    primaryPersonaName?: string;
}

const features = [
    { id: 'tradePlanning', icon: FileText, title: "Plan new trade" },
    { id: 'tradeJournal', icon: BookOpen, title: "Open Journal" },
    { id: 'aiCoaching', icon: Bot, title: "Open AI Coaching" },
];

const openPositions = [
    { symbol: 'BTC-PERP', direction: 'Long', size: '0.5', pnl: 234.50, risk: 'Medium' },
    { symbol: 'ETH-PERP', direction: 'Short', size: '12', pnl: -88.12, risk: 'Low' },
]

const newsItems = [
    { headline: "Fed hints at slower rate hikes, crypto market rallies", sentiment: "Bullish" },
    { headline: "Major exchange announces new security upgrades after hack", sentiment: "Neutral" },
    { headline: "Regulatory uncertainty in Asia spooks investors", sentiment: "Bearish" },
]

const growthPlanItems = [
    "Limit yourself to 5 trades per day.",
    "Only trade your best A+ setup for the next 2 weeks.",
    "Complete a daily journal review for at least 10 days.",
];

function PnlDisplay({ value }: { value: number }) {
    const isPositive = value >= 0;
    return (
        <div className={`flex items-center text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="mr-2 h-5 w-5" /> : <TrendingDown className="mr-2 h-5 w-5" />}
            <span>{isPositive ? '+' : ''}${value.toFixed(2)}</span>
        </div>
    );
}

export function DashboardModule() {
    const [persona, setPersona] = useState<Persona>({});
    const [isBrokerConnected, setIsBrokerConnected] = useState(false);
    const { logout } = useAuth();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const personaData = localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base");
            if (personaData) {
                setPersona(JSON.parse(personaData));
            }
            setIsBrokerConnected(localStorage.getItem('ec_broker_connected') === 'true');
        }
    }, []);

  return (
    <div className="space-y-8">
        {/* User Header & Arjun Insight */}
        <Card className="w-full bg-muted/30 border-border/50">
            <CardContent className="p-6 grid md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Welcome, {persona.primaryPersonaName || 'Trader'}.
                    </h1>
                     <p className="text-muted-foreground mt-1">
                        Persona: <span className="font-semibold text-primary">{persona.primaryPersonaName || 'The Determined Trader'}</span>
                    </p>
                </div>
                 <div className="bg-muted/50 p-4 rounded-lg border border-dashed border-border/50">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Arjun's Note:</span>
                        <blockquote className="mt-1 italic">
                           "Remember, your P&L is a lagging indicator of your process. Today, let's focus on executing your A+ setup flawlessly, regardless of the outcome. One good trade."
                        </blockquote>
                    </p>
                </div>
            </CardContent>
        </Card>
        
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-8">
                {/* Account & Positions Snapshot */}
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Account & Positions Snapshot</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isBrokerConnected ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Broker</p>
                                        <p className="font-semibold text-foreground">Delta</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Balance</p>
                                        <p className="font-semibold text-foreground">$12,345.67</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Margin Used</p>
                                        <p className="font-semibold text-foreground">15.2%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                                        <PnlDisplay value={146.38} />
                                    </div>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Symbol</TableHead>
                                            <TableHead>Direction</TableHead>
                                            <TableHead>Size</TableHead>
                                            <TableHead>PnL</TableHead>
                                            <TableHead>Risk</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {openPositions.map(pos => (
                                            <TableRow key={pos.symbol}>
                                                <TableCell>{pos.symbol}</TableCell>
                                                <TableCell className={pos.direction === 'Long' ? 'text-green-400' : 'text-red-400'}>{pos.direction}</TableCell>
                                                <TableCell>{pos.size}</TableCell>
                                                <TableCell><PnlDisplay value={pos.pnl} /></TableCell>
                                                <TableCell><Badge variant={pos.risk === 'Low' ? 'secondary' : 'default'} className={pos.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : ''}>{pos.risk}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-lg">
                                <Link className="h-8 w-8 text-muted-foreground mx-auto" />
                                <h3 className="mt-4 text-lg font-semibold text-foreground">No broker connected</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Connect your broker to see live account data and open positions.</p>
                                <Button className="mt-4">Connect Broker</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Performance Summary */}
                <div className="grid md:grid-cols-3 gap-8">
                     <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-base">Today's PnL</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <PnlDisplay value={-55.40} />
                        </CardContent>
                    </Card>
                     <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-base">Today's Win/Loss</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-lg font-semibold">1 / 2</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-base">7-Day PnL</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="h-10 w-full bg-muted rounded-md flex items-center justify-center">
                                <p className="text-xs text-muted-foreground">[Sparkline chart]</p>
                             </div>
                        </CardContent>
                    </Card>
                </div>
                 {/* Market Context & Risk */}
                <div className="grid md:grid-cols-2 gap-8">
                     <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-base">Crypto VIX</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-3xl font-bold">78 <span className="text-base font-normal text-muted-foreground">/ 100</span></p>
                             <p className="text-sm text-yellow-400 font-semibold">High Volatility Zone</p>
                             <p className="text-xs text-muted-foreground mt-2">Expect larger swings. Consider reducing size.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-base">News Snapshot</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {newsItems.map((item, index) => (
                                <div key={index} className="text-sm">
                                    <p className="text-foreground truncate">{item.headline}</p>
                                    <Badge variant={item.sentiment === 'Bullish' ? 'default' : item.sentiment === 'Bearish' ? 'destructive' : 'secondary'} className={item.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' : ''}>
                                        {item.sentiment}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right column */}
            <div className="space-y-8">
                 {/* Quick Actions */}
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {features.map(feature => (
                            <Button key={feature.id} variant="outline" className="w-full justify-start">
                                <feature.icon className="mr-2 h-4 w-4" />
                                {feature.title}
                                <ArrowRightCircle className="ml-auto h-4 w-4 text-muted-foreground" />
                            </Button>
                        ))}
                    </CardContent>
                </Card>
                {/* Growth Plan */}
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Today's Focus</CardTitle>
                        <CardDescription>From your initial growth plan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ul className="space-y-3">
                            {growthPlanItems.slice(0,2).map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-1" />
                                    <span className="text-muted-foreground text-sm">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <Button variant="link" className="px-0 mt-2">View full plan</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
