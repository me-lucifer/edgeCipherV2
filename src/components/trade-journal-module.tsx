
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, Calendar, Bookmark, ArrowRight, Edit, AlertCircle, CheckCircle, Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEventLog } from "@/context/event-log-provider";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface TradeJournalModuleProps {
    onSetModule: (module: any, context?: any) => void;
    draftId?: string;
}

const journalEntrySchema = z.object({
  id: z.string(),
  tradeId: z.string().optional(),
  status: z.enum(["pending", "completed"]),
  timestamps: z.object({
    plannedAt: z.string(),
    executedAt: z.string(),
    closedAt: z.string().optional(),
  }),
  technical: z.object({
    instrument: z.string(),
    direction: z.enum(["Long", "Short"]),
    entryPrice: z.number(),
    stopLoss: z.number(),
    takeProfit: z.number().optional(),
    leverage: z.number(),
    positionSize: z.number(),
    riskPercent: z.number(),
    rrRatio: z.number().optional(),
    strategy: z.string(),
  }),
  planning: z.object({
    planNotes: z.string().optional(),
    ruleOverridesJustification: z.string().optional(),
    arjunPreTradeSummary: z.string().optional(),
    mindset: z.string().optional(),
  }),
  review: z.object({
    pnl: z.coerce.number(),
    exitPrice: z.coerce.number(),
    emotionalNotes: z.string().optional(),
    emotionsTags: z.string().optional(),
    mistakesTags: z.string().optional(),
    learningNotes: z.string().optional(),
    newsContextTags: z.string().optional(),
  }),
  meta: z.object({
    ruleAdherenceSummary: z.object({
      followedEntryRules: z.boolean().default(true),
      movedSL: z.boolean().default(false),
      exitedEarly: z.boolean().default(false),
      rrBelowMin: z.boolean().default(false),
    }).optional(),
    journalingCompletedAt: z.string().optional(),
  })
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;

const mockJournalEntries: JournalEntry[] = [
    {
      id: 'completed-1',
      tradeId: 'DELTA-1699881122',
      status: 'completed',
      timestamps: { plannedAt: new Date(Date.now() - 86400000 * 2).toISOString(), executedAt: new Date(Date.now() - 86400000 * 2).toISOString(), closedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      technical: { instrument: 'BTC-PERP', direction: 'Long', entryPrice: 68500, stopLoss: 68000, takeProfit: 69500, leverage: 20, positionSize: 0.5, riskPercent: 1, rrRatio: 2, strategy: "BTC Trend Breakout" },
      planning: { planNotes: "Clean breakout above resistance. Good follow-through.", mindset: "Confident, Calm" },
      review: { pnl: 234.75, exitPrice: 68969.5, emotionalNotes: "Felt good, stuck to the plan.", emotionsTags: "Confident", mistakesTags: "None", learningNotes: "Trust the plan when the setup is clean.", newsContextTags: "Post-CPI" },
      meta: { journalingCompletedAt: new Date().toISOString() }
    },
    {
      id: 'completed-2',
      tradeId: 'DELTA-1699794722',
      status: 'completed',
      timestamps: { plannedAt: new Date(Date.now() - 86400000).toISOString(), executedAt: new Date(Date.now() - 86400000).toISOString(), closedAt: new Date(Date.now() - 86400000).toISOString() },
      technical: { instrument: 'ETH-PERP', direction: 'Short', entryPrice: 3605, stopLoss: 3625, leverage: 50, positionSize: 12, riskPercent: 2, rrRatio: 1, strategy: "London Reversal" },
      planning: { planNotes: "Fading what looks like a sweep of the high.", mindset: "Anxious" },
      review: { pnl: -240, exitPrice: 3625, emotionalNotes: "Market kept pushing, I felt like I was fighting a trend. Should have waited for more confirmation.", emotionsTags: "Anxious,Revenge Trading", mistakesTags: "Forced Entry", learningNotes: "Don't fight a strong trend, even if it looks like a sweep.", newsContextTags: "" },
      meta: { journalingCompletedAt: new Date().toISOString() }
    },
];

const useJournal = () => {
    const { toast } = useToast();
    const { addLog } = useEventLog();
    const [entries, setEntries] = useState<JournalEntry[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("ec_journal_entries");
            const drafts = localStorage.getItem("ec_journal_drafts");
            const parsedEntries = saved ? JSON.parse(saved) : mockJournalEntries;
            const parsedDrafts = drafts ? JSON.parse(drafts) : [];
            setEntries([...parsedDrafts, ...parsedEntries]);
        }
    }, []);

    const updateEntry = (updatedEntry: JournalEntry) => {
        setEntries(prev => {
            const newEntries = prev.map(e => e.id === updatedEntry.id ? updatedEntry : e);
            
            const isDraft = updatedEntry.id.startsWith('draft-');
            
            if (isDraft && updatedEntry.status === 'completed') {
                // Move from drafts to entries
                const drafts = JSON.parse(localStorage.getItem("ec_journal_drafts") || "[]");
                const newDrafts = drafts.filter((d: any) => d.id !== updatedEntry.id);
                localStorage.setItem("ec_journal_drafts", JSON.stringify(newDrafts));

                const completed = JSON.parse(localStorage.getItem("ec_journal_entries") || "[]");
                localStorage.setItem("ec_journal_entries", JSON.stringify([updatedEntry, ...completed]));
                addLog(`Journal entry completed: ${updatedEntry.technical.instrument}`);
            } else if (!isDraft) {
                // Update a completed entry
                const completed = JSON.parse(localStorage.getItem("ec_journal_entries") || "[]");
                const newCompleted = completed.map((e: any) => e.id === updatedEntry.id ? updatedEntry : e);
                localStorage.setItem("ec_journal_entries", JSON.stringify(newCompleted));
                addLog(`Journal entry updated: ${updatedEntry.technical.instrument}`);
            }
            
            toast({
                title: "Journal Entry Saved",
                description: "Your review has been logged successfully.",
            });

            return newEntries;
        });
    };

    return { entries, updateEntry };
}

function JournalReviewForm({ entry, onSubmit }: { entry: JournalEntry; onSubmit: (values: JournalEntry) => void; }) {
    const form = useForm<JournalEntry>({
      resolver: zodResolver(journalEntrySchema),
      defaultValues: entry,
    });

    const handleSubmit = (values: JournalEntry) => {
        const finalEntry: JournalEntry = {
            ...values,
            status: 'completed',
            meta: {
                ...values.meta,
                journalingCompletedAt: new Date().toISOString(),
            }
        };
        onSubmit(finalEntry);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="review.pnl" render={({ field }) => (<FormItem><FormLabel>Final PnL ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="review.exitPrice" render={({ field }) => (<FormItem><FormLabel>Final Exit Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <FormField control={form.control} name="review.emotionsTags" render={({ field }) => (
                    <FormItem><FormLabel>Emotions (comma-separated tags)</FormLabel><FormControl><Input placeholder="e.g., Confident, Anxious, FOMO" {...field} /></FormControl></FormItem>
                )} />
                 <FormField control={form.control} name="review.mistakesTags" render={({ field }) => (
                    <FormItem><FormLabel>Mistakes (comma-separated tags)</FormLabel><FormControl><Input placeholder="e.g., Moved SL, Exited too early, Oversized" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="review.newsContextTags" render={({ field }) => (
                    <FormItem><FormLabel>News Context (comma-separated tags)</FormLabel><FormControl><Input placeholder="e.g., FOMC Day, CPI Print" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="review.learningNotes" render={({ field }) => (
                    <FormItem>
                        <FormLabel>What did you learn?</FormLabel>
                        <FormControl><Textarea placeholder="The most important part. What is the key takeaway from this trade, win or lose?" {...field} /></FormControl>
                    </FormItem>
                )} />
                 <div className="flex justify-end">
                    <Button type="submit">Complete Journal Entry</Button>
                </div>
            </form>
        </Form>
    );
}

function AllTradesTab({ entries, updateEntry, onSetModule, initialDraftId }: { entries: JournalEntry[], updateEntry: (entry: JournalEntry) => void, onSetModule: TradeJournalModuleProps['onSetModule'], initialDraftId?: string }) {
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [filters, setFilters] = useState({
        timeRange: '30d',
        result: 'all',
        emotion: 'all',
        mistake: 'all',
        strategy: 'all',
    });

    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            if (filters.result !== 'all' && entry.status === 'completed') {
                const isWin = entry.review.pnl > 0;
                if (filters.result === 'win' && !isWin) return false;
                if (filters.result === 'loss' && isWin) return false;
            }
            if (filters.emotion !== 'all' && !(entry.review.emotionsTags || '').includes(filters.emotion)) return false;
            if (filters.mistake !== 'all' && !(entry.review.mistakesTags || '').includes(filters.mistake)) return false;
            if (filters.strategy !== 'all' && entry.technical.strategy !== filters.strategy) return false;
            
            // Date filter (mocked)
            const entryDate = new Date(entry.timestamps.executedAt);
            const now = new Date();
            if (filters.timeRange === '7d' && now.getTime() - entryDate.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
            if (filters.timeRange === 'today' && now.toDateString() !== entryDate.toDateString()) return false;
            
            return true;
        });
    }, [entries, filters]);

    const clearFilters = () => {
        setFilters({ timeRange: '30d', result: 'all', emotion: 'all', mistake: 'all', strategy: 'all' });
    }

    const uniqueStrats = [...new Set(entries.map(e => e.technical.strategy))];
    const uniqueEmotions = [...new Set(entries.flatMap(e => (e.review.emotionsTags || "").split(',')).filter(Boolean))];
    const uniqueMistakes = [...new Set(entries.flatMap(e => (e.review.mistakesTags || "").split(',')).filter(Boolean))];


    useEffect(() => {
        const entryToEdit = entries.find(e => e.id === initialDraftId);
        if (entryToEdit) {
            setEditingEntry(entryToEdit);
        }
    }, [initialDraftId, entries]);

    const discussWithArjun = (entry: JournalEntry) => {
        const question = `Arjun, can we review this trade? ${entry.technical.direction} ${entry.technical.instrument} on ${format(new Date(entry.timestamps.executedAt), "PPP")}. The result was a ${entry.review.pnl > 0 ? 'win' : 'loss'} of $${Math.abs(entry.review.pnl)}. My notes say: "${entry.planning.planNotes}". What can I learn from this?`;
        onSetModule('aiCoaching', { initialMessage: question });
    }

    if (editingEntry) {
         return (
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Trade Review: {editingEntry.tradeId || editingEntry.id}</CardTitle>
                            <CardDescription>
                                {editingEntry.status === 'pending' ? "Finalize your journal entry by adding psychological notes and outcomes." : "Viewing completed journal entry."}
                            </CardDescription>
                        </div>
                        <Button variant="ghost" onClick={() => setEditingEntry(null)}>Back to list</Button>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <Card className="bg-muted/50 border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base">Trade Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Pair/Direction:</span> <span className={cn("font-mono", editingEntry.technical.direction === 'Long' ? 'text-green-400' : 'text-red-400')}>{editingEntry.technical.instrument} {editingEntry.technical.direction}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Entry / SL / TP:</span> <span className="font-mono">{editingEntry.technical.entryPrice} / {editingEntry.technical.stopLoss} / {editingEntry.technical.takeProfit || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Risk % / R:R:</span> <span className="font-mono">{editingEntry.technical.riskPercent}% / {editingEntry.technical.rrRatio?.toFixed(2) || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Strategy:</span> <span className="font-mono">{editingEntry.technical.strategy}</span></div>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/50 border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base">Planning & Mindset</CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-foreground mb-2 text-sm">Rationale</h4>
                                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg border italic">"{editingEntry.planning.planNotes || 'No plan notes were entered.'}"</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground mb-2 text-sm">Pre-trade Mindset</h4>
                                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg border italic">"{editingEntry.planning.mindset || 'No mindset notes were entered.'}"</p>
                                </div>
                             </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6">
                         <Card className="bg-muted/50 border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base">Psychological Review</CardTitle>
                                {editingEntry.status === 'completed' && <CardDescription>This entry is locked. To edit, create a new version (prototype).</CardDescription>}
                            </CardHeader>
                            <CardContent>
                                {editingEntry.status === 'pending' ? (
                                    <JournalReviewForm entry={editingEntry} onSubmit={(values) => {
                                        updateEntry(values);
                                        setEditingEntry(null);
                                    }} />
                                ) : (
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between font-mono"><span className="text-muted-foreground">Final PnL:</span> <span className={cn(editingEntry.review.pnl > 0 ? 'text-green-400' : 'text-red-400')}>{editingEntry.review.pnl.toFixed(2)}$</span></div>
                                        <div className="flex justify-between font-mono"><span className="text-muted-foreground">Exit Price:</span> <span>{editingEntry.review.exitPrice}</span></div>
                                        <Separator className="my-4"/>
                                        <div><h4 className="font-semibold mb-1">Emotion Tags:</h4><p className="text-muted-foreground">{editingEntry.review.emotionsTags || "None"}</p></div>
                                        <div><h4 className="font-semibold mb-1">Mistake Tags:</h4><p className="text-muted-foreground">{editingEntry.review.mistakesTags || "None"}</p></div>
                                        <div><h4 className="font-semibold mb-1">Learnings:</h4><p className="text-muted-foreground italic">"{editingEntry.review.learningNotes || "No learning notes."}"</p></div>
                                        <div className="pt-4">
                                            <Button className="w-full" onClick={() => discussWithArjun(editingEntry)}><Bot className="mr-2 h-4 w-4"/>Discuss with Arjun</Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="flex items-center gap-2"><Filter /> Journal Filters</CardTitle>
                        <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-2 h-4 w-4"/>Clear Filters</Button>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                     <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                        {(['today', '7d', '30d'] as const).map(range => (
                            <Button
                                key={range}
                                size="sm"
                                variant={filters.timeRange === range ? 'secondary' : 'ghost'}
                                onClick={() => setFilters(f => ({ ...f, timeRange: range }))}
                                className="rounded-full h-8 px-3 text-xs w-full"
                            >
                                {range === 'today' ? 'Today' : range.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                     <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                        {(['all', 'win', 'loss'] as const).map(res => (
                            <Button
                                key={res}
                                size="sm"
                                variant={filters.result === res ? 'secondary' : 'ghost'}
                                onClick={() => setFilters(f => ({ ...f, result: res }))}
                                className="rounded-full h-8 px-3 text-xs w-full capitalize"
                            >
                                {res}
                            </Button>
                        ))}
                    </div>
                    <Select value={filters.strategy} onValueChange={(v) => setFilters(f => ({ ...f, strategy: v }))}>
                        <SelectTrigger><SelectValue placeholder="Filter by strategy..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Strategies</SelectItem>
                            {uniqueStrats.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={filters.emotion} onValueChange={(v) => setFilters(f => ({ ...f, emotion: v }))}>
                        <SelectTrigger><SelectValue placeholder="Filter by emotion..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Emotions</SelectItem>
                            {uniqueEmotions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={filters.mistake} onValueChange={(v) => setFilters(f => ({ ...f, mistake: v }))}>
                        <SelectTrigger><SelectValue placeholder="Filter by mistake..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Mistakes</SelectItem>
                            {uniqueMistakes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredEntries.map(entry => (
                    <Card key={entry.id} className="bg-muted/30 border-border/50 hover:border-primary/40 transition-colors flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className={cn("font-bold text-lg", entry.status === 'completed' && (entry.review.pnl >= 0 ? 'text-green-400' : 'text-red-400'))}>
                                        {entry.technical.instrument} &bull; {entry.status === 'completed' ? `${entry.review.pnl >= 0 ? '+' : ''}${entry.review.pnl.toFixed(2)}` : 'Pending'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{entry.technical.direction}</p>
                                </div>
                                <Badge variant={entry.status === 'completed' ? 'secondary' : 'outline'} className={cn(
                                    'text-xs',
                                    entry.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'border-amber-500/30 text-amber-300'
                                )}>{entry.status}</Badge>
                            </div>
                            <CardDescription>{format(new Date(entry.timestamps.executedAt), "PPP 'at' p")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1 flex flex-col">
                             <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {(entry.review.emotionsTags || "").split(',').filter(Boolean).map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs border-amber-500/30 text-amber-300">{tag}</Badge>
                                    ))}
                                </div>
                                 <div className="flex flex-wrap gap-2">
                                    {(entry.review.mistakesTags || "").split(',').filter(Boolean).map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs border-red-500/30 text-red-300">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button className="w-full" variant="outline" size="sm" onClick={() => setEditingEntry(entry)}>
                                    {entry.status === 'pending' ? 'Review' : 'View'}
                                </Button>
                                {entry.status === 'completed' && (
                                    <Button className="w-full" variant="secondary" size="sm" onClick={() => discussWithArjun(entry)}>
                                        <Bot className="mr-2 h-4 w-4" /> Discuss
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                 ))}
                 {filteredEntries.length === 0 && (
                    <Card className="md:col-span-2 lg:col-span-3 bg-muted/30 border-border/50 text-center py-12">
                        <CardHeader><CardTitle>No Entries Found</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">No journal entries match your current filters.</p>
                            <Button variant="secondary" className="mt-4" onClick={clearFilters}>Clear filters</Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

function PendingReviewTab({ entries, onSetModule }: { entries: JournalEntry[], onSetModule: TradeJournalModuleProps['onSetModule']}) {
    const draftEntries = entries.filter(e => e.status === 'pending');

    if (draftEntries.length === 0) {
        return (
            <Card className="bg-muted/30 border-border/50 text-center py-12">
                <CardHeader>
                    <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle>Journal Inbox Zero</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You've completed all your pending journal entries. Great work!</p>
                    <Button variant="secondary" className="mt-4" onClick={() => onSetModule('tradePlanning')}>Plan new trade</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftEntries.map(draft => (
                <Card key={draft.id} className="bg-muted/30 border-border/50 hover:border-primary/40 transition-colors flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle>{draft.technical.instrument}</CardTitle>
                            <Badge variant={draft.technical.direction === 'Long' ? 'default' : 'destructive'} className={cn(draft.technical.direction === 'Long' ? 'bg-green-500/20 text-green-300 border-green-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40')}>{draft.technical.direction}</Badge>
                        </div>
                        <CardDescription>{format(new Date(draft.timestamps.executedAt), "PPP 'at' p")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                         <div className="text-sm text-muted-foreground line-clamp-2 flex-1">
                           <span className="font-semibold text-foreground">Rationale: </span> {draft.planning.planNotes || 'No notes yet.'}
                        </div>
                        <Button 
                            className="w-full mt-auto"
                            onClick={() => onSetModule('tradeJournal', { draftId: draft.id })}
                        >
                           Complete Review <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}


export function TradeJournalModule({ onSetModule, draftId }: TradeJournalModuleProps) {
    const { entries, updateEntry } = useJournal();
    const [activeTab, setActiveTab] = useState(draftId ? 'all' : 'pending');

     useEffect(() => {
        if (draftId) {
            setActiveTab('all');
        }
    }, [draftId]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Trade Journal</h1>
                <p className="text-muted-foreground">Low-effort trade logging. High-impact psychology.</p>
            </div>
             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="pending">Pending Review ({entries.filter(e => e.status === 'pending').length})</TabsTrigger>
                    <TabsTrigger value="all">All Trades &amp; Filters</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="pt-6">
                    <PendingReviewTab entries={entries} onSetModule={onSetModule} />
                </TabsContent>
                <TabsContent value="all" className="pt-6">
                    <AllTradesTab entries={entries} updateEntry={updateEntry} onSetModule={onSetModule} initialDraftId={draftId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

    