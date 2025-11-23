
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, Calendar, Filter, AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEventLog } from "@/context/event-log-provider";
import { ScrollArea } from "./ui/scroll-area";

interface TradeJournalModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

const journalEntrySchema = z.object({
  id: z.string().optional(),
  datetime: z.date(),
  instrument: z.string().min(1, "Required"),
  direction: z.enum(["Long", "Short"]),
  entryPrice: z.coerce.number().positive(),
  exitPrice: z.coerce.number().positive(),
  size: z.coerce.number().positive(),
  pnl: z.coerce.number(),
  rMultiple: z.coerce.number().optional(),
  setup: z.string().optional(),
  emotions: z.string().optional(),
  notes: z.string().optional(),
});

type JournalEntry = z.infer<typeof journalEntrySchema>;

const setupTags = ["Breakout", "Mean Reversion", "Trend Continuation", "Range Play", "Other"];

const mockJournalEntries: JournalEntry[] = [
    { id: '1', datetime: new Date(new Date().setDate(new Date().getDate() - 1)), instrument: 'BTC-PERP', direction: 'Long', entryPrice: 68500, exitPrice: 68969.5, size: 0.5, pnl: 234.75, rMultiple: 2.1, setup: "Breakout", emotions: "Confident, Calm", notes: "Clean breakout above resistance. Good follow-through." },
    { id: '2', datetime: new Date(new Date().setDate(new Date().getDate() - 2)), instrument: 'ETH-PERP', direction: 'Short', entryPrice: 3605, exitPrice: 3625, size: 12, pnl: -240, rMultiple: -1, setup: "Mean Reversion", emotions: "Anxious, Revenge Trading", notes: "Felt like the top but market kept pushing. Stopped out." },
    { id: '3', datetime: new Date(new Date().setDate(new Date().getDate() - 3)), instrument: 'SOL-PERP', direction: 'Long', entryPrice: 162, exitPrice: 168, size: 50, pnl: 300, rMultiple: 3, setup: "Trend Continuation", emotions: "Calm", notes: "Bounced perfectly off the 4H EMA. Textbook setup." },
];

const useJournal = () => {
    const { toast } = useToast();
    const { addLog } = useEventLog();
    const [entries, setEntries] = useState<JournalEntry[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("ec_journal_entries");
            setEntries(saved ? JSON.parse(saved) : mockJournalEntries);
        }
    }, []);

    const addOrUpdateEntry = (entry: Omit<JournalEntry, 'id'> & {id?: string}) => {
        setEntries(prev => {
            let newEntries;
            if (entry.id) {
                newEntries = prev.map(e => e.id === entry.id ? { ...e, ...entry } : e);
            } else {
                newEntries = [{ ...entry, id: new Date().toISOString() }, ...prev];
            }
            if (typeof window !== "undefined") {
                localStorage.setItem("ec_journal_entries", JSON.stringify(newEntries));
            }
            addLog(`Journal entry saved: ${entry.instrument} ${entry.direction}`);
            toast({
                title: "Journal Entry Saved",
                description: "Your trade has been logged successfully.",
            });
            return newEntries;
        });
    };

    return { entries, addOrUpdateEntry };
}

function JournalTab({ entries, addOrUpdateEntry, onSetModule }: { entries: JournalEntry[], addOrUpdateEntry: (entry: JournalEntry) => void, onSetModule: TradeJournalModuleProps['onSetModule'] }) {
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

    const form = useForm<JournalEntry>({
        resolver: zodResolver(journalEntrySchema),
    });

    useEffect(() => {
        if (editingEntry) {
            form.reset(editingEntry);
        } else {
            form.reset({
                datetime: new Date(),
                direction: "Long",
                instrument: "",
                entryPrice: 0,
                exitPrice: 0,
                size: 0,
                pnl: 0,
                notes: "",
                emotions: "",
                setup: "",
            });
        }
    }, [editingEntry, form]);

    const onSubmit = (values: JournalEntry) => {
        addOrUpdateEntry(values);
        setEditingEntry(null);
    };

    const discussWithArjun = (entry: JournalEntry) => {
        const question = `Arjun, can we review this trade? ${entry.direction} ${entry.instrument} on ${format(entry.datetime, "PPP")}. The result was a ${entry.pnl > 0 ? 'win' : 'loss'} of $${Math.abs(entry.pnl)}. My notes say: "${entry.notes}". What can I learn from this?`;
        onSetModule('aiCoaching', { initialMessage: question });
    }

    return (
        <div className="space-y-8">
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle>{editingEntry ? 'Edit Trade' : 'Add New Trade'}</CardTitle>
                    <CardDescription>Log your trades to build a rich history for Arjun to analyze.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <FormField control={form.control} name="instrument" render={({ field }) => (
                                    <FormItem><FormLabel>Instrument</FormLabel><FormControl><Input placeholder="e.g., BTC-PERP" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="datetime" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Date & Time</FormLabel>
                                        <Popover><PopoverTrigger asChild>
                                            <Button variant="outline" className={cn(!field.value && "text-muted-foreground", "font-normal justify-start")}>
                                                <Calendar className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
                                    <FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="direction" render={({ field }) => (
                                    <FormItem><FormLabel>Direction</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Long" /></FormControl><FormLabel className="font-normal">Long</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Short" /></FormControl><FormLabel className="font-normal">Short</FormLabel></FormItem></RadioGroup></FormControl></FormItem>
                                )} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FormField control={form.control} name="entryPrice" render={({ field }) => (<FormItem><FormLabel>Entry Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="exitPrice" render={({ field }) => (<FormItem><FormLabel>Exit Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="size" render={({ field }) => (<FormItem><FormLabel>Size</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="pnl" render={({ field }) => (<FormItem><FormLabel>PnL ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="setup" render={({ field }) => (
                                    <FormItem><FormLabel>Setup Tag</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a setup" /></SelectTrigger></FormControl><SelectContent>{setupTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="emotions" render={({ field }) => (
                                    <FormItem><FormLabel>Emotion Tags</FormLabel><FormControl><Input placeholder="e.g., Confident, Anxious" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                             <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem><FormLabel>Notes & Review</FormLabel><FormControl><Textarea placeholder="What was your thesis? How did you manage the trade? What did you learn?" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="flex justify-end gap-2 pt-4">
                                {editingEntry && <Button type="button" variant="ghost" onClick={() => setEditingEntry(null)}>Cancel</Button>}
                                <Button type="submit">Save to Journal (Prototype)</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="bg-muted/30 border-border/50">
                 <CardHeader>
                    <CardTitle>Recent Journal Entries</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead><TableHead>Instrument</TableHead><TableHead>Direction</TableHead>
                                    <TableHead>PnL ($)</TableHead><TableHead>Setup</TableHead><TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.slice(0, 10).map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{format(entry.datetime, "yyyy-MM-dd")}</TableCell>
                                        <TableCell>{entry.instrument}</TableCell>
                                        <TableCell className={cn(entry.direction === "Long" ? "text-green-400" : "text-red-400")}>{entry.direction}</TableCell>
                                        <TableCell className={cn(entry.pnl >= 0 ? "text-green-400" : "text-red-400")}>{entry.pnl.toFixed(2)}</TableCell>
                                        <TableCell><Badge variant="secondary">{entry.setup}</Badge></TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setEditingEntry(entry)}>Edit</Button>
                                            <Button variant="link" size="sm" className="px-1 h-auto" onClick={() => discussWithArjun(entry)}>
                                                <Bot className="mr-1 h-4 w-4" /> Discuss
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}

function HistoricalTradesTab() {
    return (
        <div className="space-y-8">
            <Card className="bg-muted/30 border-border/50">
                 <CardHeader>
                    <CardTitle>Trade History & Filters</CardTitle>
                    <CardDescription>Analyze your past performance to find an edge.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/50 rounded-lg">
                        <FormItem><FormLabel>Date Range</FormLabel><Button variant="outline" className="font-normal w-[240px] justify-start"><Calendar className="mr-2 h-4 w-4" />{format(new Date(new Date().setDate(new Date().getDate() - 30)), "LLL dd, y")} - {format(new Date(), "LLL dd, y")}</Button></FormItem>
                        <FormItem><FormLabel>Instrument</FormLabel><Input placeholder="e.g., BTC-PERP" className="w-[180px]" /></FormItem>
                        <FormItem><FormLabel>Setup Tag</FormLabel><Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Any setup" /></SelectTrigger><SelectContent>{setupTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}</SelectContent></Select></FormItem>
                        <FormItem><FormLabel>Result</FormLabel><Select><SelectTrigger className="w-[120px]"><SelectValue placeholder="Any" /></SelectTrigger><SelectContent><SelectItem value="win">Win</SelectItem><SelectItem value="loss">Loss</SelectItem></SelectContent></Select></FormItem>
                        <Button><Filter className="mr-2 h-4 w-4" />Apply Filters</Button>
                    </div>

                     <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div><p className="text-sm text-muted-foreground">Total Trades</p><p className="font-semibold text-foreground font-mono">138</p></div>
                            <div><p className="text-sm text-muted-foreground">Win Rate</p><p className="font-semibold text-foreground font-mono">43.5%</p></div>
                            <div><p className="text-sm text-muted-foreground">Average R</p><p className="font-semibold text-foreground font-mono">1.25</p></div>
                            <div><p className="text-sm text-muted-foreground">Net PnL</p><p className="font-semibold text-green-400 font-mono">$1,280.50</p></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-muted/30 border-border/50">
                 <CardHeader>
                    <CardTitle>Filtered Trades</CardTitle>
                </CardHeader>
                 <CardContent>
                    <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-lg">
                         <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold text-foreground">Historical Analysis Coming Soon</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            This is a prototype. In the full version, this table will show your filtered historical trades.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function TradeJournalModule({ onSetModule }: TradeJournalModuleProps) {
    const { entries, addOrUpdateEntry } = useJournal();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Trade Journal</h1>
                <p className="text-muted-foreground">The single source of truth for your trading life. Log, review, and learn.</p>
            </div>
             <Tabs defaultValue="journal" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="journal">Journal</TabsTrigger>
                    <TabsTrigger value="history">Historical Trades</TabsTrigger>
                </TabsList>
                <TabsContent value="journal" className="pt-6">
                    <JournalTab entries={entries} addOrUpdateEntry={addOrUpdateEntry as any} onSetModule={onSetModule} />
                </TabsContent>
                <TabsContent value="history" className="pt-6">
                    <HistoricalTradesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
