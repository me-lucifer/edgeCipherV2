
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart as BarChartIcon, Brain, Calendar, Filter, AlertCircle, Info, TrendingUp, TrendingDown } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface PerformanceAnalyticsModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const mockEquityData = [
  { date: "2024-01-01", equity: 10000 },
  { date: "2024-01-02", equity: 10150 },
  { date: "2024-01-03", equity: 10100 },
  { date: "2024-01-04", equity: 10300 },
  { date: "2024-01-05", equity: 10250 },
  { date: "2024-01-06", equity: 10500 },
  { date: "2024-01-07", equity: 10450 },
  { date: "2024-01-08", equity: 10600 },
];

const mockStrategyData = [
    { name: "Breakout", trades: 45, winRate: 55, avgR: 1.8, pnl: 2500 },
    { name: "Mean Reversion", trades: 60, winRate: 65, avgR: 0.9, pnl: 1200 },
    { name: "Trend Following", trades: 30, winRate: 40, avgR: 2.5, pnl: 3000 },
    { name: "Range Play", trades: 25, winRate: 70, avgR: 0.7, pnl: -500 },
]

const chartConfig = {
  equity: {
    label: "Equity",
    color: "hsl(var(--primary))",
  },
};

function OverviewTab() {
    return (
        <div className="space-y-8">
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle>Equity Curve</CardTitle>
                    <CardDescription>Your account balance over the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart accessibilityLayer data={mockEquityData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                             <YAxis 
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value / 1000}k`}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="equity" fill="var(--color-equity)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader><CardTitle className="text-base">Win Rate</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold font-mono">48.2%</p></CardContent>
                </Card>
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader><CardTitle className="text-base">Average R</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold font-mono">1.35</p></CardContent>
                </Card>
                 <Card className="bg-muted/30 border-border/50">
                    <CardHeader><CardTitle className="text-base">Max Drawdown</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold font-mono">15.1%</p></CardContent>
                </Card>
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader><CardTitle className="text-base">Profit Factor</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold font-mono">1.62</p></CardContent>
                </Card>
            </div>
        </div>
    )
}

function ByStrategyTab() {
    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader>
                <CardTitle>Performance by Strategy</CardTitle>
                <CardDescription>Identify your most (and least) profitable setups.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={{}} className="h-[400px] w-full">
                    <BarChart layout="vertical" accessibilityLayer data={mockStrategyData}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} />
                        <XAxis dataKey="pnl" type="number" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Bar dataKey="pnl" radius={4}>
                            {mockStrategyData.map((entry) => (
                                <div key={entry.name} style={{ backgroundColor: entry.pnl > 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

function ByBehaviourTab() {
    const [analyticsData, setAnalyticsData] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const data = localStorage.getItem('ec_journal_analytics');
            if (data) {
                setAnalyticsData(JSON.parse(data));
            }
        }
    }, []);

    if (!analyticsData) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-lg">
                 <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No Journal Data Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Complete some journal entries to see your behavioral patterns here.
                </p>
            </div>
        )
    }

    const { emotionTagCounts, mistakeTagCounts } = analyticsData;
    const emotionData = Object.entries(emotionTagCounts).map(([tag, count]) => ({
        tag,
        count,
        winRate: (Math.random() * 30 + 40).toFixed(1), // Mock
        avgR: (Math.random() * 2 - 1).toFixed(2), // Mock
    }));

    const mistakeData = Object.entries(mistakeTagCounts).map(([tag, count]) => ({
        tag,
        count,
        winRate: (Math.random() * 20 + 20).toFixed(1), // Mock
        avgR: (Math.random() * -1.5 - 0.2).toFixed(2), // Mock
    }));

    return (
       <div className="space-y-8">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" /> Data shown here is derived from tags in your Trade Journal.
            </p>
            <div className="grid lg:grid-cols-2 gap-8">
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>By Emotion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Emotion Tag</TableHead>
                                    <TableHead>Count</TableHead>
                                    <TableHead>Win Rate</TableHead>
                                    <TableHead>Avg. R</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {emotionData.map(d => (
                                    <TableRow key={d.tag}>
                                        <TableCell><Badge variant="outline" className="border-amber-500/30 text-amber-300">{d.tag}</Badge></TableCell>
                                        <TableCell>{d.count as number}</TableCell>
                                        <TableCell>{d.winRate}%</TableCell>
                                        <TableCell className={cn(Number(d.avgR) >= 0 ? 'text-green-400' : 'text-red-400')}>{d.avgR}R</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>By Mistake</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mistake Tag</TableHead>
                                    <TableHead>Count</TableHead>
                                    <TableHead>Win Rate</TableHead>
                                    <TableHead>Avg. R</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mistakeData.map(d => (
                                    <TableRow key={d.tag}>
                                        <TableCell><Badge variant="destructive">{d.tag}</Badge></TableCell>
                                        <TableCell>{d.count as number}</TableCell>
                                        <TableCell>{d.winRate}%</TableCell>
                                        <TableCell className={cn(Number(d.avgR) >= 0 ? 'text-green-400' : 'text-red-400')}>{d.avgR}R</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             <p className="text-xs text-muted-foreground/80 italic text-center pt-4">
                Prototype: Win Rate and Avg. R numbers are simulated, but the pipeline reflects how the real system would use your Journal data.
            </p>
       </div>
   )
}

export function PerformanceAnalyticsModule({ onSetModule }: PerformanceAnalyticsModuleProps) {
    const [timeRange, setTimeRange] = useState("30d");

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Performance Analytics</h1>
                <p className="text-muted-foreground">Dive deep into your trading data to find your edge.</p>
            </div>
            
            <Tabs defaultValue="overview" className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <TabsList className="grid grid-cols-3 w-full sm:w-auto max-w-md">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="strategy">By Strategy</TabsTrigger>
                        <TabsTrigger value="behaviour">By Behaviour</TabsTrigger>
                    </TabsList>
                    <Card className="p-2 bg-muted/30 border-border/50">
                        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                            {(['7d', '30d', '90d'] as const).map(range => (
                                <Button
                                    key={range}
                                    size="sm"
                                    variant={timeRange === range ? 'secondary' : 'ghost'}
                                    onClick={() => setTimeRange(range)}
                                    className="rounded-full h-8 px-3 text-xs"
                                >
                                    {range.toUpperCase()}
                                </Button>
                            ))}
                            <Button variant="ghost" size="sm" className="rounded-full h-8 px-3 text-xs">
                                <Calendar className="mr-1 h-4 w-4" /> Custom
                            </Button>
                        </div>
                    </Card>
                </div>

                <div className="mt-6">
                    <TabsContent value="overview">
                        <OverviewTab />
                    </TabsContent>
                    <TabsContent value="strategy">
                        <ByStrategyTab />
                    </TabsContent>
                    <TabsContent value="behaviour">
                        <ByBehaviourTab />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
