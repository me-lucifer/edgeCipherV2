
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, BrainCircuit, Activity, ShieldAlert, Send, CornerDownLeft, Info, PanelRightOpen, PanelRightClose } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { Progress } from "./ui/progress";

interface AiCoachingModuleProps {
    onSetModule: (module: any) => void;
}

interface Persona {
    primaryPersonaName?: string;
    riskScore?: number;
    emotionScore?: number;
    disciplineScore?: number;
}

const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

function ScoreGauge({ label, value, colorClass }: { label: string; value: number; colorClass: string; }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span className="text-sm font-bold text-foreground">{value}</span>
            </div>
            <Progress value={value} indicatorClassName={colorClass} className="h-2" />
        </div>
    )
}

export function AiCoachingModule({ onSetModule }: AiCoachingModuleProps) {
    const [persona, setPersona] = useState<Persona>({});
    const [isContextPanelOpen, setContextPanelOpen] = useState(true);
    const mentorCardImage = PlaceHolderImages.find(p => p.id === 'mentor-card');

    useEffect(() => {
        if (typeof window !== "undefined") {
            const personaData = localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base");
            if (personaData) {
                setPersona(JSON.parse(personaData));
            }
        }
    }, []);

    const form = useForm<z.infer<typeof chatSchema>>({
        resolver: zodResolver(chatSchema),
        defaultValues: { message: "" },
    });
    
    const onSubmit = (values: z.infer<typeof chatSchema>) => {
        console.log("Chat message submitted:", values.message);
        form.reset();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Coaching</h1>
                    <p className="text-muted-foreground">Chat with Arjun, your AI trading mentor.</p>
                </div>
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setContextPanelOpen(!isContextPanelOpen)}>
                    {isContextPanelOpen ? <PanelRightClose /> : <PanelRightOpen />}
                </Button>
            </div>
            <div className="flex-1 grid lg:grid-cols-3 gap-8 min-h-0">
                {/* Main chat area */}
                <Card className="lg:col-span-2 bg-muted/30 border-border/50 flex flex-col">
                    <CardHeader className="flex-row items-center gap-4">
                        {mentorCardImage && (
                            <Image
                                src={mentorCardImage.imageUrl}
                                alt="Arjun AI Mentor Avatar"
                                width={40}
                                height={40}
                                className="rounded-full border-2 border-primary/50"
                                data-ai-hint={mentorCardImage.imageHint}
                            />
                        )}
                        <div>
                            <CardTitle>Arjun</CardTitle>
                            <CardDescription>Ask about your trades, psychology, or a specific pattern.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1 pr-4 -mr-4">
                            <div className="space-y-6">
                                {/* Mock chat messages */}
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-full bg-primary/20 border border-primary/30"><Bot className="h-5 w-5 text-primary" /></div>
                                    <div className="bg-muted p-4 rounded-lg rounded-tl-none max-w-xl">
                                        <p className="text-sm">Welcome back. Let's review your last session. What's on your mind?</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 flex-row-reverse">
                                     <div className="p-2 rounded-full bg-background border"><User className="h-5 w-5 text-foreground" /></div>
                                    <div className="bg-primary text-primary-foreground p-4 rounded-lg rounded-tr-none max-w-xl">
                                        <p className="text-sm">I got stopped out of my ETH short yesterday and it felt unfair. The market just seemed to be hunting stops.</p>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                        <div className="mt-4 pt-4 border-t border-border/50">
                             <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="relative">
                                    <FormField
                                        control={form.control}
                                        name="message"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="e.g., Let's review my last trade on BTC..."
                                                    className="pr-20 min-h-[60px]"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            form.handleSubmit(onSubmit)();
                                                        }
                                                    }}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="absolute -bottom-6 left-2" />
                                        </FormItem>
                                        )}
                                    />
                                    <div className="absolute top-3 right-3 flex items-center gap-2">
                                        <Button type="submit" size="icon">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                                <CornerDownLeft className="h-3 w-3" /> Press Enter to send, Shift+Enter for new line.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Right context panel */}
                <div className={cn("lg:block", isContextPanelOpen ? "block" : "hidden")}>
                    <Card className="bg-muted/30 border-border/50 sticky top-24">
                        <CardHeader>
                            <CardTitle>About you</CardTitle>
                            <CardDescription>Arjun uses this to tailor its coaching.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <p className="font-semibold text-primary mb-2">{persona.primaryPersonaName || "The Determined Trader"}</p>
                                <p className="text-xs text-muted-foreground italic">Your trading persona identifies your primary psychological tendencies and biases.</p>
                            </div>
                            <div className="space-y-4">
                                <ScoreGauge label="Risk Profile" value={persona.riskScore || 68} colorClass="bg-red-500" />
                                <ScoreGauge label="Emotional Control" value={persona.emotionScore || 45} colorClass="bg-yellow-500" />
                                <ScoreGauge label="Discipline Index" value={persona.disciplineScore || 55} colorClass="bg-blue-500" />
                            </div>
                            <div className="space-y-4 pt-2">
                                 <div>
                                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Activity className="h-4 w-4 text-green-500" />Strengths</h4>
                                    <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                                        <li>Quick to spot opportunities</li>
                                        <li>Comfortable with volatility</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-500" />Watch-outs</h4>
                                    <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                                        <li>Prone to FOMO & revenge trading</li>
                                        <li>Can break rules on losing streaks</li>
                                    </ul>
                                </div>
                            </div>
                             <p className="text-xs text-muted-foreground/80 pt-4 flex items-start gap-2">
                                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>This data is based on your onboarding answers and trade history analysis.</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
