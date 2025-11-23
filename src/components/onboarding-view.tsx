
"use client";

import { useAuth } from "@/context/auth-provider";
import { Button } from "./ui/button";

export function OnboardingView() {
    const { onboardingStep, setOnboardingStep, completeOnboarding, logout } = useAuth();
    
    const nextStep = () => {
        switch(onboardingStep) {
            case "welcome":
                setOnboardingStep("questionnaire");
                break;
            case "questionnaire":
                setOnboardingStep("broker");
                break;
            case "broker":
                setOnboardingStep("history");
                break;
            case "history":
                setOnboardingStep("persona");
                break;
            case "persona":
                completeOnboarding();
                break;
        }
    }

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-center p-4">
            <div className="max-w-xl">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Onboarding Wizard
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                    This is where the user would complete their profile.
                </p>
                <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-border">
                    <p className="text-2xl font-semibold text-primary">{onboardingStep.charAt(0).toUpperCase() + onboardingStep.slice(1)}</p>
                    <p className="text-muted-foreground mt-2">
                        Current Step: <strong>{onboardingStep}</strong>
                    </p>
                </div>

                <div className="mt-8 flex gap-4 justify-center">
                    <Button onClick={nextStep}>
                        {onboardingStep === 'persona' ? 'Finish Onboarding' : 'Next Step (Prototype)'}
                    </Button>
                    <Button variant="outline" onClick={logout}>
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
}
