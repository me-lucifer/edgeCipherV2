
"use client";

import { useState } from "react";
import { useAuth, type OnboardingStep } from "@/context/auth-provider";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { CheckCircle, Circle, User, HelpCircle, Link2, History, Bot, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { OnboardingQuestionnaire } from "./onboarding-questionnaire";

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

function OnboardingStepContent({ currentStep, onNext, onBack }: { currentStep: OnboardingStep, onNext: () => void, onBack: () => void }) {
    // These are placeholders. Each will be built out in subsequent steps.
    const content: Record<OnboardingStep, React.ReactNode> = {
        welcome: (
            <WelcomeStep onContinue={onNext} />
        ),
        questionnaire: (
            <OnboardingQuestionnaire onComplete={onNext} onBack={onBack} />
        ),
        broker: (
             <div>
                <h2 className="text-2xl font-semibold text-foreground">Connect Your Broker</h2>
                <p className="mt-2 text-muted-foreground">Connect your exchange account so Arjun can analyze your trades. (Content for this step will be added next).</p>
            </div>
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

    const isWelcomeStep = currentStep === 'welcome';
    const isQuestionnaireStep = currentStep === 'questionnaire';

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1">
                {content[currentStep]}
            </div>
            {!isWelcomeStep && !isQuestionnaireStep && (
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
                                />
                            </div>
                        </main>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
