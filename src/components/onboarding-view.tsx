
"use client";

import { useState, useEffect } from "react";
import { useAuth, type OnboardingStep } from "@/context/auth-provider";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { CheckCircle, Circle, User, HelpCircle, Link2, History, Bot, PlayCircle, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { OnboardingQuestionnaire } from "./onboarding-questionnaire";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";

const steps: { id: OnboardingStep; title: string; icon: React.ElementType }[] = [
    { id: "welcome", title: "Welcome", icon: User },
    { id: "questionnaire", title: "Questionnaire", icon: HelpCircle },
    { id: "broker", title: "Broker connection", icon: Link2 },
    { id: "history", title: "History & AI analysis", icon: History },
    { id: "persona", title: "Persona summary", icon: Bot },
];

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
    const [hasAgreed, setHasAgreed] = useState(false);
    const { toast } = useToast();

    const handleVideoClick = () => {
        toast({
            title: "Intro Video",
            description: "In a real product, an introductory video would play here.",
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-foreground">Arjun will help you trade better, not more.</h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                    <p>
                        Welcome to EdgeCipher. You're about to set up your AI mentor, <span className="font-semibold text-primary">Arjun</span>. This one-time process is crucial because successful trading isn't just about charts—it's about psychology, discipline, and having a system.
                    </p>
                    <p>
                        Instead of giving you signals, Arjun analyzes your actual trade history and journaling to give you personalized coaching. This onboarding will help us understand your starting point.
                    </p>
                </div>
            </div>
            
            <Card 
                className="group cursor-pointer aspect-video rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg shadow-primary/10 relative flex flex-col items-center justify-center text-center p-8 bg-muted/30 transition-all hover:border-primary/40"
                onClick={handleVideoClick}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/20" />
                <div className="relative z-10">
                        <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                        <PlayCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">5-minute intro: how EdgeCipher and Arjun work</h3>
                </div>
            </Card>

            <div className="space-y-4 pt-4">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="understand-intro" checked={hasAgreed} onCheckedChange={(checked) => setHasAgreed(checked as boolean)} />
                    <Label htmlFor="understand-intro" className="text-sm font-normal text-muted-foreground cursor-pointer">
                        I've watched or understand the intro.
                    </Label>
                </div>
                 <Button onClick={onContinue} disabled={!hasAgreed} className="w-full sm:w-auto">
                    Continue to Questionnaire
                </Button>
            </div>
            
            <p className="text-xs text-muted-foreground/80 pt-4">
                You can always revisit this intro later from the Help section in the full app.
            </p>
        </div>
    );
}

const brokerSchema = z.object({
    apiKey: z.string().min(1, "API Key is required."),
    apiSecret: z.string().min(1, "API Secret is required."),
});

function BrokerConnectionStep({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void; }) {
    const { toast } = useToast();
    const videoThumbnail = PlaceHolderImages.find(p => p.id === 'video-thumbnail');
    const [showSkipWarning, setShowSkipWarning] = useState(false);

    const form = useForm<z.infer<typeof brokerSchema>>({
        resolver: zodResolver(brokerSchema),
        defaultValues: { apiKey: "", apiSecret: "" },
    });

    const onSubmit = (values: z.infer<typeof brokerSchema>) => {
        console.log("Connect broker (prototype):", values);
        if (typeof window !== "undefined") {
            localStorage.setItem("ec_broker_connected", "true");
            localStorage.setItem("ec_broker_name", "Delta");
        }
        onContinue();
    };

    const handleSkip = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem("ec_broker_connected", "false");
        }
        setShowSkipWarning(true);
        // Delay navigation to show the warning
        setTimeout(() => {
            onSkip();
        }, 3000);
    };

    const handleVideoClick = () => {
        toast({
            title: "Video Placeholder",
            description: "In a real product, a guide on creating API keys would play here.",
        });
    };

    return (
        <div className="space-y-6">
            <p className="text-muted-foreground">
                To analyze your real trading behavior, Arjun needs read-only access to your trade history.
                EdgeCipher never controls your capital.
            </p>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: Form */}
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle>Connect Delta Exchange</CardTitle>
                        <CardDescription>Enter your read-only API keys below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="apiKey"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>API Key</FormLabel>
                                            <FormControl><Input placeholder="Your API Key" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="apiSecret"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>API Secret</FormLabel>
                                            <FormControl><Input type="password" placeholder="••••••••••••••••" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full">
                                    Connect Delta (Prototype)
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Right: Help/Info */}
                <div className="space-y-4">
                    <Card
                        onClick={handleVideoClick}
                        className="group cursor-pointer overflow-hidden border-border/50 bg-muted/30 transition-all hover:border-primary/30"
                    >
                        <div className="relative aspect-video">
                            {videoThumbnail && (
                                <Image
                                    src={videoThumbnail.imageUrl} alt="How to get API keys"
                                    fill style={{ objectFit: 'cover' }}
                                    className="opacity-20 transition-opacity group-hover:opacity-30"
                                    data-ai-hint={videoThumbnail.imageHint}
                                />
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                <div className="w-12 h-12 rounded-full border-2 border-primary/50 flex items-center justify-center mb-2 transition-colors group-hover:border-primary">
                                    <PlayCircle className="h-6 w-6 text-primary/80 transition-colors group-hover:text-primary" />
                                </div>
                                <h4 className="font-semibold text-foreground">How to create API keys on Delta</h4>
                            </div>
                        </div>
                    </Card>
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader className="flex-row items-center gap-4 space-y-0 p-4">
                            <Lock className="h-5 w-5 text-primary flex-shrink-0" />
                            <CardTitle className="text-base">Your Security is Critical</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <ul className="space-y-2 text-xs text-muted-foreground">
                                <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" /><span>Always use <strong>read-only</strong> API keys.</span></li>
                                <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" /><span>EdgeCipher will never ask for withdrawal permissions.</span></li>
                                <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" /><span>You can revoke keys at any time from the exchange.</span></li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="pt-4 text-center">
                <Button variant="link" onClick={handleSkip} disabled={showSkipWarning}>
                    Skip for now – I’ll connect later
                </Button>
            </div>

            {showSkipWarning && (
                <Alert variant="default" className="bg-muted/50 border-primary/30">
                    <AlertDescription className="text-center text-primary">
                        Skipping... Your initial coaching will be based only on your questionnaire.
                    </AlertDescription>
                </Alert>
            )}

        </div>
    );
}


function OnboardingStepContent({ currentStep, onNext, onBack, onSkipToPersona }: { currentStep: OnboardingStep, onNext: () => void, onBack: () => void, onSkipToPersona: () => void }) {
    // These are placeholders. Each will be built out in subsequent steps.
    const content: Record<OnboardingStep, React.ReactNode> = {
        welcome: (
            <WelcomeStep onContinue={onNext} />
        ),
        questionnaire: (
            <OnboardingQuestionnaire onComplete={onNext} onBack={onBack} />
        ),
        broker: (
             <BrokerConnectionStep onContinue={onNext} onSkip={onSkipToPersona} />
        ),
        history: (
             <div>
                <h2 className="text-2xl font-semibold text-foreground">Analyze Your History</h2>
                <p className="mt-2 text-muted-foreground">Arjun is now analyzing your past performance to find patterns. (Content for this step will be added next).</p>
            </div>
        ),
        persona: (
             <div>
                <h2 className="text-2xl font-semibold text-foreground">Your Trading Persona</h2>
                <p className="mt-2 text-muted-foreground">Based on your data, here's your initial trader persona. (Content for this step will be added next).</p>
            </div>
        ),
    };

    const isComplexStep = ['welcome', 'questionnaire', 'broker'].includes(currentStep);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1">
                {content[currentStep]}
            </div>
            {!isComplexStep && (
                <div className="flex justify-between items-center pt-8 mt-auto">
                    <div>
                        <Button variant="ghost" onClick={onBack}>Back</Button>
                    </div>
                    <Button onClick={onNext}>
                        {currentStep === 'persona' ? 'Finish & Go to Dashboard' : 'Continue'}
                    </Button>
                </div>
            )}
        </div>
    )
}


export function OnboardingView() {
    const { onboardingStep, setOnboardingStep, completeOnboarding, logout } = useAuth();
    
    const currentStepIndex = steps.findIndex(step => step.id === onboardingStep);
    const progress = ((currentStepIndex + 1) / steps.length) * 100;

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setOnboardingStep(steps[currentStepIndex + 1].id);
        } else {
            completeOnboarding();
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setOnboardingStep(steps[currentStepIndex - 1].id);
        }
    };
    
    const handleSetStep = (stepId: OnboardingStep) => {
        const newStepIndex = steps.findIndex(s => s.id === stepId);
        // Allow navigation only to previous steps
        if (newStepIndex < currentStepIndex) {
            setOnboardingStep(stepId);
        }
    }
    
    const handleSkipToPersona = () => {
        setOnboardingStep('persona');
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
            <Card className="w-full max-w-4xl bg-muted/20 border-border/50">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-border/50">
                        <p className="text-sm text-muted-foreground">Step {currentStepIndex + 1} of {steps.length}</p>
                        <Progress value={progress} className="mt-2 h-2" />
                    </div>
                    <div className="grid md:grid-cols-[240px_1fr]">
                        {/* Left: Step navigation */}
                        <aside className="hidden md:flex flex-col gap-1 p-6 border-r border-border/50">
                             <h3 className="px-2 pb-2 text-sm font-semibold text-foreground">Onboarding Steps</h3>
                            {steps.map((step, index) => {
                                const isCompleted = index < currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => handleSetStep(step.id)}
                                        disabled={index > currentStepIndex}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md p-2 text-left text-sm transition-colors",
                                            isCurrent ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground",
                                            index < currentStepIndex ? "hover:bg-muted/50 hover:text-foreground cursor-pointer" : "cursor-default"
                                        )}
                                    >
                                        {isCompleted ? <CheckCircle className="h-5 w-5 text-primary" /> : <step.icon className="h-5 w-5" />}
                                        <span>{step.title}</span>
                                    </button>
                                );
                            })}
                            <div className="mt-auto pt-8">
                                <Button variant="link" size="sm" className="text-muted-foreground" onClick={logout}>Logout & Exit</Button>
                            </div>
                        </aside>

                        {/* Right: Active step content */}
                        <main className="p-8">
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">{steps[currentStepIndex].title}</h1>
                            <p className="mt-2 text-sm text-muted-foreground">This is a one-time setup so Arjun can coach you properly.</p>
                            <div className="mt-8">
                                <OnboardingStepContent 
                                    currentStep={onboardingStep}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                    onSkipToPersona={handleSkipToPersona}
                                />
                            </div>
                        </main>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    