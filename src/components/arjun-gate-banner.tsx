"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Video, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface ArjunGateState {
    active: boolean;
    reason: string;
    videoId: string;
    expiresAt?: number;
}

interface ArjunGateBannerProps {
  onWatchNow: (videoId: string) => void;
}

export function ArjunGateBanner({ onWatchNow }: ArjunGateBannerProps) {
  const [gateState, setGateState] = useState<ArjunGateState | null>(null);

  const checkGate = useCallback(() => {
    const gateString = localStorage.getItem("ec_arjun_gate");
    if(gateString) {
        try {
            const parsed = JSON.parse(gateString) as ArjunGateState;
            if (parsed.active && (!parsed.expiresAt || Date.now() > parsed.expiresAt)) {
                setGateState(parsed);
            } else {
                setGateState(null);
            }
        } catch(e) {
            console.error("Failed to parse arjun gate state", e);
            setGateState(null);
        }
    } else {
        setGateState(null);
    }
  }, []);

  useEffect(() => {
    checkGate();
    window.addEventListener('storage', checkGate);
    const interval = setInterval(checkGate, 30000); // Check for expired snoozes
    return () => {
      window.removeEventListener('storage', checkGate);
      clearInterval(interval);
    }
  }, [checkGate]);

  if (!gateState) return null;

  const handleSnooze = () => {
    const newGateState = {
        ...gateState,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    };
    localStorage.setItem("ec_arjun_gate", JSON.stringify(newGateState));
    setGateState(null);
  };

  const handleDismiss = () => {
      const newGateState = {
          ...gateState,
          expiresAt: Date.now() + 4 * 60 * 60 * 1000, // 4 hours
      };
      localStorage.setItem("ec_arjun_gate", JSON.stringify(newGateState));
      setGateState(null);
  }

  return (
    <Alert variant="default" className="bg-primary/10 border-primary/20 text-foreground">
      <Video className="h-4 w-4 text-primary" />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <AlertTitle className="text-primary">Arjun Suggests a Lesson Before You Trade</AlertTitle>
          <AlertDescription>
            {gateState.reason} Watch this short video to prepare.
          </AlertDescription>
        </div>
        <div className="flex gap-2 self-start sm:self-center flex-shrink-0">
          <Button size="sm" onClick={() => onWatchNow(gateState.videoId)}>Watch Now</Button>
          <Button size="sm" variant="ghost" onClick={handleSnooze}>Remind me later</Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleDismiss}><X className="h-4 w-4"/></Button>
        </div>
      </div>
    </Alert>
  );
}
