

      "use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, Calendar, Bookmark, ArrowRight, Edit, AlertCircle, CheckCircle, Filter, X, XCircle, Circle, BrainCircuit, Trophy, NotebookPen, TrendingUp, TrendingDown, Sparkles, ChevronUp, ChevronRightIcon, Star, Search, Layers, HelpCircle, Info, Keyboard, Presentation } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { format, isToday, isYesterday, differenceInCalendarDays, startOfDay } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEventLog } from "@/context/event-log-provider";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Skeleton } from "./ui/skeleton";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "./ui/drawer";


interface TradeJournalModuleProps {
    onSetModule: (module: any, context?: any) => void;
    draftId?: string;
    journalEntries: JournalEntry[];
    updateJournalEntry: (entry: JournalEntry) => void;
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
  }).optional(),
  meta: z.object({
    ruleAdherenceSummary: z.object({
      followedEntryRules: z.boolean().default(true),
      movedSL: z.boolean().default(false),
      exitedEarly: z.boolean().default(false),
      rrBelowMin: z.boolean().default(false),
    }).optional(),
    journalingCompletedAt: z.string().optional(),
  })
}).refine(data => {
    if (data.status === 'pending') return true; // Don't validate for pending drafts
    if (!data.review) return false;
    const hasEmotionTag = data.review?.emotionsTags && data.review.emotionsTags.trim() !== '';
    const hasEmotionNote = data.review?.emotionalNotes && data.review.emotionalNotes.trim() !== '';
    return hasEmotionTag || hasEmotionNote;
}, {
    message: "Pick at least one emotion or write a note so Arjun can understand your mindset.",
    path: ["review.emotionsTags"],
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
      review: { pnl: 234.75, exitPrice: 68969.5, emotionalNotes: "Felt good, stuck to the plan.", emotionsTags: "Confident,Focused", mistakesTags: "None (disciplined)", learningNotes: "Trust the plan when the setup is clean.", newsContextTags: "Post-CPI" },
      meta: { journalingCompletedAt: new Date(Date.now() - 86400000 * 2).toISOString(), ruleAdherenceSummary: { followedEntryRules: true, movedSL: false, exitedEarly: false, rrBelowMin: false } }
    },
    {
      id: 'completed-2',
      tradeId: 'DELTA-1699794722',
      status: 'completed',
      timestamps: { plannedAt: new Date(Date.now() - 86400000).toISOString(), executedAt: new Date(Date.now() - 86400000).toISOString(), closedAt: new Date(Date.now() - 86400000).toISOString() },
      technical: { instrument: 'ETH-PERP', direction: 'Short', entryPrice: 3605, stopLoss: 3625, leverage: 50, positionSize: 12, riskPercent: 2, rrRatio: 1, strategy: "London Reversal" },
      planning: { planNotes: "Fading what looks like a sweep of the high.", mindset: "Anxious" },
      review: { pnl: -240, exitPrice: 3625, emotionalNotes: "Market kept pushing, I felt like I was fighting a trend. Should have waited for more confirmation.", emotionsTags: "Anxious,Revenge", mistakesTags: "Forced Entry,Moved SL", learningNotes: "Don't fight a strong trend, even if it looks like a sweep.", newsContextTags: "News-driven day" },
      meta: { journalingCompletedAt: new Date(Date.now() - 86400000).toISOString(), ruleAdherenceSummary: { followedEntryRules: false, movedSL: true, exitedEarly: false, rrBelowMin: true } }
    },
];

export const useJournal = () => {
    const { toast } = useToast();
    const { addLog } = useEventLog();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("ec_journal_entries");
            const drafts = localStorage.getItem("ec_journal_drafts");
            
            // Simulate fetch
            setTimeout(() => {
                const parsedEntries = saved ? JSON.parse(saved) : mockJournalEntries;
                const parsedDrafts = drafts ? JSON.parse(drafts) : [];
                setEntries([...parsedDrafts, ...parsedEntries]);
                setIsInitialLoad(false);
            }, 800);
        }
    }, []);

    const updateAnalytics = (allEntries: JournalEntry[]) => {
        const completedEntries = allEntries.filter(e => e.status === 'completed');
        const emotionTagCounts = completedEntries.flatMap(e => (e.review?.emotionsTags || "").split(',').filter(Boolean))
            .reduce((acc, tag) => ({ ...acc, [tag]: (acc[tag] || 0) + 1 }), {} as Record<string, number>);

        const mistakeTagCounts = completedEntries.flatMap(e => (e.review?.mistakesTags || "").split(',').filter(Boolean))
            .reduce((acc, tag) => ({ ...acc, [tag]: (acc[tag] || 0) + 1 }), {} as Record<string, number>);

        const totalTrades = allEntries.length;
        const completedCount = completedEntries.length;
        const journalingCompletionRate = totalTrades > 0 ? Math.round((completedCount / totalTrades) * 100) : 0;

        const analytics = {
            emotionTagCounts,
            mistakeTagCounts,
            journalingCompletionRate,
            pnlByEmotionTag: {}, // Mock
            pnlByMistakeTag: {}, // Mock
        };

        localStorage.setItem("ec_journal_analytics", JSON.stringify(analytics));
        addLog("Journal analytics updated.");
    };

    const updateEntry = (updatedEntry: JournalEntry) => {
        let newEntries: JournalEntry[] = [];
        setEntries(prev => {
            newEntries = prev.map(e => e.id === updatedEntry.id ? updatedEntry : e);
            
            const isDraft = updatedEntry.id.startsWith('draft-');
            
            if (isDraft && updatedEntry.status === 'completed') {
                const drafts = JSON.parse(localStorage.getItem("ec_journal_drafts") || "[]");
                const newDrafts = drafts.filter((d: any) => d.id !== updatedEntry.id);
                localStorage.setItem("ec_journal_drafts", JSON.stringify(newDrafts));

                const completed = JSON.parse(localStorage.getItem("ec_journal_entries") || "[]");
                localStorage.setItem("ec_journal_entries", JSON.stringify([updatedEntry, ...completed]));
                addLog(`Journal entry completed: ${updatedEntry.technical.instrument}`);
                
                const completionMessages = [
                    "Nice — this reflection is what sharpens your edge.",
                    "Journal updated. Arjun can now use this to refine your Growth Plan.",
                    "Good discipline. Most traders skip this part; they also stay stuck."
                ];
                
                toast({
                    title: "Journal Completed",
                    description: completionMessages[Math.floor(Math.random() * completionMessages.length)],
                });
            } else if (!isDraft) {
                const completed = JSON.parse(localStorage.getItem("ec_journal_entries") || "[]");
                const newCompleted = completed.map((e: any) => e.id === updatedEntry.id ? updatedEntry : e);
                localStorage.setItem("ec_journal_entries", JSON.stringify(newCompleted));
                addLog(`Journal entry updated: ${updatedEntry.technical.instrument}`);
                 toast({
                    title: "Journal Entry Saved",
                    description: "Your review has been logged successfully.",
                });
            } else if (isDraft) {
                 const drafts = JSON.parse(localStorage.getItem("ec_journal_drafts") || "[]");
                const newDrafts = drafts.map((d: any) => d.id === updatedEntry.id ? updatedEntry : d);
                localStorage.setItem("ec_journal_drafts", JSON.stringify(newDrafts));
            }

            updateAnalytics(newEntries);
            return newEntries;
        });
    };

    return { entries, updateEntry, isLoading: isInitialLoad };
}

const presetEmotions = ["FOMO", "Fear", "Anxiety", "Overconfidence", "Revenge", "Boredom", "Calm", "Focused", "Curious"];
const presetMistakes = ["Moved SL", "Exited early", "Exited late", "Oversized risk", "Skipped plan", "Took revenge trade", "Overtraded", "Ignored VIX / news", "None (disciplined)"];
const presetContexts = ["News-driven day", "Major macro event", "Exchange outage/latency", "Low liquidity session", "Weekend trading", "No special context"];


function JournalReviewForm({ entry, onSubmit, onSetModule, onSaveDraft }: { entry: JournalEntry; onSubmit: (values: JournalEntry) => void; onSetModule: TradeJournalModuleProps['onSetModule'], onSaveDraft: () => void }) {
    const { toast } = useToast();
    const form = useForm<JournalEntry>({
      resolver: zodResolver(journalEntrySchema),
      defaultValues: entry,
    });
    
    const [showCompletionDialog, setShowCompletionDialog] = useState(false);

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

    const handleAttemptSubmit = () => {
        form.handleSubmit(handleSubmit)();
    }

    const discussWithArjun = (entry: JournalEntry) => {
        const question = `Arjun, can we review this trade? ${entry.technical.direction} ${entry.technical.instrument} on ${format(new Date(entry.timestamps.executedAt), "PPP")}. The result was a ${entry.review?.pnl && entry.review.pnl > 0 ? 'win' : 'loss'} of $${entry.review?.pnl ? Math.abs(entry.review.pnl) : 0}. My notes say: "${entry.planning.planNotes}". What can I learn from this?`;
        onSetModule('aiCoaching', { initialMessage: question });
    }

    const isLosingTrade = form.getValues('review.pnl') < 0;

    return (
        <>
            <Form {...form}>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (e.nativeEvent instanceof KeyboardEvent && (e.nativeEvent.ctrlKey || e.nativeEvent.metaKey)) {
                        handleAttemptSubmit();
                    }
                }} className="space-y-6">
                    {/* Final PnL and Exit Price */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="review.pnl" render={({ field }) => (<FormItem><FormLabel>Final PnL ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="review.exitPrice" render={({ field }) => (<FormItem><FormLabel>Final Exit Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <Separator />

                    {/* Emotions */}
                     <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Emotions during this trade</h4>
                         <FormField
                            control={form.control}
                            name="review.emotionsTags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex flex-wrap gap-2">
                                            {presetEmotions.map(emotion => {
                                                const selected = (field.value || "").split(',').includes(emotion);
                                                return (
                                                    <Button
                                                        key={emotion}
                                                        type="button"
                                                        variant={selected ? "secondary" : "outline"}
                                                        size="sm"
                                                        className={cn("h-8 text-xs rounded-full",
                                                            selected && emotion === 'FOMO' && 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                                                            selected && (emotion === 'Fear' || emotion === 'Anxiety' || emotion === 'Revenge') && 'bg-red-500/20 text-red-300 border-red-500/30',
                                                            selected && (emotion === 'Calm' || emotion === 'Focused') && 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                                                        )}
                                                        onClick={() => {
                                                            const currentTags = (field.value || "").split(',').filter(Boolean);
                                                            const newTags = selected
                                                                ? currentTags.filter(t => t !== emotion)
                                                                : [...currentTags, emotion];
                                                            field.onChange(newTags.join(','));
                                                        }}
                                                    >
                                                        {emotion}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    </FormControl>
                                    <FormMessage className="pt-2" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="review.emotionalNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">Emotional notes (optional but powerful)</FormLabel>
                                    <FormControl>
                                    <Textarea 
                                        placeholder="Example: ‘Got anxious when price moved against me, almost closed early.’”" 
                                        {...field} 
                                    />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    <Separator />

                    {/* Mistakes */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-3">Mistakes (if any)</h4>
                        <FormField
                            control={form.control}
                            name="review.mistakesTags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex flex-wrap gap-2">
                                            {presetMistakes.map(mistake => {
                                                const selected = (field.value || "").split(',').includes(mistake);
                                                return (
                                                    <Button
                                                        key={mistake}
                                                        type="button"
                                                        variant={selected ? "secondary" : "outline"}
                                                        size="sm"
                                                        className={cn("h-8 text-xs rounded-full",
                                                            selected && mistake === "None (disciplined)" && "bg-green-500/20 text-green-300 border-green-500/30",
                                                            selected && mistake !== "None (disciplined)" && "bg-red-500/20 text-red-300 border-red-500/30",
                                                        )}
                                                        onClick={() => {
                                                            let currentTags = (field.value || "").split(',').filter(Boolean);
                                                            if (mistake === 'None (disciplined)') {
                                                                field.onChange(selected ? '' : 'None (disciplined)');
                                                            } else {
                                                                currentTags = currentTags.filter(t => t !== 'None (disciplined)');
                                                                const newTags = selected
                                                                    ? currentTags.filter(t => t !== mistake)
                                                                    : [...currentTags, mistake];
                                                                field.onChange(newTags.join(','));
                                                            }
                                                        }}
                                                    >
                                                        {mistake}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground mt-3">Be honest here. These tags help Arjun and Performance Analytics show you patterns later.</p>
                                </FormItem>
                            )}
                        />
                    </div>
                    <Separator />

                    {/* Learning Notes */}
                    <div>
                        <FormLabel>What did you learn from this trade?</FormLabel>
                        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1 my-2">
                            <li>What would you repeat next time?</li>
                            <li>What would you avoid next time?</li>
                            <li>Did you follow your plan, or adjust mid-trade?</li>
                        </ul>
                        <FormField
                            control={form.control}
                            name="review.learningNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                    <Textarea
                                        placeholder="Example: 'I respected my SL but rushed my TP. Next time I’ll keep a partial position for the original target.'"
                                        {...field}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Separator />

                    {/* Context */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-3">News &amp; Context</h4>
                         <FormField
                            control={form.control}
                            name="review.newsContextTags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex flex-wrap gap-2">
                                            {presetContexts.map(context => {
                                                const selected = (field.value || "").split(',').includes(context);
                                                return (
                                                    <Button
                                                        key={context}
                                                        type="button"
                                                        variant={selected ? "secondary" : "outline"}
                                                        size="sm"
                                                        className="h-8 text-xs rounded-full"
                                                        onClick={() => {
                                                            const currentTags = (field.value || "").split(',').filter(Boolean);
                                                            const newTags = selected
                                                                ? currentTags.filter(t => t !== context)
                                                                : [...currentTags, context];
                                                            field.onChange(newTags.join(','));
                                                        }}
                                                    >
                                                        {context}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                         <p className="text-xs text-muted-foreground mt-3">Tagging news and conditions helps separate bad decisions from bad environments.</p>
                    </div>

                    {isLosingTrade && !(form.watch('review.mistakesTags') || form.watch('review.learningNotes')) && (
                        <p className="text-xs text-amber-400">
                            Big losses rarely come from perfect execution. Consider tagging a mistake or adding a learning note if something felt off.
                        </p>
                    )}
                    <div className="flex justify-end pt-4 gap-2">
                        <Button type="button" variant="ghost" onClick={onSaveDraft}>Save and finish later</Button>
                        <Button type="button" onClick={handleAttemptSubmit}>Mark journal as completed</Button>
                    </div>
                     <div className="pt-4 border-t border-border/50">
                        <Button className="w-full" variant="outline" onClick={() => discussWithArjun(form.getValues())}><Bot className="mr-2 h-4 w-4"/>Discuss this trade with Arjun</Button>
                    </div>
                </form>
            </Form>
            <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
                <AlertDialogContent role="dialog" aria-modal="true">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Journal is Empty</AlertDialogTitle>
                        <AlertDialogDescription>
                            This journal entry has no psychological notes. Are you sure you want to mark it as completed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => form.handleSubmit(handleSubmit)()}>Yes, complete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

const RuleAdherenceCheck = ({ label, passed, note }: { label: string; passed: boolean; note?: string }) => {
    const Icon = passed ? CheckCircle : XCircle;
    const color = passed ? 'text-green-500' : 'text-red-500';
    return (
        <div className="flex items-center gap-2 text-sm">
            <Icon className={cn("h-4 w-4", color)} />
            <span className={cn(!passed && 'text-foreground font-medium')}>{label}</span>
        </div>
    );
};

function RuleAdherenceSummary({ entry }: { entry: JournalEntry }) {
    if (!entry.meta.ruleAdherenceSummary) {
        return null;
    }
    const summary = entry.meta.ruleAdherenceSummary;
    const mistakes = entry.review?.mistakesTags || "";

    const checks = [
        { label: "Followed Entry Rules", passed: summary.followedEntryRules, note: "" },
        { label: "Stop Loss Respected", passed: !mistakes.includes("Moved SL"), note: "" },
        { label: "R:R Met Minimum", passed: !summary.rrBelowMin, note: "" },
        { label: "Risk Within Limits", passed: entry.technical.riskPercent <= 2, note: "" }, // Mocking threshold
    ];

    return (
        <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Rule Adherence Summary</h4>
            <div className="space-y-3">
                {checks.map((check, i) => <RuleAdherenceCheck key={i} {...check} />)}
            </div>
            <p className="text-xs text-muted-foreground/80 mt-4">
                These flags help you see whether you broke your own rules on this trade.
            </p>
        </div>
    );
}

function JournalPatternsSidebar({ entries, onSetModule }: { entries: JournalEntry[]; onSetModule: TradeJournalModuleProps['onSetModule'] }) {
    const { topEmotions, topMistakes, journalingHabits } = useMemo(() => {
        const completedEntries = entries.filter(e => e.status === 'completed' && e.meta.journalingCompletedAt);
        
        const emotionCounts = completedEntries.flatMap(e => (e.review?.emotionsTags || "").split(',').filter(Boolean))
            .reduce((acc, tag) => ({ ...acc, [tag]: (acc[tag] || 0) + 1 }), {} as Record<string, number>);

        const topEmotions = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([tag, count]) => {
                const tradesWithTag = completedEntries.filter(e => (e.review?.emotionsTags || "").includes(tag));
                const wins = tradesWithTag.filter(e => e.review?.pnl && e.review.pnl > 0).length;
                const losses = tradesWithTag.length - wins;
                return { tag, count, wins, losses };
            });

        const mistakeCounts = completedEntries.flatMap(e => (e.review?.mistakesTags || "").split(',').filter(Boolean))
            .reduce((acc, tag) => ({ ...acc, [tag]: (acc[tag] || 0) + 1 }), {} as Record<string, number>);
        
        const topMistakes = Object.entries(mistakeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([tag, count]) => ({ tag, count, avgPnl: -150 })); // Mock PnL

        const totalTrades = entries.length;
        const completedCount = completedEntries.length;
        const completionRate = totalTrades > 0 ? (completedCount / totalTrades) * 100 : 0;
        
        // Streak calculation
        const completedDates = completedEntries
            .map(e => e.meta.journalingCompletedAt ? new Date(e.meta.journalingCompletedAt) : null)
            .filter(Boolean) as Date[];
            
        const uniqueDates = [...new Set(completedDates.map(d => d.toISOString().split('T')[0]))]
            .map(d => new Date(d))
            .sort((a,b) => b.getTime() - a.getTime());

        let currentJournalStreak = 0;
        if (uniqueDates.length > 0 && (isToday(uniqueDates[0]) || isYesterday(uniqueDates[0]))) {
            currentJournalStreak = 1;
            for (let i = 1; i < uniqueDates.length; i++) {
                const diff = differenceInCalendarDays(uniqueDates[i-1], uniqueDates[i]);
                if (diff === 1) {
                    currentJournalStreak++;
                } else {
                    break;
                }
            }
        }
        
        const now = new Date();
        const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));
        const journalDaysLast30 = uniqueDates.filter(d => d >= thirtyDaysAgo).length;

        return { 
            topEmotions, 
            topMistakes, 
            journalingHabits: {
                completionRate: completionRate.toFixed(0),
                total: totalTrades,
                completed: completedCount,
                currentJournalStreak,
                journalDaysLast30
            }
        };
    }, [entries]);

    const handleDiscussPatterns = () => {
        const prompt = `Arjun, I notice some patterns in my trading. My most common emotions seem to be ${topEmotions.map(e => e.tag).join(', ')}, and my top mistakes are ${topMistakes.map(m => m.tag).join(', ')}. How should my Growth Plan adjust to address these?`;
        onSetModule('aiCoaching', { initialMessage: prompt });
    }

    return (
        <div className="lg:col-span-1 space-y-6 sticky top-24">
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" />Patterns Arjun is Watching</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-foreground text-sm mb-3">Top Emotions</h4>
                        <div className="space-y-3">
                            {topEmotions.map(({ tag, count, wins, losses }) => (
                                <div key={tag}>
                                    <div className="flex justify-between items-center">
                                        <Badge variant="outline" className="border-amber-500/30 text-amber-300">{tag}</Badge>
                                        <span className="text-xs font-mono">{count} times</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Appears in {losses} losing and {wins} winning trades.</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator />
                     <div>
                        <h4 className="font-semibold text-foreground text-sm mb-3">Top Mistakes</h4>
                        <div className="space-y-3">
                           {topMistakes.map(({ tag, count, avgPnl }) => (
                               <div key={tag}>
                                    <div className="flex justify-between items-center">
                                        <Badge variant="destructive" className={cn(tag === "None (disciplined)" ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-red-500/20 border-red-500/30 text-red-300")}>{tag}</Badge>
                                        <span className="text-xs font-mono">{count} times</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Avg result: <span className="font-mono text-red-400">${avgPnl.toFixed(2)}</span></p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator />
                     <div>
                        <h4 className="font-semibold text-foreground text-sm mb-3">Journaling Habits</h4>
                         <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">Completion Rate (30d)</p>
                                <p className="font-mono font-bold text-lg">{journalingHabits.completionRate}%</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">Current Streak</p>
                                <p className="font-mono font-bold text-lg">{journalingHabits.currentJournalStreak} day(s)</p>
                            </div>
                            {journalingHabits.currentJournalStreak >= 5 && (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 w-full justify-center">
                                    <Trophy className="mr-2 h-4 w-4" /> 5-day consistency badge!
                                </Badge>
                            )}
                             <p className="text-xs text-muted-foreground mt-1">You've journaled on {journalingHabits.journalDaysLast30} of the last 30 days.</p>
                             {journalingHabits.currentJournalStreak === 0 && journalingHabits.completed > 0 &&(
                                 <p className="text-xs text-primary/80">Start a new streak: journal today’s trades.</p>
                             )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button variant="link" className="p-0 h-auto text-primary" onClick={handleDiscussPatterns}>
                            Discuss these patterns with Arjun <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function EmotionResultSnapshot() {
    const mockEmotionResults = [
        { emotion: "FOMO", avgR: -1.2 },
        { emotion: "Calm", avgR: 0.8 },
        { emotion: "Fear", avgR: -0.6 },
        { emotion: "Focused", avgR: 1.1 },
    ];

    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="text-base">Emotion vs. Result Snapshot</CardTitle>
                <CardDescription className="text-xs">Based on last 30 completed trades.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-3">
                    {mockEmotionResults.map(({ emotion, avgR }) => {
                        const isWin = avgR >= 0;
                        const Icon = isWin ? TrendingUp : TrendingDown;
                        return (
                            <div key={emotion} className="flex items-center gap-2 p-2 rounded-md bg-muted border border-border/50">
                                <Badge variant="outline" className={cn("text-xs",
                                emotion === 'FOMO' && 'border-amber-500/30 text-amber-300',
                                (emotion === 'Fear' || emotion === 'Anxious') && 'border-red-500/30 text-red-300',
                                (emotion === 'Calm' || emotion === 'Focused') && 'border-blue-500/30 text-blue-300',
                                )}>{emotion}</Badge>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-mono font-semibold px-2 py-1 rounded",
                                    isWin ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                )}>
                                    <Icon className="h-3 w-3" />
                                    <span>avg {isWin ? '+' : ''}{avgR.toFixed(1)}R</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

type GroupingOption = 'none' | 'day' | 'strategy';

const initialFilters = {
    timeRange: '30d',
    result: 'all',
    emotion: 'all',
    mistake: 'all',
    strategy: 'all',
};

function AllTradesTab({ entries, updateEntry, onSetModule, initialDraftId, filters, setFilters, showUnjournaledOnly, setShowUnjournaledOnly, searchQuery, setSearchQuery, groupBy, setGroupBy }: { entries: JournalEntry[], updateEntry: (entry: JournalEntry) => void, onSetModule: TradeJournalModuleProps['onSetModule'], initialDraftId?: string, filters: typeof initialFilters, setFilters: (filters: typeof initialFilters) => void, showUnjournaledOnly: boolean, setShowUnjournaledOnly: (show: boolean) => void, searchQuery: string, setSearchQuery: (query: string) => void, groupBy: GroupingOption, setGroupBy: (groupBy: GroupingOption) => void }) {
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

    const isMissingPsychData = (entry: JournalEntry) => {
      if (!entry.review) return true;
      return !entry.review?.emotionsTags && !entry.review?.learningNotes;
    }

    const unjournaledCount = useMemo(() => {
        return entries.filter(entry => entry.status === 'pending' || (entry.status === 'completed' && isMissingPsychData(entry))).length;
    }, [entries]);

    const filteredEntries = useMemo(() => {
        let baseEntries = entries;

        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            baseEntries = entries.filter(entry => {
                const inInstrument = entry.technical?.instrument.toLowerCase().includes(lowerCaseQuery);
                const inStrategy = entry.technical?.strategy?.toLowerCase().includes(lowerCaseQuery);
                const inLearningNotes = (entry.review?.learningNotes || "").toLowerCase().includes(lowerCaseQuery);
                const inEmotionalNotes = (entry.review?.emotionalNotes || "").toLowerCase().includes(lowerCaseQuery);
                return inInstrument || inStrategy || inLearningNotes || inEmotionalNotes;
            });
        }
        
        if (showUnjournaledOnly) {
            return baseEntries.filter(entry => entry.status === 'pending' || (entry.status === 'completed' && isMissingPsychData(entry)));
        }

        return baseEntries.filter(entry => {
            if (!entry.timestamps) return false;
            
            if (filters.result !== 'all' && entry.status === 'completed' && entry.review) {
                const isWin = entry.review.pnl > 0;
                if (filters.result === 'win' && !isWin) return false;
                if (filters.result === 'loss' && isWin) return false;
            }
            if (filters.emotion !== 'all' && !(entry.review?.emotionsTags || '').includes(filters.emotion)) return false;
            if (filters.mistake !== 'all' && !(entry.review?.mistakesTags || '').includes(filters.mistake)) return false;
            if (filters.strategy !== 'all' && entry.technical?.strategy !== filters.strategy) return false;
            
            const entryDate = new Date(entry.timestamps.executedAt);
            const now = new Date();
            if (filters.timeRange === '7d' && now.getTime() - entryDate.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
            if (filters.timeRange === 'today' && now.toDateString() !== entryDate.toDateString()) return false;
            
            return true;
        });
    }, [entries, filters, showUnjournaledOnly, searchQuery]);
    
    const groupedEntries = useMemo(() => {
        if (groupBy === 'none') return null;

        const groups = filteredEntries.reduce((acc, entry) => {
            let key: string;
            if (groupBy === 'day') {
                key = entry.timestamps ? format(startOfDay(new Date(entry.timestamps.executedAt)), "yyyy-MM-dd") : 'unknown-date';
            } else { // strategy
                key = entry.technical?.strategy || 'Uncategorized';
            }
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(entry);
            return acc;
        }, {} as Record<string, JournalEntry[]>);
        
        return Object.entries(groups).sort((a,b) => a[0] > b[0] ? -1 : 1);

    }, [groupBy, filteredEntries]);


    const clearFilters = () => {
        setFilters(initialFilters);
        setShowUnjournaledOnly(false);
        setSearchQuery('');
        setGroupBy('none');
    }

    const uniqueStrats = [...new Set(entries.map(e => e.technical?.strategy).filter(Boolean) as string[])];
    const uniqueEmotions = [...new Set(entries.flatMap(e => e.review?.emotionsTags?.split(',').filter(Boolean) || []))];
    const uniqueMistakes = [...new Set(entries.flatMap(e => e.review?.mistakesTags?.split(',').filter(Boolean) || []))];


    useEffect(() => {
        const entryToEdit = entries.find(e => e.id === initialDraftId);
        if (entryToEdit) {
            setEditingEntry(entryToEdit);
        }

        const handleSetEditing = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail) {
                setEditingEntry(detail);
            }
        };

        window.addEventListener('set-journal-editing', handleSetEditing);
        return () => window.removeEventListener('set-journal-editing', handleSetEditing);

    }, [initialDraftId, entries]);

    const discussWithArjun = (entry: JournalEntry) => {
        const question = `Arjun, can we review this trade? ${entry.technical.direction} ${entry.technical.instrument} on ${format(new Date(entry.timestamps.executedAt), "PPP")}. The result was a ${entry.review?.pnl && entry.review.pnl > 0 ? 'win' : 'loss'} of $${entry.review?.pnl ? Math.abs(entry.review.pnl) : 0}. My notes say: "${entry.planning.planNotes}". What can I learn from this?`;
        onSetModule('aiCoaching', { initialMessage: question });
    }

    if (entries.length === 0) {
        return (
            <Card className="bg-muted/30 border-border/50 text-center py-12">
                <CardHeader>
                    <CardTitle>Your journal is empty</CardTitle>
                    <CardDescription>
                        Once you execute your first trade from Trade Planning, it will appear here as a draft journal entry.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Remember: journaling starts from your very first trade, not your 100th.</p>
                    <Button variant="secondary" className="mt-4" onClick={() => onSetModule('tradePlanning')}>
                        Plan your first trade
                    </Button>
                </CardContent>
            </Card>
        );
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
                    <Card className="bg-muted/50 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-base">Trade Summary</CardTitle>
                            <CardDescription>The "what" of your trade (read-only).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             {editingEntry.technical && (
                                <>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-2">Technical Details</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between"><span className="text-muted-foreground">Pair/Direction:</span> <span className={cn("font-mono", editingEntry.technical.direction === 'Long' ? 'text-green-400' : 'text-red-400')}>{editingEntry.technical.instrument} {editingEntry.technical.direction}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Entry / SL / TP:</span> <span className="font-mono">{editingEntry.technical.entryPrice} / {editingEntry.technical.stopLoss} / {editingEntry.technical.takeProfit || 'N/A'}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Risk % / R:R:</span> <span className="font-mono">{editingEntry.technical.riskPercent}% / {editingEntry.technical.rrRatio?.toFixed(2) || 'N/A'}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Strategy:</span> <span className="font-mono">{editingEntry.technical.strategy}</span></div>
                                        </div>
                                    </div>
                                    <Separator />
                                </>
                            )}
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">Planning & Mindset</h4>
                                <div className="space-y-3">
                                     <div>
                                        <p className="font-semibold text-muted-foreground text-xs">Rationale</p>
                                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg border italic">"{editingEntry.planning.planNotes || 'No plan notes were entered.'}"</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-muted-foreground text-xs">Pre-trade Mindset</p>
                                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg border italic">"{editingEntry.planning.mindset || 'No mindset notes were entered.'}"</p>
                                    </div>
                                </div>
                            </div>
                            {editingEntry.meta.ruleAdherenceSummary && (
                                <>
                                    <Separator />
                                    <RuleAdherenceSummary entry={editingEntry} />
                                </>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/50 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-base">Psychological Review</CardTitle>
                            <CardDescription>The "how" and "why" of your trade.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {editingEntry.status === 'pending' ? (
                                <JournalReviewForm 
                                    entry={editingEntry} 
                                    onSubmit={(values) => {
                                        updateEntry(values);
                                        setEditingEntry(null);
                                    }} 
                                    onSetModule={onSetModule}
                                    onSaveDraft={() => {
                                        updateEntry(editingEntry);
                                        setEditingEntry(null);
                                    }}
                                />
                            ) : editingEntry.review ? (
                                <div className="space-y-6">
                                     <div className="flex justify-between font-mono text-sm"><span className="text-muted-foreground">Final PnL:</span> <span className={cn(editingEntry.review.pnl >= 0 ? 'text-green-400' : 'text-red-400')}>{editingEntry.review.pnl >= 0 ? '+' : ''}{editingEntry.review.pnl.toFixed(2)}$</span></div>
                                     <div className="flex justify-between font-mono text-sm"><span className="text-muted-foreground">Exit Price:</span> <span>{editingEntry.review.exitPrice}</span></div>
                                    <Separator />
                                     <div>
                                        <h4 className="font-semibold mb-2 text-sm">Emotions During Trade</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(editingEntry.review?.emotionsTags || "None").split(',').filter(Boolean).map(tag => <Badge key={tag} variant="outline" className="border-amber-500/30 text-amber-300">{tag}</Badge>)}
                                        </div>
                                    </div>
                                     <div>
                                        <h4 className="font-semibold mb-2 text-sm">Mistakes (if any)</h4>
                                         <div className="flex flex-wrap gap-2">
                                            {(editingEntry.review?.mistakesTags || "None").split(',').filter(Boolean).map(tag => <Badge key={tag} variant="destructive" className={cn(tag === "None (disciplined)" ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-red-500/20 border-red-500/30 text-red-300")}>{tag}</Badge>)}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2 text-sm">Learning Notes</h4>
                                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg border italic">"{editingEntry.review?.learningNotes || "No learning notes."}"</p>
                                    </div>
                                     <div>
                                        <h4 className="font-semibold mb-2 text-sm">Context Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(editingEntry.review?.newsContextTags || "None").split(',').filter(Boolean).map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <Button className="w-full" onClick={() => discussWithArjun(editingEntry)}><Bot className="mr-2 h-4 w-4"/>Discuss with Arjun</Button>
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        )
    }

    const PnLCell = ({ entry }: { entry: JournalEntry }) => {
        if (entry.status === 'pending' || !entry.review) {
            return <span className="text-muted-foreground">Pending</span>
        }
        const pnl = entry.review.pnl;
        const isWin = pnl >= 0;
        
        if (!entry.technical) return null;
        const riskAmount = (entry.technical.riskPercent / 100) * 10000;
        const rValue = riskAmount > 0 ? pnl / riskAmount : 0;

        return (
            <div className={cn("font-mono font-semibold", isWin ? 'text-green-400' : 'text-red-400')}>
                {rValue.toFixed(1)}R
            </div>
        )
    };
    
    const TagCell = ({ tags, variant }: { tags?: string; variant: 'emotion' | 'mistake' }) => {
        if (!tags) return <span className="text-muted-foreground/50">-</span>;
    
        const tagList = tags.split(',').filter(Boolean);
        const emotionColorMapping: { [key: string]: string } = {
            "FOMO": "border-amber-500/50 text-amber-400",
            "Fear": "border-red-500/50 text-red-400",
            "Anxious": "border-yellow-500/50 text-yellow-400",
            "Overconfidence": "border-purple-500/50 text-purple-400",
            "Calm": "border-blue-500/50 text-blue-400",
            "Focused": "border-primary/50 text-primary",
        };
    
        const mistakeColorMapping: { [key: string]: string } = {
            "None (disciplined)": "bg-green-500/20 border-green-500/30 text-green-300",
            "default": "bg-destructive/20 text-destructive-foreground border-destructive/30"
        };
    
        const getColorClass = (tag: string, type: 'emotion' | 'mistake') => {
            if (type === 'emotion') {
                return emotionColorMapping[tag] || "border-border";
            }
            if (type === 'mistake') {
                return mistakeColorMapping[tag] || mistakeColorMapping.default;
            }
            return "";
        };

        return (
            <div className="flex flex-wrap gap-1">
                {tagList.slice(0, 2).map(tag => (
                    <Badge
                        key={tag}
                        variant={variant === 'mistake' && tag !== "None (disciplined)" ? 'destructive' : 'outline'}
                        className={cn("text-xs", getColorClass(tag, variant))}
                    >
                        {tag}
                    </Badge>
                ))}
                {tagList.length > 2 && <Badge variant="outline" className="text-xs">+{tagList.length - 2}</Badge>}
            </div>
        );
    };

    const renderGroupHeader = (groupKey: string, groupEntries: JournalEntry[]) => {
        if (groupBy === 'day') {
            const netR = groupEntries.reduce((acc, entry) => {
                if (entry.status !== 'completed' || !entry.review || !entry.technical) return acc;
                const riskAmount = (entry.technical.riskPercent / 100) * 10000;
                return acc + (riskAmount > 0 ? entry.review.pnl / riskAmount : 0);
            }, 0);

            const topEmotions = groupEntries
                .flatMap(e => (e.review?.emotionsTags || "").split(',').filter(Boolean))
                .reduce((acc, tag) => ({...acc, [tag]: (acc[tag] || 0) + 1}), {} as Record<string, number>);
            const sortedEmotions = Object.entries(topEmotions).sort((a,b) => b[1] - a[1]).slice(0,2).map(([tag]) => tag).join(', ');

            return (
                <div className="flex items-center gap-4 text-sm">
                    <h3 className="font-semibold text-foreground">{format(new Date(groupKey), "PPP")} ({groupEntries.length} trades)</h3>
                    <Separator orientation="vertical" className="h-4" />
                    <p className="text-muted-foreground">Net: <span className={cn("font-mono", netR >= 0 ? 'text-green-400' : 'text-red-400')}>{netR >= 0 ? '+' : ''}{netR.toFixed(1)}R</span></p>
                    {sortedEmotions && <p className="text-muted-foreground hidden sm:block">Emotions: <span className="font-semibold">{sortedEmotions}</span></p>}
                </div>
            );
        }

        if (groupBy === 'strategy') {
            const wins = groupEntries.filter(e => e.status === 'completed' && e.review && e.review.pnl > 0).length;
            const totalCompleted = groupEntries.filter(e => e.status === 'completed').length;
            const winRate = totalCompleted > 0 ? (wins / totalCompleted) * 100 : 0;
             const netR = groupEntries.reduce((acc, entry) => {
                if (entry.status !== 'completed' || !entry.review || !entry.technical) return acc;
                const riskAmount = (entry.technical.riskPercent / 100) * 10000;
                return acc + (riskAmount > 0 ? entry.review.pnl / riskAmount : 0);
            }, 0);
            const avgR = totalCompleted > 0 ? netR / totalCompleted : 0;

            return (
                 <div className="flex items-center gap-4 text-sm">
                    <h3 className="font-semibold text-foreground">{groupKey} ({groupEntries.length} trades)</h3>
                    <Separator orientation="vertical" className="h-4" />
                    <p className="text-muted-foreground">Win Rate: <span className="font-mono">{winRate.toFixed(0)}%</span></p>
                    <p className="text-muted-foreground hidden sm:block">Avg Result: <span className={cn("font-mono", avgR >= 0 ? 'text-green-400' : 'text-red-400')}>{avgR >= 0 ? '+' : ''}{avgR.toFixed(1)}R</span></p>
                </div>
            )
        }
    };

    const renderEntries = (entriesToRender: JournalEntry[]) => (
        <>
            {/* Mobile Card View */}
            <div className="space-y-4 md:hidden">
                {entriesToRender.map(entry => (
                    <Card key={entry.id} className="bg-muted/30 border-border/50" onClick={() => setEditingEntry(entry)}>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{entry.technical?.instrument} <span className={cn(entry.technical?.direction === 'Long' ? 'text-green-400' : 'text-red-400')}>{entry.technical?.direction}</span></p>
                                    <p className="text-xs text-muted-foreground">{entry.timestamps ? format(new Date(entry.timestamps.executedAt), "MMM d, yyyy") : 'N/A'}</p>
                                </div>
                                <PnLCell entry={entry} />
                            </div>
                            <div className="space-y-2">
                                <TagCell tags={entry.review?.emotionsTags} variant="emotion" />
                                <TagCell tags={entry.review?.mistakesTags} variant="mistake" />
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                                {entry.status === 'pending' ? 'Complete Journal' : 'View Details'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Trade</TableHead>
                            <TableHead>Result (R)</TableHead>
                            <TableHead>Emotions</TableHead>
                            <TableHead>Mistakes</TableHead>
                            <TableHead>Strategy</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entriesToRender.map(entry => (
                            <TableRow key={entry.id} className="group cursor-pointer" onClick={() => setEditingEntry(entry)}>
                                <TableCell className="text-xs text-muted-foreground">{entry.timestamps ? format(new Date(entry.timestamps.executedAt), "MMM d") : 'N/A'}</TableCell>
                                <TableCell>
                                    <div className="font-semibold">{entry.technical?.instrument}</div>
                                    <div className={cn("text-xs", entry.technical?.direction === 'Long' ? 'text-green-400' : 'text-red-400')}>{entry.technical?.direction}</div>
                                </TableCell>
                                <TableCell><PnLCell entry={entry} /></TableCell>
                                <TableCell><TagCell tags={entry.review?.emotionsTags} variant="emotion" /></TableCell>
                                <TableCell><TagCell tags={entry.review?.mistakesTags} variant="mistake" /></TableCell>
                                <TableCell><Badge variant="secondary" className="text-xs">{entry.technical?.strategy || 'N/A'}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span>Open</span>
                                        <ChevronRightIcon className="h-4 w-4" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                    {entriesToRender.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No trades match your filters.</p>
                        <Button variant="link" size="sm" className="mt-2" onClick={clearFilters}>Clear filters</Button>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <CardTitle className="flex items-center gap-2"><Filter /> Journal Filters</CardTitle>
                                <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-2 h-4 w-4"/>Clear Filters</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by pair, strategy, or notes..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                           <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                               <div className={cn("grid grid-cols-2 gap-4 col-span-2 lg:col-span-3", showUnjournaledOnly && "opacity-50 pointer-events-none")}>
                                    <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                                        {(['today', '7d', '30d'] as const).map(range => (
                                            <Button
                                                key={range}
                                                size="sm"
                                                variant={filters.timeRange === range ? 'secondary' : 'ghost'}
                                                onClick={() => setFilters({ ...filters, timeRange: range })}
                                                className="rounded-full h-8 px-3 text-xs w-full"
                                                disabled={showUnjournaledOnly}
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
                                                onClick={() => setFilters({ ...filters, result: res })}
                                                className="rounded-full h-8 px-3 text-xs w-full capitalize"
                                                disabled={showUnjournaledOnly}
                                            >
                                                {res}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                
                                <Button
                                    variant={showUnjournaledOnly ? 'secondary' : 'outline'}
                                    onClick={() => setShowUnjournaledOnly(!showUnjournaledOnly)}
                                    className="col-span-2 lg:col-span-1"
                                >
                                    <NotebookPen className="mr-2 h-4 w-4" />
                                    Show unjournaled only
                                    {unjournaledCount > 0 && <span className="ml-2 font-mono bg-primary/20 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs">{unjournaledCount}</span>}
                                </Button>

                                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupingOption)} disabled={showUnjournaledOnly}>
                                    <SelectTrigger className="items-center gap-2" disabled={showUnjournaledOnly}>
                                        <Layers className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Group by..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No grouping</SelectItem>
                                        <SelectItem value="day">Group by Day</SelectItem>
                                        <SelectItem value="strategy">Group by Strategy</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filters.strategy} onValueChange={(v) => setFilters({ ...filters, strategy: v })} disabled={showUnjournaledOnly}>
                                    <SelectTrigger disabled={showUnjournaledOnly}><SelectValue placeholder="Filter by strategy..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Strategies</SelectItem>
                                        {uniqueStrats.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.emotion} onValueChange={(v) => setFilters({ ...filters, emotion: v })} disabled={showUnjournaledOnly}>
                                    <SelectTrigger disabled={showUnjournaledOnly}><SelectValue placeholder="Filter by emotion..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Emotions</SelectItem>
                                        {uniqueEmotions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.mistake} onValueChange={(v) => setFilters({ ...filters, mistake: v })} disabled={showUnjournaledOnly}>
                                    <SelectTrigger disabled={showUnjournaledOnly}><SelectValue placeholder="Filter by mistake..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Mistakes</SelectItem>
                                        {uniqueMistakes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <EmotionResultSnapshot />

                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>Trade Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {groupedEntries ? (
                                <div className="space-y-6">
                                    {groupedEntries.map(([groupKey, groupEntries]) => (
                                        <Collapsible key={groupKey} defaultOpen>
                                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-muted p-3">
                                                {renderGroupHeader(groupKey, groupEntries)}
                                                <ChevronUp className="h-4 w-4 shrink-0 transition-transform duration-200" />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="py-4">
                                                {renderEntries(groupEntries)}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))}
                                </div>
                            ) : (
                                renderEntries(filteredEntries)
                            )}
                        </CardContent>
                    </Card>
                </div>
                <JournalPatternsSidebar entries={entries} onSetModule={onSetModule} />
            </div>
        </div>
    )
}

type Priority = 'High' | 'Medium' | 'Low';
type ReviewPriority = {
    priority: Priority;
    reasons: string[];
};

function getReviewPriority(entry: JournalEntry): ReviewPriority {
    const reasons: string[] = [];
    let priority: Priority = 'Low';

    if (entry.status === 'completed' && entry.review && entry.technical) {
        const pnl = entry.review?.pnl;
        const riskAmount = entry.technical.riskPercent / 100 * 10000; // Mock 10k capital
        const rValue = pnl && riskAmount > 0 ? pnl / riskAmount : 0;

        if (rValue < -1) {
            reasons.push(`Significant loss (${rValue.toFixed(1)}R)`);
            priority = 'High';
        }
    }

    if (entry.planning.ruleOverridesJustification) {
        reasons.push('Rule breach');
        if (priority !== 'High') priority = 'High';
    }

    if ((entry.review?.mistakesTags || '').includes('Revenge')) {
        reasons.push('Revenge trade');
        priority = 'High';
    }
    
    if (priority === 'Low' && (entry.planning.mindset || "").toLowerCase().includes("anxious")) {
        reasons.push('Emotional trade');
        priority = 'Medium';
    }
    
    if (entry.status === 'pending' && priority !== 'High') {
        priority = 'Medium';
        reasons.push('Pending final result');
    }

    if (reasons.length === 0) {
        reasons.push('Standard review');
    }

    return { priority, reasons };
}

function JournalDetailSkeleton() {
    return (
        <CardContent className="border-t border-border/50 pt-6 animate-pulse" role="status" aria-live="polite" aria-label="Loading journal details">
            <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-muted/50 border-border/50">
                    <CardHeader>
                        <Skeleton className="h-5 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-1/3" />
                             <Skeleton className="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
                 <Card className="bg-muted/50 border-border/50">
                    <CardHeader>
                        <Skeleton className="h-5 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-8 w-16 rounded-full" />
                                <Skeleton className="h-8 w-20 rounded-full" />
                                <Skeleton className="h-8 w-24 rounded-full" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CardContent>
    );
}


function PendingReviewTab({ entries, onSetModule, updateEntry }: { entries: JournalEntry[]; onSetModule: TradeJournalModuleProps['onSetModule'], updateEntry: (entry: JournalEntry) => void; }) {
    const { toast } = useToast();
    const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const detailHeadingRef = useRef<HTMLHeadingElement>(null);


    useEffect(() => {
        if (expandedEntryId && !isDetailLoading && detailHeadingRef.current) {
            detailHeadingRef.current.focus();
        }
    }, [expandedEntryId, isDetailLoading]);

    const draftEntries = useMemo(() => {
        const drafts = entries
            .filter(e => e.status === 'pending')
            .map(entry => ({
                entry,
                priorityInfo: getReviewPriority(entry)
            }));
        
        const priorityOrder: Record<Priority, number> = { High: 1, Medium: 2, Low: 3 };

        drafts.sort((a, b) => {
            const priorityDiff = priorityOrder[a.priorityInfo.priority] - priorityOrder[b.priorityInfo.priority];
            if (priorityDiff !== 0) return priorityDiff;
            if (!a.entry.timestamps || !b.entry.timestamps) return 0;
            return new Date(b.entry.timestamps.executedAt).getTime() - new Date(a.entry.timestamps.executedAt).getTime();
        });
        
        return drafts;
    }, [entries]);

    const handleMarkAsClean = (entry: JournalEntry) => {
        const updatedEntry: JournalEntry = {
            ...entry,
            status: 'completed',
            review: {
                ...entry.review,
                pnl: entry.review?.pnl ?? 0,
                exitPrice: entry.review?.exitPrice ?? (entry.technical?.stopLoss || 0),
                emotionsTags: "Calm,Focused",
                mistakesTags: "None (disciplined)",
                learningNotes: "Executed according to plan. No major deviations.",
            },
            meta: {
                ...entry.meta,
                journalingCompletedAt: new Date().toISOString(),
            }
        };
        updateEntry(updatedEntry);
        toast({
            title: "Logged as clean trade",
            description: "Great – not every trade needs a long essay.",
        });
    };

    const handleToggleExpand = (entryId: string) => {
        if (expandedEntryId === entryId) {
            setExpandedEntryId(null);
        } else {
            setIsDetailLoading(true);
            setExpandedEntryId(entryId);
            setTimeout(() => {
                setIsDetailLoading(false);
            }, 500);
        }
    };

    if (draftEntries.length === 0) {
        return (
            <Card className="bg-muted/30 border-border/50 text-center py-12">
                <CardHeader>
                    <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle>Nothing waiting on your desk.</CardTitle>
                    <CardDescription>You've completed all your pending journal entries. Great work!</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Every trade you close from now on will appear here automatically for review.</p>
                    <Button variant="secondary" className="mt-4" onClick={() => onSetModule('dashboard')}>
                        Open Dashboard
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="relative space-y-8">
             <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50 hidden md:block" />
            {draftEntries.map(({ entry, priorityInfo }) => (
                <div key={entry.id} className="md:pl-12 relative">
                    <div className="absolute left-4 top-5 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background hidden md:block" />
                    <Card 
                        className={cn("bg-muted/30 border-l-4 transition-colors hover:bg-muted/40", 
                            priorityInfo.priority === 'High' && 'border-red-500',
                            priorityInfo.priority === 'Medium' && 'border-amber-500',
                            priorityInfo.priority === 'Low' && 'border-green-500',
                        )}
                    >
                        <CardContent className="p-4" >
                            <div className="grid md:grid-cols-[1fr_auto] items-center gap-4 cursor-pointer" onClick={() => handleToggleExpand(entry.id)}>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                        <h3 className="font-bold text-lg text-foreground">{entry.technical.instrument} – <span className={cn(entry.technical.direction === 'Long' ? 'text-green-400' : 'text-red-400')}>{entry.technical.direction}</span></h3>
                                        <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">Pending journal</Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <p>Executed: {entry.timestamps ? format(new Date(entry.timestamps.executedAt), "PPP 'at' p") : "No date"}</p>
                                        <p>Strategy: <Badge variant="secondary" className="text-xs">{entry.technical.strategy}</Badge></p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <Badge variant="outline" className={cn("text-xs",
                                            priorityInfo.priority === 'High' && 'border-red-500/50 text-red-300',
                                            priorityInfo.priority === 'Medium' && 'border-amber-500/50 text-amber-300',
                                            priorityInfo.priority === 'Low' && 'border-green-500/50 text-green-300',
                                        )}>
                                            <Star className="mr-1 h-3 w-3" />
                                            Priority: {priorityInfo.priority}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground italic">
                                            {priorityInfo.reasons.join('; ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 w-full md:w-auto" onClick={(e) => {
                                    e.stopPropagation();
                                }}>
                                    <Button 
                                        className="w-full"
                                        onClick={() => handleToggleExpand(entry.id)}
                                    >
                                       {expandedEntryId === entry.id ? 'Collapse' : 'Complete Review'}
                                       {expandedEntryId === entry.id ? <ChevronUp className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                                    </Button>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="w-full text-xs text-muted-foreground"
                                                    onClick={(e) => { e.stopPropagation(); handleMarkAsClean(entry); }}
                                                >
                                                    <Sparkles className="mr-2 h-3 w-3" /> Mark as clean trade
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">No major emotions or mistakes. I executed the plan as intended.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </CardContent>
                        
                        {expandedEntryId === entry.id && (
                           isDetailLoading ? (
                                <JournalDetailSkeleton />
                           ) : (
                            <CardContent className="border-t border-border/50 pt-6" role="region" aria-labelledby={`journal-entry-title-${entry.id}`}>
                                <h2 id={`journal-entry-title-${entry.id}`} ref={detailHeadingRef} tabIndex={-1} className="sr-only focus:outline-none focus:ring-2 focus:ring-ring rounded-sm">
                                  Journal entry details for {entry.technical.instrument}
                                </h2>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <Card className="bg-muted/50 border-border/50">
                                        <CardHeader>
                                            <CardTitle className="text-base">Trade Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-semibold text-foreground mb-2">Technical Details</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between"><span className="text-muted-foreground">Pair/Direction:</span> <span className={cn("font-mono", entry.technical.direction === 'Long' ? 'text-green-400' : 'text-red-400')}>{entry.technical.instrument} {entry.technical.direction}</span></div>
                                                    <div className="flex justify-between"><span className="text-muted-foreground">Entry / SL / TP:</span> <span className="font-mono">{entry.technical.entryPrice} / {entry.technical.stopLoss} / {entry.technical.takeProfit || 'N/A'}</span></div>
                                                    <div className="flex justify-between"><span className="text-muted-foreground">Risk % / R:R:</span> <span className="font-mono">{entry.technical.riskPercent}% / {entry.technical.rrRatio?.toFixed(2) || 'N/A'}</span></div>
                                                </div>
                                            </div>
                                             <Separator />
                                            <div>
                                                <h4 className="text-sm font-semibold text-foreground mb-2">Planning Notes</h4>
                                                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg border italic">"{entry.planning.planNotes || 'No plan notes were entered.'}"</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-muted/50 border-border/50">
                                        <CardHeader>
                                            <CardTitle className="text-base">Psychological Review</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <JournalReviewForm 
                                                entry={entry} 
                                                onSubmit={(values) => {
                                                    updateEntry(values);
                                                    setExpandedEntryId(null);
                                                }} 
                                                onSetModule={onSetModule}
                                                onSaveDraft={() => {
                                                    updateEntry(entry);
                                                    setExpandedEntryId(null);
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                           )
                        )}
                    </Card>
                </div>
            ))}
        </div>
    )
}

function ArjunJournalSummary({ entries }: { entries: JournalEntry[] }) {
    const { pendingCount, completedLast7Days, message } = useMemo(() => {
        const pendingCount = entries.filter(e => e.status === 'pending').length;
        const now = new Date();
        const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        
        const completedLast7Days = entries.filter(e => 
            e.status === 'completed' &&
            e.meta.journalingCompletedAt &&
            new Date(e.meta.journalingCompletedAt).getTime() >= sevenDaysAgo
        ).length;

        let message = "You're journaling consistently. This is how pros think.";
        if (pendingCount > 0) {
            message = "You have journal work waiting. Complete pending reviews before your next session to stay sharp.";
        } else if (completedLast7Days === 0 && entries.some(e => e.status === 'completed')) {
            message = "You’re trading but not journaling. That’s a leak in your edge.";
        } else if (completedLast7Days === 0 && entries.length === 0) {
            message = "Plan and execute trades to start building your journal.";
        }
        
        return { pendingCount, completedLast7Days, message };
    }, [entries]);

    return (
        <Card className="bg-muted/30 border-primary/20">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Bot className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-foreground">Arjun's view on your journaling</h3>
                        <p className="text-sm text-muted-foreground">{message}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 text-sm font-mono self-start sm:self-center ml-10 sm:ml-0">
                    <div>
                        <p className="text-xs text-muted-foreground">Completed (7D)</p>
                        <p className="font-bold text-lg text-foreground">{completedLast7Days}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="font-bold text-lg text-amber-400">{pendingCount}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function JournalSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-64" />
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    );
}

function JournalWalkthrough({ isOpen, onOpenChange, onDemoSelect }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onDemoSelect: (demo: 'high-emotion' | 'clean') => void }) {
    const walkthroughSteps = [
        { icon: NotebookPen, title: "Why Journal?", description: "This isn’t a diary. It’s where you turn trades into data-driven lessons to stop repeating mistakes." },
        { icon: Star, title: "Pending Review", description: "Every executed trade lands here as a draft. Your job: fill in emotions, mistakes, and what you learned." },
        { icon: Filter, title: "All Trades & Patterns", description: "Use filters and the patterns sidebar to see *when* you trade best and worst, and *why*." },
    ];

    const shortcuts = [
        { keys: ['j', 'p'], label: 'Go to Pending tab' },
        { keys: ['j', 'a'], label: 'Go to All trades tab' },
        { keys: ['j', 'n'], label: 'Open next pending review' },
        { keys: ['Ctrl', 'Enter'], label: 'Complete journal entry (in form)' },
    ];
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-background/90 backdrop-blur-sm animate-in fade-in"
                onClick={() => onOpenChange(false)}
            />
            <Card className="relative z-10 w-full max-w-4xl bg-muted/80 border-border/50 animate-in fade-in zoom-in-95" role="dialog" aria-modal="true">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center justify-between">
                        <span>How to Use the Journal</span>
                         <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="-mr-2" aria-label="Close walkthrough">
                            <X className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                    <CardDescription>The 3-step process to ensure every trade is disciplined.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid md:grid-cols-3 gap-6 text-center">
                        {walkthroughSteps.map((step, index) => (
                            <div key={step.title} className="relative">
                                <Card className="h-full bg-muted/50 p-6">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                        <step.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                                </Card>
                            </div>
                        ))}
                    </div>
                     <Separator />
                     <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-foreground mb-4 text-center md:text-left">Try a demo entry</h3>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <Button onClick={() => onDemoSelect('high-emotion')}>Demo: High-emotion loss</Button>
                                <Button variant="outline" onClick={() => onDemoSelect('clean')}>Demo: Clean, disciplined trade</Button>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Keyboard className="h-4 w-4" />Shortcuts</h3>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                {shortcuts.map((shortcut, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span>{shortcut.label}</span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map(key => (
                                                <kbd key={key} className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md">{key}</kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function DemoScriptPanel({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const steps = [
    "Show Pending review tab: these are trades auto-imported from Trade Planning.",
    "Open a big-loss trade (e.g., the ETH Short). Note the 'High' priority.",
    "Walk through filling out the psychological review: tag 'Anxious' and 'Revenge'.",
    "Complete the journal entry. Note the success toast.",
    "Switch to All Trades tab. Show the new completed entry.",
    "Use filters to isolate losing trades or trades tagged with 'Revenge'.",
    "Show the Patterns sidebar, pointing out how the new tags are reflected.",
    "Click 'Discuss these patterns with Arjun' to show the handoff to AI Coaching.",
    "Jump to Performance Analytics > By Behaviour to show the full data pipeline.",
  ];

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Journal Demo Script</DrawerTitle>
          <DrawerDescription>A presenter's guide to showcasing the journal workflow.</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <ul className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
            {steps.map((step, i) => <li key={i}>{step}</li>)}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}


export function TradeJournalModule({ onSetModule, draftId, journalEntries, updateJournalEntry }: TradeJournalModuleProps) {
    const [activeTab, setActiveTab] = useState('pending');
    const [filters, setFilters] = useState(initialFilters);
    const [groupBy, setGroupBy] = useState<GroupingOption>('none');
    const [showUnjournaledOnly, setShowUnjournaledOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
    const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isDemoPanelOpen, setIsDemoPanelOpen] = useState(false);

    // This flag can be set to false or tied to an env variable to hide the demo script button.
    const isDemoMode = true;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);

         const walkthroughSeen = localStorage.getItem('ec_journal_tour_seen');
        if (!walkthroughSeen) {
            setIsWalkthroughOpen(true);
            localStorage.setItem('ec_journal_tour_seen', 'true');
        }

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

     useEffect(() => {
        if (typeof window !== "undefined") {
            const savedState = localStorage.getItem("ec_journal_ui_state");
            if (savedState) {
                try {
                    const { activeTab: savedTab, filters: savedFilters, searchQuery: savedQuery, groupBy: savedGroupBy } = JSON.parse(savedState);
                    setActiveTab(savedTab || 'pending');
                    setFilters(savedFilters || initialFilters);
                    setSearchQuery(savedQuery || '');
                    setDebouncedSearchQuery(savedQuery || '');
                    setGroupBy(savedGroupBy || 'none');
                } catch (e) {
                    console.error("Failed to parse journal UI state", e);
                }
            } else {
                 const hasPending = journalEntries.some(e => e.status === 'pending');
                 if (!hasPending && journalEntries.length > 0) {
                     setActiveTab('all');
                 }
            }
        }

        if (draftId) {
            setActiveTab('all');
        }
    }, [draftId, journalEntries]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                return;
            }

            if (e.key === 'j' && !sequenceTimeoutRef.current) {
                sequenceTimeoutRef.current = setTimeout(() => {
                    sequenceTimeoutRef.current = null;
                }, 1500);
            } else if (sequenceTimeoutRef.current) {
                const navMap: Record<string, 'pending' | 'all'> = {
                    'p': 'pending',
                    'a': 'all',
                };
                if (navMap[e.key]) {
                    handleTabChange(navMap[e.key]);
                }
                
                if (e.key === 'n' && activeTab === 'pending') {
                    const firstPending = document.querySelector('[data-radix-collection-item]');
                    if (firstPending instanceof HTMLElement) {
                        firstPending.click();
                    }
                }
                
                if (sequenceTimeoutRef.current) {
                    clearTimeout(sequenceTimeoutRef.current);
                    sequenceTimeoutRef.current = null;
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (sequenceTimeoutRef.current) {
                clearTimeout(sequenceTimeoutRef.current);
            }
        };
    }, [activeTab]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const stateToSave = JSON.stringify({ activeTab, filters, searchQuery, groupBy });
            localStorage.setItem("ec_journal_ui_state", stateToSave);
        }
    }, [activeTab, filters, searchQuery, groupBy]);

    const pendingCount = useMemo(() => journalEntries.filter(e => e.status === 'pending').length, [journalEntries]);

    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
        // Reset filters when switching tabs for a cleaner experience
        setFilters(initialFilters);
        setShowUnjournaledOnly(false);
        setSearchQuery('');
        setGroupBy('none');
    }
    
    const handleDemoSelect = (demoType: 'high-emotion' | 'clean') => {
        let entryId;
        if (demoType === 'high-emotion') {
            entryId = 'completed-2';
        } else {
            entryId = 'completed-1';
        }

        if (activeTab !== 'all') {
            setActiveTab('all');
        }
        
        // This is a bit of a hack for the prototype to ensure the tab switch has rendered
        setTimeout(() => {
            const entryToEdit = journalEntries.find(e => e.id === entryId);
            if (entryToEdit) {
                const event = new CustomEvent('set-journal-editing', { detail: entryToEdit });
                window.dispatchEvent(event);
            }
        }, 100);

        setIsWalkthroughOpen(false);
    };

    if (isLoading) {
        return <JournalSkeleton />;
    }
    
    return (
        <div className="space-y-8">
            <JournalWalkthrough isOpen={isWalkthroughOpen} onOpenChange={setIsWalkthroughOpen} onDemoSelect={handleDemoSelect} />
            <DemoScriptPanel isOpen={isDemoPanelOpen} onOpenChange={setIsDemoPanelOpen} />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                 <div className="text-center md:text-left">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3 justify-center md:justify-start"><Bookmark className="h-6 w-6"/>Trade Journal</h1>
                    <p className="text-muted-foreground mt-2">Low-effort trade logging. High-impact psychology.</p>
                </div>
                <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => setIsWalkthroughOpen(true)}>
                        <HelpCircle className="mr-2 h-4 w-4" />
                        How this works
                    </Button>
                    {isDemoMode && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => setIsDemoPanelOpen(true)}>
                                        <Presentation className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Open Demo Script</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>
            
            <ArjunJournalSummary entries={journalEntries} />

             <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto md:mx-0">
                    <TabsTrigger value="pending">
                        Pending Review 
                        {pendingCount > 0 && <Badge className="ml-2 bg-amber-500/80 text-white hover:bg-amber-500">{pendingCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="all">All Trades &amp; Filters</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="pt-6">
                    <PendingReviewTab entries={journalEntries} onSetModule={onSetModule} updateEntry={updateJournalEntry} />
                </TabsContent>
                <TabsContent value="all" className="pt-6">
                    <AllTradesTab 
                        entries={journalEntries} 
                        updateEntry={updateJournalEntry} 
                        onSetModule={onSetModule} 
                        initialDraftId={draftId}
                        filters={filters}
                        setFilters={setFilters}
                        showUnjournaledOnly={showUnjournaledOnly}
                        setShowUnjournaledOnly={setShowUnjournaledOnly}
                        searchQuery={debouncedSearchQuery}
                        setSearchQuery={setSearchQuery}
                        groupBy={groupBy}
                        setGroupBy={setGroupBy}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
