
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bot, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface CryptoVixModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const zoneData = [
    { zone: "Calm (<25)", days: 10, color: "bg-green-500" },
    { zone: "Normal (25-50)", days: 15, color: "bg-blue-500" },
    { zone: "Elevated (50-75)", days: 4, color: "bg-yellow-500" },
    { zone: "Extreme (>75)", days: 1, color: "bg-red-500" },
]

export function CryptoVixModule({ onSetModule }: CryptoVixModuleProps) {
    
    const askArjun = () => {
        onSetModule('aiCoaching', { initialMessage: "How should I adapt my trading to the current volatility?" });
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Crypto VIX - Volatility Index</h1>
                <p className="text-muted-foreground">Understand and adapt to market volatility.</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>30-Day Volatility History</CardTitle>
                            <CardDescription>Current VIX: <span className="font-bold text-primary">58 (Elevated)</span></CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="h-64 w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border/50">
                                <LineChart className="h-16 w-16 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground ml-4">[VIX history line chart placeholder]</p>
                            </div>
                        </CardContent>
                    </Card>

                     <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>Understanding Volatility Zones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>Volatility isn't good or bad—it's just a condition you need to adapt to. High volatility means bigger price swings (more opportunity, more risk), while low volatility means smaller swings.</p>
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">How to adapt:</h4>
                                <ul className="list-disc list-inside space-y-2">
                                    <li><span className="font-semibold text-green-400">Calm/Normal:</span> Focus on standard setups. Be patient, as moves can be slower.</li>
                                    <li><span className="font-semibold text-amber-400">Elevated:</span> Consider reducing position size. Widening stops might be necessary to avoid getting shaken out. A+ setups only.</li>
                                    <li><span className="font-semibold text-red-400">Extreme:</span> The riskiest time to trade. Many pros sit out. If you trade, use minimum size and expect erratic moves.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    <Card className="bg-muted/30 border-border/50 sticky top-24">
                         <CardHeader>
                            <CardTitle>30-Day Zone Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Zone</TableHead><TableHead>Days</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {zoneData.map(d => (
                                        <TableRow key={d.zone}>
                                            <TableCell className="flex items-center gap-2">
                                                <div className={cn("w-2 h-2 rounded-full", d.color)} />
                                                {d.zone}
                                            </TableCell>
                                            <TableCell>{d.days}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> Ask Arjun</CardTitle>
                        </CardHeader>
                         <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Get personalized advice on how your strategy should adapt to the current volatility.</p>
                             <Button variant="outline" className="w-full" onClick={askArjun}>
                                Ask Arjun how to adapt
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
