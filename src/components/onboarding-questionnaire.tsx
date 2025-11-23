
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const questionnaireSchema = z.object({
    experience: z.string().min(1, "Please select an option."),
    style: z.string().min(1, "Please select an option."),
    volatilityComfort: z.number().min(1).max(5),
    
    majorLoss: z.enum(["yes", "no"]),
    lossBehavior: z.string().optional(),

    ruleBreaking: z.string().min(1, "Please select an option."),
    biggestStruggle: z.string().min(1, "Please select an option."),
    winningStreakBehavior: z.string().min(1, "Please select an option."),
    losingStreakBehavior: z.string().min(1, "Please select an option."),

    journalConsistency: z.string().min(1, "Please select an option."),
    primaryGoal: z.string().min(1, "Please select an option."),
    timeCommitment: z.number().min(1).max(5),
    extraInfo: z.string().optional(),
});

type QuestionnaireAnswers = z.infer<typeof questionnaireSchema>;

const defaultValues: Partial<QuestionnaireAnswers> = {
    volatilityComfort: 3,
    timeCommitment: 3,
};

const totalPages = 4;

interface OnboardingQuestionnaireProps {
  onComplete: () => void;
  onBack: () => void;
}

export function OnboardingQuestionnaire({ onComplete, onBack }: OnboardingQuestionnaireProps) {
    const [page, setPage] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const form = useForm<QuestionnaireAnswers>({
        resolver: zodResolver(questionnaireSchema),
        defaultValues: (() => {
            if (typeof window !== "undefined") {
                const savedAnswers = localStorage.getItem("ec_onboarding_answers");
                if (savedAnswers) {
                    try {
                        return { ...defaultValues, ...JSON.parse(savedAnswers) };
                    } catch (e) {
                        return defaultValues;
                    }
                }
            }
            return defaultValues;
        })(),
    });

    const watchMajorLoss = form.watch("majorLoss");

    useEffect(() => {
        const subscription = form.watch((value) => {
             if (typeof window !== "undefined") {
                localStorage.setItem("ec_onboarding_answers", JSON.stringify(value));
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);


    const handleNextPage = async () => {
        let isValid = false;
        if (page === 1) isValid = await form.trigger(["experience", "style", "volatilityComfort"]);
        if (page === 2) isValid = await form.trigger(["majorLoss", "lossBehavior"]);
        if (page === 3) isValid = await form.trigger(["ruleBreaking", "biggestStruggle", "winningStreakBehavior", "losingStreakBehavior"]);
        
        if (isValid || page === 4) {
             setPage(p => p + 1);
        }
    };

    const handleBackPage = () => {
        if (page > 1) {
            setPage(p => p - 1);
        } else {
            onBack();
        }
    };

    const onSubmit = (values: QuestionnaireAnswers) => {
        console.log("Final answers:", values);
        setIsAnalyzing(true);
        
        // Simulate persona generation
        setTimeout(() => {
            const riskScore = (values.volatilityComfort * 10) + (values.majorLoss === 'yes' ? 20 : 5) + (values.ruleBreaking === 'Often' ? 20 : 0);
            const persona = {
                primaryPersonaName: "The Impulsive Sprinter", // Placeholder
                riskScore: Math.min(100, riskScore),
                emotionScore: 65, // Placeholder
                disciplineScore: 40, // Placeholder
            };
            if (typeof window !== "undefined") {
                localStorage.setItem("ec_persona_base", JSON.stringify(persona));
            }

            setIsAnalyzing(false);
            onComplete();
        }, 2000);
    };

    const pageProgress = (page / totalPages) * 100;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 relative">
                 {isAnalyzing && (
                    <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 font-semibold text-foreground">Analyzing your responses...</p>
                        <p className="text-sm text-muted-foreground">Generating your trader persona.</p>
                    </div>
                )}
                
                <div className={cn("space-y-8", isAnalyzing ? 'blur-sm' : '')}>
                    {page === 1 && (
                         <>
                            <FormField
                                control={form.control}
                                name="experience"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>How long have you been trading crypto futures?</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4 pt-2">
                                                {["< 3 months", "3-12 months", "1-3 years", "3+ years"].map(val => (
                                                    <FormItem key={val} className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value={val} />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">{val}</FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="style"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>What best describes your trading style?</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4 pt-2">
                                                {["Scalper", "Day trader", "Swing", "Position", "Not sure"].map(val => (
                                                    <FormItem key={val} className="flex items-center space-x-3 space-y-0">
                                                        <FormControl><RadioGroupItem value={val} /></FormControl>
                                                        <FormLabel className="font-normal">{val}</FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="volatilityComfort"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>On a scale of 1-5, how comfortable are you with volatility and big swings in PnL?</FormLabel>
                                        <FormControl>
                                            <div className="pt-2">
                                                <Slider
                                                    min={1} max={5} step={1}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                                    <span>1 (Hate it)</span>
                                                    <span>3 (Neutral)</span>
                                                    <span>5 (Very comfortable)</span>
                                                </div>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </>
                    )}

                    {page === 2 && (
                         <>
                            <FormField
                                control={form.control}
                                name="majorLoss"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Have you ever lost more than 30% of your account in a short period?</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8 pt-2">
                                                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                           {watchMajorLoss === 'yes' && (
                                <FormField
                                    control={form.control}
                                    name="lossBehavior"
                                    render={({ field }) => (
                                        <FormItem className="p-4 rounded-md border bg-muted/50">
                                            <FormLabel>How did that loss affect your behaviour?</FormLabel>
                                            <FormControl>
                                                 <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="pt-2">
                                                    {["Stopped trading for a while", "Traded more to recover (revenge trading)", "Ignored it and continued my plan", "Other"].map(val => (
                                                        <FormItem key={val} className="flex items-center space-x-3 space-y-0">
                                                            <FormControl><RadioGroupItem value={val} /></FormControl>
                                                            <FormLabel className="font-normal">{val}</FormLabel>
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={form.control}
                                name="ruleBreaking"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>How often do you break your own trading rules?</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4 pt-2">
                                                {["Never", "Rarely", "Sometimes", "Often", "I don’t have clear rules"].map(val => (
                                                    <FormItem key={val} className="flex items-center space-x-3 space-y-0">
                                                        <FormControl><RadioGroupItem value={val} /></FormControl>
                                                        <FormLabel className="font-normal">{val}</FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}

                    {page === 3 && (
                        <>
                             <FormField
                                control={form.control}
                                name="biggestStruggle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>What’s your biggest psychological struggle in trading?</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4 pt-2">
                                                {["FOMO (fear of missing out)", "Revenge trading", "Overtrading", "Fear of pulling the trigger", "Moving stops or targets", "Other"].map(val => (
                                                    <FormItem key={val} className="flex items-center space-x-3 space-y-0">
                                                        <FormControl><RadioGroupItem value={val} /></FormControl>
                                                        <FormLabel className="font-normal">{val}</FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="winningStreakBehavior"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>When you’re on a winning streak, what tends to happen?</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4 pt-2">
                                                {["I increase my size too much", "I start taking random trades", "I stick to my plan", "Other"].map(val => (
                                                    <FormItem key={val} className="flex items-center space-x-3 space-y-0">
                                                        <FormControl><RadioGroupItem value={val} /></FormControl>
                                                        <FormLabel className="font-normal">{val}</FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="losingStreakBehavior"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>When you’re on a losing streak, what tends to happen?</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4 pt-2">
                                                {["I stop trading for a while", "I trade more to make it back", "I change my strategy randomly", "I stick to my plan", "Other"].map(val => (
                                                    <FormItem key={val} className="flex items-center space-x-3 space-y-0">
                                                        <FormControl><RadioGroupItem value={val} /></FormControl>
                                                        <FormLabel className="font-normal">{val}</FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}

                    {page === 4 && (
                        <>
                             <FormField
                                control={form.control}
                                name="journalConsistency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>How consistently do you keep a trade journal?</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4 pt-2">
                                                {["Never", "Rarely", "Sometimes", "Consistently"].map(val => (
                                                    <FormItem key={val} className="flex items-center space-x-3 space-y-0">
                                                        <FormControl><RadioGroupItem value={val} /></FormControl>
                                                        <FormLabel className="font-normal">{val}</FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="primaryGoal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>What’s your primary goal for the next 6-12 months?</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4 pt-2">
                                                {["Become consistently profitable", "Protect my capital", "Grow returns aggressively", "Learn the foundations"].map(val => (
                                                    <FormItem key={val} className="flex items-center space-x-3 space-y-0">
                                                        <FormControl><RadioGroupItem value={val} /></FormControl>
                                                        <FormLabel className="font-normal">{val}</FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="timeCommitment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>How many hours per week can you realistically dedicate to improving your trading (review, journaling, etc.)?</FormLabel>
                                        <FormControl>
                                            <div className="pt-2">
                                                <Slider
                                                    min={1} max={5} step={1}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                                 <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                                    <span>~1-2 hrs</span>
                                                    <span>~5-7 hrs</span>
                                                    <span>10+ hrs</span>
                                                </div>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="extraInfo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Anything else Arjun should know about your trading history or mindset?</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Optional: e.g., 'I only trade Bitcoin', 'I struggle with weekend trading', etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                </div>

                <div className="pt-8">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                        <Progress value={pageProgress} className="w-1/2" />
                    </div>
                     <div className="flex justify-between items-center pt-8 mt-auto">
                        <div>
                            <Button variant="ghost" type="button" onClick={handleBackPage}>Back</Button>
                        </div>
                        {page < totalPages ? (
                            <Button type="button" onClick={handleNextPage}>Next</Button>
                        ) : (
                            <Button type="submit">Generate my profile</Button>
                        )}
                    </div>
                </div>

                {page === totalPages && (
                    <p className="text-xs text-center text-muted-foreground mt-4">
                        Perfect — Arjun now understands the basics of your trading mind. Next, we’ll connect your trades if you have any history.
                    </p>
                )}
            </form>
        </Form>
    );
}
